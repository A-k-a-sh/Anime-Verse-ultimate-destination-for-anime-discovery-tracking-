const mongoose = require('mongoose');

const animeSchema = new mongoose.Schema({
  malId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  anilistId: {
    type: Number,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  titleEnglish: String,
  titleJapanese: String,
  synopsis: String,
  background: String,
  imageUrl: String,
  bannerImage: String,
  trailerUrl: String,
  episodes: Number,
  duration: String,
  status: {
    type: String,
    enum: ['Airing', 'Completed', 'Upcoming', 'Not yet aired'],
    index: true
  },
  aired: {
    from: Date,
    to: Date
  },
  broadcast: {
    day: String,
    time: String,
    timezone: String
  },
  rating: String,
  genres: {
    type: [String],
    index: true
  },
  themes: [String],
  demographics: [String],
  studios: [String],
  producers: [String],
  licensors: [String],
  source: String,
  score: {
    type: Number,
    index: true
  },
  scoredBy: Number,
  rank: Number,
  popularity: Number,
  year: {
    type: Number,
    index: true
  },
  season: {
    type: String,
    enum: ['winter', 'spring', 'summer', 'fall'],
    index: true
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for seasonal queries
animeSchema.index({ year: 1, season: 1 });

// Index for sorting by score
animeSchema.index({ score: -1 });

module.exports = mongoose.model('Anime', animeSchema);
