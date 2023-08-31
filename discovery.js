const POLL_INTERVAL = 5000;
const schedule = [];
const base = 1000 * 60 * 10;
const DHT = require('hyperdht');
const node = new DHT();
const goodbye = require('graceful-goodbye')

const run = async () => {
    try {
        for (let index in schedule) {
            const announce = schedule[index];
            if (announce.time < new Date().getTime()) {
                announce.time = new Date().getTime() + base + parseInt(base * Math.random());
                console.log('announcing', schedule[index]);
                await node.announce(announce.hash, announce.keyPair).finished();
            }
        }
    } catch (e) {
        console.error(e);
    }
}
setInterval(run, POLL_INTERVAL)
run();
async function toArray(iterable) {
    const result = []
    for await (const data of iterable) result.push(data)
    return result
}

module.exports = {
    announce: (name, keyPair) => {
        const hash = DHT.hash(Buffer.from(name))
        schedule[name] = {hash, name, keyPair, time: new Date().getTime()}
        run();
    },
    unannounce: (name)=>{
        const hash = DHT.hash(Buffer.from(name))
        delete schedule[name];
        return node.unannounce(hash, ann.keyPair).finished();
    },
    lookup: async (name)=>{
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

goodbye(unannounceAll)
