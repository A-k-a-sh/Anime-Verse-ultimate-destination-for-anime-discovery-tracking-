const mongoose = require('mongoose');

const chapterItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  chapter: {
    type: String,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  volume: {
    type: String,
    default: null
  },
  date: {
    type: Date,
    default: null
  }
}, { _id: false });

const mangaChapterIndexSchema = new mongoose.Schema({
  malId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  provider: {
    type: String,
    required: true,
    default: 'mangapill'
  },
  totalChapters: {
    type: Number,
    default: 0
  },
  chapters: [chapterItemSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MangaChapterIndex', mangaChapterIndexSchema);
