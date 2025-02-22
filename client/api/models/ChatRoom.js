const mongoose = require('mongoose');

const chatRoomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  room: { type: String, required: true },
  user: { type: String, required: true },
  message: { type: String, default: '' }, 
  fileUrl: String,
  fileType: String,
  fileName: String,
  createdAt: { type: Date, default: Date.now },
  editedAt: Date,
  deleted: { type: Boolean, default: false }
});

module.exports = mongoose.model('ChatRoom', chatRoomSchema);