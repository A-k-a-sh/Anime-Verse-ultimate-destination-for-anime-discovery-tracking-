const MangaChapterIndex = require('../models/MangaChapterIndex');
const MangaChapterPages = require('../models/MangaChapterPages');
const Manga = require('../models/Manga');
const aniListApi = require('../utils/aniListApi');

const MANGADEX_BASE = 'https://api.mangadex.org';
const MANGAPILL_BASE = 'https://mangapill.com';
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/**
 * Helper to fetch JSON with custom headers and timeout
 */
async function fetchJson(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 12000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText} for ${url}`);
    }
    return await res.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Helper to fetch HTML text with custom headers and timeout
 */
async function fetchHtml(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), options.timeout || 12000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        ...options.headers
      },
      ...options
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText} for ${url}`);
    }
    return await res.text();
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Sanitize manga title for search queries
 */
function sanitizeSearchTitle(title) {
  if (!title) return '';
  return title
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compare two chapter strings numerically or lexicographically
 */
function parseChapterNumber(chStr) {
  if (!chStr) return 0;
  const match = String(chStr).match(/[\d.]+/);
  return match ? parseFloat(match[0]) : 0;
}

// =========================================================================
// PROVIDER 1: MANGADEX ADAPTER
// =========================================================================

/**
 * Query MangaDex for manga metadata and chapter feed
 */
async function fetchFromMangaDex(malId, mangaTitle) {
  try {
    const cleanTitle = sanitizeSearchTitle(mangaTitle);
    if (!cleanTitle) return null;

    // 1. Search for Manga by title
    const searchUrl = `${MANGADEX_BASE}/manga?title=${encodeURIComponent(cleanTitle)}&limit=10&includes[]=cover_art`;
    const searchRes = await fetchJson(searchUrl, { timeout: 8000 });
    const mangaList = searchRes.data || [];
    if (!mangaList.length) return null;

    // Match by MAL link or first item
    let match = mangaList.find(m => m.attributes?.links?.mal === String(malId));
    if (!match) {
      match = mangaList[0];
    }
    const mangaDexId = match.id;

    // 2. Fetch English chapter feed (up to 500 chapters)
    const feedUrl = `${MANGADEX_BASE}/manga/${mangaDexId}/feed?translatedLanguage[]=en&order[chapter]=asc&limit=500&includeExternalUrl=0`;
    const feedRes = await fetchJson(feedUrl, { timeout: 10000 });
    const rawChapters = feedRes.data || [];

    if (!rawChapters.length) {
      console.log(`[MangaDex] 0 readable EN chapters found for "${cleanTitle}" (likely licensed to MangaPlus/Viz)`);
      return null;
    }

    // 3. Map and deduplicate chapters by chapter number
    const chapterMap = new Map();

    for (let i = 0; i < rawChapters.length; i++) {
      const ch = rawChapters[i];
      const chNum = ch.attributes?.chapter ? String(ch.attributes.chapter) : String(i + 1);
      
      // If not yet added or current one has a title while previous had none, keep best
      if (!chapterMap.has(chNum) || (!chapterMap.get(chNum).title && ch.attributes?.title)) {
        chapterMap.set(chNum, {
          id: ch.id,
          chapter: chNum,
          title: ch.attributes?.title || `Chapter ${chNum}`,
          volume: ch.attributes?.volume || null,
          date: ch.attributes?.publishAt ? new Date(ch.attributes.publishAt) : null
        });
      }
    }

    const chapters = Array.from(chapterMap.values());
    chapters.sort((a, b) => parseChapterNumber(a.chapter) - parseChapterNumber(b.chapter));

    return {
      provider: 'mangadex',
      totalChapters: chapters.length,
      chapters
    };
  } catch (err) {
    console.warn(`[MangaDex] Error fetching chapters for "${mangaTitle}":`, err.message);
    return null;
  }
}

/**
 * Fetch chapter page images from MangaDex@Home CDN
 */
async function fetchMangaDexPages(chapterId) {
  const atHomeUrl = `${MANGADEX_BASE}/at-home/server/${chapterId}`;
  const atHomeData = await fetchJson(atHomeUrl, { timeout: 10000 });

  const baseUrl = atHomeData.baseUrl;
  const hash = atHomeData.chapter?.hash;
  const pageFiles = atHomeData.chapter?.data || [];

  if (!pageFiles.length || !baseUrl || !hash) {
    throw new Error('MangaDex@Home returned empty page list');
  }

  return pageFiles.map((filename, index) => {
    const rawCdnUrl = `${baseUrl}/data/${hash}/${filename}`;
    const proxyUrl = `/api/manga/proxy-image?url=${encodeURIComponent(rawCdnUrl)}&referer=${encodeURIComponent('https://mangadex.org/')}`;
    return {
      pageNumber: index + 1,
      rawCdnUrl,
      proxyUrl,
      dimensions: { width: null, height: null }
    };
  });
}

// =========================================================================
// PROVIDER 2: MANGAPILL ADAPTER (Scraper Fallback for Jump / Big Hits)
// =========================================================================

/**
 * Query MangaPill for manga chapters
 */
async function fetchFromMangaPill(mangaTitle) {
  try {
    const cleanTitle = sanitizeSearchTitle(mangaTitle);
    if (!cleanTitle) return null;

    const searchUrl = `${MANGAPILL_BASE}/search?q=${encodeURIComponent(cleanTitle)}`;
    const searchHtml = await fetchHtml(searchUrl, { timeout: 8000 });

    // Match manga card link: /manga/3069/naruto
    const mangaLinkMatch = searchHtml.match(/href="(\/manga\/\d+\/[^"]+)"/);
    if (!mangaLinkMatch) {
      console.log(`[MangaPill] No search match found for "${cleanTitle}"`);
      return null;
    }

    const mangaPath = mangaLinkMatch[1];
    const detailUrl = `${MANGAPILL_BASE}${mangaPath}`;
    const detailHtml = await fetchHtml(detailUrl, { timeout: 10000 });

    // Parse all chapter link anchors
    // e.g. <a href="/chapters/3069-10001000/naruto-chapter-1" class="...">Chapter 1</a>
    const chapterRegex = /<a[^>]*href="(\/chapters\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
    const chapters = [];
    const seenChapters = new Set();
    let match;

    while ((match = chapterRegex.exec(detailHtml)) !== null) {
      const chapterPath = match[1];
      const rawText = match[2].replace(/<[^>]+>/g, '').trim();

      // Extract chapter number
      const numMatch = rawText.match(/chapter\s+([\d.]+)/i) || chapterPath.match(/chapter-([\d.]+)/i);
      const chNum = numMatch ? numMatch[1] : String(chapters.length + 1);

      if (!seenChapters.has(chNum)) {
        seenChapters.add(chNum);
        chapters.push({
          id: chapterPath, // Store path for direct page scraping
          chapter: chNum,
          title: rawText || `Chapter ${chNum}`,
          volume: null,
          date: null
        });
      }
    }

    if (!chapters.length) {
      console.log(`[MangaPill] No chapter links found on detail page for "${cleanTitle}"`);
      return null;
    }

    // MangaPill lists chapters in descending order. Sort ascending (Chapter 1 first).
    chapters.sort((a, b) => parseChapterNumber(a.chapter) - parseChapterNumber(b.chapter));

    return {
      provider: 'mangapill',
      totalChapters: chapters.length,
      chapters
    };
  } catch (err) {
    console.warn(`[MangaPill] Error fetching chapters for "${mangaTitle}":`, err.message);
    return null;
  }
}

/**
 * Fetch chapter page images from MangaPill
 */
async function fetchMangaPillPages(chapterPath) {
  const normalizedPath = chapterPath.startsWith('/') ? chapterPath : `/${chapterPath}`;
  const chapterUrl = `${MANGAPILL_BASE}${normalizedPath}`;
  const chapterHtml = await fetchHtml(chapterUrl, { timeout: 10000 });

  // Match all image sources: data-src="..." or fallback src="..."
  const dataSrcMatches = [...chapterHtml.matchAll(/data-src="([^"]+)"/g)].map(m => m[1]);
  let imgUrls = dataSrcMatches;

  if (!imgUrls.length) {
    // Fallback: match src inside images with cdn or file in path
    imgUrls = [...chapterHtml.matchAll(/src="([^"]+)"/g)]
      .map(m => m[1])
      .filter(url => url.includes('/file/mangap/') || url.includes('cdn.'));
  }

  if (!imgUrls.length) {
    throw new Error('No page image URLs found in MangaPill chapter HTML');
  }

  return imgUrls.map((rawCdnUrl, index) => {
    const proxyUrl = `/api/manga/proxy-image?url=${encodeURIComponent(rawCdnUrl)}&referer=${encodeURIComponent('https://mangapill.com/')}`;
    return {
      pageNumber: index + 1,
      rawCdnUrl,
      proxyUrl,
      dimensions: { width: null, height: null }
    };
  });
}

// =========================================================================
// SERVICE EXPORTS (WATERFALL RESOLVER & DB CACHE)
// =========================================================================

const mangaContentService = {
  /**
   * Resolve manga title given malId
   */
  async resolveTitle(malId, passedTitle = null) {
    if (passedTitle && passedTitle.trim()) {
      return passedTitle.trim();
    }

    try {
      const numMalId = parseInt(malId, 10);
      const cachedManga = await Manga.findOne({ malId: numMalId });
      if (cachedManga) {
        return cachedManga.title || cachedManga.titleEnglish || cachedManga.titleJapanese || '';
      }

      const aniListDetails = await aniListApi.getMangaById(numMalId);
      return aniListDetails?.data?.title || aniListDetails?.data?.titleEnglish || '';
    } catch (err) {
      console.warn(`[mangaContentService] Failed to resolve title for MAL ID ${malId}:`, err.message);
      return '';
    }
  },

  /**
   * Get full chapter list using Database-First multi-source waterfall:
   * 1. Check MongoDB MangaChapterIndex (< 15ms)
   * 2. Try MangaDex API (Official / Open)
   * 3. Fallback to MangaPill Scraper (100% on Big Hits)
   * 4. Persist newly fetched index into MongoDB
   */
  async getChapters(malId, providedTitle = null) {
    const numMalId = parseInt(malId, 10);
    if (isNaN(numMalId)) {
      throw new Error('Invalid MAL ID');
    }

    // 1. Check MongoDB Cache first
    const cachedIndex = await MangaChapterIndex.findOne({ malId: numMalId });
    const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

    if (cachedIndex && cachedIndex.chapters && cachedIndex.chapters.length > 0) {
      const isFresh = (Date.now() - new Date(cachedIndex.lastUpdated).getTime()) < CACHE_TTL_MS;
      if (isFresh) {
        return {
          malId: numMalId,
          provider: cachedIndex.provider,
          totalChapters: cachedIndex.totalChapters,
          chapters: cachedIndex.chapters,
          cached: true
        };
      }
    }

    // Resolve manga title
    const mangaTitle = await this.resolveTitle(numMalId, providedTitle);
    if (!mangaTitle) {
      if (cachedIndex) {
        return {
          malId: numMalId,
          provider: cachedIndex.provider,
          totalChapters: cachedIndex.totalChapters,
          chapters: cachedIndex.chapters,
          cached: true
        };
      }
      throw new Error(`Unable to resolve title for Manga ID ${numMalId}`);
    }

    console.log(`[mangaContentService] Resolving chapters for "${mangaTitle}" (MAL: ${numMalId})...`);

    // 2. Try Provider 1: MangaDex
    let result = await fetchFromMangaDex(numMalId, mangaTitle);

    // 3. Fallback to Provider 2: MangaPill if MangaDex returned no chapters
    if (!result || !result.chapters || result.chapters.length === 0) {
      console.log(`[mangaContentService] Falling back to MangaPill for "${mangaTitle}"...`);
      result = await fetchFromMangaPill(mangaTitle);
    }

    if (!result || !result.chapters || result.chapters.length === 0) {
      // If external fetch fails but stale cache exists, return stale cache
      if (cachedIndex && cachedIndex.chapters.length > 0) {
        console.warn(`[mangaContentService] External fetch failed for "${mangaTitle}", serving stale cache.`);
        return {
          malId: numMalId,
          provider: cachedIndex.provider,
          totalChapters: cachedIndex.totalChapters,
          chapters: cachedIndex.chapters,
          cached: true
        };
      }

      return {
        malId: numMalId,
        provider: 'none',
        totalChapters: 0,
        chapters: [],
        cached: false
      };
    }

    // 4. Upsert into MongoDB MangaChapterIndex
    await MangaChapterIndex.findOneAndUpdate(
      { malId: numMalId },
      {
        malId: numMalId,
        provider: result.provider,
        totalChapters: result.totalChapters,
        chapters: result.chapters,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );

    return {
      malId: numMalId,
      provider: result.provider,
      totalChapters: result.totalChapters,
      chapters: result.chapters,
      cached: false
    };
  },

  /**
   * Get pages for a specific chapter:
   * 1. Check MongoDB MangaChapterPages (7-day TTL cache)
   * 2. Fetch pages from provider
   * 3. Cache into MongoDB MangaChapterPages
   * 4. Return pages + navigation (prev/next chapter)
   */
  async getChapterPages(malId, chapterNumber, providedTitle = null) {
    const numMalId = parseInt(malId, 10);
    const targetCh = String(chapterNumber).trim();

    if (isNaN(numMalId) || !targetCh) {
      throw new Error('Valid MAL ID and Chapter Number are required');
    }

    // 1. Check MongoDB Cache first
    const cachedPages = await MangaChapterPages.findOne({
      mangaId: numMalId,
      chapter: targetCh
    });

    // Fetch chapter index for navigation metadata
    const chapterIndexData = await this.getChapters(numMalId, providedTitle);
    const allChapters = chapterIndexData.chapters || [];

    // Find current, previous, and next chapter
    const currentIndex = allChapters.findIndex(
      ch => String(ch.chapter).trim() === targetCh || parseChapterNumber(ch.chapter) === parseChapterNumber(targetCh)
    );

    const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1].chapter : null;
    const nextChapter = (currentIndex >= 0 && currentIndex < allChapters.length - 1)
      ? allChapters[currentIndex + 1].chapter
      : null;

    const currentMeta = currentIndex >= 0 ? allChapters[currentIndex] : null;

    if (cachedPages && cachedPages.pages && cachedPages.pages.length > 0) {
      return {
        mangaId: numMalId,
        chapter: targetCh,
        chapterTitle: currentMeta?.title || `Chapter ${targetCh}`,
        totalChapters: allChapters.length,
        totalPages: cachedPages.pages.length,
        provider: cachedPages.provider || chapterIndexData.provider,
        pages: cachedPages.pages,
        navigation: {
          hasPrev: Boolean(prevChapter),
          prevChapter,
          hasNext: Boolean(nextChapter),
          nextChapter
        },
        cached: true
      };
    }

    if (currentIndex === -1 && allChapters.length > 0) {
      throw new Error(`Chapter ${targetCh} not found in available chapter index`);
    }

    const provider = chapterIndexData.provider;
    const targetChapterItem = allChapters[currentIndex];
    let pages = [];

    console.log(`[mangaContentService] Fetching pages for MAL ${numMalId} Ch ${targetCh} via ${provider}...`);

    if (provider === 'mangadex') {
      pages = await fetchMangaDexPages(targetChapterItem.id);
    } else if (provider === 'mangapill') {
      pages = await fetchMangaPillPages(targetChapterItem.id);
    } else {
      throw new Error(`Unsupported manga content provider: ${provider}`);
    }

    // 3. Cache into MongoDB MangaChapterPages (auto-expires in 7 days via TTL index)
    await MangaChapterPages.findOneAndUpdate(
      { mangaId: numMalId, chapter: targetCh },
      {
        mangaId: numMalId,
        chapter: targetCh,
        totalPages: pages.length,
        provider,
        pages,
        createdAt: new Date()
      },
      { upsert: true, new: true }
    );

    return {
      mangaId: numMalId,
      chapter: targetCh,
      chapterTitle: currentMeta?.title || `Chapter ${targetCh}`,
      totalChapters: allChapters.length,
      totalPages: pages.length,
      provider,
      pages,
      navigation: {
        hasPrev: Boolean(prevChapter),
        prevChapter,
        hasNext: Boolean(nextChapter),
        nextChapter
      },
      cached: false
    };
  }
};

module.exports = mangaContentService;