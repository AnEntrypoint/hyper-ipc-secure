const { announce, lookup } = require('../discovery.js');
const crypto = require('hypercore-crypto');
const kp = crypto.keyPair();
const node = require('../index.js')();
const keys = [

]
const lbserve(key, name) {
    announce(crypto.data(Buffer.concat([key.publicKey, key.scalar])), key)
    node.serve(kp, 'hello.world', async (args) => {
        return { message: `henlo, ${JSON.stringify(args)}` };
    });
}

const makeKey = ()=>{
    global.kp = crypto.keyPair()
    const sub = node.getSub(kp, 'hello.world')
    return sub;
}
    /*const serialized = JSON.stringify(sub)
    const parsed = JSON.parse(serialized)
    parsed.publicKey = Buffer.from(par.publicKey.data);
    parsed.scalar = Buffer.from(par.scalar.data);*/
for(x = 0; x < 10; x++) {
    keys.push(makeKey());
}
for(key of keys) {
    announce(crypto.data(Buffer.concat([key.publicKey, key.scalar])), key)
}
for(key of keys) {
    node.serve(key, 'hello.world', async (args) => {
        return { message: `henlo, ${JSON.stringify(args)}` };
    });
}
setTimeout(async function () {
    const par = node.getSub(kp, 'hello.world')
    const ld = await lookup(crypto.data(Buffer.concat([par.publicKey, par.scalar])))
    const out = [];
    for (remote of ld) {
        for (peer of remote.peers) {
            const hex = peer.publicKey.toString('hex');
            if (!out.includes(hex)) {
                console.log('FOUND:', hex);
                out.push(hex)
            }
        }
    }
    if (!out.length) {
        console.log('NO NODES FOUND');
        return;
    }

    console.log('RUNING ONE OF', out.length, 'NODES')
    try {
        const output = await node.runKey(Buffer.from(out[0], 'hex'), 'hello.world', { hello: "world" });
        console.log("CLIENT OUTPUT", { output });
    } catch (e) {
        console.error("ERROR THROWN:", e)
    }
}, 5000)
