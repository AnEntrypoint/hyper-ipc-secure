const node2 = require('../index.js')();
const fs = require('fs');
global.kp = JSON.parse(fs.readFileSync('kp'))
console.log(kp)
kp.publicKey = Buffer.from(kp.publicKey)
kp.secretKey = Buffer.from(kp.secretKey)
setTimeout(async function () {
  console.log('RUN')
  try {
    const output = await node2.run(kp.publicKey, 'hello.world', {hello:"world"});
    console.log("CLIENT OUTPUT", {output});
  } catch(e) {
    console.error("ERROR THROWN:", e)
  }
}, 5000)
