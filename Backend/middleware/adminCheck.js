const mongoose = require('mongoose');
const Pulse = require('../models/Pulse');
const PulseComment = require('../models/PulseComment');

/**
 * Checks whether the given user email is listed in ADMIN_EMAILS environment variable
 * @param {Object} user - User document or req.user
 * @returns {boolean}
 */
const isAdmin = (user) => {
  if (!user || !user.email) return false;
  const rawAdminEmails = process.env.ADMIN_EMAILS || '';
  const adminEmails = rawAdminEmails
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(user.email.toLowerCase());
};

/**
 * Ensures only the original author of a Pulse can perform the action (e.g. edit content)
 * Strict Separation of Powers: Admins CANNOT edit another author's content.
 */
const verifyPulseAuthorOnly = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Pulse ID' });
    }

    const pulse = await Pulse.findById(id);
    if (!pulse) {
      return res.status(404).json({ success: false, message: 'Pulse not found' });
    }

    if (!req.user || !pulse.author.equals(req.user._id)) {
      return res.status(403).json({
        success: false,
        message: 'Strict permission: Only the original author may edit this Pulse'
      });
    }

    req.pulse = pulse;
    next();
  } catch (err) {
    console.error('verifyPulseAuthorOnly error:', err);
    res.status(500).json({ success: false, message: 'Server error checking Pulse ownership' });
  }
};

/**
 * Allows the author OR a designated platform admin (e.g. deleting rule-breaking pulses or toggling comments)
 */
const verifyPulseAuthorOrAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Pulse ID' });
    }

    const pulse = await Pulse.findById(id);
    if (!pulse) {
      return res.status(404).json({ success: false, message: 'Pulse not found' });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const isAuthor = pulse.author.equals(req.user._id);
    const userIsAdmin = isAdmin(req.user);

    if (!isAuthor && !userIsAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Author or Admin access required'
      });
    }

    req.pulse = pulse;
    req.isAuthor = isAuthor;
    req.isAdmin = userIsAdmin;
    next();
  } catch (err) {
    console.error('verifyPulseAuthorOrAdmin error:', err);
    res.status(500).json({ success: false, message: 'Server error checking Pulse permissions' });
  }
};

/**
 * Allows the comment author OR an admin to delete a comment
 */
const verifyCommentAuthorOrAdmin = async (req, res, next) => {
  try {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({ success: false, message: 'Invalid Comment ID' });
    }

    const comment = await PulseComment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: 'Comment not found' });
    }

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const isAuthor = comment.author.equals(req.user._id);
    const userIsAdmin = isAdmin(req.user);

    if (!isAuthor && !userIsAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Permission denied: Author or Admin access required'
      });
    }

    req.comment = comment;
    req.isAuthor = isAuthor;
    req.isAdmin = userIsAdmin;
    next();
  } catch (err) {
    console.error('verifyCommentAuthorOrAdmin error:', err);
    res.status(500).json({ success: false, message: 'Server error checking Comment permissions' });
  }
};

module.exports = {
  isAdmin,
  verifyPulseAuthorOnly,
  verifyPulseAuthorOrAdmin,
  verifyCommentAuthorOrAdmin
};
