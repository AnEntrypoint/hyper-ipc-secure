### Installation

```
npm install --save hyper-ipc-secure
```
You can split your program into different parts, and use this library to
get one part to ask another to run code, and receive the response, 
allowing you to expose your functions remotely.

The different instances will automatically find each other and connect using
a peer-to-peer library called hyperswarm.

You can hand the constructor a secret key when you create it to make endpoints
harder to guess.

Communication is noise encrypted.

UPDATE:

There is a new webhook client available in this project, this allows you to run
a local webhook that executes code on remote hyperswarm based nodes, giving you
easy access to all your swarms for webhook based tools like n8n

EXAMPLES:

take a quick look at examples to see how to call remote code with parameters, and
to see the webhook example
