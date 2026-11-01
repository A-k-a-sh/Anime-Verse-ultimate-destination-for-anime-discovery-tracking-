const mongoose = require('mongoose');

const characterSchema = new mongoose.Schema({
  malId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true
  },
  nameKanji: String,
  nicknames: [String],
  about: String,
  imageUrl: String,
  favorites: Number,
  animeAppearances: [{
    malId: Number,
    title: String,
    imageUrl: String,
    role: {
      type: String,
      enum: ['Main', 'Supporting']
    }
  }],
  mangaAppearances: [{
    malId: Number,
    title: String,
    role: {
      type: String,
      enum: ['Main', 'Supporting']
    }
  }],
  voiceActors: [{
    malId: Number,
    name: String,
    imageUrl: String,
    language: String
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Character', characterSchema);
