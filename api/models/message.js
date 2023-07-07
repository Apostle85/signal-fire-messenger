const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  dialogId: {
    required: true,
    type: String,
  },
  senderId: {
    required: true,
    type: String,
  },
  text: {
    required: true,
    type: String,
  },
  image: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('message', messageSchema);
