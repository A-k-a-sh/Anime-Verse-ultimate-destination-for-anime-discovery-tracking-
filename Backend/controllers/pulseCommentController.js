const mongoose = require('mongoose');
const Pulse = require('../models/Pulse');
const PulseComment = require('../models/PulseComment');
const { buildCommentTree } = require('../utils/commentTree');

// @desc    Get threaded comment tree for a Pulse
// @route   GET /api/pulses/:id/comments
// @access  Public
const getPulseComments = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Pulse ID' });
    }

    const comments = await PulseComment.find({ pulseId: id })
      .populate('author', 'username avatar')
      .sort({ createdAt: 1 });

    const currentUserId = req.user?._id;
    const tree = buildCommentTree(comments, currentUserId);

    res.json({
      success: true,
      count: comments.length,
      data: tree
    });
  } catch (err) {
    console.error('getPulseComments error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving Pulse comments' });
  }
};

// @desc    Add a comment or reply to a Pulse
// @route   POST /api/pulses/:id/comments
// @access  Authenticated
const createComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content, parentId = null } = req.body;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Pulse ID' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Comment content cannot be empty' });
    }

    if (content.trim().length > 2500) {
      return res.status(400).json({ success: false, message: 'Comment exceeds maximum limit of 2,500 characters' });
    }

    const pulse = await Pulse.findById(id);
    if (!pulse) {
      return res.status(404).json({ success: false, message: 'Pulse not found' });
    }

    if (!pulse.commentsEnabled) {
      return res.status(403).json({
        success: false,
        message: 'Discussions are closed for this Pulse'
      });
    }

    let depth = 0;
    let resolvedParentId = null;

    if (parentId) {
      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        return res.status(400).json({ success: false, message: 'Invalid parent comment ID' });
      }

      const parentComment = await PulseComment.findById(parentId);
      if (!parentComment || parentComment.pulseId.toString() !== id) {
        return res.status(400).json({ success: false, message: 'Parent comment not found on this Pulse' });
      }

      resolvedParentId = parentComment._id;
      // Max 4 indentation levels before flattening deeper replies into level 4
      depth = Math.min((parentComment.depth || 0) + 1, 4);
    }

    const newComment = new PulseComment({
      pulseId: pulse._id,
      author: userId,
      content: content.trim(),
      parentId: resolvedParentId,
      depth
    });

    await newComment.save();
    await newComment.populate('author', 'username avatar');

    const commentObj = newComment.toObject();
    commentObj.replies = [];
    commentObj.userVote = null;
    commentObj.upvoteCount = 0;
    commentObj.downvoteCount = 0;

    res.status(201).json({
      success: true,
      data: commentObj
    });
  } catch (err) {
    console.error('createComment error:', err);
    res.status(500).json({ success: false, message: 'Server error creating comment' });
  }
};

// @desc    Delete a comment (Reddit-style graceful mask if child replies exist)
// @route   DELETE /api/pulses/:id/comments/:commentId
// @access  Comment Author OR Admin (via verifyCommentAuthorOrAdmin)
const deleteComment = async (req, res) => {
  try {
    const comment = req.comment; // Attached by verifyCommentAuthorOrAdmin

    // Check if any child replies exist referencing this comment
    const hasReplies = await PulseComment.exists({ parentId: comment._id });

    if (hasReplies) {
      // Reddit Graceful Deletion: mask content and set isDeleted = true
      comment.isDeleted = true;
      comment.content = '[This comment was deleted by the user]';
      await comment.save();

      return res.json({
        success: true,
        isDeleted: true,
        message: 'Comment content masked to preserve discussion thread'
      });
    } else {
      // No replies depend on this comment: safely remove from database
      await comment.deleteOne();

      return res.json({
        success: true,
        isDeleted: false,
        message: 'Comment permanently removed'
      });
    }
  } catch (err) {
    console.error('deleteComment error:', err);
    res.status(500).json({ success: false, message: 'Server error deleting comment' });
  }
};

// @desc    Vote (upvote or downvote) on a comment
// @route   POST /api/pulses/:id/comments/:commentId/vote
// @access  Authenticated
const voteComment = async (req, res) => {
  try {
    const { commentId } = req.params;
    const { direction } = req.body; // 'up' or 'down'
    const userId = req.user._id;

    if (!['up', 'down'].includes(direction)) {
      return res.status(400).json({ success: false, message: "Invalid vote direction. Must be 'up' or 'down'" });
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ success: false, message: 'Invalid Comment ID' });
    }

    const comment = await PulseComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    const hasUpvoted = comment.upvotes.some(uid => uid.equals(userId));
    const hasDownvoted = comment.downvotes.some(uid => uid.equals(userId));

    if (direction === 'up') {
      if (hasUpvoted) {
        // Toggle off -> Neutral
        comment.upvotes.pull(userId);
      } else {
        comment.upvotes.addToSet(userId);
        comment.downvotes.pull(userId);
      }
    } else if (direction === 'down') {
      if (hasDownvoted) {
        // Toggle off -> Neutral
        comment.downvotes.pull(userId);
      } else {
        comment.downvotes.addToSet(userId);
        comment.upvotes.pull(userId);
      }
    }

    comment.score = comment.upvotes.length - comment.downvotes.length;
    await comment.save();

    const currentUpvoted = comment.upvotes.some(uid => uid.equals(userId));
    const currentDownvoted = comment.downvotes.some(uid => uid.equals(userId));
    const userVote = currentUpvoted ? 'up' : currentDownvoted ? 'down' : null;

    res.json({
      success: true,
      score: comment.score,
      userVote,
      upvoteCount: comment.upvotes.length,
      downvoteCount: comment.downvotes.length
    });
  } catch (err) {
    console.error('voteComment error:', err);
    res.status(500).json({ success: false, message: 'Server error processing comment vote' });
  }
};

module.exports = {
  getPulseComments,
  createComment,
  deleteComment,
  voteComment
};
