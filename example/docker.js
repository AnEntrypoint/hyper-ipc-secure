const node = require('../index.js')();
const crypto = require('hypercore-crypto');

global.kp = crypto.keyPair();

node.dockerServe(kp, 'node', node.serve);

node.webhookclient(3003)
//fetch("http://"+kp.publicKey+"/node")