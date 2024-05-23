const DHT = require("hyperdht");
const { unpack, pack } = require('msgpackr');
const node = new DHT();
const Keychain = require('keypear');
const net = require("net");
const axios = require('axios');
const dockerServe = require('./dockerServe.js').init;
const { announce, lookup } = require('./discovery.js');
const crypto = require('hypercore-crypto');
const goodbye = require('graceful-goodbye');
const captureConsole = require('capture-console');
const fs = require('fs');
goodbye(() => node.destroy());
const multiplexedConnections = new Map();
const reconnect = async (key, options, attempts = 0) => {
    if (attempts > 10) throw new Error('Max connection attempts reached');
    try {
        const socket = node.connect(key, options);
        return socket;
    } catch (error) {
        if (error.message.includes('PEER_NOT_FOUND')) {
            throw new Error('PEER_NOT_FOUND');
        }
        return reconnect(key, options, attempts + 1);
    }
};
const runKey = async (key, args, options = { reusableSocket: false }) => {
    const keyString = key.toString('hex');
    if (!multiplexedConnections.has(keyString)) {
        multiplexedConnections.set(keyString, { lastUsed: Date.now(), sessions: {} });
    }
    const conn = multiplexedConnections.get(keyString);
    conn.lastUsed = Date.now();
    return new Promise(async (pass, fail) => {
        const sessionId = crypto.randomBytes(32).toString('hex');
        const runWithSocket = (socket) => {
            socket.on("data", (res) => {
                const out = unpack(res);
                if (out.sessionId === sessionId) {
                    if (out.error) {
                        fail(out.error);
                    } else {
                        pass(out.result);
                    }
                    if (conn.sessions[sessionId]) delete conn.sessions[sessionId];
                }
            });
            socket.on('error', async (error) => {
                if (error.message.includes('PEER_NOT_FOUND')) {
                    fail('PEER_NOT_FOUND');
                    return;
                }
                if (socket === conn.sessions[sessionId].socket) {
                    conn.sessions[sessionId].socket = await reconnect(key, options).catch(fail);
                }
                if (conn.sessions[sessionId].socket) {
                    runWithSocket(conn.sessions[sessionId].socket);
                }
            });
            socket.write(pack({ sessionId, args }));
        };
        conn.sessions[sessionId] = { buffer: [], completed: false };
        conn.sessions[sessionId].socket = conn.sessions[sessionId].socket || await reconnect(key, options).catch(fail);
        if (conn.sessions[sessionId].socket) {
            runWithSocket(conn.sessions[sessionId].socket);
        }
    });
};
const serveKey = (keyPair, cb, options = { reusableSocket: false, timeout: 600000 }) => {
    const sessions = new Map();
    const server = node.createServer(options);
    server.on("connection", (socket) => {
        socket.on('error', (e) => { if (socket && !socket.destroyed) socket.destroy(); });
        socket.on("data", async (data) => {
            const { sessionId, args } = unpack(data);
            const session = sessions.get(sessionId) || { stdout: '', stderr: '', result: null, completed: false };
            sessions.set(sessionId, session);
            try {
                let stdout = '';
                let stderr = '';
                captureConsole.startCapture(process.stdout, (out) => { stdout += out; });
                captureConsole.startCapture(process.stderr, (err) => { stderr += err; });
                const out = await cb(args);
                session.result = out;
                session.stdout = stdout;
                session.stderr = stderr;
                captureConsole.stopCapture(process.stdout);
                captureConsole.stopCapture(process.stderr);
                session.completed = true;
                socket.write(pack({
                    sessionId,
                    stdout: session.stdout,
                    stderr: session.stderr,
                    result: session.result
                }));
            } catch (error) {
                socket.write(pack({ sessionId, error }));
            } finally {
                socket.end();
                sessions.delete(sessionId);
            }
        });
    });
    server.listen(keyPair);
    const timeout = options.timeout ?? 600000;
    setInterval(() => {
        const now = Date.now();
        for (const key of multiplexedConnections.keys()) {
            const conn = multiplexedConnections.get(key);
            if (conn.lastUsed + timeout < now) {
                if (conn.sessions) {
                    Object.values(conn.sessions).forEach(({ socket }) => socket.destroy());
                }
                multiplexedConnections.delete(key);
            }
        }
    }, timeout);
};
const serve = (kp, command, cb) => {
    const keys = Keychain.from(kp);
    const keyPair = keys.get(command);
    serveKey(keyPair, cb);
};
const tcpServe = (kp, command, port, host) => {
    const keys = Keychain.from(kp);
    const keyPair = keys.get(command);
    const server = node.createServer({ reusableSocket: true });
    server.on("connection", (servsock) => {
        const socket = net.connect({ port, host, allowHalfOpen: true });
        pipeline(servsock, socket, servsock);
    });
    server.listen(keyPair);
};
const tcpClient = (publicKey, command, port) => {
    const keys = new Keychain(publicKey);
    const keyPair = keys.get(command);
    const server = net.createServer({ allowHalfOpen: true }, (local) => {
        const socket = node.connect(keyPair.publicKey, { reusableSocket: true });
        pipeline(local, socket, local);
    });
    server.listen(port, "127.0.0.1");
};
const sockFileServe = (kp, command, file) => {
    const keys = new Keychain(kp);
    const keyPair = keys.get(command);
    const server = node.createServer({ reusableSocket: true });
    server.on("connection", (socket) => {
        const stream = fs.createReadStream(file);
        pipeline(stream, socket, stream, (err) => { if(err) socket.destroy(); });
    });
    server.listen(keyPair);
};
const getSub = (kp, name) => {
    const keys = Keychain.from(kp);
    const sub = keys.get(name);
    return sub;
};
const lbserve = (taskKey, serverKey, name, cb) => {
    const serverTaskKey = getSub(serverKey, name);
    announce(taskKey.publicKey, serverTaskKey);
    serveKey(serverTaskKey, cb);
    return serverTaskKey;
};
const lbfind = async (taskKey) => {
    const results = await lookup(taskKey.publicKey);
    const out = [];
    for (const remote of results) {
        for (const peer of remote.peers) {
            const hex = peer.publicKey.toString('hex');
            if (!out.includes(hex)) {
                out.push(hex);
            }
        }
    }
    if (!out.length) throw new Error('NO NODES FOUND');
    return out;
};
const webhookclient = (PORT) => {
    const { init } = require('./webhookclient.js');
    init(PORT, { serve, run, runKey });
};
const webhookserver = (kp, command, target) => {
    serve(kp, command, async (postData) => {
        return axios.post(target, postData).data
            .catch((error) => console.error('Error:', error));
    });
};
const run = (publicKey, command, args) => {
    const keys = new Keychain(publicKey); // generate a "readonly" keychain
    const key = keys.sub(command).publicKey;
    console.log('running key', key, args);
    return runKey(key, args);
};
module.exports = () => {
    return {
        webhookclient,
        webhookserver,
        serveKey,
        serve,
        run,
        runKey,
        lbserve,
        lbfind,
        sockFileServe,
        tcpServe,
        tcpClient,
        dockerServe,
        getSub,
        announce,
        lookup
    };
};