const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect, optionalAuth } = require('../middleware/auth');
const {
  verifyPulseAuthorOnly,
  verifyPulseAuthorOrAdmin,
  verifyCommentAuthorOrAdmin
} = require('../middleware/adminCheck');

const {
  getAllPulses,
  getPulseBySlug,
  getPulseById,
  createPulse,
  updatePulse,
  deletePulse,
  toggleComments,
  votePulse,
  uploadPulseImage
} = require('../controllers/pulseController');

const {
  getPulseComments,
  createComment,
  deleteComment,
  voteComment
} = require('../controllers/pulseCommentController');

// Configure Multer memory storage for direct Cloudinary streaming
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed'), false);
    }
  }
});

// Middleware to catch Multer-specific upload errors gracefully
const handleUpload = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
};

// ============================================================================
// 1. Static / Specific Action Routes (Must precede dynamic :slug / :id)
// ============================================================================

// GET /api/pulses - Public feed with filters, search and sorting
router.get('/', optionalAuth, getAllPulses);

// POST /api/pulses - Create a new Pulse
router.post('/', protect, createPulse);

// POST /api/pulses/upload-image - Upload cover or inline image to Cloudinary
router.post('/upload-image', protect, handleUpload, uploadPulseImage);

// GET /api/pulses/id/:id - Fetch pulse by Mongo ID (used by authoring editor)
router.get('/id/:id', optionalAuth, getPulseById);

// ============================================================================
// 2. Threaded Comments Sub-Routes
// ============================================================================

// GET /api/pulses/:id/comments - Retrieve discussion tree
router.get('/:id/comments', optionalAuth, getPulseComments);

// POST /api/pulses/:id/comments - Post a new comment or nested reply
router.post('/:id/comments', protect, createComment);

// DELETE /api/pulses/:id/comments/:commentId - Delete comment (Reddit-style graceful mask)
router.delete('/:id/comments/:commentId', protect, verifyCommentAuthorOrAdmin, deleteComment);

// POST /api/pulses/:id/comments/:commentId/vote - Vote on a comment
router.post('/:id/comments/:commentId/vote', protect, voteComment);

// ============================================================================
// 3. Pulse Modification & Voting Routes (by Mongo ID)
// ============================================================================

// POST /api/pulses/:id/vote - Upvote / Downvote a Pulse
router.post('/:id/vote', protect, votePulse);

// PATCH /api/pulses/:id/toggle-comments - Author or Admin lock/unlock comments
router.patch('/:id/toggle-comments', protect, verifyPulseAuthorOrAdmin, toggleComments);

// PUT /api/pulses/:id - Edit Pulse (Author only)
router.put('/:id', protect, verifyPulseAuthorOnly, updatePulse);

// DELETE /api/pulses/:id - Delete Pulse (Author or Admin)
router.delete('/:id', protect, verifyPulseAuthorOrAdmin, deletePulse);

// ============================================================================
// 4. Reader View Route (by URL Slug)
// ============================================================================

// GET /api/pulses/:slug - Public reader view (increments view count)
router.get('/:slug', optionalAuth, getPulseBySlug);

module.exports = router;
