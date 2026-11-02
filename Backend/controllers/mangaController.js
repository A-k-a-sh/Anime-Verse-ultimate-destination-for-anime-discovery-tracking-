const Manga = require('../models/Manga');
const aniListApi = require('../utils/aniListApi');
const { resolveGenreName } = require('../utils/genreMap');
const mangaContentService = require('../services/mangaContentService');

// @desc    Search manga (Database-First with AniList fallback)
// @route   GET /api/manga/search or GET /api/manga
// @access  Public
const searchManga = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 25, type, status, order_by, sort, genre, genres, adult } = req.query;

    const parsedPage = Math.max(parseInt(page) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 25, 1), 50);
    const skip = (parsedPage - 1) * parsedLimit;

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
      if (s === 'publishing' || s === 'releasing') {
        query.status = { $in: ['Publishing', 'Releasing'] };
      } else if (s === 'complete' || s === 'completed' || s === 'finished') {
        query.status = { $in: ['Completed', 'Finished'] };
      } else if (s === 'upcoming' || s === 'not yet published') {
        query.status = { $in: ['Upcoming', 'Not yet published'] };
      } else {
        query.status = new RegExp(`^${status}$`, 'i');
      }
    }

    if (type) {
      query.type = new RegExp(`^${type}$`, 'i');
    }

    const genreParam = genre || genres;
    const isAdultRequested = (adult && adult !== '') || (genreParam && (genreParam.toLowerCase().includes('hentai') || genreParam.trim() === '12'));

    if (genreParam) {
      const genreList = genreParam.split(',').map(resolveGenreName).filter(Boolean);
      if (genreList.length > 0) {
        query.genres = { $in: genreList.map(g => new RegExp(`^${g}$`, 'i')) };
      }
    } else if (adult === 'only_adult') {
      query.genres = { $in: [/^hentai$/i, /^ecchi$/i] };
    } else if (!isAdultRequested) {
      // Exclude adult/hentai content by default unless explicitly requested
      query.genres = { $nin: ['Hentai', 'hentai'] };
    }

    // Determine sort option
    let sortOption = {};
    const sortDirection = (sort && sort.toLowerCase() === 'asc') ? 1 : -1;

    if (order_by === 'popularity') {
      sortOption = { popularity: -1, score: -1 };
    } else if (order_by === 'score') {
      sortOption = { score: sortDirection, scoredBy: -1 };
    } else if (order_by === 'title') {
      sortOption = { title: sortDirection };
    } else if (order_by === 'start_date' || order_by === 'year') {
      sortOption = { 'published.from': sortDirection, score: -1 };
    } else {
      sortOption = { popularity: -1, score: -1 };
    }

    // 1. Query MongoDB first (Database-First: < 15ms)
    const total = await Manga.countDocuments(query);
    const results = await Manga.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(parsedLimit);

    if (results.length > 0) {
      const hasMoreInDb = (parsedPage * parsedLimit) < total;
      // Option A: If we've reached the end of cached DB results, keep has_next_page true (up to page 100)
      // so user can click "Load More" and dynamically expand cache from AniList
      const hasNextPage = hasMoreInDb || parsedPage < 100;

      return res.json({
        success: true,
        data: results,
        pagination: {
          last_visible_page: Math.ceil(total / parsedLimit) || 1,
          has_next_page: hasNextPage,
          current_page: parsedPage,
          total_items: total
        }
      });
    }

    // Fallback for hentai / adult manga when page results are empty
    if (isAdultRequested) {
      try {
        const hentaiMangaResult = await aniListApi.getHentaiManga(parsedPage, parsedLimit);
        if (hentaiMangaResult.data?.length > 0) {
          return res.json({
            success: true,
            data: hentaiMangaResult.data,
            pagination: hentaiMangaResult.pagination
          });
        }
      } catch (err) {
        console.error('Error fetching hentai manga from AniList:', err.message);
      }
    }

    // 2. Option A Fallback to AniList API on cache miss or page exhaustion
    try {
      const filters = {
        page: parsedPage,
        limit: parsedLimit,
        type,
        status,
        order_by,
        sort,
        genre: genreParam ? genreParam.split(',').map(resolveGenreName).filter(Boolean).join(',') : '',
        isAdult: isAdultRequested
      };

      const result = await aniListApi.searchManga(q || '', filters);
      return res.json({
        success: true,
        data: result.data || [],
        pagination: result.pagination || {
          last_visible_page: parsedPage,
          has_next_page: false,
          current_page: parsedPage,
          total_items: 0
        }
      });
    } catch (apiError) {
      console.error('AniList Manga search fallback error:', apiError.message);
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
    }
  } catch (error) {
    console.error('Manga search error:', error.message);
    res.status(500).json({
      success: false,
      data: [],
      pagination: { last_visible_page: 1, has_next_page: false, current_page: 1 },
      message: error.message || 'Error occurred while searching manga.'
    });
  }
};

// @desc    Get manga by ID (Database-First)
// @route   GET /api/manga/:id
// @access  Public
const getMangaById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const malId = parseInt(id);

    if (isNaN(malId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid manga ID'
      });
    }

    // 1. Check MongoDB cache first (< 10ms)
    const manga = await Manga.findOne({ malId });
    if (manga) {
      return res.json({
        success: true,
        data: manga,
        cached: true
      });
    }

    // 2. Fetch from AniList API and persist in MongoDB
    try {
      const freshManga = await aniListApi.fetchMangaById(malId);
      if (!freshManga) {
        return res.status(404).json({
          success: false,
          message: 'Manga not found'
        });
      }
      return res.json({
        success: true,
        data: freshManga
      });
    } catch (apiError) {
      console.error(`AniList fetch error for manga ${malId}:`, apiError.message);
      return res.status(502).json({
        success: false,
        message: 'Unable to fetch manga details from external provider.'
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get manga pictures
// @route   GET /api/manga/:id/pictures
// @access  Public
const getMangaPictures = async (req, res, next) => {
  try {
    const { id } = req.params;
    const pictures = await aniListApi.getMangaPictures(id);

    res.json({
      success: true,
      data: pictures
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get manga characters
// @route   GET /api/manga/:id/characters
// @access  Public
const getMangaCharacters = async (req, res, next) => {
  try {
    const { id } = req.params;
    const characters = await aniListApi.getMangaCharacters(id);

    res.json({
      success: true,
      data: characters
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get manga recommendations
// @route   GET /api/manga/:id/recommendations
// @access  Public
const getMangaRecommendations = async (req, res, next) => {
  try {
    const { id } = req.params;
    const recommendations = await aniListApi.getMangaRecommendations(id);

    res.json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    console.error(`❌ Error fetching recommendations for manga ${req.params.id}:`, error.message);
    res.json({
      success: true,
      data: [],
      message: 'Recommendations temporarily unavailable'
    });
  }
};

// @desc    Get top manga (Database-First with AniList fallback)
// @route   GET /api/manga/top
// @access  Public
const getTopManga = async (req, res, next) => {
  try {
    const { page = 1, limit = 25, refresh } = req.query;
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 25, 1), 50);
    const parsedPage = Math.max(parseInt(page) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    // 1. Query MongoDB first (exclude adult/hentai from top manga by default)
    const baseQuery = { score: { $gt: 0 }, genres: { $nin: ['Hentai', 'hentai'] } };
    const total = await Manga.countDocuments(baseQuery);
    const cached = await Manga.find(baseQuery)
      .sort({ score: -1, scoredBy: -1, popularity: -1 })
      .skip(skip)
      .limit(parsedLimit);

    if (cached.length > 0 && !refresh) {
      const hasMoreInDb = (parsedPage * parsedLimit) < total;
      const hasNextPage = hasMoreInDb || parsedPage < 100;

      return res.json({
        success: true,
        data: cached,
        pagination: {
          last_visible_page: Math.ceil(total / parsedLimit) || 1,
          has_next_page: hasNextPage,
          current_page: parsedPage,
          total_items: total
        },
        cached: true
      });
    }

    // 2. Fetch from AniList API if DB empty or refresh forced
    try {
      const result = await aniListApi.getTopManga(parsedPage, parsedLimit);
      return res.json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        cached: false
      });
    } catch (apiError) {
      console.error('AniList getTopManga error:', apiError.message);
      if (cached.length > 0) {
        return res.json({
          success: true,
          data: cached,
          pagination: {
            last_visible_page: Math.ceil(total / parsedLimit) || 1,
            has_next_page: (parsedPage * parsedLimit) < total,
            current_page: parsedPage
          },
          cached: true
        });
      }
      return res.json({
        success: true,
        data: [],
        pagination: { last_visible_page: 1, has_next_page: false }
      });
    }
  } catch (error) {
    console.error('Error fetching top manga:', error.message);
    res.json({
      success: true,
      data: [],
      pagination: { last_visible_page: 1, has_next_page: false },
      message: 'Top manga temporarily unavailable.'
    });
  }
};

// @desc    Get random manga
// @route   GET /api/manga/random
// @access  Public
const getRandomManga = async (req, res, next) => {
  try {
    const manga = await aniListApi.getRandomManga();

    res.json({
      success: true,
      data: manga
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get chapters list for a manga (Database-First Waterfall)
// @route   GET /api/manga/:id/chapters
// @access  Public
const getMangaChapters = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title } = req.query;

    const chaptersData = await mangaContentService.getChapters(id, title);

    res.json({
      success: true,
      data: chaptersData
    });
  } catch (error) {
    console.error('getMangaChapters error:', error.message);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to fetch manga chapters'
    });
  }
};

// @desc    Get pages for a specific manga chapter (Database-First 7-day TTL Cache)
// @route   GET /api/manga/:id/chapter/:chapterNumber
// @access  Public
const getChapterPages = async (req, res, next) => {
  try {
    const { id, chapterNumber } = req.params;
    const { title } = req.query;

    const pagesData = await mangaContentService.getChapterPages(id, chapterNumber, title);

    res.json({
      success: true,
      data: pagesData
    });
  } catch (error) {
    console.error('getChapterPages error:', error.message);
    res.status(error.message.includes('not found') ? 404 : 500).json({
      success: false,
      message: error.message || 'Failed to fetch chapter pages'
    });
  }
};

// Concurrency Limiter Queue for upstream CDN image fetching
class ConcurrencyLimiter {
  constructor(concurrency = 15) {
    this.concurrency = concurrency;
    this.running = 0;
    this.queue = [];
  }

  run(task, isCancelledCheck) {
    return new Promise((resolve, reject) => {
      this.queue.push({ task, resolve, reject, isCancelledCheck });
      this.next();
    });
  }

  next() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    const { task, resolve, reject, isCancelledCheck } = this.queue.shift();

    if (isCancelledCheck && isCancelledCheck()) {
      // Client disconnected before proxy slot was allocated
      reject(new Error('Client aborted'));
      this.next();
      return;
    }

    this.running++;

    task()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        this.running--;
        this.next();
      });
  }
}

const cdnLimiter = new ConcurrencyLimiter(6);

// @desc    Zero-storage streaming proxy for protected manga CDN images
// @route   GET /api/manga/proxy-image
// @access  Public
const proxyMangaImage = async (req, res, next) => {
  try {
    const { url, referer } = req.query;

    if (!url) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }

    // Security check: validate protocol
    try {
      const parsedUrl = new URL(url);
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        return res.status(400).json({ success: false, message: 'Invalid URL protocol' });
      }
    } catch {
      return res.status(400).json({ success: false, message: 'Invalid URL format' });
    }

    // Wrap upstream fetch & streaming in cdnLimiter (max 6 parallel upstream connections)
    await cdnLimiter.run(
      () =>
        new Promise(async (resolveTask, rejectTask) => {
          let taskDone = false;
          const finish = (err) => {
            if (!taskDone) {
              taskDone = true;
              if (err) rejectTask(err);
              else resolveTask();
            }
          };

          // If client disconnects or completes streaming, release slot immediately
          req.on('close', () => finish());
          res.on('finish', () => finish());
          res.on('error', finish);

          try {
            let upstreamResponse = null;
            let attempts = 0;
            const maxAttempts = 2;

            while (attempts < maxAttempts) {
              attempts++;
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), 12000);

              try {
                upstreamResponse = await fetch(url, {
                  signal: controller.signal,
                  headers: {
                    'User-Agent':
                      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Referer': referer || 'https://mangapill.com/',
                    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
                  }
                });
                clearTimeout(timeoutId);

                // If upstream CDN throttled with 429 or 503, pause and retry once
                if ((upstreamResponse.status === 429 || upstreamResponse.status === 503) && attempts < maxAttempts) {
                  console.warn(`[ProxyLimiter] Upstream CDN returned ${upstreamResponse.status} for ${url}, retrying in 400ms...`);
                  await new Promise((r) => setTimeout(r, 400));
                  continue;
                }

                break;
              } catch (fetchErr) {
                clearTimeout(timeoutId);
                if (attempts < maxAttempts) {
                  await new Promise((r) => setTimeout(r, 400));
                  continue;
                }
                throw fetchErr;
              }
            }

            if (!upstreamResponse || !upstreamResponse.ok) {
              const status = upstreamResponse ? upstreamResponse.status : 502;
              if (!res.headersSent) {
                res.status(status).send('Upstream CDN image error');
              }
              return finish();
            }

            const contentType = upstreamResponse.headers.get('content-type') || 'image/jpeg';
            if (!res.headersSent) {
              res.setHeader('Content-Type', contentType);
              res.setHeader('Cache-Control', 'public, max-age=604800, immutable'); // 7 days browser cache
            }

            const { Readable } = require('stream');
            const stream = Readable.fromWeb(upstreamResponse.body);
            stream.pipe(res);
          } catch (taskErr) {
            finish(taskErr);
          }
        }),
      () => req.destroyed || res.writableEnded
    );
  } catch (error) {
    if (error.message === 'Client aborted') {
      return;
    }
    if (error.name === 'AbortError') {
      if (!res.headersSent) res.status(504).send('Image fetch timed out');
      return;
    }
    console.error('proxyMangaImage error:', error.message);
    if (!res.headersSent) {
      res.status(500).send('Failed to proxy manga image');
    }
  }
};

module.exports = {
  searchManga,
  getMangaById,
  getMangaPictures,
  getMangaCharacters,
  getMangaRecommendations,
  getTopManga,
  getRandomManga,
  getMangaChapters,
  getChapterPages,
  proxyMangaImage
};
