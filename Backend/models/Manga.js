const mongoose = require('mongoose');

const mangaSchema = new mongoose.Schema({
  malId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  titleEnglish: String,
  titleJapanese: String,
  synopsis: String,
  imageUrl: String,
  bannerImage: String,
  type: {
    type: String,
    enum: ['Manga', 'Manhwa', 'Manhua', 'Novel', 'One-shot', 'Doujinshi', 'Light Novel']
  },
  chapters: Number,
  volumes: Number,
  status: {
    type: String,
    enum: ['Publishing', 'Completed', 'Discontinued', 'On Hiatus', 'Not yet published'],
    index: true
  },
  published: {
    from: Date,
    to: Date
  },
  score: {
    type: Number,
    index: true
  },
  scoredBy: Number,
  rank: Number,
  popularity: Number,
  genres: {
    type: [String],
    index: true
  },
  themes: [String],
  demographics: [String],
  authors: [{
    malId: Number,
    name: String,
    type: String
  }],
  serializations: [String],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for sorting by score
mangaSchema.index({ score: -1 });

module.exports = mongoose.model('Manga', mangaSchema);
