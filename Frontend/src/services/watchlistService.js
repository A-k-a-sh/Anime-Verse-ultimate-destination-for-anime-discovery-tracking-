import api from './api';

export const watchlistService = {
  // Get user's watchlist
  getWatchlist: async (params = {}) => {
    const response = await api.get('/watchlist', { params });
    return response.data;
  },

  // Add to watchlist
  addToWatchlist: async (data) => {
    const response = await api.post('/watchlist', data);
    return response.data;
  },

  // Update watchlist item
  updateWatchlistItem: async (id, data) => {
    const response = await api.put(`/watchlist/${id}`, data);
    return response.data;
  },

  // Remove from watchlist
  removeFromWatchlist: async (id) => {
    const response = await api.delete(`/watchlist/${id}`);
    return response.data;
  },

  // Get watchlist stats
  getStats: async () => {
    const response = await api.get('/watchlist/stats');
    return response.data;
  },

  // Check if anime is in watchlist
  checkInWatchlist: async (malId) => {
    try {
      const response = await api.get('/watchlist');
      const watchlist = response.data.data || [];
      console.log('Checking watchlist for malId:', malId);
      console.log('Watchlist malIds:', watchlist.map(item => item.malId));
      // Ensure type consistency - convert both to numbers for comparison
      const numericMalId = parseInt(malId);
      const found = watchlist.find(item => parseInt(item.malId) === numericMalId);
      console.log('Found entry:', found ? 'YES' : 'NO');
      return found || null;
    } catch (error) {
      console.error('Error checking watchlist:', error);
      return null;
    }
  },

  /**
   * Sync watch progress to user's watchlist.
   * Automatically creates or updates the entry with progress and status.
   *
   * @param {number|string} malId
   * @param {number} episodeNumber
   * @param {object} [animeData]
   * @param {number} [totalEpisodes]
   * @returns {Promise<object|null>}
   */
  updateProgress: async (malId, episodeNumber, animeData = null, totalEpisodes = null) => {
    try {
      const numMalId = parseInt(malId, 10);
      const epNum = parseInt(episodeNumber, 10);
      if (isNaN(numMalId) || isNaN(epNum)) return null;

      const existing = await watchlistService.checkInWatchlist(numMalId);
      const isCompleted = totalEpisodes && epNum >= totalEpisodes;
      const targetStatus = isCompleted ? 'completed' : 'watching';

      if (existing) {
        const currentEp = existing.episodesWatched || 0;
        const newEp = Math.max(currentEp, epNum);

        const updatePayload = {
          episodesWatched: newEp,
          status: existing.status === 'completed' && !isCompleted ? 'completed' : targetStatus,
        };

        const result = await watchlistService.updateWatchlistItem(existing._id, updatePayload);
        return result?.data || null;
      } else {
        const addPayload = {
          malId: numMalId,
          status: targetStatus,
          episodesWatched: epNum,
          isManga: false,
        };
        const result = await watchlistService.addToWatchlist(addPayload);
        return result?.data || null;
      }
    } catch (error) {
      console.warn('Watchlist progress sync skipped/failed:', error.message);
      return null;
    }
  },

  /**
   * Sync manga reading progress to user's watchlist.
   * Automatically creates or updates the entry with progress and reading status.
   *
   * @param {number|string} malId
   * @param {number|string} chapterNumber
   * @param {object} [mangaData]
   * @param {number} [totalChapters]
   * @returns {Promise<object|null>}
   */
  updateMangaProgress: async (malId, chapterNumber, mangaData = null, totalChapters = null) => {
    try {
      const numMalId = parseInt(malId, 10);
      const chNum = parseFloat(chapterNumber);
      if (isNaN(numMalId) || isNaN(chNum)) return null;

      const existing = await watchlistService.checkInWatchlist(numMalId);
      const isCompleted = totalChapters && chNum >= totalChapters;
      const targetStatus = isCompleted ? 'completed' : 'watching';

      if (existing) {
        const currentCh = existing.episodesWatched || 0;
        const newCh = Math.max(currentCh, Math.floor(chNum));

        const updatePayload = {
          episodesWatched: newCh,
          status: existing.status === 'completed' && !isCompleted ? 'completed' : targetStatus,
          isManga: true
        };

        const result = await watchlistService.updateWatchlistItem(existing._id, updatePayload);
        return result?.data || null;
      } else {
        const addPayload = {
          malId: numMalId,
          status: targetStatus,
          episodesWatched: Math.floor(chNum),
          isManga: true,
        };
        const result = await watchlistService.addToWatchlist(addPayload);
        return result?.data || null;
      }
    } catch (error) {
      console.warn('Manga watchlist progress sync skipped/failed:', error.message);
      return null;
    }
  },
};
