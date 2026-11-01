const Watchlist = require('../models/Watchlist');
const aniListApi = require('../utils/aniListApi');

// @desc    Get user's watchlist
// @route   GET /api/watchlist
// @access  Private
const getWatchlist = async (req, res, next) => {
  try {
    const { status } = req.query;
    
    const query = { userId: req.user._id };
    if (status) query.status = status;

    const watchlist = await Watchlist.find(query).sort({ updatedAt: -1 });

    // Return cached data immediately, don't wait for API calls
    // This prevents slow response times and rate limit issues
    const populatedWatchlist = await Promise.all(watchlist.map(async (item) => {
      const itemObj = item.toObject();
      let animeData = itemObj.animeData;
      
      // If animeData is missing or incomplete, try to get from cache
      if (!animeData || !animeData.title || !animeData.imageUrl) {
        console.log(`Missing data for ${itemObj.isManga ? 'manga' : 'anime'} ${itemObj.malId}, checking cache...`);
        const CacheModel = itemObj.isManga ? require('../models/Manga') : require('../models/Anime');
        const cached = await CacheModel.findOne({ malId: itemObj.malId });
        
        if (cached) {
          const cachedObj = cached.toObject ? cached.toObject() : cached;
          animeData = {
            title: cachedObj.title || cachedObj.titleEnglish || animeData?.title || 'Unknown',
            imageUrl: cachedObj.imageUrl || animeData?.imageUrl || null,
            episodes: itemObj.isManga ? (cachedObj.chapters || animeData?.episodes || 0) : (cachedObj.episodes || animeData?.episodes || 0)
          };
          
          // Update the database entry for future requests
          await Watchlist.updateOne(
            { _id: itemObj._id },
            { $set: { animeData } }
          );
          
          console.log(`Updated cache data for ${itemObj.malId}:`, animeData);
        }
      }
      
      const anime = {
        ...(animeData || { title: 'Unknown' }),
        malId: itemObj.malId,
        isManga: itemObj.isManga || false
      };
      
      return {
        ...itemObj,
        anime
      };
    }));

    res.json({
      success: true,
      data: populatedWatchlist
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add anime/manga to watchlist
// @route   POST /api/watchlist
// @access  Private
const addToWatchlist = async (req, res, next) => {
  try {
    const { malId, status = 'plan-to-watch', episodesWatched = 0, userRating, isManga = false } = req.body;

    // Check if already in watchlist first
    const existing = await Watchlist.findOne({
      userId: req.user._id,
      malId
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Already in watchlist'
      });
    }

    // Get data from cache ONLY - never make API calls here to avoid blocking
    const CacheModel = isManga ? require('../models/Manga') : require('../models/Anime');
    const cached = await CacheModel.findOne({ malId });
    
    console.log(`Adding ${isManga ? 'manga' : 'anime'} ${malId} to watchlist. Cached:`, !!cached);
    
    let contentData;
    if (cached) {
      // Use cached data - convert Mongoose doc to plain object
      const cachedObj = cached.toObject ? cached.toObject() : cached;
      console.log('Cached data fields:', { 
        title: cachedObj.title, 
        titleEnglish: cachedObj.titleEnglish,
        imageUrl: cachedObj.imageUrl,
        hasImages: !!cachedObj.images,
        chapters: cachedObj.chapters,
        episodes: cachedObj.episodes
      });
      
      contentData = {
        title: cachedObj.title || cachedObj.titleEnglish || `${isManga ? 'Manga' : 'Anime'} #${malId}`,
        imageUrl: cachedObj.imageUrl || cachedObj.images?.jpg?.large_image_url || cachedObj.images?.jpg?.image_url || null,
        episodes: isManga ? (cachedObj.chapters || 0) : (cachedObj.episodes || 0)
      };
    } else {
      // No cache - use minimal placeholder AND trigger background fetch
      console.log('No cache found, using placeholder and fetching in background');
      contentData = {
        title: `${isManga ? 'Manga' : 'Anime'} #${malId}`,
        imageUrl: null,
        episodes: 0
      };
      
      // Trigger background fetch to cache the data (don't wait for it)
      const fetchPromise = isManga 
        ? aniListApi.fetchMangaById(malId)
        : aniListApi.fetchAnimeById(malId);
      
      fetchPromise.then(async (data) => {
        console.log(`Background fetch complete for ${isManga ? 'manga' : 'anime'} ${malId}`);
        // Update the watchlist item with fetched data
        const dataObj = data.toObject ? data.toObject() : data;
        await Watchlist.updateOne(
          { userId: req.user._id, malId },
          {
            $set: {
              animeData: {
                title: dataObj.title || dataObj.titleEnglish,
                imageUrl: dataObj.imageUrl,
                episodes: isManga ? (dataObj.chapters || 0) : (dataObj.episodes || 0)
              }
            }
          }
        );
        console.log(`Updated watchlist entry with fresh data for ${malId}`);
      }).catch(err => {
        console.error(`Background fetch failed for ${isManga ? 'manga' : 'anime'} ${malId}:`, err.message);
      });
    }
    
    console.log('Saving to watchlist:', contentData);

    const watchlistItem = await Watchlist.create({
      userId: req.user._id,
      malId,
      animeData: {
        title: contentData.title,
        imageUrl: contentData.imageUrl,
        episodes: contentData.episodes
      },
      status,
      episodesWatched,
      userRating,
      isManga
    });

    res.status(201).json({
      success: true,
      message: isManga ? 'Added to reading list' : 'Added to watchlist',
      data: {
        ...watchlistItem.toObject(),
        anime: {
          title: contentData.title,
          imageUrl: contentData.imageUrl,
          episodes: contentData.episodes,
          malId,
          isManga
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update watchlist entry
// @route   PUT /api/watchlist/:id
// @access  Private
const updateWatchlistItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, episodesWatched, userRating, isFavorite } = req.body;

    const watchlistItem = await Watchlist.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!watchlistItem) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist entry not found'
      });
    }

    if (status !== undefined) watchlistItem.status = status;
    if (episodesWatched !== undefined) watchlistItem.episodesWatched = episodesWatched;
    if (userRating !== undefined) watchlistItem.userRating = userRating;
    if (isFavorite !== undefined) watchlistItem.isFavorite = isFavorite;

    await watchlistItem.save();

    // Return cached data to avoid rate limits
    const anime = watchlistItem.animeData || { title: 'Unknown', malId: watchlistItem.malId };

    res.json({
      success: true,
      message: 'Watchlist updated',
      data: {
        ...watchlistItem.toObject(),
        anime
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove from watchlist
// @route   DELETE /api/watchlist/:id
// @access  Private
const removeFromWatchlist = async (req, res, next) => {
  try {
    const { id } = req.params;

    const watchlistItem = await Watchlist.findOne({
      _id: id,
      userId: req.user._id
    });

    if (!watchlistItem) {
      return res.status(404).json({
        success: false,
        message: 'Watchlist entry not found'
      });
    }

    await watchlistItem.deleteOne();

    res.json({
      success: true,
      message: 'Removed from watchlist'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's watchlist stats
// @route   GET /api/watchlist/stats
// @access  Private
const getWatchlistStats = async (req, res, next) => {
  try {
    const watchlist = await Watchlist.find({ userId: req.user._id });

    const stats = {
      totalAnime: watchlist.length,
      watching: watchlist.filter(item => item.status === 'watching').length,
      completed: watchlist.filter(item => item.status === 'completed').length,
      planToWatch: watchlist.filter(item => item.status === 'plan-to-watch').length,
      dropped: watchlist.filter(item => item.status === 'dropped').length,
      totalEpisodesWatched: watchlist.reduce((sum, item) => sum + item.episodesWatched, 0),
      favoriteCount: watchlist.filter(item => item.isFavorite).length
    };

    // Calculate average rating (only for rated anime)
    const ratedAnime = watchlist.filter(item => item.userRating !== null && item.userRating > 0);
    stats.averageRating = ratedAnime.length > 0
      ? (ratedAnime.reduce((sum, item) => sum + item.userRating, 0) / ratedAnime.length).toFixed(1)
      : 0;

    // Calculate total days watched (assuming 24 min per episode)
    stats.totalDaysWatched = ((stats.totalEpisodesWatched * 24) / 60 / 24).toFixed(1);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWatchlist,
  addToWatchlist,
  updateWatchlistItem,
  removeFromWatchlist,
  getWatchlistStats
};
