const Anime = require('../models/Anime');
const jikanApi = require('../utils/jikanApi');

// @desc    Get all anime with filters and pagination
// @route   GET /api/anime
// @access  Public
const getAllAnime = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      genre,
      year,
      season,
      status,
      sort = 'score_desc',
      search
    } = req.query;

    // Build query
    const query = {};
    
    if (genre) {
      const genres = genre.split(',');
      query.genres = { $in: genres.map(g => new RegExp(`^${g.trim()}$`, 'i')) };
    }
    
    if (year) query.year = parseInt(year);
    if (season) query.season = season.toLowerCase();
    if (status) {
      const s = status.toLowerCase();
      if (s === 'airing' || s === 'currently airing') {
        query.status = { $in: ['Airing', 'Currently Airing'] };
      } else if (s === 'complete' || s === 'completed' || s === 'finished airing') {
        query.status = { $in: ['Completed', 'Finished Airing'] };
      } else if (s === 'upcoming' || s === 'not yet aired') {
        query.status = { $in: ['Upcoming', 'Not yet aired'] };
      } else {
        query.status = new RegExp(`^${status}$`, 'i');
      }
    }
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { titleEnglish: { $regex: search, $options: 'i' } },
        { titleJapanese: { $regex: search, $options: 'i' } }
      ];
    }

    // Determine sort
    let sortOption = {};
    switch (sort) {
      case 'score_desc':
        sortOption = { score: -1, scoredBy: -1 };
        break;
      case 'score_asc':
        sortOption = { score: 1 };
        break;
      case 'title_asc':
        sortOption = { title: 1 };
        break;
      case 'year_desc':
        sortOption = { year: -1, score: -1 };
        break;
      default:
        sortOption = { score: -1, scoredBy: -1 };
    }

    const parsedPage = Math.max(parseInt(page) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const skip = (parsedPage - 1) * parsedLimit;
    const total = await Anime.countDocuments(query);
    const anime = await Anime.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parsedLimit);

    res.json({
      success: true,
      data: anime,
      pagination: {
        currentPage: parsedPage,
        totalPages: Math.ceil(total / parsedLimit) || 1,
        totalResults: total,
        hasNextPage: parsedPage * parsedLimit < total,
        hasPrevPage: parsedPage > 1,
        last_visible_page: Math.ceil(total / parsedLimit) || 1,
        current_page: parsedPage,
        has_next_page: parsedPage * parsedLimit < total
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Search anime
// @route   GET /api/anime/search
// @access  Public
const searchAnime = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 25, type, status, rating, genre, genres, order_by, sort } = req.query;

    const parsedPage = Math.max(parseInt(page) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 25, 1), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    // Build MongoDB query
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
      if (s === 'airing' || s === 'currently airing') {
        query.status = { $in: ['Airing', 'Currently Airing'] };
      } else if (s === 'complete' || s === 'completed' || s === 'finished airing') {
        query.status = { $in: ['Completed', 'Finished Airing'] };
      } else if (s === 'upcoming' || s === 'not yet aired') {
        query.status = { $in: ['Upcoming', 'Not yet aired'] };
      } else {
        query.status = new RegExp(`^${status}$`, 'i');
      }
    }

    const genreParam = genre || genres;
    if (genreParam) {
      const genreList = genreParam.split(',').map(g => g.trim()).filter(Boolean);
      if (genreList.length > 0) {
        query.genres = { $in: genreList.map(g => new RegExp(`^${g}$`, 'i')) };
      }
    }

    if (rating) {
      query.rating = { $regex: rating, $options: 'i' };
    }

    // Determine sort option
    let sortOption = {};
    const sortDirection = (sort && sort.toLowerCase() === 'asc') ? 1 : -1;

    if (order_by === 'popularity') {
      sortOption = { popularity: 1, score: -1 };
    } else if (order_by === 'score') {
      sortOption = { score: sortDirection, scoredBy: -1 };
    } else if (order_by === 'title') {
      sortOption = { title: sortDirection };
    } else if (order_by === 'start_date' || order_by === 'year') {
      sortOption = { 'aired.from': sortDirection, year: sortDirection, score: -1 };
    } else {
      sortOption = { score: -1, scoredBy: -1 };
    }

    // Query MongoDB first - always prioritize database
    const total = await Anime.countDocuments(query);
    const results = await Anime.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parsedLimit);

    // If results found in MongoDB, return immediately (<15ms)
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

    // Crucial Fallback: ONLY if results.length === 0 AND a specific search query 'q' was provided,
    // query Jikan API and asynchronously cache the results into MongoDB
    if (q && q.trim()) {
      const filters = {
        page: parsedPage,
        limit: parsedLimit,
        type,
        status,
        rating,
        genre: genre || genres,
        order_by,
        sort
      };

      try {
        const result = await jikanApi.searchAnime(q.trim(), filters);
        return res.json({
          success: true,
          data: result.data,
          pagination: result.pagination
        });
      } catch (apiError) {
        console.error('Jikan API fallback error for search query:', q, apiError.message);
      }
    }

    // If query returned 0 items from DB and no Jikan fallback needed, return empty results
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
  } catch (error) {
    console.error('Search error:', error.message);
    res.status(500).json({
      success: false,
      data: [],
      pagination: { last_visible_page: 1, has_next_page: false, current_page: 1 },
      message: error.message || 'Error occurred while searching anime.'
    });
  }
};

// @desc    Get anime by ID
// @route   GET /api/anime/:id
// @access  Public
const getAnimeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Try to fetch fresh data from Jikan API (with caching inside)
    try {
      const anime = await jikanApi.fetchAnimeById(id);
      if (!anime) {
        return res.status(404).json({
          success: false,
          message: 'Anime not found'
        });
      }
      return res.json({
        success: true,
        data: anime
      });
    } catch (apiError) {
      // If API fails, try cache as fallback
      console.error('API error for anime details, checking cache:', apiError.message);
      const cached = await Anime.findOne({ malId: parseInt(id) });
      
      if (cached) {
        return res.json({
          success: true,
          data: cached,
          cached: true,
          message: 'Showing cached data due to API unavailability'
        });
      }
      
      return res.status(404).json({
        success: false,
        message: 'Anime not found'
      });
    }
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({
        success: false,
        message: 'Anime not found'
      });
    }
    next(error);
  }
};

// @desc    Get anime pictures
// @route   GET /api/anime/:id/pictures
// @access  Public
const getAnimePictures = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pictures = await jikanApi.getAnimePictures(id);

    res.json({
      success: true,
      data: pictures
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get anime characters
// @route   GET /api/anime/:id/characters
// @access  Public
const getAnimeCharacters = async (req, res, next) => {
  try {
    const { id } = req.params;
    const characters = await jikanApi.getAnimeCharacters(id);

    res.json({
      success: true,
      data: characters
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get anime staff
// @route   GET /api/anime/:id/staff
// @access  Public
const getAnimeStaff = async (req, res, next) => {
  try {
    const { id } = req.params;
    const staff = await jikanApi.getAnimeStaff(id);

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get anime episodes
// @route   GET /api/anime/:id/episodes
// @access  Public
const getAnimeEpisodes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1 } = req.query;
    
    const result = await jikanApi.getAnimeEpisodes(id, page);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get anime recommendations
// @route   GET /api/anime/:id/recommendations
// @access  Public
const getAnimeRecommendations = async (req, res, next) => {
  try {
    const { id } = req.params;
    const recommendations = await jikanApi.getAnimeRecommendations(id);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error(`❌ Error fetching recommendations for anime ${req.params.id}:`, error.message);
    console.error('Error details:', error.response?.data || error);
    // Return empty array on error instead of failing
    res.json({
      success: true,
      data: [],
      message: 'Recommendations temporarily unavailable'
    });
  }
};

// @desc    Get anime reviews from MAL
// @route   GET /api/anime/:id/reviews
// @access  Public
const getAnimeReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { page = 1 } = req.query;
    
    const result = await jikanApi.getAnimeReviews(id, page);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error(`❌ Error fetching reviews for anime ${req.params.id}:`, error.message);
    console.error('Error details:', error.response?.data || error);
    // Return empty array on error instead of failing
    res.json({
      success: true,
      data: [],
      pagination: { last_visible_page: 1, has_next_page: false },
      message: 'Reviews temporarily unavailable'
    });
  }
};

// @desc    Get seasonal anime
// @route   GET /api/anime/seasonal/:year/:season
// @access  Public
const getSeasonalAnime = async (req, res, next) => {
  try {
    const { year, season } = req.params;
    
    // Check MongoDB cache first for this season
    const seasonMap = {
      'winter': 'Winter',
      'spring': 'Spring', 
      'summer': 'Summer',
      'fall': 'Fall'
    };
    
    const cached = await Anime.find({
      year: parseInt(year),
      season: seasonMap[season.toLowerCase()]
    }).sort({ score: -1, popularity: 1 }).limit(25);
    
    if (cached.length > 0) {
      return res.json({
        success: true,
        data: cached,
        pagination: {
          has_next_page: false,
          current_page: 1
        }
      });
    }
    
    // Fallback to API if no cache
    const result = await jikanApi.getSeasonalAnime(year, season);

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Error fetching seasonal anime:', error.message);
    res.json({
      success: true,
      data: [],
      pagination: { last_visible_page: 1, has_next_page: false },
      message: 'Seasonal anime temporarily unavailable. Please try again in a moment.'
    });
  }
};

// @desc    Get top anime
// @route   GET /api/anime/top
// @access  Public
const getTopAnime = async (req, res, next) => {
  try {
    const { page = 1, limit = 25, refresh } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 25, 1), 100);
    const parsedPage = Math.max(parseInt(page) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    // Database-First: query MongoDB cache
    const total = await Anime.countDocuments({ score: { $gt: 0 } });
    const cached = await Anime.find({ score: { $gt: 0 } })
      .sort({ score: -1, scoredBy: -1 })
      .skip(skip)
      .limit(parsedLimit);

    // If we have cached results in MongoDB and no explicit refresh requested, return immediately (<15ms)
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

    // Fetch fresh data from API if DB empty or refresh forced
    try {
      const result = await jikanApi.getTopAnime(parsedPage, Math.min(parsedLimit, 25));
      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        cached: false
      });
    } catch (apiError) {
      console.error('API error in getTopAnime, using cache:', apiError.message);
      if (cached.length > 0) {
        return res.json({
          success: true,
          data: cached,
          pagination: {
            last_visible_page: Math.ceil(total / parsedLimit) || 1,
            has_next_page: (parsedPage * parsedLimit) < total,
            current_page: parsedPage
          },
          cached: true,
          message: 'Showing cached results due to API unavailability'
        });
      }
      throw apiError;
    }
  } catch (error) {
    console.error('Error fetching top anime:', error.message);
    res.json({
      success: true,
      data: [],
      pagination: { last_visible_page: 1, has_next_page: false },
      message: 'Top anime temporarily unavailable. Please try again in a moment.'
    });
  }
};

// @desc    Get random anime
// @route   GET /api/anime/random
// @access  Public
const getRandomAnime = async (req, res, next) => {
  try {
    const anime = await jikanApi.getRandomAnime();

    res.json({
      success: true,
      data: anime
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
  getRandomAnime
};
