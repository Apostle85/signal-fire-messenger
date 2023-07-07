const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    required: true,
    type: String,
    unique: true,
  },
  name: {
    type: String,
    minlength: 2,
    maxlength: 30,
  },
  salt: {
    type: String,
    required: true,
    select: false,
  },
  verifier: {
    type: String,
    required: true,
    select: false,
  },
  serverKey: {
    type: Object,
    default: {},
    select: false,
  },
  followers: {
    type: Array,
    default: [],
  },
  followings: {
    type: Array,
    default: [],
  },
  image: {
    type: String,
  },
  bundle: {
    type: Object,
    required: true,
    select: false,
  },
});

module.exports = mongoose.model('user', userSchema);
