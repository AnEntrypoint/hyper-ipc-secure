const { serve } = require('hyper-ipc');
const { Wasmtime } = require("@bytecodealliance/wasmtime");

module.exports = {
  init: async (kp, command, wasmModulePath) => {
    const wasmtime = new Wasmtime();
    const module = await wasmtime.Module.fromFile(wasmModulePath);
    serve(kp, command, async (postData) => {
      try {
        const instance = new wasmtime.Instance(module);
        const result = instance.exports.myFunction(postData);
        const output = result.toJSValue();

        return output;
      } catch (error) {
        console.error('Error:', error);
        throw error;
      }
    });
  }
};
