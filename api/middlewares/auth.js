const jwt = require('jsonwebtoken');
const IncorrectProfileError = require('../errors/IncorrectProfileError');
const {
  UNAUTHORIZED_USER_ERROR,
  INCORRECT_TOKEN_ERROR,
  USER_NOT_FOUND_ERROR,
} = require('../constants/errorMessages');
const User = require('../models/user');
const { decryptAesGcm256 } = require('../utils/encrypting');
const IncorrectDataError = require('../errors/IncorrectDataError');

module.exports = async (req, res, next) => {
  // const { authorization } = req.headers;
  // if (!authorization || !authorization.startsWith('Bearer ')) {
  //   next(new IncorrectProfileError('Необходима авторизация'));
  // }
  // const token = authorization.replace('Bearer ', '');
  const token = req.cookies.jwt;

  const { NODE_ENV, JWT_SECRET } = process.env;
  if (!token) return next(new IncorrectProfileError(UNAUTHORIZED_USER_ERROR));
  let payload;
  try {
    payload = jwt.verify(token, NODE_ENV === 'production' ? JWT_SECRET : 'some-secret-key');
    console.log('JWT успешно проверен');
  } catch (err) {
    return next(new IncorrectProfileError(INCORRECT_TOKEN_ERROR));
  }
  try {
    const user = await User.findOne({ _id: payload._id }).select('+serverKey');
    req.user = user;
    if (Object.keys(req.body).length !== 0 || Object.keys(req.params).length !== 0) {
      console.log('params: ', req.params);
      console.log('body: ', req.body);
      if (Object.keys(req.body).length !== 0) {
        console.log('Packed: ', req.body);
        console.log('Encrypted: ', req.body.data);
        req.body = { ...decryptAesGcm256(req.body.data, user.serverKey) };
        console.log('DATA: ', req.body);
      }
    }
  } catch (err) {
    if (err.name === 'CastError') {
      next(new IncorrectDataError(USER_NOT_FOUND_ERROR));
    }
    next(err);
  }
  return next(); // пропускаем запрос дальше
};
