const mongoose = require('mongoose');

const pageItemSchema = new mongoose.Schema({
  pageNumber: {
    type: Number,
    required: true
  },
  rawCdnUrl: {
    type: String,
    required: true
  },
  proxyUrl: {
    type: String,
    required: true
  },
  dimensions: {
    width: {
      type: Number,
      default: null
    },
    height: {
      type: Number,
      default: null
    }
  }
}, { _id: false });

const mangaChapterPagesSchema = new mongoose.Schema({
  mangaId: {
    type: Number,
    required: true,
    index: true
  },
  chapter: {
    type: String,
    required: true,
    index: true
  },
  totalPages: {
    type: Number,
    default: 0
  },
  provider: {
    type: String,
    default: 'mangapill'
  },
  pages: [pageItemSchema],
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800 // 7 days in seconds (MongoDB TTL index)
  }
}, {
  timestamps: true
});

// Compound unique index for fast lookups and preventing duplicate chapter page documents
mangaChapterPagesSchema.index({ mangaId: 1, chapter: 1 }, { unique: true });

module.exports = mongoose.model('MangaChapterPages', mangaChapterPagesSchema);
