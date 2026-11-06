const crypto = require('crypto');
const mongoose = require('mongoose');
const Pulse = require('../models/Pulse');
const PulseComment = require('../models/PulseComment');
const {
  uploadImageBuffer,
  deleteImageByPublicId,
  extractCloudinaryPublicIds,
  deleteMultipleImages
} = require('../services/cloudinaryService');

/**
 * Helper to generate a clean, URL-safe unique slug
 */
const generateSlug = (title) => {
  const base = title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const uniqueHex = crypto.randomBytes(3).toString('hex');
  return `${base || 'pulse'}-${uniqueHex}`;
};

/**
 * Helper to calculate reading time in minutes based on word count
 */
const calculateReadingTime = (htmlContent) => {
  if (!htmlContent) return 1;
  const plainText = htmlContent.replace(/<[^>]*>/g, ' ').trim();
  const words = plainText.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
};

/**
 * Helper to extract plain text excerpt if not provided
 */
const extractExcerpt = (htmlContent, maxLen = 220) => {
  if (!htmlContent) return '';
  const plainText = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (plainText.length <= maxLen) return plainText;
  return plainText.substring(0, maxLen).trim() + '...';
};

// @desc    Get all published Pulses with filtering, sorting and pagination
// @route   GET /api/pulses
// @access  Public
const getAllPulses = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = 'latest',
      tag,
      mediaId,
      mediaType,
      author,
      search,
      status = 'published'
    } = req.query;

    const query = {};

    // Status filter - only allow drafts if author is viewing their own
    if (status === 'draft') {
      if (!req.user || (author && req.user._id.toString() !== author.toString())) {
        return res.status(403).json({ success: false, message: 'Not authorized to view drafts' });
      }
      query.status = 'draft';
    } else if (status === 'all' && req.user && author && req.user._id.toString() === author.toString()) {
      // Allow author to see all their own pulses
    } else {
      query.status = 'published';
    }

    if (tag) {
      query.tags = tag.toLowerCase().trim();
    }

    if (mediaId) {
      query['relatedMedia.malId'] = Number(mediaId);
    }

    if (mediaType) {
      query['relatedMedia.type'] = mediaType;
    }

    if (author) {
      if (mongoose.Types.ObjectId.isValid(author)) {
        query.author = author;
      }
    }

    if (search && search.trim()) {
      const trimmed = search.trim();
      query.$or = [
        { title: { $regex: trimmed, $options: 'i' } },
        { excerpt: { $regex: trimmed, $options: 'i' } },
        { tags: { $regex: trimmed, $options: 'i' } }
      ];
    }

    // Determine sort
    let sortOptions = { createdAt: -1 };
    if (sort === 'top') {
      sortOptions = { pulseScore: -1, createdAt: -1 };
    } else if (sort === 'trending') {
      // Trending: high pulse score prioritized, then recent
      sortOptions = { pulseScore: -1, views: -1, createdAt: -1 };
    } else if (sort === 'views') {
      sortOptions = { views: -1, createdAt: -1 };
    } else if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const total = await Pulse.countDocuments(query);
    const pulses = await Pulse.find(query)
      .select('-content') // Exclude heavy rich HTML in feed list
      .populate('author', 'username avatar')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .lean();

    const currentUserId = req.user?._id?.toString();

    // Map pulses to include userVote indicator and count metrics
    const data = pulses.map(p => {
      let userVote = null;
      if (currentUserId) {
        const hasUp = (p.upvotes || []).some(uid => uid.toString() === currentUserId);
        const hasDown = (p.downvotes || []).some(uid => uid.toString() === currentUserId);
        userVote = hasUp ? 'up' : hasDown ? 'down' : null;
      }
      return {
        ...p,
        upvoteCount: (p.upvotes || []).length,
        downvoteCount: (p.downvotes || []).length,
        userVote,
        // Omit raw user arrays from client response
        upvotes: undefined,
        downvotes: undefined
      };
    });

    res.json({
      success: true,
      data,
      pagination: {
        current: pageNum,
        pages: Math.ceil(total / limitNum) || 1,
        total,
        limit: limitNum
      }
    });
  } catch (err) {
    console.error('getAllPulses error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving Pulses' });
  }
};

// @desc    Get single Pulse by slug
// @route   GET /api/pulses/:slug
// @access  Public
const getPulseBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const pulse = await Pulse.findOneAndUpdate(
      { slug },
      { $inc: { views: 1 } },
      { new: true }
    ).populate('author', 'username avatar createdAt favoriteGenres');

    if (!pulse) {
      return res.status(404).json({ success: false, message: 'Pulse not found' });
    }

    // If draft, only author can view
    if (pulse.status === 'draft') {
      if (!req.user || !pulse.author._id.equals(req.user._id)) {
        return res.status(403).json({ success: false, message: 'This Pulse is still an unpublished draft' });
      }
    }

    const currentUserId = req.user?._id?.toString();
    let userVote = null;
    if (currentUserId) {
      const hasUp = (pulse.upvotes || []).some(uid => uid.toString() === currentUserId);
      const hasDown = (pulse.downvotes || []).some(uid => uid.toString() === currentUserId);
      userVote = hasUp ? 'up' : hasDown ? 'down' : null;
    }

    const pulseObj = pulse.toObject();
    pulseObj.upvoteCount = (pulse.upvotes || []).length;
    pulseObj.downvoteCount = (pulse.downvotes || []).length;
    pulseObj.userVote = userVote;
    delete pulseObj.upvotes;
    delete pulseObj.downvotes;

    res.json({
      success: true,
      data: pulseObj
    });
  } catch (err) {
    console.error('getPulseBySlug error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving Pulse' });
  }
};

// @desc    Get single Pulse by ID (for edit studio)
// @route   GET /api/pulses/id/:id
// @access  Public / Authenticated
const getPulseById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Pulse ID' });
    }

    const pulse = await Pulse.findById(id).populate('author', 'username avatar');
    if (!pulse) {
      return res.status(404).json({ success: false, message: 'Pulse not found' });
    }

    if (pulse.status === 'draft') {
      if (!req.user || !pulse.author._id.equals(req.user._id)) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this draft' });
      }
    }

    res.json({ success: true, data: pulse });
  } catch (err) {
    console.error('getPulseById error:', err);
    res.status(500).json({ success: false, message: 'Server error retrieving Pulse by ID' });
  }
};

// @desc    Create a new Pulse
// @route   POST /api/pulses
// @access  Authenticated
const createPulse = async (req, res) => {
  try {
    const {
      title,
      content,
      excerpt,
      coverImage,
      tags = [],
      relatedMedia = [],
      hasSpoilers = false,
      commentsEnabled = true,
      status = 'published',
      uploadedAssetPublicIds = []
    } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Pulse title is required' });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: 'Pulse content is required' });
    }

    const slug = generateSlug(title);
    const readingTimeMinutes = calculateReadingTime(content);
    const resolvedExcerpt = (excerpt && excerpt.trim()) ? excerpt.trim() : extractExcerpt(content);

    const formattedTags = Array.isArray(tags)
      ? tags.map(t => String(t).trim().toLowerCase()).filter(Boolean)
      : [];

    const pulse = new Pulse({
      title: title.trim(),
      slug,
      excerpt: resolvedExcerpt,
      content,
      coverImage: {
        url: coverImage?.url || null,
        publicId: coverImage?.publicId || null
      },
      author: req.user._id,
      tags: formattedTags,
      relatedMedia: Array.isArray(relatedMedia) ? relatedMedia : [],
      hasSpoilers: Boolean(hasSpoilers),
      commentsEnabled: commentsEnabled !== undefined ? Boolean(commentsEnabled) : true,
      readingTimeMinutes,
      status: ['draft', 'published'].includes(status) ? status : 'published'
    });

    await pulse.save();
    await pulse.populate('author', 'username avatar');

    // Smart cleanup of discarded session uploads (e.g. backspaced images or removed banners)
    if (Array.isArray(uploadedAssetPublicIds) && uploadedAssetPublicIds.length > 0) {
      const activeIds = extractCloudinaryPublicIds(content);
      if (coverImage?.publicId) {
        activeIds.add(coverImage.publicId);
      }
      const orphanIds = uploadedAssetPublicIds.filter(id => !activeIds.has(id));
      if (orphanIds.length > 0) {
        deleteMultipleImages(orphanIds).catch(err => {
          console.warn('Background cleanup of discarded session assets failed:', err);
        });
      }
    }

    res.status(201).json({
      success: true,
      data: pulse
    });
  } catch (err) {
    console.error('createPulse error:', err);
    res.status(500).json({ success: false, message: err.message || 'Server error creating Pulse' });
  }
};

// @desc    Update an existing Pulse
// @route   PUT /api/pulses/:id
// @access  Author Only (via verifyPulseAuthorOnly)
const updatePulse = async (req, res) => {
  try {
    const pulse = req.pulse; // Already validated and attached by middleware
    const {
      title,
      content,
      excerpt,
      coverImage,
      tags,
      relatedMedia,
      hasSpoilers,
      commentsEnabled,
      status,
      uploadedAssetPublicIds = []
    } = req.body;

    // Track prior active assets before applying updates
    const priorActiveIds = extractCloudinaryPublicIds(pulse.content);
    if (pulse.coverImage?.publicId) {
      priorActiveIds.add(pulse.coverImage.publicId);
    }

    if (title && title.trim()) {
      pulse.title = title.trim();
    }

    if (content && content.trim()) {
      pulse.content = content;
      pulse.readingTimeMinutes = calculateReadingTime(content);
    }

    if (excerpt !== undefined) {
      pulse.excerpt = (excerpt && excerpt.trim())
        ? excerpt.trim()
        : extractExcerpt(pulse.content);
    }

    if (coverImage) {
      pulse.coverImage = {
        url: coverImage.url || null,
        publicId: coverImage.publicId || null
      };
    }

    if (Array.isArray(tags)) {
      pulse.tags = tags.map(t => String(t).trim().toLowerCase()).filter(Boolean);
    }

    if (Array.isArray(relatedMedia)) {
      pulse.relatedMedia = relatedMedia;
    }

    if (hasSpoilers !== undefined) {
      pulse.hasSpoilers = Boolean(hasSpoilers);
    }

    if (commentsEnabled !== undefined) {
      pulse.commentsEnabled = Boolean(commentsEnabled);
    }

    if (status && ['draft', 'published'].includes(status)) {
      pulse.status = status;
    }

    await pulse.save();
    await pulse.populate('author', 'username avatar');

    // Smart cleanup of discarded assets (from previous content + new uploads during edit)
    const newActiveIds = extractCloudinaryPublicIds(pulse.content);
    if (pulse.coverImage?.publicId) {
      newActiveIds.add(pulse.coverImage.publicId);
    }

    const candidatePool = new Set([
      ...priorActiveIds,
      ...(Array.isArray(uploadedAssetPublicIds) ? uploadedAssetPublicIds : [])
    ]);

    const orphanIds = Array.from(candidatePool).filter(id => !newActiveIds.has(id));
    if (orphanIds.length > 0) {
      deleteMultipleImages(orphanIds).catch(err => {
        console.warn('Background cleanup of discarded update assets failed:', err);
      });
    }

    res.json({
      success: true,
      data: pulse
    });
  } catch (err) {
    console.error('updatePulse error:', err);
    res.status(500).json({ success: false, message: 'Server error updating Pulse' });
  }
};

// @desc    Delete a Pulse
// @route   DELETE /api/pulses/:id
// @access  Author OR Admin (via verifyPulseAuthorOrAdmin)
const deletePulse = async (req, res) => {
  try {
    const pulse = req.pulse; // Attached by verifyPulseAuthorOrAdmin

    // Clean up all Cloudinary assets associated with this Pulse (cover + inline content images)
    const assetsToDelete = extractCloudinaryPublicIds(pulse.content);
    if (pulse.coverImage?.publicId) {
      assetsToDelete.add(pulse.coverImage.publicId);
    }

    if (assetsToDelete.size > 0) {
      deleteMultipleImages(assetsToDelete).catch(err => {
        console.warn('Failed to clean up Cloudinary assets on pulse deletion:', err);
      });
    }

    // Delete associated comments
    await PulseComment.deleteMany({ pulseId: pulse._id });

    // Delete the Pulse
    await pulse.deleteOne();

    res.json({
      success: true,
      message: 'Pulse and associated discussions deleted successfully'
    });
  } catch (err) {
    console.error('deletePulse error:', err);
    res.status(500).json({ success: false, message: 'Server error deleting Pulse' });
  }
};

// @desc    Toggle comments on/off
// @route   PATCH /api/pulses/:id/toggle-comments
// @access  Author OR Admin (via verifyPulseAuthorOrAdmin)
const toggleComments = async (req, res) => {
  try {
    const pulse = req.pulse; // Attached by verifyPulseAuthorOrAdmin
    const { commentsEnabled } = req.body;

    pulse.commentsEnabled = commentsEnabled !== undefined
      ? Boolean(commentsEnabled)
      : !pulse.commentsEnabled;

    await pulse.save();

    res.json({
      success: true,
      commentsEnabled: pulse.commentsEnabled,
      message: `Comments have been ${pulse.commentsEnabled ? 'enabled' : 'disabled'}`
    });
  } catch (err) {
    console.error('toggleComments error:', err);
    res.status(500).json({ success: false, message: 'Server error toggling comments' });
  }
};

// @desc    Vote (upvote or downvote) on a Pulse
// @route   POST /api/pulses/:id/vote
// @access  Authenticated
const votePulse = async (req, res) => {
  try {
    const { id } = req.params;
    const { direction } = req.body; // 'up' or 'down'
    const userId = req.user._id;

    if (!['up', 'down'].includes(direction)) {
      return res.status(400).json({ success: false, message: "Invalid vote direction. Must be 'up' or 'down'" });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid Pulse ID' });
    }

    const pulse = await Pulse.findById(id);
    if (!pulse) {
      return res.status(404).json({ success: false, message: 'Pulse not found' });
    }

    const hasUpvoted = pulse.upvotes.some(uid => uid.equals(userId));
    const hasDownvoted = pulse.downvotes.some(uid => uid.equals(userId));

    if (direction === 'up') {
      if (hasUpvoted) {
        // Toggle off -> Neutral
        pulse.upvotes.pull(userId);
      } else {
        // Apply upvote and remove any downvote
        pulse.upvotes.addToSet(userId);
        pulse.downvotes.pull(userId);
      }
    } else if (direction === 'down') {
      if (hasDownvoted) {
        // Toggle off -> Neutral
        pulse.downvotes.pull(userId);
      } else {
        // Apply downvote and remove any upvote
        pulse.downvotes.addToSet(userId);
        pulse.upvotes.pull(userId);
      }
    }

    pulse.pulseScore = pulse.upvotes.length - pulse.downvotes.length;
    await pulse.save();

    const currentUpvoted = pulse.upvotes.some(uid => uid.equals(userId));
    const currentDownvoted = pulse.downvotes.some(uid => uid.equals(userId));
    const userVote = currentUpvoted ? 'up' : currentDownvoted ? 'down' : null;

    res.json({
      success: true,
      pulseScore: pulse.pulseScore,
      userVote,
      upvoteCount: pulse.upvotes.length,
      downvoteCount: pulse.downvotes.length
    });
  } catch (err) {
    console.error('votePulse error:', err);
    res.status(500).json({ success: false, message: 'Server error processing Pulse vote' });
  }
};

// @desc    Upload an image for cover or inline content via Cloudinary
// @route   POST /api/pulses/upload-image
// @access  Authenticated
const uploadPulseImage = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'No image file uploaded' });
    }

    const result = await uploadImageBuffer(req.file.buffer, 'animeverse/pulses');

    res.json({
      success: true,
      url: result.url,
      publicId: result.publicId
    });
  } catch (err) {
    console.error('uploadPulseImage error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Server error uploading image to Cloudinary'
    });
  }
};

// @desc    Cleanup uncommitted uploaded assets (e.g. user cleared draft or cancelled)
// @route   POST /api/pulses/cleanup-assets
// @access  Authenticated
const cleanupDiscardedAssets = async (req, res) => {
  try {
    const { publicIds } = req.body;
    if (!Array.isArray(publicIds) || publicIds.length === 0) {
      return res.status(200).json({ success: true, message: 'No assets to clean up' });
    }

    // Safety: ensure assets belong to animeverse/pulses folder
    const safeIds = publicIds.filter(id => typeof id === 'string' && id.startsWith('animeverse/pulses/'));
    if (safeIds.length > 0) {
      await deleteMultipleImages(safeIds);
    }

    res.status(200).json({
      success: true,
      message: `Cleaned up ${safeIds.length} discarded asset(s)`
    });
  } catch (err) {
    console.error('cleanupDiscardedAssets error:', err);
    res.status(500).json({ success: false, message: 'Server error cleaning up assets' });
  }
};

module.exports = {
  getAllPulses,
  getPulseBySlug,
  getPulseById,
  createPulse,
  updatePulse,
  deletePulse,
  toggleComments,
  votePulse,
  uploadPulseImage,
  cleanupDiscardedAssets
};
