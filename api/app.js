const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const { errors } = require('celebrate');
const helmet = require('helmet');

const routes = require('./routes/routes');
const { requestLogger, errorLogger } = require('./middlewares/logger');
const error = require('./middlewares/error');
const cors = require('./middlewares/cors');

// const limiter = require('./middlewares/limiter');

const { NODE_ENV, DB_ADDRESS } = process.env;
const app = express();
const PORT = 3000;
app.use(helmet());
app.use(cors);
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(NODE_ENV === 'production' ? DB_ADDRESS : 'mongodb://127.0.0.1:27017/signalfiredb');

app.use(requestLogger);
// app.use(limiter);
app.use(routes);
app.use(errorLogger);
app.use(errors());
app.use(error);

app.listen(PORT);

// const fs = require('fs');
// const https = require('https');
// const server = https.createServer(options, app);
// server.listen(PORT);
// const key = fs.readFileSync(__dirname + '/selfsigned.key');
// const cert = fs.readFileSync(__dirname + '/selfsigned.crt');
// const options = {
//   key,
//   cert,
// };