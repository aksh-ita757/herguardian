const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  displayName: { type: String, default: 'Anonymous' },
  content:     { type: String, required: true, maxlength: 500 },
  likes:       { type: Number, default: 0 },
  likedBy:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

const forumPostSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isAnonymous: { type: Boolean, default: true },
  displayName: { type: String, default: 'Anonymous' },
  title:       { type: String, required: true, maxlength: 150 },
  content:     { type: String, required: true, maxlength: 2000 },
  tag: {
    type:    String,
    // lowercase to match what the frontend sends
    enum:    ['support', 'legal', 'health', 'safety', 'general'],
    default: 'general',
  },
  likes:      { type: Number, default: 0 },
  likedBy:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replies:    [replySchema],
  isApproved: { type: Boolean, default: true },
  isReported: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('ForumPost', forumPostSchema);
