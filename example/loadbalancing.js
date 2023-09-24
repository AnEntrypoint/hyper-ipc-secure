/*const serializedServerKey = JSON.stringify(serverKey);
const parsed = JSON.parse(serializedServerKey)
parsed.publicKey = Buffer.from(parsed.publicKey.data);
parsed.scalar = Buffer.from(parsed.scalar.data);*/


const crypto = require('hypercore-crypto');
const kp = crypto.keyPair();
const node = require('../index.js')();

const serverKey = node.getSub(kp, 'server1'); //if its done this way, individual servers can be called directly as well as via load balancing
node.lbserve(kp, 'hello.world', serverKey)

const serverKey2 = node.getSub(kp, 'server2'); //if its done this way, individual servers can be called directly as well as via load balancing
node.lbserve(kp, 'hello.world', serverKey2)

setTimeout(async function () {
    //we can run without knowing serverKey or serverKey2
    const out = await node.lbfind(kp, 'hello.world');
    console.log(out)
    const output = await node.runKey(Buffer.from(out[0], 'hex'), 'hello.world', { hello: "world" });
    console.log({output})
}, 5000)

