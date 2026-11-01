const aniListApi = require('../utils/aniListApi');
const Character = require('../models/Character');

// @desc    Get character by ID
// @route   GET /api/characters/:id
// @access  Public
const getCharacterById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const numericId = parseInt(id);

    // 1. Database-first: check MongoDB cache first
    let character = await Character.findOne({ malId: numericId });
    let cached = true;

    // 2. Fallback to AniList GraphQL API
    if (!character) {
      cached = false;
      character = await aniListApi.fetchCharacterById(id);
      if (!character) {
        return res.status(404).json({
          success: false,
          message: 'Character not found'
        });
      }
    }

    const charObj = character.toObject ? character.toObject() : character;

    // Ensure backwards compatibility with frontend CharacterDetails expectations
    if (!charObj.voices && charObj.voiceActors) {
      charObj.voices = charObj.voiceActors.map(va => ({
        person: {
          name: va.name,
          images: { jpg: { image_url: va.imageUrl } }
        },
        language: va.language
      }));
    }
    if (!charObj.anime && charObj.animeAppearances) {
      const missingIds = charObj.animeAppearances
        .filter(a => !a.imageUrl && a.malId)
        .map(a => a.malId);

      const coverMap = new Map();
      if (missingIds.length > 0) {
        const Anime = require('../models/Anime');
        const matchedAnime = await Anime.find({ malId: { $in: missingIds } }).select('malId imageUrl images');
        matchedAnime.forEach(item => {
          coverMap.set(item.malId, item.imageUrl || item.images?.jpg?.large_image_url || item.images?.jpg?.image_url);
        });
      }

      charObj.anime = charObj.animeAppearances.map(a => {
        const cover = a.imageUrl || coverMap.get(a.malId) || '';
        return {
          role: a.role,
          anime: {
            mal_id: a.malId,
            malId: a.malId,
            title: a.title,
            imageUrl: cover,
            images: {
              jpg: {
                image_url: cover,
                large_image_url: cover
              }
            }
          }
        };
      });
    }
    if (!charObj.name_kanji && charObj.nameKanji) {
      charObj.name_kanji = charObj.nameKanji;
    }
    if (!charObj.images && charObj.imageUrl) {
      charObj.images = {
        jpg: {
          image_url: charObj.imageUrl,
          large_image_url: charObj.imageUrl
        }
      };
    }

    return res.json({
      success: true,
      data: charObj,
      cached
    });
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Character not found'
      });
    }
    next(error);
  }
};

// @desc    Get character pictures
// @route   GET /api/characters/:id/pictures
// @access  Public
const getCharacterPictures = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pictures = await aniListApi.getCharacterPictures(id);

    res.json({
      success: true,
      data: pictures
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCharacterById,
  getCharacterPictures
};
