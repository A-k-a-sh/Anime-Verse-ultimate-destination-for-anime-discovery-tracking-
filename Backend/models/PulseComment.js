const mongoose = require('mongoose');

const pulseCommentSchema = new mongoose.Schema({
  pulseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Pulse',
    required: [true, 'Pulse ID is required'],
    index: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Comment author is required']
  },
  content: {
    type: String,
    required: [true, 'Comment content cannot be empty'],
    trim: true,
    maxlength: [2500, 'Comment exceeds maximum character limit of 2500']
  },
  // Threading pointer (Reddit style nested hierarchy)
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PulseComment',
    default: null,
    index: true
  },
  depth: {
    type: Number,
    default: 0,
    max: 4 // Max indentation levels before flattening
  },
  isDeleted: {
    type: Boolean,
    default: false // Set to true if deleted while child replies exist
  },

  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  score: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Compound index for nested tree retrieval
pulseCommentSchema.index({ pulseId: 1, parentId: 1, createdAt: 1 });

module.exports = mongoose.model('PulseComment', pulseCommentSchema);
