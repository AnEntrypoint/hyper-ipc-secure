const { serve } = require('hyper-ipc');
module.exports = {
  init: (kp, dockerImage) => {
    serve(kp, command, async (postData) => {
      try {
        const container = await docker.createContainer({
          Image: dockerImage,
          Cmd: postData.startCmd,
          Tty: true,
          AttachStdin: true,
          AttachStdout: true,
          AttachStderr: true,
        });

        await container.start();
        const exec = await container.exec({
          Cmd: postData.Cmd
        });
        const stream = await exec.start();
        const output = await new Promise((resolve, reject) => {
          container.modem.demuxStream(stream, process.stdout, process.stderr);
          stream.on('end', () => resolve('Container execution finished.'));
          stream.on('error', reject);
        });
        return output;
      } catch (error) {
        console.error('Error:', error);
        throw error;
      }
    });
  }
}
