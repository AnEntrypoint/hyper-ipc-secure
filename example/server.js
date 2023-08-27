const node = require('../index.js')();
const crypto = require('hypercore-crypto');

global.kp = crypto.keyPair();

node.serveWorker(kp, 'hello.world', async (args) => {
  console.log({args})
  return `henlo, ${JSON.stringify(args)}`;
});

require('./client.js');
