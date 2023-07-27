const DHT = require("@hyperswarm/dht");
const crypto = require('hypercore-crypto')
const { unpack, pack } = require('msgpackr');
const node = new DHT();
const Keychain = require('keypear')

const axios = require('axios');


const runKey = async (key, args) => {
  return new Promise((pass, fail) => {
    console.log('calling', key.toString('hex'), args);
    const socket = node.connect(key, { reusableSocket: true });
    socket.on('open', function () {
      console.log('socket opened')
    })
    socket.on("data", (res) => {
      socket.end();
      const out = unpack(res);
      if(out && out.error) {
        fail(out.error);
        throw out;
      }
      pass(out);
    });
    socket.on('error', error => fail({ error }));
    socket.write(pack(args));
  })
}
const serve = (kp, command, cb) => {
  console.log({kp});
  const keys = new Keychain(kp);
  const keyPair = keys.get(command);
  console.log(`serving ${kp.publicKey.toString('hex')}/${command}`, keyPair.publicKey.toString('hex'));
  const server = node.createServer({ reusableSocket: true });
  server.on("connection", function (socket) {
    console.log('connection', keyPair.publicKey.toString('hex'));
    socket.on('error', function (e) { throw e });
    socket.on("data", async data => {
      try {
        socket.write(pack(await cb(unpack(data))));
      } catch (error) {
        console.trace(error);
        socket.write(pack({ error }));
      }
      socket.end();
    });
  });
  server.listen(keyPair);
  console.log('running listen...')
}
const run = (publicKey, command, args) => {
  console.log('run', command);
  const keys = new Keychain(publicKey) // generate a "readonly" keychain
  const key = keys.sub(command).publicKey;
  console.log({keys, key})
  return runKey(key, args)
}
const webhookclient = (PORT) => { //listens locally and calls a serve instance
  const {init} = require('./webhookclient.js');
  init(PORT, {serve, run, runKey})
}
const webhookserver = (kp, command, target)=>{ //starts a serve instance that calls a webhook
  serve(kp, command, async (postData)=>{
    return await axios.post(target, postData).data
    .catch(error => {
      console.error('Error:', error);
    });  
  })
}
module.exports = () => {
  return {
    webhookclient,
    webhookserver,
    serve,
    run,
    runKey
  }
}

async function exitHandler(options, exitCode) {
  if (options.cleanup) console.log('DHT Cleanup');
  if (exitCode || exitCode === 0) console.log(exitCode);
  try {
    await node.destroy([options])
  } catch (e) {

  }
  if (options.exit) process.exit(1);
}

process.on('exit', exitHandler.bind(null, { cleanup: true }));
process.on('SIGINT', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
process.on('uncaughtException', exitHandler.bind(null, { exit: true }));
