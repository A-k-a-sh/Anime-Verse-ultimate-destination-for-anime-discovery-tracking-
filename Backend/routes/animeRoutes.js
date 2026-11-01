const express = require('express');
const router = express.Router();
const {
  getAllAnime,
  searchAnime,
  getAnimeById,
  getAnimePictures,
  getAnimeCharacters,
  getAnimeStaff,
  getAnimeEpisodes,
  getAnimeRecommendations,
  getAnimeReviews,
  getSeasonalAnime,
  getTopAnime,
  getRandomAnime,
  syncAiringAnime
} = require('../controllers/animeController');

// Order matters: specific routes before :id parameter routes
router.get('/search', searchAnime);
router.get('/top', getTopAnime);
router.get('/random', getRandomAnime);
router.get('/sync-airing', syncAiringAnime);
router.get('/seasonal/:year/:season', getSeasonalAnime);
router.get('/:id/pictures', getAnimePictures);
router.get('/:id/characters', getAnimeCharacters);
router.get('/:id/staff', getAnimeStaff);
router.get('/:id/episodes', getAnimeEpisodes);
router.get('/:id/recommendations', getAnimeRecommendations);
router.get('/:id/reviews', getAnimeReviews);
router.get('/:id', getAnimeById);
router.get('/', getAllAnime);

module.exports = router;
