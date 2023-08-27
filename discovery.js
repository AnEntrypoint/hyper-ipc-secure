const POLL_INTERVAL = 5000;
const schedule = [];
const base = 1000 * 60 * 15;
const DHT = require('hyperdht');
const node = new DHT();

const run = async () => {
    try {
        for (let index in schedule) {
            const announce = schedule[index];
            if (announce.time > new Date().getTime()) {
                announce.time = new Date().getTime() + base + parseInt(base * Math.random());
            }
            await node.announce(announce.hash, announce.keyPair).finished();
        }
    } catch (e) {
        console.error(e);
    }
}
setInterval(run, POLL_INTERVAL)

async function toArray(iterable) {
    const result = []
        for await(const data of iterable) {
            result.push(data)
        }
        return result
    }

module.exports = {
    announce: (name, keyPair) => {
        const hash = DHT.hash(Buffer.from(name));
        schedule[name] = {
            hash,
            keyPair,
            time: new Date().getTime()
        }
    },
    unannounce: (name) => {
        const hash = DHT.hash(Buffer.from(name))
        delete schedule[name];
        return node.unannounce(hash, ann.keyPair).finished();
    },
    lookup: async (name) => {
        console.log(node);
        const hash = DHT.hash(Buffer.from(name));
        return await toArray(node.lookup(hash));
    }
}

const unannounceAll = async () => {
    for (ann of schedule) {
        await node.unannounce(ann.hash, ann.keyPair).finished();
    }
}
process.on("beforeExit", async (code) => {
    await unannounceAll();
    console.log("Process beforeExit event with code: ", code);
});

process.on("exit", async (code) => {
    await unannounceAll();
    console.log("Process exit event with code: ", code);
});

process.on("SIGTERM", async (signal) => {
    await unannounceAll();
    console.log(`Process ${
        process.pid
    } received a SIGTERM signal`);
    process.exit(0);
});

process.on("SIGINT", async (signal) => {
    await unannounceAll();
    console.log(`Process ${
        process.pid
    } has been interrupted`);
    process.exit(0);
});

process.on("uncaughtException", async (err) => {
    await unannounceAll();
    console.error(`Uncaught Exception: ${
        err.message
    }`);
    process.exit(1);
});
