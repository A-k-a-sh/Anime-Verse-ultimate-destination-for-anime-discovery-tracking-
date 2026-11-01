const axios = require('axios');
const Anime = require('../models/Anime');
const Manga = require('../models/Manga');
const Character = require('../models/Character');
const { resolveGenreName } = require('./genreMap');

const ANILIST_URL = process.env.ANILIST_API_URL || 'https://graphql.anilist.co';
const REQUEST_TIMEOUT = 8000;

/**
 * Execute GraphQL Query against AniList
 */
const queryAniList = async (query, variables = {}) => {
  try {
    const response = await axios.post(
      ANILIST_URL,
      { query, variables },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'AnimeVerse/2.0'
        },
        timeout: REQUEST_TIMEOUT
      }
    );
    return response.data.data;
  } catch (error) {
    const errMsg = error.response?.data?.errors?.[0]?.message || error.message;
    console.error(`AniList API Error: ${errMsg}`);
    throw new Error(errMsg);
  }
};

// Map AniList anime status to AnimeVerse Mongoose status enum
const mapAnimeStatus = (status) => {
  switch (status) {
    case 'FINISHED': return 'Completed';
    case 'RELEASING': return 'Airing';
    case 'NOT_YET_RELEASED': return 'Upcoming';
    case 'CANCELLED': return 'Completed';
    case 'HIATUS': return 'Not yet aired';
    default: return 'Completed';
  }
};

// Map AniList manga status to AnimeVerse Mongoose manga status enum
const mapMangaStatus = (status) => {
  switch (status) {
    case 'FINISHED': return 'Completed';
    case 'RELEASING': return 'Publishing';
    case 'NOT_YET_RELEASED': return 'Not yet published';
    case 'CANCELLED': return 'Discontinued';
    case 'HIATUS': return 'On Hiatus';
    default: return 'Completed';
  }
};

// Map AniList manga format to AnimeVerse type enum
const mapMangaType = (format) => {
  switch (format) {
    case 'MANGA': return 'Manga';
    case 'NOVEL': return 'Light Novel';
    case 'ONE_SHOT': return 'One-shot';
    default: return 'Manga';
  }
};

// Transform AniList Media to Anime schema
const transformAnimeData = (media) => {
  const mainStudios = media.studios?.edges?.filter(e => e.isMain).map(e => e.node.name) || [];
  const prodStudios = media.studios?.edges?.filter(e => !e.isMain).map(e => e.node.name) || [];

  return {
    malId: media.idMal || media.id,
    title: media.title?.english || media.title?.romaji || 'Unknown Title',
    titleEnglish: media.title?.english || null,
    titleJapanese: media.title?.native || null,
    synopsis: media.description ? media.description.replace(/<[^>]*>?/gm, '').trim() : '',
    background: null,
    imageUrl: media.coverImage?.extraLarge || media.coverImage?.large,
    trailerUrl: media.trailer?.site === 'youtube' ? `https://www.youtube.com/embed/${media.trailer.id}` : null,
    episodes: media.episodes || null,
    duration: media.duration ? `${media.duration} min` : null,
    status: mapAnimeStatus(media.status),
    aired: {
      from: media.startDate?.year ? new Date(media.startDate.year, (media.startDate.month || 1) - 1, media.startDate.day || 1) : null,
      to: media.endDate?.year ? new Date(media.endDate.year, (media.endDate.month || 1) - 1, media.endDate.day || 1) : null
    },
    rating: media.format || 'TV',
    genres: media.genres || [],
    studios: mainStudios.length > 0 ? mainStudios : (prodStudios.slice(0, 1)),
    producers: prodStudios,
    licensors: [],
    score: media.averageScore ? media.averageScore / 10 : null,
    scoredBy: media.popularity || 0,
    popularity: media.popularity || 0,
    year: media.seasonYear || media.startDate?.year || null,
    season: media.season ? media.season.toLowerCase() : null,
    lastUpdated: Date.now()
  };
};

// Transform AniList Media to Manga schema
const transformMangaData = (media) => {
  const authors = media.staff?.edges?.map(e => e.node?.name?.full).filter(Boolean) || [];

  return {
    malId: media.idMal || media.id,
    title: media.title?.english || media.title?.romaji || 'Unknown Manga',
    titleEnglish: media.title?.english || null,
    titleJapanese: media.title?.native || null,
    synopsis: media.description ? media.description.replace(/<[^>]*>?/gm, '').trim() : '',
    imageUrl: media.coverImage?.extraLarge || media.coverImage?.large,
    type: mapMangaType(media.format),
    chapters: media.chapters || null,
    volumes: media.volumes || null,
    status: mapMangaStatus(media.status),
    published: {
      from: media.startDate?.year ? new Date(media.startDate.year, (media.startDate.month || 1) - 1, media.startDate.day || 1) : null,
      to: media.endDate?.year ? new Date(media.endDate.year, (media.endDate.month || 1) - 1, media.endDate.day || 1) : null
    },
    score: media.averageScore ? media.averageScore / 10 : null,
    scoredBy: media.popularity || 0,
    popularity: media.popularity || 0,
    genres: media.genres || [],
    authors: authors,
    lastUpdated: Date.now()
  };
};

// ==========================================
// ANIME API METHODS
// ==========================================

const fetchAnimeById = async (malId, forceRefresh = false) => {
  const numericId = parseInt(malId);

  // Check MongoDB cache first if not forced refresh
  if (!forceRefresh) {
    const cached = await Anime.findOne({ malId: numericId });
    if (cached) return cached;
  }

  const query = `
    query ($idMal: Int) {
      Media(idMal: $idMal, type: ANIME) {
        id
        idMal
        title { romaji english native }
        description(asHtml: false)
        bannerImage
        coverImage { large extraLarge }
        episodes
        duration
        status
        format
        startDate { year month day }
        endDate { year month day }
        season
        seasonYear
        averageScore
        popularity
        genres
        studios {
          edges {
            isMain
            node { name }
          }
        }
        trailer { id site }
      }
    }
  `;

  // Fallback to search if idMal isn't matched directly
  let data = null;
  try {
    data = await queryAniList(query, { idMal: numericId });
  } catch (err) {
    // If idMal lookup fails, try AniList ID directly
    const fallbackQuery = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          id
          idMal
          title { romaji english native }
          description(asHtml: false)
          bannerImage
          coverImage { large extraLarge }
          episodes
          duration
          status
          format
          startDate { year month day }
          endDate { year month day }
          season
          seasonYear
          averageScore
          popularity
          genres
          studios { edges { isMain node { name } } }
          trailer { id site }
        }
      }
    `;
    data = await queryAniList(fallbackQuery, { id: numericId });
  }

  if (!data || !data.Media) return null;

  const animeData = transformAnimeData(data.Media);
  const anime = await Anime.findOneAndUpdate(
    { malId: animeData.malId },
    animeData,
    { upsert: true, new: true }
  );

  return anime;
};

const searchAnime = async (searchQuery, filters = {}) => {
  const page = Math.max(parseInt(filters.page) || 1, 1);
  const perPage = Math.min(Math.max(parseInt(filters.limit) || 25, 1), 50);

  const query = `
    query ($search: String, $page: Int, $perPage: Int, $sort: [MediaSort], $genre: String) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          currentPage
          hasNextPage
          lastPage
        }
        media(search: $search, type: ANIME, sort: $sort, genre: $genre) {
          id
          idMal
          title { romaji english native }
          description(asHtml: false)
          coverImage { large extraLarge }
          episodes
          duration
          status
          format
          startDate { year month day }
          season
          seasonYear
          averageScore
          popularity
          genres
          studios(isMain: true) { nodes { name } }
        }
      }
    }
  `;

  // Determine sort
  let sort = ['POPULARITY_DESC'];
  if (filters.order_by === 'score') sort = ['SCORE_DESC'];
  if (filters.order_by === 'title') sort = ['TITLE_ROMAJI'];
  if (filters.order_by === 'start_date') sort = ['START_DATE_DESC'];

  const genreParam = filters.genre || filters.genres;
  const rawGenre = genreParam ? genreParam.split(',')[0].trim() : undefined;
  const resolvedGenre = rawGenre ? resolveGenreName(rawGenre) : undefined;

  const data = await queryAniList(query, {
    search: searchQuery && searchQuery.trim() ? searchQuery.trim() : undefined,
    page,
    perPage,
    sort,
    genre: resolvedGenre || undefined
  });

  const mediaList = data?.Page?.media || [];

  // Upsert fetched items into MongoDB
  const animeList = await Promise.all(
    mediaList.map(async (item) => {
      const animeData = transformAnimeData(item);
      return await Anime.findOneAndUpdate(
        { malId: animeData.malId },
        animeData,
        { upsert: true, new: true }
      );
    })
  );

  return {
    data: animeList,
    pagination: {
      last_visible_page: data?.Page?.pageInfo?.lastPage || 1,
      has_next_page: data?.Page?.pageInfo?.hasNextPage || false,
      current_page: data?.Page?.pageInfo?.currentPage || page
    }
  };
};

const getTopAnime = async (page = 1, limit = 25) => {
  const parsedPage = Math.max(parseInt(page) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit) || 25, 1), 50);

  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          currentPage
          hasNextPage
          lastPage
        }
        media(type: ANIME, sort: SCORE_DESC) {
          id
          idMal
          title { romaji english native }
          description(asHtml: false)
          coverImage { large extraLarge }
          episodes
          duration
          status
          format
          startDate { year month day }
          season
          seasonYear
          averageScore
          popularity
          genres
          studios(isMain: true) { nodes { name } }
        }
      }
    }
  `;

  const data = await queryAniList(query, { page: parsedPage, perPage: parsedLimit });
  const mediaList = data?.Page?.media || [];

  const animeList = await Promise.all(
    mediaList.map(async (item) => {
      const animeData = transformAnimeData(item);
      return await Anime.findOneAndUpdate(
        { malId: animeData.malId },
        animeData,
        { upsert: true, new: true }
      );
    })
  );

  return {
    data: animeList,
    pagination: {
      last_visible_page: data?.Page?.pageInfo?.lastPage || 1,
      has_next_page: data?.Page?.pageInfo?.hasNextPage || false,
      current_page: parsedPage
    }
  };
};

const getHentaiAnime = async (page = 1, limit = 25) => {
  const parsedPage = Math.max(parseInt(page) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit) || 25, 1), 50);

  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          currentPage
          hasNextPage
          lastPage
        }
        media(genre: "Hentai", type: ANIME, sort: POPULARITY_DESC) {
          id
          idMal
          title { romaji english native }
          description(asHtml: false)
          coverImage { large extraLarge }
          episodes
          duration
          status
          format
          startDate { year month day }
          season
          seasonYear
          averageScore
          popularity
          genres
          studios(isMain: true) { nodes { name } }
        }
      }
    }
  `;

  try {
    const data = await queryAniList(query, { page: parsedPage, perPage: parsedLimit });
    const mediaList = data?.Page?.media || [];

    const animeList = await Promise.all(
      mediaList.map(async (item) => {
        const animeData = transformAnimeData(item);
        animeData.rating = 'Rx - Hentai';
        if (!animeData.genres.includes('Hentai')) {
          animeData.genres.push('Hentai');
        }
        return await Anime.findOneAndUpdate(
          { malId: animeData.malId },
          animeData,
          { upsert: true, new: true }
        );
      })
    );

    return {
      data: animeList,
      pagination: {
        last_visible_page: data?.Page?.pageInfo?.lastPage || 1,
        has_next_page: data?.Page?.pageInfo?.hasNextPage || false,
        current_page: parsedPage
      }
    };
  } catch (err) {
    console.error('Error fetching hentai anime:', err.message);
    return { data: [], pagination: { last_visible_page: 1, has_next_page: false, current_page: parsedPage } };
  }
};

const getSeasonalAnime = async (year, season, page = 1, limit = 25) => {
  const parsedPage = Math.max(parseInt(page) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit) || 25, 1), 50);
  const s = (season || 'winter').toUpperCase();

  const query = `
    query ($season: MediaSeason, $seasonYear: Int, $page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          currentPage
          hasNextPage
          lastPage
        }
        media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: POPULARITY_DESC) {
          id
          idMal
          title { romaji english native }
          description(asHtml: false)
          coverImage { large extraLarge }
          episodes
          duration
          status
          format
          startDate { year month day }
          season
          seasonYear
          averageScore
          popularity
          genres
          studios(isMain: true) { nodes { name } }
        }
      }
    }
  `;

  const data = await queryAniList(query, {
    season: s,
    seasonYear: parseInt(year),
    page: parsedPage,
    perPage: parsedLimit
  });

  const mediaList = data?.Page?.media || [];

  const animeList = await Promise.all(
    mediaList.map(async (item) => {
      const animeData = transformAnimeData(item);
      return await Anime.findOneAndUpdate(
        { malId: animeData.malId },
        animeData,
        { upsert: true, new: true }
      );
    })
  );

  return {
    data: animeList,
    pagination: {
      last_visible_page: data?.Page?.pageInfo?.lastPage || 1,
      has_next_page: data?.Page?.pageInfo?.hasNextPage || false,
      current_page: parsedPage
    }
  };
};

const getRandomAnime = async () => {
  const randomPage = Math.floor(Math.random() * 20) + 1;
  const result = await getTopAnime(randomPage, 10);
  if (result.data && result.data.length > 0) {
    const randomIndex = Math.floor(Math.random() * result.data.length);
    return result.data[randomIndex];
  }
  return null;
};

// ==========================================
// SUB-RESOURCES (Characters, Staff, Recommendations, Reviews)
// ==========================================

const getAnimeCharacters = async (malId) => {
  const numericId = parseInt(malId);
  const query = `
    query ($idMal: Int) {
      Media(idMal: $idMal, type: ANIME) {
        characters(sort: [ROLE, RELEVANCE], perPage: 15) {
          edges {
            role
            node {
              id
              name { full native }
              image { large }
            }
            voiceActors(language: JAPANESE) {
              id
              name { full }
              image { large }
              languageV2
            }
          }
        }
      }
    }
  `;

  try {
    const data = await queryAniList(query, { idMal: numericId });
    const edges = data?.Media?.characters?.edges || [];

    // Map to shape required by CharacterCard.jsx
    return edges.map(edge => ({
      role: edge.role === 'MAIN' ? 'Main' : 'Supporting',
      character: {
        mal_id: edge.node?.id,
        name: edge.node?.name?.full || edge.node?.name?.native,
        images: {
          jpg: {
            image_url: edge.node?.image?.large
          }
        }
      },
      voice_actors: edge.voiceActors?.map(va => ({
        person: {
          name: va.name?.full,
          images: {
            jpg: {
              image_url: va.image?.large
            }
          }
        },
        language: 'Japanese'
      })) || []
    }));
  } catch (err) {
    console.warn(`Error getting characters for ${malId}:`, err.message);
    return [];
  }
};

const getAnimeStaff = async (malId) => {
  const numericId = parseInt(malId);
  const query = `
    query ($idMal: Int) {
      Media(idMal: $idMal, type: ANIME) {
        staff(perPage: 12) {
          edges {
            role
            node {
              id
              name { full }
              image { large }
            }
          }
        }
      }
    }
  `;

  try {
    const data = await queryAniList(query, { idMal: numericId });
    const edges = data?.Media?.staff?.edges || [];

    return edges.map(edge => ({
      person: {
        name: edge.node?.name?.full,
        images: {
          jpg: {
            image_url: edge.node?.image?.large
          }
        }
      },
      positions: [edge.role]
    }));
  } catch (err) {
    console.warn(`Error getting staff for ${malId}:`, err.message);
    return [];
  }
};

const getAnimePictures = async (malId) => {
  const numericId = parseInt(malId);
  const query = `
    query ($idMal: Int) {
      Media(idMal: $idMal, type: ANIME) {
        coverImage { extraLarge large }
        bannerImage
      }
    }
  `;

  try {
    const data = await queryAniList(query, { idMal: numericId });
    const media = data?.Media;
    const pictures = [];

    if (media?.coverImage?.extraLarge) {
      pictures.push({
        jpg: {
          image_url: media.coverImage.extraLarge,
          large_image_url: media.coverImage.extraLarge
        }
      });
    }
    if (media?.bannerImage) {
      pictures.push({
        jpg: {
          image_url: media.bannerImage,
          large_image_url: media.bannerImage
        }
      });
    }

    return pictures;
  } catch (err) {
    return [];
  }
};

const getAnimeEpisodes = async (malId, page = 1) => {
  const numericId = parseInt(malId);
  const anime = await Anime.findOne({ malId: numericId });
  const totalEps = anime?.episodes || 12;

  try {
    const query = `
      query ($idMal: Int) {
        Media(idMal: $idMal, type: ANIME) {
          streamingEpisodes {
            title
            thumbnail
            url
          }
        }
      }
    `;
    const result = await queryAniList(query, { idMal: numericId });
    const streaming = result?.Media?.streamingEpisodes || [];

    if (streaming.length > 0) {
      const episodes = streaming.map((ep, idx) => {
        let cleanTitle = ep.title || '';
        // Extract title if in formats like "Episode 1 - Title" or "1. Title"
        const match = cleanTitle.match(/(?:Episode\s*\d+\s*[-:]\s*|\d+\.\s*)(.+)/i);
        if (match && match[1]) {
          cleanTitle = match[1].trim();
        }

        return {
          mal_id: idx + 1,
          episode: idx + 1,
          title: cleanTitle || ep.title || `Episode ${idx + 1}`,
          fullTitle: ep.title,
          thumbnail: ep.thumbnail || null
        };
      });

      return {
        data: episodes,
        pagination: { last_visible_page: 1, has_next_page: false }
      };
    }
  } catch (err) {
    console.warn(`Failed to fetch streamingEpisodes for malId ${malId}:`, err.message);
  }

  // Fallback if no streaming episodes available
  const episodes = [];
  for (let i = 1; i <= Math.min(totalEps, 100); i++) {
    episodes.push({
      mal_id: i,
      title: `Episode ${i}`,
      episode: i
    });
  }
  return {
    data: episodes,
    pagination: { last_visible_page: 1, has_next_page: false }
  };
};

const getAnimeRecommendations = async (malId) => {
  const numericId = parseInt(malId);
  const query = `
    query ($idMal: Int) {
      Media(idMal: $idMal, type: ANIME) {
        recommendations(perPage: 10, sort: RATING_DESC) {
          nodes {
            mediaRecommendation {
              id
              idMal
              title { english romaji }
              coverImage { large }
              averageScore
            }
          }
        }
      }
    }
  `;

  try {
    const data = await queryAniList(query, { idMal: numericId });
    const nodes = data?.Media?.recommendations?.nodes || [];

    const recs = nodes
      .filter(n => n.mediaRecommendation && n.mediaRecommendation.idMal)
      .map(n => ({
        entry: {
          malId: n.mediaRecommendation.idMal,
          mal_id: n.mediaRecommendation.idMal,
          title: n.mediaRecommendation.title?.english || n.mediaRecommendation.title?.romaji,
          imageUrl: n.mediaRecommendation.coverImage?.large,
          score: n.mediaRecommendation.averageScore ? n.mediaRecommendation.averageScore / 10 : null
        }
      }));

    if (recs.length > 0) return recs;
  } catch (err) {
    console.warn(`AniList recommendation query failed for ${malId}:`, err.message);
  }

  // Smart local MongoDB Fallback: find anime with matching genres
  try {
    const currentAnime = await Anime.findOne({ malId: numericId });
    if (currentAnime && currentAnime.genres && currentAnime.genres.length > 0) {
      const localRecs = await Anime.find({
        genres: { $in: currentAnime.genres },
        malId: { $ne: numericId }
      })
        .sort({ score: -1 })
        .limit(10);

      return localRecs.map(item => ({
        entry: {
          malId: item.malId,
          mal_id: item.malId,
          title: item.title,
          imageUrl: item.imageUrl,
          score: item.score
        }
      }));
    }
  } catch (localErr) {
    console.error('Local recommendation fallback error:', localErr.message);
  }

  return [];
};

const getAnimeReviews = async (malId, page = 1) => {
  const numericId = parseInt(malId);
  const query = `
    query ($idMal: Int) {
      Media(idMal: $idMal, type: ANIME) {
        reviews(perPage: 5, sort: RATING_DESC) {
          nodes {
            id
            summary
            body(asHtml: false)
            score
            user {
              name
              avatar { large }
            }
            createdAt
          }
        }
      }
    }
  `;

  try {
    const data = await queryAniList(query, { idMal: numericId });
    const nodes = data?.Media?.reviews?.nodes || [];

    const reviews = nodes.map(r => ({
      user: {
        username: r.user?.name || 'AnimeFan',
        images: {
          jpg: {
            image_url: r.user?.avatar?.large || 'https://via.placeholder.com/40'
          }
        }
      },
      date: new Date(r.createdAt * 1000).toISOString(),
      score: Math.round(r.score / 10),
      review: r.summary || (r.body ? r.body.slice(0, 300) : '')
    }));

    return {
      data: reviews,
      pagination: { last_visible_page: 1, has_next_page: false }
    };
  } catch (err) {
    return {
      data: [],
      pagination: { last_visible_page: 1, has_next_page: false }
    };
  }
};

// ==========================================
// MANGA API METHODS
// ==========================================

const fetchMangaById = async (malId) => {
  const numericId = parseInt(malId);

  // Check MongoDB cache first
  const cached = await Manga.findOne({ malId: numericId });
  if (cached) return cached;

  const query = `
    query ($idMal: Int) {
      Media(idMal: $idMal, type: MANGA) {
        id
        idMal
        title { romaji english native }
        description(asHtml: false)
        coverImage { large extraLarge }
        chapters
        volumes
        status
        format
        startDate { year month day }
        endDate { year month day }
        averageScore
        popularity
        genres
        staff(perPage: 3) {
          edges {
            role
            node { name { full } }
          }
        }
      }
    }
  `;

  try {
    const data = await queryAniList(query, { idMal: numericId });
    if (!data?.Media) return null;

    const mangaData = transformMangaData(data.Media);
    const manga = await Manga.findOneAndUpdate(
      { malId: mangaData.malId },
      mangaData,
      { upsert: true, new: true }
    );
    return manga;
  } catch (err) {
    console.error(`Error fetching manga ${malId}:`, err.message);
    return null;
  }
};

const searchManga = async (searchQuery, filters = {}) => {
  const page = Math.max(parseInt(filters.page) || 1, 1);
  const perPage = Math.min(Math.max(parseInt(filters.limit) || 25, 1), 50);
  const isAdult = filters.isAdult !== undefined ? Boolean(filters.isAdult) : false;

  const query = `
    query ($search: String, $page: Int, $perPage: Int, $sort: [MediaSort], $genre: String, $isAdult: Boolean) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          currentPage
          hasNextPage
          lastPage
        }
        media(search: $search, type: MANGA, sort: $sort, genre: $genre, isAdult: $isAdult) {
          id
          idMal
          title { romaji english native }
          description(asHtml: false)
          coverImage { large extraLarge }
          chapters
          volumes
          status
          format
          startDate { year month day }
          averageScore
          popularity
          genres
          staff(perPage: 2) {
            edges {
              role
              node { name { full } }
            }
          }
        }
      }
    }
  `;

  let sort = ['POPULARITY_DESC'];
  if (filters.order_by === 'score') sort = ['SCORE_DESC'];
  if (filters.order_by === 'title') sort = ['TITLE_ROMAJI'];
  if (filters.order_by === 'start_date') sort = ['START_DATE_DESC'];

  const genreParam = filters.genre || filters.genres;
  const rawGenre = genreParam ? genreParam.split(',')[0].trim() : undefined;
  const resolvedGenre = rawGenre ? resolveGenreName(rawGenre) : undefined;

  const data = await queryAniList(query, {
    search: searchQuery && searchQuery.trim() ? searchQuery.trim() : undefined,
    page,
    perPage,
    sort,
    genre: resolvedGenre || undefined,
    isAdult
  });

  const mediaList = data?.Page?.media || [];

  const mangaList = await Promise.all(
    mediaList.map(async (item) => {
      const mangaData = transformMangaData(item);
      return await Manga.findOneAndUpdate(
        { malId: mangaData.malId },
        mangaData,
        { upsert: true, new: true }
      );
    })
  );

  return {
    data: mangaList,
    pagination: {
      last_visible_page: data?.Page?.pageInfo?.lastPage || 1,
      has_next_page: data?.Page?.pageInfo?.hasNextPage || false,
      current_page: data?.Page?.pageInfo?.currentPage || page
    }
  };
};

const getTopManga = async (page = 1, limit = 25) => {
  const parsedPage = Math.max(parseInt(page) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit) || 25, 1), 50);

  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          currentPage
          hasNextPage
          lastPage
        }
        media(type: MANGA, isAdult: false, sort: SCORE_DESC) {
          id
          idMal
          title { romaji english native }
          description(asHtml: false)
          coverImage { large extraLarge }
          chapters
          volumes
          status
          format
          startDate { year month day }
          averageScore
          popularity
          genres
          staff(perPage: 2) {
            edges {
              role
              node { name { full } }
            }
          }
        }
      }
    }
  `;

  const data = await queryAniList(query, { page: parsedPage, perPage: parsedLimit });
  const mediaList = data?.Page?.media || [];

  const mangaList = await Promise.all(
    mediaList.map(async (item) => {
      const mangaData = transformMangaData(item);
      return await Manga.findOneAndUpdate(
        { malId: mangaData.malId },
        mangaData,
        { upsert: true, new: true }
      );
    })
  );

  return {
    data: mangaList,
    pagination: {
      last_visible_page: data?.Page?.pageInfo?.lastPage || 1,
      has_next_page: data?.Page?.pageInfo?.hasNextPage || false,
      current_page: parsedPage
    }
  };
};

const getRandomManga = async () => {
  const randomPage = Math.floor(Math.random() * 10) + 1;
  const result = await getTopManga(randomPage, 10);
  if (result.data && result.data.length > 0) {
    const randomIndex = Math.floor(Math.random() * result.data.length);
    return result.data[randomIndex];
  }
  return null;
};

const getMangaPictures = async (malId) => {
  const manga = await Manga.findOne({ malId: parseInt(malId) });
  if (manga?.imageUrl) {
    return [{ jpg: { image_url: manga.imageUrl, large_image_url: manga.imageUrl } }];
  }
  return [];
};

const getMangaCharacters = async (malId) => {
  return [];
};

const getMangaRecommendations = async (malId) => {
  const numericId = parseInt(malId);
  const current = await Manga.findOne({ malId: numericId });
  if (current && current.genres?.length > 0) {
    const recs = await Manga.find({
      genres: { $in: current.genres },
      malId: { $ne: numericId }
    }).sort({ score: -1 }).limit(10);
    return recs;
  }
  return [];
};

const getHentaiManga = async (page = 1, limit = 25) => {
  const parsedPage = Math.max(parseInt(page) || 1, 1);
  const parsedLimit = Math.min(Math.max(parseInt(limit) || 25, 1), 50);

  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          currentPage
          hasNextPage
          lastPage
        }
        media(genre: "Hentai", type: MANGA, sort: POPULARITY_DESC) {
          id
          idMal
          title { romaji english native }
          description(asHtml: false)
          coverImage { large extraLarge }
          chapters
          volumes
          status
          format
          startDate { year month day }
          averageScore
          popularity
          genres
          staff(perPage: 2) {
            edges {
              role
              node { name { full } }
            }
          }
        }
      }
    }
  `;

  try {
    const data = await queryAniList(query, { page: parsedPage, perPage: parsedLimit });
    const mediaList = data?.Page?.media || [];

    const mangaList = await Promise.all(
      mediaList.map(async (item) => {
        const mangaData = transformMangaData(item);
        if (!mangaData.genres.includes('Hentai')) {
          mangaData.genres.push('Hentai');
        }
        return await Manga.findOneAndUpdate(
          { malId: mangaData.malId },
          mangaData,
          { upsert: true, new: true }
        );
      })
    );

    return {
      data: mangaList,
      pagination: {
        last_visible_page: data?.Page?.pageInfo?.lastPage || 1,
        has_next_page: data?.Page?.pageInfo?.hasNextPage || false,
        current_page: parsedPage
      }
    };
  } catch (err) {
    console.error('Error fetching hentai manga:', err.message);
    return { data: [], pagination: { last_visible_page: 1, has_next_page: false, current_page: parsedPage } };
  }
};

// ==========================================
// CHARACTER API METHODS
// ==========================================

const fetchCharacterById = async (characterId) => {
  const numericId = parseInt(characterId);
  const cached = await Character.findOne({ malId: numericId });
  if (cached) return cached;

  const query = `
    query ($id: Int) {
      Character(id: $id) {
        id
        name { full native alternative }
        image { large }
        description(asHtml: false)
        favourites
        media(type: ANIME, sort: POPULARITY_DESC, perPage: 6) {
          edges {
            characterRole
            node {
              id
              idMal
              title { english romaji }
              coverImage { large extraLarge }
            }
            voiceActors(language: JAPANESE) {
              id
              name { full }
              image { large }
            }
          }
        }
      }
    }
  `;

  try {
    const data = await queryAniList(query, { id: numericId });
    if (!data?.Character) return null;

    const char = data.Character;
    const voiceActors = [];
    char.media?.edges?.forEach(e => {
      e.voiceActors?.forEach(va => {
        if (!voiceActors.some(v => v.name === va.name?.full)) {
          voiceActors.push({
            malId: va.id,
            name: va.name?.full,
            imageUrl: va.image?.large,
            language: 'Japanese'
          });
        }
      });
    });

    const newChar = {
      malId: char.id,
      name: char.name?.full || char.name?.native,
      nameKanji: char.name?.native,
      nicknames: char.name?.alternative || [],
      about: char.description ? char.description.replace(/<[^>]*>?/gm, '') : '',
      imageUrl: char.image?.large,
      favorites: char.favourites || 0,
      animeAppearances: char.media?.edges?.map(e => ({
        malId: e.node?.idMal || e.node?.id,
        title: e.node?.title?.english || e.node?.title?.romaji,
        imageUrl: e.node?.coverImage?.extraLarge || e.node?.coverImage?.large || '',
        role: e.characterRole === 'MAIN' ? 'Main' : 'Supporting'
      })) || [],
      voiceActors,
      lastUpdated: Date.now()
    };

    return await Character.findOneAndUpdate(
      { malId: newChar.malId },
      newChar,
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error(`Error fetching character ${characterId}:`, err.message);
    return null;
  }
};

const getCharacterPictures = async (characterId) => {
  const char = await Character.findOne({ malId: parseInt(characterId) });
  if (char?.imageUrl) {
    return [{ jpg: { image_url: char.imageUrl } }];
  }
  return [];
};

// ==========================================
// SYNC CURRENTLY AIRING ANIME
// ==========================================

const syncCurrentlyAiring = async (targetPages = 2) => {
  const query = `
    query ($page: Int, $perPage: Int) {
      Page(page: $page, perPage: $perPage) {
        pageInfo {
          currentPage
          hasNextPage
        }
        media(type: ANIME, status: RELEASING, sort: POPULARITY_DESC) {
          id
          idMal
          title { romaji english native }
          description(asHtml: false)
          coverImage { large extraLarge }
          episodes
          duration
          status
          format
          startDate { year month day }
          season
          seasonYear
          averageScore
          popularity
          genres
          nextAiringEpisode { episode timeUntilAiring airingAt }
          studios(isMain: true) { nodes { name } }
        }
      }
    }
  `;

  let updatedCount = 0;
  for (let page = 1; page <= targetPages; page++) {
    const data = await queryAniList(query, { page, perPage: 25 });
    const mediaList = data?.Page?.media || [];
    if (mediaList.length === 0) break;

    for (const item of mediaList) {
      const animeData = transformAnimeData(item);
      if (item.nextAiringEpisode?.episode && item.nextAiringEpisode.episode > 1) {
        animeData.episodes = item.nextAiringEpisode.episode - 1;
      }
      await Anime.findOneAndUpdate(
        { malId: animeData.malId },
        { $set: animeData },
        { upsert: true, new: true }
      );
      updatedCount++;
    }

    if (!data?.Page?.pageInfo?.hasNextPage) break;
  }

  return { updatedCount };
};

module.exports = {
  // Anime
  fetchAnimeById,
  searchAnime,
  getTopAnime,
  getSeasonalAnime,
  getRandomAnime,
  getAnimeCharacters,
  getAnimeStaff,
  getAnimePictures,
  getAnimeEpisodes,
  getAnimeRecommendations,
  getAnimeReviews,
  getHentaiAnime,
  syncCurrentlyAiring,

  // Manga
  fetchMangaById,
  searchManga,
  getTopManga,
  getRandomManga,
  getMangaPictures,
  getMangaCharacters,
  getMangaRecommendations,
  getHentaiManga,

  // Character
  fetchCharacterById,
  getCharacterPictures
};

