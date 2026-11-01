const Manga = require('../models/Manga');
const aniListApi = require('../utils/aniListApi');

// @desc    Search manga (Database-First with AniList fallback)
// @route   GET /api/manga/search or GET /api/manga
// @access  Public
const searchManga = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 25, type, status, order_by, sort, genre, genres } = req.query;

    const parsedPage = Math.max(parseInt(page) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 25, 1), 50);
    const skip = (parsedPage - 1) * parsedLimit;

    const query = {};

    if (q && q.trim()) {
      const trimmedQ = q.trim();
      query.$or = [
        { title: { $regex: trimmedQ, $options: 'i' } },
        { titleEnglish: { $regex: trimmedQ, $options: 'i' } },
        { titleJapanese: { $regex: trimmedQ, $options: 'i' } }
      ];
    }

    if (status) {
      const s = status.toLowerCase();
      if (s === 'publishing' || s === 'releasing') {
        query.status = { $in: ['Publishing', 'Releasing'] };
      } else if (s === 'complete' || s === 'completed' || s === 'finished') {
        query.status = { $in: ['Completed', 'Finished'] };
      } else if (s === 'upcoming' || s === 'not yet published') {
        query.status = { $in: ['Upcoming', 'Not yet published'] };
      } else {
        query.status = new RegExp(`^${status}$`, 'i');
      }
    }

    if (type) {
      query.type = new RegExp(`^${type}$`, 'i');
    }

    const genreParam = genre || genres;
    if (genreParam) {
      const genreList = genreParam.split(',').map(g => g.trim()).filter(Boolean);
      if (genreList.length > 0) {
        query.genres = { $in: genreList.map(g => new RegExp(`^${g}$`, 'i')) };
      }
    } else {
      // Exclude adult/hentai content by default unless explicitly filtered
      query.genres = { $nin: ['Hentai', 'hentai'] };
    }

    // Determine sort option
    let sortOption = {};
    const sortDirection = (sort && sort.toLowerCase() === 'asc') ? 1 : -1;

    if (order_by === 'popularity') {
      sortOption = { popularity: -1, score: -1 };
    } else if (order_by === 'score') {
      sortOption = { score: sortDirection, scoredBy: -1 };
    } else if (order_by === 'title') {
      sortOption = { title: sortDirection };
    } else if (order_by === 'start_date' || order_by === 'year') {
      sortOption = { 'published.from': sortDirection, score: -1 };
    } else {
      sortOption = { popularity: -1, score: -1 };
    }

    // 1. Query MongoDB first (Database-First: < 15ms)
    const total = await Manga.countDocuments(query);
    const results = await Manga.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parsedLimit);

    if (results.length > 0) {
      return res.json({
        success: true,
        data: results,
        pagination: {
          last_visible_page: Math.ceil(total / parsedLimit) || 1,
          has_next_page: (parsedPage * parsedLimit) < total,
          current_page: parsedPage,
          total_items: total
        }
      });
    }

    // 2. Fallback to AniList API on cache miss
    try {
      const filters = {
        page: parsedPage,
        limit: parsedLimit,
        type,
        status,
        order_by,
        sort,
        genre: genre || genres
      };

      const result = await aniListApi.searchManga(q || '', filters);
      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination
      });
    } catch (apiError) {
      console.error('AniList Manga search fallback error:', apiError.message);
      return res.json({
        success: true,
        data: [],
        pagination: {
          last_visible_page: 1,
          has_next_page: false,
          current_page: parsedPage,
          total_items: 0
        }
      });
    }
  } catch (error) {
    console.error('Manga search error:', error.message);
    res.status(500).json({
      success: false,
      data: [],
      pagination: { last_visible_page: 1, has_next_page: false, current_page: 1 },
      message: error.message || 'Error occurred while searching manga.'
    });
  }
};

// @desc    Get manga by ID (Database-First)
// @route   GET /api/manga/:id
// @access  Public
const getMangaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const malId = parseInt(id);

    if (isNaN(malId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid manga ID'
      });
    }

    // 1. Check MongoDB cache first (< 10ms)
    const manga = await Manga.findOne({ malId });
    if (manga) {
      return res.json({
        success: true,
        data: manga,
        cached: true
      });
    }

    // 2. Fetch from AniList API and persist in MongoDB
    try {
      const freshManga = await aniListApi.fetchMangaById(malId);
      if (!freshManga) {
        return res.status(404).json({
          success: false,
          message: 'Manga not found'
        });
      }
      return res.json({
        success: true,
        data: freshManga
      });
    } catch (apiError) {
      console.error(`AniList fetch error for manga ${malId}:`, apiError.message);
      return res.status(502).json({
        success: false,
        message: 'Unable to fetch manga details from external provider.'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get manga pictures
// @route   GET /api/manga/:id/pictures
// @access  Public
const getMangaPictures = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pictures = await aniListApi.getMangaPictures(id);

    res.json({
      success: true,
      data: pictures
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get manga characters
// @route   GET /api/manga/:id/characters
// @access  Public
const getMangaCharacters = async (req, res, next) => {
  try {
    const { id } = req.params;
    const characters = await aniListApi.getMangaCharacters(id);

    res.json({
      success: true,
      data: characters
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get manga recommendations
// @route   GET /api/manga/:id/recommendations
// @access  Public
const getMangaRecommendations = async (req, res, next) => {
  try {
    const { id } = req.params;
    const recommendations = await aniListApi.getMangaRecommendations(id);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error(`❌ Error fetching recommendations for manga ${req.params.id}:`, error.message);
    res.json({
      success: true,
      data: [],
      message: 'Recommendations temporarily unavailable'
    });
  }
};

// @desc    Get top manga (Database-First with AniList fallback)
// @route   GET /api/manga/top
// @access  Public
const getTopManga = async (req, res, next) => {
  try {
    const { page = 1, limit = 25, refresh } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 25, 1), 50);
    const parsedPage = Math.max(parseInt(page) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    // 1. Query MongoDB first (exclude adult/hentai from top manga by default)
    const baseQuery = { score: { $gt: 0 }, genres: { $nin: ['Hentai', 'hentai'] } };
    const total = await Manga.countDocuments(baseQuery);
    const cached = await Manga.find(baseQuery)
      .sort({ score: -1, scoredBy: -1, popularity: -1 })
      .skip(skip)
      .limit(parsedLimit);

    if (cached.length > 0 && !refresh) {
      return res.json({
        success: true,
        data: cached,
        pagination: {
          last_visible_page: Math.ceil(total / parsedLimit) || 1,
          has_next_page: (parsedPage * parsedLimit) < total,
          current_page: parsedPage,
          total_items: total
        },
        cached: true
      });
    }

    // 2. Fetch from AniList API if DB empty or refresh forced
    try {
      const result = await aniListApi.getTopManga(parsedPage, parsedLimit);
      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        cached: false
      });
    } catch (apiError) {
      console.error('AniList getTopManga error:', apiError.message);
      if (cached.length > 0) {
        return res.json({
          success: true,
          data: cached,
          pagination: {
            last_visible_page: Math.ceil(total / parsedLimit) || 1,
            has_next_page: (parsedPage * parsedLimit) < total,
            current_page: parsedPage
          },
          cached: true
        });
      }
      return res.json({
        success: true,
        data: [],
        pagination: { last_visible_page: 1, has_next_page: false }
      });
    }
  } catch (error) {
    console.error('Error fetching top manga:', error.message);
    res.json({
      success: true,
      data: [],
      pagination: { last_visible_page: 1, has_next_page: false },
      message: 'Top manga temporarily unavailable.'
    });
  }
};

// @desc    Get random manga
// @route   GET /api/manga/random
// @access  Public
const getRandomManga = async (req, res, next) => {
  try {
    const manga = await aniListApi.getRandomManga();

    res.json({
      success: true,
      data: manga
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  searchManga,
  getMangaById,
  getMangaPictures,
  getMangaCharacters,
  getMangaRecommendations,
  getTopManga,
  getRandomManga
};
