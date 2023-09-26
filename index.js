const DHT = require("hyperdht");
const { unpack, pack } = require('msgpackr');
const node = new DHT();
const Keychain = require('keypear')
var net = require("net");
const axios = require('axios');
const dockerServe = require('./dockerServe.js').init
const { announce, lookup } = require('./discovery.js');
const crypto = require('hypercore-crypto');
const goodbye = require('graceful-goodbye')
goodbye(() => node.destroy())

const runKey = (key, args) => {
  return new Promise(async (pass, fail) => {
    console.log('calling', key.toString('hex'), args);
    const socket = node.connect(key, { reusableSocket: true });
    socket.on('open', function () {
      console.log('socket opened')
    })
    socket.on("data", (res) => {
      socket.end();
      const out = unpack(res);
      if (out && out.error) {
        fail(out.error);
      } else {
        pass(out);
      }
    });
    socket.on('error', error => { throw error });
    socket.write(pack(args));
  })
}

const sockFileServe = (kp, command, file) => {
  const keys = new Keychain(kp);
  const keyPair = keys.get(command);
  console.log(`serving ${kp.publicKey.toString('hex')}/${command}`, keyPair.publicKey.toString('hex'));
  const server = node.createServer({ reusableSocket: true });
  server.on("connection", function (socket) {
    const socketFilePath = file;
    const stream = fs.createReadStream(socketFilePath);
    stream.pipe(socket);
    socket.pipe(stream);
    socket.on('error', (err) => {
      stream.end();
      throw err;
    });
    socket.on('close', () => {
      stream.end();
    });
  });
  server.listen(keyPair);
  //console.log('running sock file listen...')
}

const getSub = (kp, name) => {
  const keys = Keychain.from(kp)
  const sub = keys.get(name)
  console.log({ sub })
  return sub
}

const tcpServe = (kp, command, port, host) => {
  const keys = Keychain.from(kp);
  const keyPair = keys.get(command);
  console.log(`serving ${kp.publicKey.toString('hex')}/${command}`, keyPair.publicKey.toString('hex'));
  const server = node.createServer({ reusableSocket: true });
  server.on("connection", function (servsock) {
    //console.log('new connection, relaying to ' + port);
    var socket = net.connect({ port, host, allowHalfOpen: true });
    pump(servsock, socket, servsock);
  });
  server.listen(keyPair);
  console.log('listening for remote connections for tcp ', port);
}
const tcpClient = (publicKey, command, port) => {
  const keys = new Keychain(publicKey);
  const keyPair = keys.get(command);
  var server = net.createServer({ allowHalfOpen: true }, function (local) {
    console.log('connecting to tcp ', port);
    const socket = node.connect(keyPair.publicKey, { reusableSocket: true });
    pump(local, socket, local);
  });
  server.listen(port, "127.0.0.1");
  console.log('listening for local connections on tcp', port);
}
const { awaitSync } = require("@kaciras/deasync");
const runner = async (data, cb) => {
  var capcon = require('capture-console');
  var cbout;
  var out;
  const input = unpack(data);
  var stdio = capcon.captureStdio(() => {
    cbout = awaitSync((input) => {
      return new Promise(async res => {
        try { out = await cb(input); res(out) }
        catch (error) { out = { error }; res(out) }
      })
    });
  });
  await cbout(input);
  if (typeof out == 'object' || typeof out == 'undefined') {
    const combined =Object.assign(out || {}, stdio);
    console.log(combined);
    return combined;
  } else return out;
}

const serveKey = (keyPair, cb) => {
  const server = node.createServer({ reusableSocket: true });
  server.on("connection", function (socket) {
    console.log('connection', keyPair.publicKey.toString('hex'));
    socket.on('error', function (e) { throw e });
    socket.on("data", async data => {
      try {
        const output = await runner(data, cb);
        socket.write(pack(output));
      } catch (error) {
        socket.write(pack({ error }));
      }
      socket.end();
    });
  });
  server.listen(keyPair);
  console.log('listening to', keyPair.publicKey.toString('hex'))
}

const serve = (kp, command, cb) => {
  const keys = Keychain.from(kp);
  const keyPair = keys.get(command);
  console.log(`serving ${kp.publicKey.toString('hex')}/${command}`, keyPair.publicKey.toString('hex'));
  serveKey(keyPair, cb);
}

const run = (publicKey, command, args) => {
  const keys = new Keychain(publicKey) // generate a "readonly" keychain
  const key = keys.sub(command).publicKey;
  return runKey(key, args)
}
const webhookclient = (PORT) => { //listens locally and calls a serve instance
  const { init } = require('./webhookclient.js');
  init(PORT, { serve, run, runKey })
}
const webhookserver = (kp, command, target) => { //starts a serve instance that calls a webhook
  serve(kp, command, async (postData) => {
    return await axios.post(target, postData).data
      .catch(error => {
        console.error('Error:', error);
      });
  })
}

const lbserve = (taskKey, serverKey, name, cb) => {
  console.log({taskKey, serverKey, name})
  const serverTaskKey = getSub(serverKey, name);
  announce(crypto.data(Buffer.concat([taskKey.publicKey, taskKey.scalar])), serverTaskKey)
  serveKey(serverTaskKey, cb);
  return serverTaskKey;
}

const lbfind = async (taskKey)=>{
  const results = await lookup(crypto.data(Buffer.concat([taskKey.publicKey, taskKey.scalar])))
  const out = [];
  for (remote of results) {
      for (peer of remote.peers) {
          const hex = peer.publicKey.toString('hex');
          if (!out.includes(hex)) {
              out.push(hex)
          }
      }
  }
  if (!out.length) {
      throw new Error('NO NODES FOUND');
  }
  try {
      return out;
  } catch (e) {
      console.error("ERROR THROWN:", e)
  }
}

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
    getSub
  }
}
