const { announce, lookup } = require('../discovery.js');
const crypto = require('hypercore-crypto');

const kp = crypto.keyPair();

announce('testname', kp)

setTimeout(async ()=>{
    console.log(await lookup('testname'))
}, 10000)