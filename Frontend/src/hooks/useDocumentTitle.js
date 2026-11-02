import { useEffect } from 'react';

export const DEFAULT_APP_TITLE = 'AnimeVerse — Watch Anime & Read Manga Free';
export const BRAND_SUFFIX = ' • AnimeVerse';

/**
 * Custom hook to dynamically update document.title
 * @param {string} title - The title for the current page or content
 * @param {Object} [options]
 * @param {boolean} [options.appendBrand=true] - Whether to append ' • AnimeVerse'
 * @param {string} [options.fallback=DEFAULT_APP_TITLE] - Fallback when title is empty
 */
export const useDocumentTitle = (title, options = {}) => {
  const { appendBrand = true, fallback = DEFAULT_APP_TITLE } = options;

  useEffect(() => {
    if (!title || !String(title).trim()) {
      document.title = fallback;
      return;
    }

    const trimmed = String(title).trim();
    if (trimmed.endsWith('AnimeVerse')) {
      document.title = trimmed;
    } else if (appendBrand) {
      document.title = `${trimmed}${BRAND_SUFFIX}`;
    } else {
      document.title = trimmed;
    }
  }, [title, appendBrand, fallback]);
};

export default useDocumentTitle;
