/**
 * AnimeVerse Manga Reader Local Storage Utilities
 * Manages guest reading history, completed chapters, and reader configuration preferences.
 */

const STORAGE_KEYS = {
  READ_PREFIX: 'animeverse_manga_read_',
  LAST_CH_PREFIX: 'animeverse_manga_last_ch_',
  SETTINGS: 'animeverse_reader_settings',
  HISTORY: 'animeverse_manga_history'
};

const DEFAULT_SETTINGS = {
  mode: 'webtoon',       // 'webtoon' | 'single' | 'double'
  direction: 'rtl',      // 'rtl' (Right-to-Left) | 'ltr' (Left-to-Right)
  fit: 'width',          // 'width' | 'height' | 'original'
  theme: 'dark',         // 'black' (#000000) | 'dark' (#121212) | 'sepia' (#1f1b16)
  maxWidth: '900px'      // '700px' | '900px' | '1200px' | '100%'
};

export const readStorage = {
  /**
   * Get all completed chapter numbers for a manga
   * @param {number|string} malId
   * @returns {string[]} Array of read chapter strings
   */
  getReadChapters: (malId) => {
    if (!malId) return [];
    try {
      const data = localStorage.getItem(`${STORAGE_KEYS.READ_PREFIX}${malId}`);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch (err) {
      console.warn('Failed to get read chapters from storage:', err);
      return [];
    }
  },

  /**
   * Mark a chapter as completed/read for a manga
   * @param {number|string} malId
   * @param {number|string} chapter
   * @returns {string[]} Updated array of read chapters
   */
  markChapterRead: (malId, chapter) => {
    if (!malId || chapter === undefined || chapter === null) return [];
    try {
      const current = readStorage.getReadChapters(malId);
      const chStr = String(chapter).trim();
      const updated = current.includes(chStr) ? current : [...current, chStr];

      localStorage.setItem(
        `${STORAGE_KEYS.READ_PREFIX}${malId}`,
        JSON.stringify(updated)
      );

      readStorage.setLastReadChapter(malId, chStr);
      return updated;
    } catch (err) {
      console.warn('Failed to mark chapter as read in storage:', err);
      return [];
    }
  },

  /**
   * Check if a specific chapter is marked as read
   * @param {number|string} malId
   * @param {number|string} chapter
   * @returns {boolean}
   */
  isChapterRead: (malId, chapter) => {
    if (!malId || chapter === undefined || chapter === null) return false;
    const list = readStorage.getReadChapters(malId);
    return list.includes(String(chapter).trim());
  },

  /**
   * Get the last read chapter identifier for a manga
   * @param {number|string} malId
   * @returns {string|null}
   */
  getLastReadChapter: (malId) => {
    if (!malId) return null;
    try {
      const ch = localStorage.getItem(`${STORAGE_KEYS.LAST_CH_PREFIX}${malId}`);
      return ch ? String(ch) : null;
    } catch {
      return null;
    }
  },

  /**
   * Set the last read chapter identifier for a manga
   * @param {number|string} malId
   * @param {number|string} chapter
   */
  setLastReadChapter: (malId, chapter) => {
    if (!malId || chapter === undefined || chapter === null) return;
    try {
      localStorage.setItem(`${STORAGE_KEYS.LAST_CH_PREFIX}${malId}`, String(chapter).trim());
    } catch (err) {
      console.warn('Failed to set last read chapter:', err);
    }
  },

  /**
   * Get reader configuration preferences with defaults
   * @returns {typeof DEFAULT_SETTINGS}
   */
  getReaderSettings: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!stored) return { ...DEFAULT_SETTINGS };
      const parsed = JSON.parse(stored);
      return {
        ...DEFAULT_SETTINGS,
        ...parsed
      };
    } catch (err) {
      console.warn('Failed to get reader settings from storage:', err);
      return { ...DEFAULT_SETTINGS };
    }
  },

  /**
   * Save partial or complete reader settings
   * @param {Partial<typeof DEFAULT_SETTINGS>} newSettings
   * @returns {typeof DEFAULT_SETTINGS}
   */
  saveReaderSettings: (newSettings) => {
    try {
      const current = readStorage.getReaderSettings();
      const updated = {
        ...current,
        ...newSettings
      };
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    } catch (err) {
      console.warn('Failed to save reader settings:', err);
      return { ...DEFAULT_SETTINGS };
    }
  },

  /**
   * Record a manga chapter to recent history for "Continue Reading"
   * @param {{ malId: number|string, title: string, imageUrl?: string, chapter: number|string, totalChapters?: number }} entry
   */
  recordHistory: (entry) => {
    if (!entry || !entry.malId) return;
    try {
      const existing = readStorage.getHistory();
      const numId = Number(entry.malId);
      const filtered = existing.filter((item) => Number(item.malId) !== numId);
      const updated = [
        {
          malId: numId,
          title: entry.title || 'Unknown Manga',
          imageUrl: entry.imageUrl || '',
          chapter: String(entry.chapter || '1'),
          totalChapters: entry.totalChapters || null,
          updatedAt: Date.now(),
        },
        ...filtered,
      ].slice(0, 25);
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to record manga read history:', err);
    }
  },

  /**
   * Get recent reading history
   * @returns {Array<{ malId: number, title: string, imageUrl: string, chapter: string, totalChapters: number|null, updatedAt: number }>}
   */
  getHistory: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  /**
   * Remove a single manga entry from reading history
   * @param {number|string} malId
   */
  removeFromHistory: (malId) => {
    try {
      const list = readStorage.getHistory();
      const updated = list.filter((item) => Number(item.malId) !== Number(malId));
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(updated));
      return updated;
    } catch {
      return [];
    }
  },

  /**
   * Clear all reading history
   */
  clearHistory: () => {
    try {
      localStorage.removeItem(STORAGE_KEYS.HISTORY);
    } catch (err) {
      console.warn('Failed to clear read history:', err);
    }
  }
};
