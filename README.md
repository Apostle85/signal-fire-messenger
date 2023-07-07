# Fullstack Messenger App with Encryption

Hello, i'm Eli and this is my University Diploma project - 
**Web-Messenger with End-to-End Encryption (E2EE)**
that is based on **Signal Protocol** (X3DH protocol and Double Ratchet Algorithm realization).
The project contains: 
* Authentication
* Users Search
* Adding to Friends-list
* Messenger
----------------
## Technology Stack:
* React
* Node.js (+ lots of npm packages)
* MongoDB (+ mongoose)
* Socket.io
----------------
## For better security:
* Limiter (Node module)
* Helmet (Node module)
* Cors settings
* Client and Server Validation
* Client-Server Encryption (SRP-protocol SRP-6a)
* Client-Client Encryption (E2EE)
* AES Encryption Algorithm
----------------
P.S.:
1. Encryption was developed via Web Crypto API. Unfortunately, most browsers' APIs don't support special type of elliptic curves that are used in Signal Protocol, so this project replaces them with another types.
2. This project doesn't support signing in on different devices with one account due to the difficulty of transferring the account private key package from the first authorized device. To solve this problem you may copy and transfer JSON-object that represents account private key package to a new device.
