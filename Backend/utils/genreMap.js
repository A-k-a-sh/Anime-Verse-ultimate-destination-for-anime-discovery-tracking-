// Mapping of legacy MyAnimeList numeric genre IDs to standard genre names
const MAL_GENRE_MAP = {
  1: 'Action',
  2: 'Adventure',
  3: 'Racing',
  4: 'Comedy',
  5: 'Avante Garde',
  6: 'Mythology',
  7: 'Mystery',
  8: 'Drama',
  9: 'Ecchi',
  10: 'Fantasy',
  11: 'Strategy Game',
  12: 'Hentai',
  13: 'Historical',
  14: 'Horror',
  15: 'Kids',
  16: 'Martial Arts',
  17: 'Mecha',
  18: 'Music',
  19: 'Parody',
  20: 'Samurai',
  21: 'Romance',
  22: 'Romance',
  23: 'School',
  24: 'Sci-Fi',
  25: 'Shoujo',
  26: 'Girls Love',
  27: 'Shounen',
  28: 'Boys Love',
  29: 'Space',
  30: 'Sports',
  31: 'Super Power',
  32: 'Vampire',
  33: 'Harem',
  35: 'Harem',
  36: 'Slice of Life',
  37: 'Supernatural',
  38: 'Military',
  39: 'Detective',
  40: 'Psychological',
  41: 'Suspense',
  42: 'Seinen',
  43: 'Josei',
  46: 'Award Winning',
  47: 'Gourmet',
  48: 'Workplace',
  49: 'Erotica'
};

/**
 * Resolves a genre parameter (either numeric ID like "2" or name like "Adventure")
 * to its standard textual genre name.
 */
const resolveGenreName = (genre) => {
  if (!genre) return '';
  const trimmed = String(genre).trim();
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && MAL_GENRE_MAP[num]) {
    return MAL_GENRE_MAP[num];
  }
  return trimmed;
};

module.exports = {
  MAL_GENRE_MAP,
  resolveGenreName
};

