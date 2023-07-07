const mongoose = require('mongoose');

const dialogSchema = new mongoose.Schema({
  members: {
    type: Array,
    required: true,
  },
}, { timestamps: true });

module.exports = mongoose.model('dialog', dialogSchema);
