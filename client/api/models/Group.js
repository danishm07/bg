const mongoose = require('mongoose');

// Define Post schema
const postSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['text', 'code', 'file'],
    default: 'text'
  },
  title: String,
  description: String,
  content: String,         
  language: String,        
  fileUrl: String,        
  tags: [String],
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Group'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create Post model
const Post = mongoose.model('Post', postSchema);

// Define Group schema
const groupSchema = new mongoose.Schema({
  name: String,
  code: { type: String, unique: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }]
});

// Create Group model
const Group = mongoose.model('Group', groupSchema);

module.exports = { Group, Post };