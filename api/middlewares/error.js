const { UNKNOWN_ERROR } = require('../constants/errorMessages');

module.exports = ((err, req, res, next) => {
  const { statusCode = 500, message } = err;

  res
    .status(statusCode)
    .send({
      message: statusCode === 500
        ? UNKNOWN_ERROR
        : message,
    });
  next();
});
