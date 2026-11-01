const axios = require('axios');
const Anime = require('../models/Anime');
const Character = require('../models/Character');
const Manga = require('../models/Manga');

const JIKAN_BASE_URL = process.env.JIKAN_API_URL || 'https://api.jikan.moe/v4';

// Cache durations in milliseconds
const CACHE_DURATIONS = {
  ANIME: 2 * 60 * 60 * 1000,             // 2 hours
  CHARACTER: 2 * 60 * 60 * 1000,         // 2 hours
  MANGA: 2 * 60 * 60 * 1000,             // 2 hours
  PICTURES: Infinity,                     // Never expire (URLs stable)
  EPISODES: 2 * 60 * 60 * 1000,          // 2 hours
  REVIEWS: 2 * 60 * 60 * 1000,           // 2 hours
  RECOMMENDATIONS: 2 * 60 * 60 * 1000,   // 2 hours
  SEASONAL: 2 * 60 * 60 * 1000,          // 2 hours
  TOP: 2 * 60 * 60 * 1000                // 2 hours
};

// Rate limiting: 3 requests/second, 60/minute
let lastRequestTime = Date.now();
const MIN_REQUEST_INTERVAL = 200; // Faster: ~5 requests/second (still under Jikan's limit)
const MAX_RETRIES = 0; // Don't retry - fail fast
const REQUEST_TIMEOUT = 8000; // 8 second timeout

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Rate-limited fetch from Jikan API with exponential backoff
const rateLimitedFetch = async (url, retryCount = 0) => {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await delay(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
  }
  
  lastRequestTime = Date.now();
  
  try {
    const response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'AnimeVerse/1.0'
      }
    });
    return response.data;
  } catch (error) {
    const errorMsg = error.response?.status === 429 
      ? 'Rate limit exceeded' 
      : error.message;
    console.error(`Jikan API Error (${url}): ${errorMsg}`);
    
    if (error.response?.status === 429) {
      // Rate limit hit - fail fast, don't retry
      console.error(`Rate limit hit for ${url} - using cached data only`);
      throw new Error('Rate limit exceeded. Using cached data.');
    }
    
    // For other errors, don't retry
    throw error;
  }
};

// Transform Jikan anime data to our schema
const transformAnimeData = (jikanAnime) => {
  return {
    malId: jikanAnime.mal_id,
    title: jikanAnime.title,
    titleEnglish: jikanAnime.title_english,
    titleJapanese: jikanAnime.title_japanese,
    synopsis: jikanAnime.synopsis,
    background: jikanAnime.background,
    imageUrl: jikanAnime.images?.jpg?.large_image_url || jikanAnime.images?.jpg?.image_url,
    trailerUrl: jikanAnime.trailer?.embed_url,
    episodes: jikanAnime.episodes,
    duration: jikanAnime.duration,
    status: jikanAnime.status,
    aired: {
      from: jikanAnime.aired?.from,
      to: jikanAnime.aired?.to
    },
    broadcast: jikanAnime.broadcast ? {
      day: jikanAnime.broadcast.day,
      time: jikanAnime.broadcast.time,
      timezone: jikanAnime.broadcast.timezone
    } : {},
    rating: jikanAnime.rating, 
    genres: jikanAnime.genres?.map(g => g.name) || [],
    themes: jikanAnime.themes?.map(t => t.name) || [],
    demographics: jikanAnime.demographics?.map(d => d.name) || [],
    studios: jikanAnime.studios?.map(s => s.name) || [],
    producers: jikanAnime.producers?.map(p => p.name) || [],
    licensors: jikanAnime.licensors?.map(l => l.name) || [],
    source: jikanAnime.source,
    score: jikanAnime.score,
    scoredBy: jikanAnime.scored_by,
    rank: jikanAnime.rank,
    popularity: jikanAnime.popularity,
    year: jikanAnime.year,
    season: jikanAnime.season,
    lastUpdated: Date.now()
  };
};

// Fetch and cache single anime by MAL ID
const fetchAnimeById = async (malId, forceRefresh = false) => {
  // Check cache first if not force refresh
  if (!forceRefresh) {
    let anime = await Anime.findOne({ malId });
    if (anime && (Date.now() - anime.lastUpdated < CACHE_DURATIONS.ANIME)) {
      return anime; // Return cached
    }
  }
  
  // Fetch from Jikan API
  const data = await rateLimitedFetch(`${JIKAN_BASE_URL}/anime/${malId}/full`);
  const animeData = transformAnimeData(data.data);
  
  // Update or create in cache
  const anime = await Anime.findOneAndUpdate(
    { malId },
    animeData,
    { upsert: true, new: true }
  );
  
  return anime;
};

// Search anime
const searchAnime = async (query, filters = {}) => {
  const params = new URLSearchParams();
  
  if (query) params.append('q', query);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit || 25);
  if (filters.type) params.append('type', filters.type);
  if (filters.status) params.append('status', filters.status);
  if (filters.rating) params.append('rating', filters.rating);
  if (filters.genre) params.append('genres', filters.genre);
  if (filters.genres) params.append('genres', filters.genres);
  if (filters.order_by) params.append('order_by', filters.order_by);
  if (filters.sort) params.append('sort', filters.sort);
  if (filters.sfw !== undefined) params.append('sfw', filters.sfw);
  
  const data = await rateLimitedFetch(`${JIKAN_BASE_URL}/anime?${params}`);
  
  // Cache each result
  const animeList = await Promise.all(
    data.data.map(async (item) => {
      const animeData = transformAnimeData(item);
      return await Anime.findOneAndUpdate(
        { malId: item.mal_id },
        animeData,
        { upsert: true, new: true }
      );
    })
  );
  
  return {
    data: animeList,
    pagination: data.pagination
  };
};

// Get seasonal anime
const getSeasonalAnime = async (year, season) => {
  const data = await rateLimitedFetch(`${JIKAN_BASE_URL}/seasons/${year}/${season}`);
  
  const animeList = await Promise.all(
    data.data.map(async (item) => {
      const animeData = transformAnimeData(item);
      return await Anime.findOneAndUpdate(
        { malId: item.mal_id },
        animeData,
        { upsert: true, new: true }
      );
    })
  );
  
  return {
    data: animeList,
    pagination: data.pagination
  };
};

// Get top anime
const getTopAnime = async (page = 1, limit = 25) => {
  try {
    const data = await rateLimitedFetch(`${JIKAN_BASE_URL}/top/anime?page=${page}&limit=${limit}`);
    
    if (!data || !data.data || !Array.isArray(data.data)) {
      console.error('Invalid response from Jikan API for getTopAnime');
      return {
        data: [],
        pagination: { has_next_page: false }
      };
    }
    
    const animeList = await Promise.all(
      data.data.map(async (item) => {
        const animeData = transformAnimeData(item);
        return await Anime.findOneAndUpdate(
          { malId: item.mal_id },
          animeData,
          { upsert: true, new: true }
        );
      })
    );
    
    return {
      data: animeList,
      pagination: data.pagination
    };
  } catch (error) {
    console.error('Error in getTopAnime:', error.message);
    return {
      data: [],
      pagination: { has_next_page: false }
    };
  }
};

// Get random anime
const getRandomAnime = async () => {
  const data = await rateLimitedFetch(`${JIKAN_BASE_URL}/random/anime`);
  const animeData = transformAnimeData(data.data);
  
  const anime = await Anime.findOneAndUpdate(
    { malId: data.data.mal_id },
    animeData,
    { upsert: true, new: true }
  );
  
  return anime;
};

// Get anime pictures
const getAnimePictures = async (malId) => {
  const data = await rateLimitedFetch(`${JIKAN_BASE_URL}/anime/${malId}/pictures`);
  return data.data;
};

// Get anime characters
const getAnimeCharacters = async (malId) => {
  const data = await rateLimitedFetch(`${JIKAN_BASE_URL}/anime/${malId}/characters`);
  return data.data;
};

// Get anime staff
const getAnimeStaff = async (malId) => {
  const data = await rateLimitedFetch(`${JIKAN_BASE_URL}/anime/${malId}/staff`);
  return data.data;
};

// Get anime episodes
const getAnimeEpisodes = async (malId, page = 1) => {
  const data = await rateLimitedFetch(`${JIKAN_BASE_URL}/anime/${malId}/episodes?page=${page}`);
  return {
    data: data.data,
    pagination: data.pagination
  };
};

// Get anime recommendations
const getAnimeRecommendations = async (malId) => {
  const data = await rateLimitedFetch(`${JIKAN_BASE_URL}/anime/${malId}/recommendations`);
  return data.data;
};

// Get anime reviews from MAL
const getAnimeReviews = async (malId, page = 1) => {
  const data = await rateLimitedFetch(`${JIKAN_BASE_URL}/anime/${malId}/reviews?page=${page}`);
  return {
    data: data.data,
    pagination: data.pagination
  };
};

// Character functions
const fetchCharacterById = async (malId) => {
  let character = await Character.findOne({ malId });
  
  if (character && (Date.now() - character.lastUpdated < CACHE_DURATIONS.CHARACTER)) {
    return character;
  }
  
  const data = await rateLimitedFetch(`${JIKAN_BASE_URL}/characters/${malId}/full`);
  const charData = data.data;
  
  character = await Character.findOneAndUpdate(
    { malId },
    {
      malId: charData.mal_id,
      name: charData.name,
      nameKanji: charData.name_kanji,
      nicknames: charData.nicknames || [],
      about: charData.about,
      imageUrl: charData.images?.jpg?.image_url,
      favorites: charData.favorites,
      animeAppearances: charData.anime?.map(a => ({
        malId: a.anime.mal_id,
        title: a.anime.title,
        role: a.role
      })) || [],
      mangaAppearances: charData.manga?.map(m => ({
        malId: m.manga.mal_id,
        title: m.manga.title,
        role: m.role
      })) || [],
      voiceActors: charData.voices?.map(v => ({
        malId: v.person.mal_id,
        name: v.person.name,
        imageUrl: v.person.images?.jpg?.image_url,
        language: v.language
      })) || [],
      lastUpdated: Date.now()
    },
    { upsert: true, new: true }
  );
  
  return character;
};

const getCharacterPictures = async (malId) => {
  const data = await rateLimitedFetch(`${JIKAN_BASE_URL}/characters/${malId}/pictures`);
  return data.data;
};

// Manga functions
const fetchMangaById = async (malId) => {
  try {
    // Check cache with lean query (no validation)
    let manga = await Manga.findOne({ malId }).lean();
    
    if (manga && (Date.now() - manga.lastUpdated < CACHE_DURATIONS.MANGA)) {
      return manga;
    }
    
    const data = await rateLimitedFetch(`${JIKAN_BASE_URL}/manga/${malId}/full`);
    const mangaData = data.data;
    
    // Force delete any existing document to avoid schema conflicts
    await Manga.deleteMany({ malId });
    
    // Create fresh document with correct schema
    const newManga = {
      malId: mangaData.mal_id,
      title: mangaData.title,
      titleEnglish: mangaData.title_english,
      titleJapanese: mangaData.title_japanese,
      synopsis: mangaData.synopsis,
      imageUrl: mangaData.images?.jpg?.large_image_url || mangaData.images?.jpg?.image_url,
      type: mangaData.type,
      chapters: mangaData.chapters,
      volumes: mangaData.volumes,
      status: mangaData.status,
      published: {
        from: mangaData.published?.from,
        to: mangaData.published?.to
      },
      score: mangaData.score,
      scoredBy: mangaData.scored_by,
      rank: mangaData.rank,
      popularity: mangaData.popularity,
      genres: mangaData.genres?.map(g => g.name) || [],
      themes: mangaData.themes?.map(t => t.name) || [],
      demographics: mangaData.demographics?.map(d => d.name) || [],
      authors: mangaData.authors?.map(a => ({
        malId: a.mal_id,
        name: a.name,
        type: a.type
      })) || [],
      serializations: mangaData.serializations?.map(s => s.name) || [],
      lastUpdated: Date.now()
    };
    
    manga = await Manga.create(newManga);
    
    return manga;
  } catch (error) {
    console.error('Error fetching manga:', error.message);
    // If validation fails, return raw Jikan data without caching
    if (error.name === 'ValidationError') {
      const data = await rateLimitedFetch(`${JIKAN_BASE_URL}/manga/${malId}/full`);
      return {
        malId: data.data.mal_id,
        title: data.data.title,
        titleEnglish: data.data.title_english,
        titleJapanese: data.data.title_japanese,
        synopsis: data.data.synopsis,
        imageUrl: data.data.images?.jpg?.large_image_url || data.data.images?.jpg?.image_url,
        type: data.data.type,
        chapters: data.data.chapters,
        volumes: data.data.volumes,
        status: data.data.status,
        score: data.data.score,
        scoredBy: data.data.scored_by,
        rank: data.data.rank,
        popularity: data.data.popularity,
        genres: data.data.genres?.map(g => g.name) || [],
        themes: data.data.themes?.map(t => t.name) || [],
        demographics: data.data.demographics?.map(d => d.name) || [],
      };
    }
    throw error;
  }
};

const searchManga = async (query, filters = {}) => {
  const params = new URLSearchParams();
  
  if (query) params.append('q', query);
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit || 25);
  if (filters.type) params.append('type', filters.type);
  if (filters.status) params.append('status', filters.status);
  if (filters.genre) params.append('genres', filters.genre);
  if (filters.genres) params.append('genres', filters.genres);
  if (filters.order_by) params.append('order_by', filters.order_by);
  if (filters.sort) params.append('sort', filters.sort);
  
  const data = await rateLimitedFetch(`${JIKAN_BASE_URL}/manga?${params}`);
  return {
    data: data.data,
    pagination: data.pagination
  };
};

const getTopManga = async (page = 1, limit = 25) => {
  const data = await rateLimitedFetch(`${JIKAN_BASE_URL}/top/manga?page=${page}&limit=${limit}`);
  return {
    data: data.data,
    pagination: data.pagination
  };
};

const getRandomManga = async () => {
  const data = await rateLimitedFetch(`${JIKAN_BASE_URL}/random/manga`);
  return data.data;
};

const getMangaPictures = async (malId) => {
  const data = await rateLimitedFetch(`${JIKAN_BASE_URL}/manga/${malId}/pictures`);
  return data.data;
};

const getMangaCharacters = async (malId) => {
  const data = await rateLimitedFetch(`${JIKAN_BASE_URL}/manga/${malId}/characters`);
  return data.data;
};

const getMangaRecommendations = async (malId) => {
  const data = await rateLimitedFetch(`${JIKAN_BASE_URL}/manga/${malId}/recommendations`);
  return data.data;
};

module.exports = {
  // Anime
  fetchAnimeById,
  searchAnime,
  getSeasonalAnime,
  getTopAnime,
  getRandomAnime,
  getAnimePictures,
  getAnimeCharacters,
  getAnimeStaff,
  getAnimeEpisodes,
  getAnimeRecommendations,
  getAnimeReviews,
  
  // Character
  fetchCharacterById,
  getCharacterPictures,
  
  // Manga
  fetchMangaById,
  searchManga,
  getTopManga,
  getRandomManga,
  getMangaPictures,
  getMangaCharacters,
  getMangaRecommendations
};
