/**
 * AnimeVerse Web Player Local Storage Utilities
 * Manages offline/guest watch progress, server preferences, and player settings.
 */

const STORAGE_KEYS = {
  WATCHED_PREFIX: 'animeverse_watched_',
  LAST_EP_PREFIX: 'animeverse_last_ep_',
  SERVER_PREF: 'animeverse_server_preference',
  TRACK_PREF: 'animeverse_track_preference',
  AUTO_NEXT: 'animeverse_auto_next',
  AUTO_SKIP: 'animeverse_auto_skip',
  THEATER_MODE: 'animeverse_theater_mode',
  EP_VIEW_MODE: 'animeverse_ep_view_mode',
};

export const watchStorage = {
  /**
   * Get all watched episode numbers for an anime
   * @param {number|string} malId
   * @returns {number[]} Array of watched episode numbers
   */
  getWatchedEpisodes: (malId) => {
    if (!malId) return [];
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.WATCHED_PREFIX}${malId}`);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.map(Number) : [];
    } catch (err) {
      console.warn('Failed to get watched episodes from storage:', err);
      return [];
    }
  },

  /**
   * Mark an episode as watched for an anime
   * @param {number|string} malId
   * @param {number} episode
   * @returns {number[]} Updated array of watched episodes
   */
  markEpisodeWatched: (malId, episode) => {
    if (!malId || !episode) return [];
    try {
      const current = watchStorage.getWatchedEpisodes(malId);
      const epNum = Number(episode);
      const updated = current.includes(epNum) ? current : [...current, epNum];
      localStorage.setItem(
        `${STORAGE_KEYS.WATCHED_PREFIX}${malId}`,
        JSON.stringify(updated.sort((a, b) => a - b))
      );
      watchStorage.setLastWatched(malId, epNum);
      return updated;
    } catch (err) {
      console.warn('Failed to mark episode as watched:', err);
      return [];
    }
  },

  /**
   * Check if a specific episode is watched
   * @param {number|string} malId
   * @param {number} episode
   * @returns {boolean}
   */
  isEpisodeWatched: (malId, episode) => {
    const list = watchStorage.getWatchedEpisodes(malId);
    return list.includes(Number(episode));
  },

  /**
   * Get the last watched episode number for an anime
   * @param {number|string} malId
   * @returns {number|null}
   */
  getLastWatched: (malId) => {
    if (!malId) return null;
    try {
      const ep = localStorage.getItem(`${STORAGE_KEYS.LAST_EP_PREFIX}${malId}`);
      return ep ? Number(ep) : null;
    } catch (err) {
      return null;
    }
  },

  /**
   * Set the last watched episode number for an anime
   * @param {number|string} malId
   * @param {number} episode
   */
  setLastWatched: (malId, episode) => {
    if (!malId || !episode) return;
    try {
      localStorage.setItem(`${STORAGE_KEYS.LAST_EP_PREFIX}${malId}`, String(episode));
    } catch (err) {
      console.warn('Failed to set last watched episode:', err);
    }
  },

  /**
   * Get server preference ('server1' | 'server2')
   * Default is 'server1' (MegaPlay)
   * @returns {'server1' | 'server2'}
   */
  getServerPreference: () => {
    try {
      const pref = localStorage.getItem(STORAGE_KEYS.SERVER_PREF);
      return pref === 'server2' ? 'server2' : 'server1';
    } catch {
      return 'server1';
    }
  },

  /**
   * Set server preference
   * @param {'server1' | 'server2'} server
   */
  setServerPreference: (server) => {
    try {
      localStorage.setItem(STORAGE_KEYS.SERVER_PREF, server === 'server2' ? 'server2' : 'server1');
    } catch (err) {
      console.warn('Failed to set server preference:', err);
    }
  },

  /**
   * Get audio track preference ('sub' | 'dub' | 'hsub')
   * @returns {'sub' | 'dub' | 'hsub'}
   */
  getTrackPreference: () => {
    try {
      const track = localStorage.getItem(STORAGE_KEYS.TRACK_PREF);
      return ['sub', 'dub', 'hsub'].includes(track) ? track : 'sub';
    } catch {
      return 'sub';
    }
  },

  /**
   * Set audio track preference
   * @param {'sub' | 'dub' | 'hsub'} track
   */
  setTrackPreference: (track) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TRACK_PREF, track);
    } catch (err) {
      console.warn('Failed to set track preference:', err);
    }
  },

  /**
   * Get auto-next preference (default true)
   * @returns {boolean}
   */
  getAutoNext: () => {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.AUTO_NEXT);
      return val === null ? true : val === 'true';
    } catch {
      return true;
    }
  },

  /**
   * Set auto-next preference
   * @param {boolean} value
   */
  setAutoNext: (value) => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTO_NEXT, String(!!value));
    } catch (err) {
      console.warn('Failed to set auto-next:', err);
    }
  },

  /**
   * Get auto-skip intros/outros preference (default true)
   * @returns {boolean}
   */
  getAutoSkip: () => {
    try {
      const val = localStorage.getItem(STORAGE_KEYS.AUTO_SKIP);
      return val === null ? true : val === 'true';
    } catch {
      return true;
    }
  },

  /**
   * Set auto-skip preference
   * @param {boolean} value
   */
  setAutoSkip: (value) => {
    try {
      localStorage.setItem(STORAGE_KEYS.AUTO_SKIP, String(!!value));
    } catch (err) {
      console.warn('Failed to set auto-skip:', err);
    }
  },

  /**
   * Get theater mode preference (default false)
   * @returns {boolean}
   */
  getTheaterMode: () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.THEATER_MODE) === 'true';
    } catch {
      return false;
    }
  },

  /**
   * Set theater mode preference
   * @param {boolean} value
   */
  setTheaterMode: (value) => {
    try {
      localStorage.setItem(STORAGE_KEYS.THEATER_MODE, String(!!value));
    } catch (err) {
      console.warn('Failed to set theater mode:', err);
    }
  },

  /**
   * Get episode selector view mode ('grid' | 'list')
   * @returns {'grid' | 'list'}
   */
  getEpisodeViewMode: () => {
    try {
      const mode = localStorage.getItem(STORAGE_KEYS.EP_VIEW_MODE);
      return mode === 'list' ? 'list' : 'grid';
    } catch {
      return 'grid';
    }
  },

  /**
   * Set episode selector view mode ('grid' | 'list')
   * @param {'grid' | 'list'} mode
   */
  setEpisodeViewMode: (mode) => {
    try {
      localStorage.setItem(STORAGE_KEYS.EP_VIEW_MODE, mode === 'list' ? 'list' : 'grid');
    } catch (err) {
      console.warn('Failed to set episode view mode:', err);
    }
  },
};

export default watchStorage;
