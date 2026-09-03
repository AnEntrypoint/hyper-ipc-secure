const node = require('../index.js')();
const crypto = require('hypercore-crypto');

global.kp = crypto.keyPair()

const rd = node.getSub({publicKey:kp.publicKey}, 'sub')
setTimeout(async function () {
    console.log('RUN')
    try {
      const output = await node.run(rd, 'hello.world', {hello:"world"});
      console.log("CLIENT OUTPUT", {output});
    } catch(e) {
      console.error("ERROR THROWN:", e)
    }
  }, 5000)
  


const sub = node.getSub(kp, 'sub')
const ser = JSON.stringify(sub)
const par = JSON.parse(ser)
par.publicKey = Buffer.from(par.publicKey.data);
par.scalar = Buffer.from(par.scalar.data);
console.log({ser})
node.serve(par, 'hello.world', async (args) => {
    return {message:`henlo, ${JSON.stringify(args)}`};
});
