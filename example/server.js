const node = require('../index.js')();
const crypto = require('hypercore-crypto');
const fs = require('fs');
global.kp = crypto.keyPair();
fs.writeFileSync('kp',JSON.stringify(kp));
node.serve(kp, 'hello.world', async (args) => {
  throw new Error(JSON.stringify({msg:"MAKING ERROR OUT OF ARGS:",args:JSON.stringify(args)}))
  return {message:`henlo, ${JSON.stringify(args)}`};
});

node.serve(kp, 'error.world', async (args) => {
  return {message:`henlo, ${JSON.stringify(args)}`};
});

