# hyper-ipc-secure

hyper-ipc-secure is a version of hyper-ipc where you can have many named endpoints and the client needs only a pubkey and a name. This library allows you to split your program into different parts, and use it to get one part to ask another to run code, and receive the response, allowing you to expose your functions remotely. The different instances will automatically find each other and connect using a peer-to-peer library called hyperswarm. You can hand the constructor a secret key when you create it to make endpoints harder to guess. Communication is noise encrypted.

## Installation

To install hyper-ipc-secure, follow the steps below:

1. Ensure that you have Node.js and npm installed on your machine.
2. Run the following command in your terminal:

```bash
npm install --save hyper-ipc-secure
```

This will install hyper-ipc-secure and save it as a dependency in your project.

The different instances will automatically find each other and connect using
a peer-to-peer library called hyperswarm.

You can hand the constructor a secret key when you create it to make endpoints
harder to guess.

Communication is noise encrypted.

UPDATE:

There is a new webhook client available in this project, this allows you to run
a local webhook that executes code on remote hyperswarm based nodes, giving you
easy access to all your swarms for webhook based tools like n8n

## Usage

Here are some examples of how to use hyper-ipc-secure:

- Calling remote code with parameters:

```javascript
// Code example goes here
```

- Using the webhook example:

```javascript
// Code example goes here
```

Please refer to the examples directory for more detailed examples.

### Contributing

We welcome contributions to hyper-ipc-secure! Here are the steps to contribute:

1. Fork the repository.
2. Create a new branch for your changes.
3. Make your changes in your branch.
4. Submit a pull request with your changes.

Please make sure to update tests as appropriate and follow the code style of the project.
