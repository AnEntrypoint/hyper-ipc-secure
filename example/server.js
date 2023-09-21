const node = require('../index.js')();
const crypto = require('hypercore-crypto');
global.kp = crypto.keyPair();

node.serve(kp, 'hello.world', async (args) => {
  console.log({args})
  return {message:`henlo, ${JSON.stringify(args)}`};
});

require('./client.js');
