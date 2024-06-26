const POLL_INTERVAL = 500;
const schedule = [];
const base = 1000 * 60 * 10;
const DHT = require('hyperdht');
const node = new DHT();
const goodbye = require('graceful-goodbye')
const Keychain = require('keypear')

const run = async () => {
    try {
        for (let index in schedule) {
            const announce = schedule[index];
            if (announce.time < new Date().getTime()) {
                announce.time = new Date().getTime() + base + parseInt(base * Math.random());
                console.log("ANOUNCING:", announce.hash.toString('hex'), announce.keyPair.publicKey.toString('hex'));
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
    announce: (name, keys) => {
        const hash = DHT.hash(Buffer.from(name))
        schedule[name.toString('hex')+keys.publicKey.toString('hex')] = {hash, name:name.toString('hex'), keyPair:keys, time: new Date().getTime()}
        run();
    },
    unannounce: (name, keys)=>{
        delete schedule[name];
        return node.unannounce(name.toString('hex')+keys.publicKey.toString('hex'), ann.keyPair).finished();
    },
    lookup: async (name)=>{
        const hash = DHT.hash(Buffer.from(name));
        console.log("LOOKING UP:", hash.toString('hex'));
        return await toArray(node.lookup(hash));
    }
}

const unannounceAll = async () => {
    for (i in schedule) {
        const ann = schedule[i];
        console.log("UNANOUNCING:", ann.hash.toString('hex'), ann.keyPair.publicKey.toString('hex'));
        try {
            await node.unannounce(ann.hash, ann.keyPair);
        } catch(e) {
            console.error(e);
        }
        
    }
}

goodbye(()=>{
    console.log('cleaning up before close')
    unannounceAll()
})
