const crypto = require('hypercore-crypto');
const kp = crypto.keyPair();
const node = require('../index.js')();

const serverKey = node.getSub(kp, 'server1');

/*const serializedServerKey = JSON.stringify(serverKey);
const parsed = JSON.parse(serializedServerKey)
parsed.publicKey = Buffer.from(parsed.publicKey.data);
parsed.scalar = Buffer.from(parsed.scalar.data);*/

node.lbserve(kp, 'hello.world', serverKey)

setTimeout(async function () {
    node.lbrun(kp, 'hello.world');    
}, 5000)

