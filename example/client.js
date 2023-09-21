const node2 = require('../index.js')();
setTimeout(function () {
  console.log('RUN')
  node2.run(kp.publicKey, 'hello.world', {hello:"world"}).then(a=>console.log("output:"+JSON.stringify(a))).catch(console.error);
}, 5000)
