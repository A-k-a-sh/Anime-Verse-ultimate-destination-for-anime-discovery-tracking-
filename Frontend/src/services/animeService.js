import api from './api';

// In-memory cache & in-flight request deduplication map
const cache = new Map();
const inFlightRequests = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes TTL
const MAX_CACHE_ENTRIES = 100; // Bounded cache size

const getCached = (key) => {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return item.data;
};

const setCached = (key, data) => {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { data, timestamp: Date.now() });
};

/**
 * Execute request with TTL caching and in-flight promise deduplication
 */
const cachedFetch = async (key, fetcher) => {
  const cached = getCached(key);
  if (cached !== null) {
    return cached;
  }

  // Deduplicate concurrent requests
  if (inFlightRequests.has(key)) {
    return inFlightRequests.get(key);
  }

  const promise = (async () => {
    try {
      const result = await fetcher();
      if (result && result.success !== false) {
        setCached(key, result);
      }
      return result;
    } finally {
      inFlightRequests.delete(key);
    }
  })();

  inFlightRequests.set(key, promise);
  return promise;
};

export const animeService = {
  // Clear cache manually if needed
  clearCache: () => {
    cache.clear();
    inFlightRequests.clear();
  },

  // Get all anime with filters
  searchAnime: async (params = {}) => {
    const cacheKey = `anime_all:${JSON.stringify(params)}`;
    return cachedFetch(cacheKey, async () => {
      try {
        const response = await api.get('/anime', { params });
        console.log('searchAnime response:', response.data);
        return response.data;
      } catch (error) {
        console.error('searchAnime error:', error);
        return { success: false, data: [], error: error.message };
      }
    });
  },

  getAll: async (params = {}) => {
    const cacheKey = `anime_all:${JSON.stringify(params)}`;
    return cachedFetch(cacheKey, async () => {
      try {
        const response = await api.get('/anime', { params });
        return response.data;
      } catch (error) {
        console.error('getAll error:', error);
        return { success: false, data: [], error: error.message };
      }
    });
  },

  // Search anime
  search: async (query, params = {}) => {
    const cacheKey = `search:${JSON.stringify({ q: query, ...params })}`;
    return cachedFetch(cacheKey, async () => {
      const response = await api.get('/anime/search', { 
        params: { q: query, ...params } 
      });
      return response.data;
    });
  },

  // Get anime by ID
  getById: async (id) => {
    const cacheKey = `anime:${id}`;
    return cachedFetch(cacheKey, async () => {
      const response = await api.get(`/anime/${id}`);
      return response.data;
    });
  },

  // Get anime pictures
  getPictures: async (id) => {
    const cacheKey = `pictures:${id}`;
    return cachedFetch(cacheKey, async () => {
      const response = await api.get(`/anime/${id}/pictures`);
      return response.data;
    });
  },

  // Get anime characters
  getCharacters: async (id) => {
    const cacheKey = `characters:${id}`;
    return cachedFetch(cacheKey, async () => {
      const response = await api.get(`/anime/${id}/characters`);
      return response.data;
    });
  },

  // Get anime staff
  getStaff: async (id) => {
    const cacheKey = `staff:${id}`;
    return cachedFetch(cacheKey, async () => {
      const response = await api.get(`/anime/${id}/staff`);
      return response.data;
    });
  },

  // Get anime episodes
  getEpisodes: async (id) => {
    const cacheKey = `episodes:${id}`;
    return cachedFetch(cacheKey, async () => {
      const response = await api.get(`/anime/${id}/episodes`);
      return response.data;
    });
  },

  // Get anime recommendations
  getRecommendations: async (id) => {
    const cacheKey = `recommendations:${id}`;
    return cachedFetch(cacheKey, async () => {
      const response = await api.get(`/anime/${id}/recommendations`);
      return response.data;
    });
  },

  // Get anime reviews (MAL)
  getReviews: async (id) => {
    const cacheKey = `reviews:${id}`;
    return cachedFetch(cacheKey, async () => {
      const response = await api.get(`/anime/${id}/reviews`);
      return response.data;
    });
  },

  // Get top anime
  getTop: async (params = {}) => {
    const cacheKey = `top:${JSON.stringify(params)}`;
    return cachedFetch(cacheKey, async () => {
      try {
        const response = await api.get('/anime/top', { params });
        console.log('getTop response:', response.data);
        return response.data;
      } catch (error) {
        console.error('getTop error:', error);
        return { success: false, data: [], error: error.message };
      }
    });
  },

  getTopAnime: async (params = {}) => {
    const cacheKey = `top:${JSON.stringify(params)}`;
    return cachedFetch(cacheKey, async () => {
      try {
        const response = await api.get('/anime/top', { params });
        console.log('getTopAnime response:', response.data);
        return response.data;
      } catch (error) {
        console.error('getTopAnime error:', error);
        return { success: false, data: [], error: error.message };
      }
    });
  },

  // Get seasonal anime
  getSeasonal: async (year, season, params = {}) => {
    const cacheKey = `seasonal:${year}:${season}:${JSON.stringify(params)}`;
    return cachedFetch(cacheKey, async () => {
      const response = await api.get(`/anime/seasonal/${year}/${season}`, { params });
      return response.data;
    });
  },

  getSeasonalAnime: async (year, season, params = {}) => {
    const cacheKey = `seasonal:${year}:${season}:${JSON.stringify(params)}`;
    return cachedFetch(cacheKey, async () => {
      try {
        const response = await api.get(`/anime/seasonal/${year}/${season}`, { params });
        return response.data;
      } catch (error) {
        console.error('getSeasonalAnime error:', error);
        return { success: false, data: [], error: error.message };
      }
    });
  },

  // Get random anime (kept uncached for freshness)
  getRandom: async () => {
    const response = await api.get('/anime/random');
    return response.data;
  },

  getRandomAnime: async () => {
    try {
      const response = await api.get('/anime/random');
      return response.data;
    } catch (error) {
      console.error('getRandomAnime error:', error);
      return { success: false, data: null, error: error.message };
    }
  },
};
