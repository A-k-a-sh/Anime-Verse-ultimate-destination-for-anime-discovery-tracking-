import api from './api';

export const mangaService = {
  // Search manga
  search: async (query, params = {}) => {
    const response = await api.get('/manga/search', { 
      params: { q: query, ...params } 
    });
    return response.data;
  },

  searchManga: async (params = {}) => {
    try {
      const response = await api.get('/manga/search', { params });
      return response.data;
    } catch (error) {
      console.error('searchManga error:', error);
      return { success: false, data: [], error: error.message };
    }
  },

  // Get manga by ID
  getById: async (id) => {
    const response = await api.get(`/manga/${id}`);
    return response.data;
  },

  // Get manga pictures
  getPictures: async (id) => {
    const response = await api.get(`/manga/${id}/pictures`);
    return response.data;
  },

  // Get manga characters
  getCharacters: async (id) => {
    const response = await api.get(`/manga/${id}/characters`);
    return response.data;
  },

  // Get manga recommendations
  getRecommendations: async (id) => {
    const response = await api.get(`/manga/${id}/recommendations`);
    return response.data;
  },

  // Get top manga
  getTop: async (params = {}) => {
    const response = await api.get('/manga/top', { params });
    return response.data;
  },

  // Get random manga
  getRandom: async () => {
    const response = await api.get('/manga/random');
    return response.data;
  },

  // Get manga chapters list
  getChapters: async (id, title = null) => {
    const params = title ? { title } : {};
    const response = await api.get(`/manga/${id}/chapters`, { params });
    return response.data;
  },

  // Get chapter pages and navigation
  getChapterPages: async (id, chapterNumber, title = null) => {
    const params = title ? { title } : {};
    const response = await api.get(`/manga/${id}/chapter/${chapterNumber}`, { params });
    return response.data;
  },
};
