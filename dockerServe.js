const Docker = require('dockerode');

module.exports = {
  init: (kp, dockerImage, serve) => {
    serve(kp, dockerImage, async (postData) => {
      const docker = new Docker({ socketPath: '/var/run/docker.sock' });

      try {
        const container = await docker.createContainer({
          Image: dockerImage,
          Cmd: [],
          Tty: true,
          AttachStdin: true,
          AttachStdout: true,
          AttachStderr: true,
          OpenStdin: true,
          StdinOnce: true,
        });
        
        await container.start(); // Start the Docker container
        console.log(postData,  `node -e '${postData.exec.replaceAll(`'`,`\'`)}'`)
        const exec = await container.exec({
          Cmd: ["bash", "-c", `node -e '${postData.exec.replaceAll(`'`,`\'`)}'`],
          //Cmd: ['bash', '-c', `${postData.exec} >/dev/stdout 2>/dev/stderr`],
          AttachStdout: true,
          AttachStderr: true,
        });
      
        const stream = await exec.start({ Detach: false, Tty: true });
        let output = '';
      
        await new Promise((resolve, reject) => {
          container.modem.demuxStream(stream, process.stdout, process.stderr);
          stream.on('data', (chunk) => {
            output += chunk.toString();
          });
          stream.on('end', () => resolve(output.trim()));
          stream.on('error', reject);
        });
      
        // Check if the container is running
        let containerInfo = await container.inspect();
        
        if (containerInfo.State.Running) {
          // If the container is running, remove the container
          try {
            await container.stop();
          } catch (error) {
            console.error('Error removing container:', error);
            throw error;
          }
        }
        await container.remove();
        
        return output.trim();
      } catch (error) {
        console.error('Error:', error);
        throw error;
      }
    });
  },
};