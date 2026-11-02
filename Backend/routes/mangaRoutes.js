const express = require('express');
const router = express.Router();
const {
  searchManga,
  getMangaById,
  getMangaPictures,
  getMangaCharacters,
  getMangaRecommendations,
  getTopManga,
  getRandomManga,
  getMangaChapters,
  getChapterPages,
  proxyMangaImage
} = require('../controllers/mangaController');

router.get('/search', searchManga);
router.get('/top', getTopManga);
router.get('/random', getRandomManga);
router.get('/proxy-image', proxyMangaImage);
router.get('/:id/chapters', getMangaChapters);
router.get('/:id/chapter/:chapterNumber', getChapterPages);
router.get('/:id/pictures', getMangaPictures);
router.get('/:id/characters', getMangaCharacters);
router.get('/:id/recommendations', getMangaRecommendations);
router.get('/:id', getMangaById);
router.get('/', searchManga);

module.exports = router;
