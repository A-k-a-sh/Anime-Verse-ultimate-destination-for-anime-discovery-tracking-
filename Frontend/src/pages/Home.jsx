import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { animeService } from '../services/animeService';
import { mangaService } from '../services/mangaService';
import { watchStorage } from '../utils/watchStorage';
import { readStorage } from '../utils/readStorage';
import {
  PlayIcon,
  StarIcon,
  CalendarIcon,
  ClockIcon,
  FireIcon,
  TvIcon,
  BookOpenIcon,
  SparklesIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/solid';

const GENRE_CHIPS = [
  { name: 'Action', emoji: '⚔️' },
  { name: 'Fantasy', emoji: '🪄' },
  { name: 'Romance', emoji: '🌸' },
  { name: 'Supernatural', emoji: '👁️' },
  { name: 'Comedy', emoji: '🤣' },
  { name: 'Sci-Fi', emoji: '🚀' },
  { name: 'Drama', emoji: '🎭' },
  { name: 'Adventure', emoji: '🗺️' },
  { name: 'Mystery', emoji: '🔍' },
  { name: 'Sports', emoji: '⚽' },
  { name: 'Slice of Life', emoji: '🍰' },
];

const isNotAdult = (item) => {
  if (!item) return false;
  const genres = item.genres || [];
  const genreNames = genres.map((g) => (typeof g === 'string' ? g : g?.name || g?.title || '').toLowerCase());
  if (genreNames.some((g) => g.includes('hentai') || g.includes('erotica'))) return false;
  if (typeof item.rating === 'string' && (item.rating.includes('Rx') || item.rating.toLowerCase().includes('hentai'))) return false;
  return true;
};

const cleanSynopsis = (text, maxLength = 140) => {
  if (!text) return 'No synopsis available.';
  const stripped = text.replace(/<[^>]*>?/gm, '').trim();
  if (stripped.length <= maxLength) return stripped;
  return stripped.slice(0, maxLength).trim() + '...';
};

const Home = () => {
  // Core Data States
  const [spotlightAnime, setSpotlightAnime] = useState([]);
  const [currentSpotlight, setCurrentSpotlight] = useState(0);
  const [isSpotlightPaused, setIsSpotlightPaused] = useState(false);
  const [trendingAnime, setTrendingAnime] = useState([]);
  const [latestAnime, setLatestAnime] = useState([]);
  const [topAnime, setTopAnime] = useState([]);
  const [trendingManga, setTrendingManga] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingManga, setLoadingManga] = useState(true);

  // Continue Watching State (Local Storage)
  const [continueWatchingList, setContinueWatchingList] = useState([]);
  // Continue Reading State (Local Storage)
  const [continueReadingList, setContinueReadingList] = useState([]);

  // Active Tab for Discovery Shelf
  const [activeTab, setActiveTab] = useState('airing'); // 'airing' | 'trending' | 'top'

  // Fetch Watch & Read History on Mount
  useEffect(() => {
    const history = watchStorage.getHistory();
    setContinueWatchingList(history);

    const mangaHistory = readStorage.getHistory();
    setContinueReadingList(mangaHistory);
  }, []);

  const handleRemoveHistory = (e, malId) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = watchStorage.removeFromHistory(malId);
    setContinueWatchingList(updated);
  };

  const handleClearHistory = () => {
    watchStorage.clearHistory();
    setContinueWatchingList([]);
  };

  const handleRemoveReadHistory = (e, malId) => {
    e.preventDefault();
    e.stopPropagation();
    const updated = readStorage.removeFromHistory(malId);
    setContinueReadingList(updated);
  };

  const handleClearReadHistory = () => {
    readStorage.clearHistory();
    setContinueReadingList([]);
  };

  // Fetch Anime Data (Cached)
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);

        // Fetch spotlight anime (top 5 for slider)
        const spotlightResponse = await animeService.getTopAnime({ limit: 5 });
        if (spotlightResponse.success && spotlightResponse.data) {
          setSpotlightAnime(spotlightResponse.data.filter(isNotAdult));
        }

        // Fetch trending anime (top 10 for sidebar)
        const trendingResponse = await animeService.getTopAnime({ limit: 10, page: 2 });
        if (trendingResponse.success && trendingResponse.data) {
          setTrendingAnime(trendingResponse.data.filter(isNotAdult));
        }

        // Fetch latest anime (currently airing)
        const latestResponse = await animeService.search('', {
          status: 'airing',
          order_by: 'start_date',
          sort: 'desc',
          limit: 18,
        });
        if (latestResponse.success && latestResponse.data) {
          setLatestAnime(latestResponse.data.filter(isNotAdult));
        }

        // Fetch top rated for grid
        const topResponse = await animeService.getTopAnime({ limit: 30 });
        if (topResponse.success && topResponse.data) {
          setTopAnime(topResponse.data.filter(isNotAdult));
        }
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Fetch Manga Shelf Data (Non-blocking)
  useEffect(() => {
    const fetchManga = async () => {
      try {
        setLoadingManga(true);
        const res = await mangaService.getTop({ limit: 12 });
        if (res?.success && Array.isArray(res.data)) {
          setTrendingManga(res.data.filter(isNotAdult));
        }
      } catch (err) {
        console.warn('Could not load trending manga for home:', err);
      } finally {
        setLoadingManga(false);
      }
    };

    fetchManga();
  }, []);

  // Spotlight Auto-Rotation (every 6 seconds, pauses on hover)
  useEffect(() => {
    if (spotlightAnime.length === 0 || isSpotlightPaused) return;
    const interval = setInterval(() => {
      setCurrentSpotlight((prev) => (prev + 1) % spotlightAnime.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [spotlightAnime.length, isSpotlightPaused]);

  const currentAnime = spotlightAnime[currentSpotlight] || {};
  const currentBanner = currentAnime.bannerImage || currentAnime.imageUrl;

  // Active Tab Data Selector
  const activeShelfData = useMemo(() => {
    if (activeTab === 'airing') return latestAnime.slice(0, 12);
    if (activeTab === 'trending') return trendingAnime.slice(0, 12);
    return topAnime.slice(0, 12);
  }, [activeTab, latestAnime, trendingAnime, topAnime]);

  const activeTabLink = useMemo(() => {
    if (activeTab === 'airing') return '/browse?status=airing';
    if (activeTab === 'trending') return '/browse?sort=popularity_desc';
    return '/browse?sort=score_desc';
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm font-medium animate-pulse">Loading Anime Multiverse...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-100 text-white pb-20 selection:bg-primary selection:text-white">
      {/* =========================================================================
          1. SPOTLIGHT SLIDER & TOP TRENDING SIDEBAR
      ========================================================================= */}
      <div className="relative bg-gradient-to-b from-dark-200 to-dark-100 border-b border-white/5 pt-4 pb-8 overflow-hidden">
        {/* Subtle Ambient Color Glow */}
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Main Spotlight Slider (Span 8) */}
            <div className="lg:col-span-8">
              {spotlightAnime.length > 0 && (
                <div
                  onMouseEnter={() => setIsSpotlightPaused(true)}
                  onMouseLeave={() => setIsSpotlightPaused(false)}
                  className="relative aspect-[16/9] sm:aspect-[21/9] lg:aspect-[16/9] rounded-2xl overflow-hidden group shadow-2xl border border-white/10"
                >
                  {/* Background Banner with Crossfade Transition */}
                  <AnimatePresence initial={false}>
                    <motion.div
                      key={`banner-${currentAnime.malId || currentSpotlight}`}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.7, ease: [0.25, 0.1, 0.25, 1] }}
                      className="absolute inset-0 bg-cover bg-center filter brightness-90 group-hover:brightness-100"
                      style={{ backgroundImage: `url(${currentBanner})` }}
                    >
                      {/* Gradients for text legibility */}
                      <div className="absolute inset-0 bg-gradient-to-t from-dark-100 via-dark-100/70 to-transparent pointer-events-none" />
                      <div className="absolute inset-0 bg-gradient-to-r from-dark-100/90 via-dark-100/40 to-transparent pointer-events-none" />
                    </motion.div>
                  </AnimatePresence>

                  {/* Slide Content with Smooth Transition */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`content-${currentAnime.malId || currentSpotlight}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className="relative h-full flex flex-col justify-end p-5 sm:p-8 z-10 pointer-events-auto"
                    >
                      {/* Badges Row */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="bg-primary text-white text-xs font-black uppercase px-2.5 py-1 rounded-md shadow-md">
                          #{currentSpotlight + 1} Spotlight
                        </span>

                        {currentAnime.score && (
                          <span className="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1 backdrop-blur-md">
                            <StarIcon className="w-3.5 h-3.5 fill-yellow-400" />
                            <span>{Number(currentAnime.score).toFixed(1)}</span>
                          </span>
                        )}

                        <span className="bg-white/10 text-gray-200 text-xs font-bold px-2 py-0.5 rounded-md backdrop-blur-md">
                          SUB • DUB
                        </span>

                        {currentAnime.type && (
                          <span className="bg-white/10 text-gray-300 text-xs px-2 py-0.5 rounded-md backdrop-blur-md hidden sm:inline">
                            {currentAnime.type}
                          </span>
                        )}
                      </div>

                      {/* Anime Title */}
                      <h2 className="text-2xl sm:text-4xl font-display font-black text-white mb-2 line-clamp-1 sm:line-clamp-2 max-w-xl drop-shadow-lg">
                        {currentAnime.title || currentAnime.titleEnglish}
                      </h2>

                      {/* Metadata Strip */}
                      <div className="flex flex-wrap items-center gap-3 mb-2.5 text-xs text-gray-300">
                        {currentAnime.duration && (
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-3.5 h-3.5 text-primary" />
                            <span>{currentAnime.duration}</span>
                          </span>
                        )}
                        {currentAnime.year && (
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3.5 h-3.5 text-primary" />
                            <span>{currentAnime.year}</span>
                          </span>
                        )}
                        {currentAnime.episodes && (
                          <span className="flex items-center gap-1">
                            <TvIcon className="w-3.5 h-3.5 text-primary" />
                            <span>{currentAnime.episodes} Episodes</span>
                          </span>
                        )}
                      </div>

                      {/* Genres Pills */}
                      {currentAnime.genres && currentAnime.genres.length > 0 && (
                        <div className="hidden sm:flex flex-wrap gap-1.5 mb-3">
                          {currentAnime.genres.slice(0, 3).map((g, idx) => {
                            const name = typeof g === 'string' ? g : g?.name;
                            return (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded bg-dark-100/80 border border-white/10 text-[11px] text-gray-300 font-medium"
                              >
                                {name}
                              </span>
                            );
                          })}
                        </div>
                      )}

                      {/* Synopsis (Clamped and Cleaned) */}
                      <p className="text-gray-300 text-xs sm:text-sm mb-5 line-clamp-2 max-w-xl leading-relaxed drop-shadow hidden sm:block overflow-hidden">
                        {cleanSynopsis(currentAnime.synopsis, 130)}
                      </p>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <Link
                          to={`/watch/${currentAnime.malId}/1`}
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-secondary hover:shadow-[0_0_25px_rgba(230,57,70,0.6)] text-white px-5 sm:px-7 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg"
                        >
                          <PlayIcon className="w-4 h-4 fill-white" />
                          <span>Watch Now</span>
                        </Link>
                        <Link
                          to={`/anime/${currentAnime.malId}`}
                          className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl font-semibold text-xs sm:text-sm backdrop-blur-md border border-white/15 transition-all"
                        >
                          <span>Details</span>
                        </Link>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Prev / Next Arrows */}
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentSpotlight((prev) => (prev - 1 + spotlightAnime.length) % spotlightAnime.length)
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer shadow-lg"
                    aria-label="Previous Spotlight"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentSpotlight((prev) => (prev + 1) % spotlightAnime.length)
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/90 text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity z-20 cursor-pointer shadow-lg"
                    aria-label="Next Spotlight"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>

                  {/* Bottom Navigation Indicators */}
                  <div className="absolute bottom-4 right-4 flex items-center gap-2 z-20">
                    {spotlightAnime.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentSpotlight(idx)}
                        className={`h-1.5 rounded-full transition-all cursor-pointer ${
                          idx === currentSpotlight ? 'w-6 bg-primary shadow-sm' : 'w-1.5 bg-white/40 hover:bg-white/70'
                        }`}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Trending Top 10 Sidebar (Span 4) */}
            <div className="lg:col-span-4 bg-dark-200/90 rounded-2xl p-4 sm:p-5 border border-white/10 shadow-2xl flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <FireIcon className="w-5 h-5 text-primary fill-primary" />
                  <span>Top 10 Trending</span>
                </h3>
                <span className="text-[11px] font-semibold text-gray-400">Live Ranks</span>
              </div>

              {/* Scrollable List */}
              <div className="space-y-2.5 max-h-[380px] sm:max-h-[460px] overflow-y-auto scrollbar-thin pr-1">
                {trendingAnime.slice(0, 10).map((anime, index) => {
                  const isTop3 = index < 3;
                  const rankColors = [
                    'bg-yellow-500 text-black',
                    'bg-gray-300 text-black',
                    'bg-amber-600 text-white',
                  ];

                  return (
                    <Link
                      key={anime.malId}
                      to={`/anime/${anime.malId}`}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-all duration-200 group border border-transparent hover:border-white/5"
                    >
                      {/* Rank Number */}
                      <span
                        className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center shrink-0 shadow-sm ${
                          isTop3 ? rankColors[index] : 'bg-dark-100 text-gray-400'
                        }`}
                      >
                        {index + 1}
                      </span>

                      {/* Poster Thumbnail */}
                      <img
                        src={anime.imageUrl}
                        alt={anime.title}
                        className="w-12 h-16 object-cover rounded-lg shrink-0 shadow group-hover:scale-105 transition-transform"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold text-xs sm:text-sm truncate group-hover:text-primary transition-colors">
                          {anime.title || anime.titleEnglish}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                          {anime.score && (
                            <span className="flex items-center gap-0.5 text-yellow-400 font-bold">
                              <StarIcon className="w-3 h-3 fill-yellow-400" />
                              <span>{Number(anime.score).toFixed(1)}</span>
                            </span>
                          )}
                          <span>•</span>
                          <span>{anime.type || 'TV'}</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. QUICK GENRE DISCOVERY CHIPS BAR
      ========================================================================= */}
      <div className="py-4 border-b border-white/5 bg-dark-200/40">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
              Genres:
            </span>
            {GENRE_CHIPS.map((chip) => (
              <Link
                key={chip.name}
                to={`/browse?genre=${encodeURIComponent(chip.name)}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-100 hover:bg-primary/20 text-gray-300 hover:text-white border border-white/5 hover:border-primary/40 text-xs font-semibold shrink-0 transition-all hover:scale-105 shadow-sm"
              >
                <span>{chip.emoji}</span>
                <span>{chip.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8 space-y-12">
        {/* =========================================================================
            3. "CONTINUE WATCHING" SHELF (0 Backend Calls - Pure Local Storage)
        ========================================================================= */}
        {continueWatchingList.length > 0 && (
          <section className="bg-dark-200/50 rounded-2xl p-5 sm:p-6 border border-white/10 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-primary/20 text-primary">
                  <PlayIcon className="w-4 h-4 fill-primary" />
                </span>
                <h2 className="text-lg sm:text-xl font-bold text-white">Continue Watching</h2>
                <span className="text-xs text-gray-400 font-medium">({continueWatchingList.length})</span>
              </div>
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors font-medium cursor-pointer"
              >
                Clear History
              </button>
            </div>

            {/* Horizontal Scroll Cards */}
            <div className="flex gap-4 overflow-x-auto scrollbar-thin pb-2">
              {continueWatchingList.map((item) => (
                <div
                  key={item.malId}
                  className="group relative w-44 sm:w-52 shrink-0 bg-dark-100 rounded-xl overflow-hidden border border-white/10 hover:border-primary/50 transition-all duration-300 shadow-lg flex flex-col justify-between"
                >
                  <Link to={`/watch/${item.malId}/${item.episode}`} className="block relative aspect-[16/10] overflow-hidden bg-dark-300">
                    <img
                      src={item.imageUrl || 'https://via.placeholder.com/300x180?text=No+Cover'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
                        <PlayIcon className="w-5 h-5 ml-0.5 fill-white" />
                      </div>
                    </div>

                    {/* Episode Tag */}
                    <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-bold text-white border border-white/10">
                      Ep {item.episode}{item.totalEpisodes ? ` / ${item.totalEpisodes}` : ''}
                    </div>

                    {/* Remove from history button */}
                    <button
                      type="button"
                      onClick={(e) => handleRemoveHistory(e, item.malId)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/70 hover:bg-red-500 text-white transition-colors cursor-pointer"
                      title="Remove from history"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  </Link>

                  <div className="p-3">
                    <Link
                      to={`/watch/${item.malId}/${item.episode}`}
                      className="text-xs font-bold text-white truncate block hover:text-primary transition-colors"
                      title={item.title}
                    >
                      {item.title}
                    </Link>
                    <Link
                      to={`/watch/${item.malId}/${item.episode}`}
                      className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      <span>Resume Episode {item.episode}</span>
                      <ArrowRightIcon className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =========================================================================
            4. INTERACTIVE MULTI-TAB DISCOVERY SHELF (AIRING / TRENDING / TOP)
        ========================================================================= */}
        <section>
          {/* Shelf Header & Tab Switcher */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-primary/20 text-primary">
                <SparklesIcon className="w-5 h-5 text-primary" />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-white">Explore Anime</h2>
            </div>

            {/* Interactive Tab Switcher */}
            <div className="flex items-center gap-2">
              <div className="inline-flex p-1 rounded-xl bg-dark-200 border border-white/10 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setActiveTab('airing')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'airing'
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  📺 Airing
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('trending')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'trending'
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  🔥 Trending
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('top')}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    activeTab === 'top'
                      ? 'bg-primary text-white shadow-md'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  ⭐ Top Rated
                </button>
              </div>

              <Link
                to={activeTabLink}
                className="text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-colors ml-2 hidden sm:inline"
              >
                View All →
              </Link>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {activeShelfData.map((anime, index) => (
              <Link
                key={anime.malId || index}
                to={`/anime/${anime.malId}`}
                className="group relative bg-dark-200/80 rounded-xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 flex flex-col justify-between"
              >
                <div className="relative aspect-[2/3] overflow-hidden bg-dark-300">
                  <img
                    src={anime.imageUrl}
                    alt={anime.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                      <PlayIcon className="w-5 h-5 ml-0.5 fill-white" />
                    </div>
                  </div>

                  {/* Score */}
                  {anime.score && (
                    <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-bold text-yellow-400 border border-white/10 flex items-center gap-0.5">
                      <StarIcon className="w-3 h-3 fill-yellow-400" />
                      <span>{Number(anime.score).toFixed(1)}</span>
                    </div>
                  )}

                  {/* Episode Badge */}
                  {anime.episodes && (
                    <div className="absolute bottom-2 left-2 bg-primary px-2 py-0.5 rounded text-white text-[10px] font-extrabold uppercase">
                      EP {anime.episodes}
                    </div>
                  )}
                </div>

                <div className="p-2.5">
                  <h3 className="text-xs font-semibold text-white truncate group-hover:text-primary transition-colors">
                    {anime.title || anime.titleEnglish}
                  </h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {anime.type || 'TV'} {anime.year ? `• ${anime.year}` : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* =========================================================================
            4.5 CONTINUE READING SHELF (Local Storage Reading History)
        ========================================================================= */}
        {continueReadingList.length > 0 && (
          <section className="bg-gradient-to-r from-dark-200/80 via-dark-200/50 to-dark-100 rounded-2xl p-5 sm:p-6 border border-purple-500/20 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/5">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400">
                  <BookOpenIcon className="w-5 h-5" />
                </span>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">Continue Reading</h2>
                  <p className="text-xs text-gray-400">Jump right back into your chapters</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleClearReadHistory}
                className="text-xs text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
              >
                Clear History
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-2 custom-scrollbar">
              {continueReadingList.map((item) => (
                <div
                  key={item.malId}
                  className="group relative w-40 sm:w-48 shrink-0 bg-dark-100 rounded-xl overflow-hidden border border-white/10 hover:border-purple-500/50 transition-all duration-300 shadow-lg flex flex-col justify-between"
                >
                  <Link to={`/read/${item.malId}/${item.chapter}`} className="block relative aspect-[2/3] overflow-hidden bg-dark-300">
                    <img
                      src={item.imageUrl || 'https://via.placeholder.com/200x300?text=No+Cover'}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-lg">
                        <BookOpenIcon className="w-5 h-5" />
                      </div>
                    </div>

                    <div className="absolute bottom-2 left-2 bg-black/80 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-bold text-white border border-white/10">
                      Ch {item.chapter}{item.totalChapters ? ` / ${item.totalChapters}` : ''}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleRemoveReadHistory(e, item.malId)}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/70 hover:bg-red-500 text-white transition-colors cursor-pointer"
                      title="Remove from history"
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  </Link>

                  <div className="p-3">
                    <Link
                      to={`/read/${item.malId}/${item.chapter}`}
                      className="text-xs font-bold text-white truncate block hover:text-purple-400 transition-colors"
                      title={item.title}
                    >
                      {item.title}
                    </Link>
                    <Link
                      to={`/read/${item.malId}/${item.chapter}`}
                      className="inline-flex items-center gap-1 mt-2 text-[11px] font-semibold text-purple-400 hover:text-purple-300 transition-colors"
                    >
                      <span>Resume Ch {item.chapter}</span>
                      <ArrowRightIcon className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* =========================================================================
            5. TRENDING MANGA & WEBTOONS SHELF (Bridges Anime & Manga into Home)
        ========================================================================= */}
        <section className="bg-gradient-to-b from-dark-200/60 to-dark-100 rounded-2xl p-5 sm:p-6 border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-purple-500/20 text-purple-400">
                <BookOpenIcon className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">Trending Manga & Webtoons</h2>
                <p className="text-xs text-gray-400">Read top-rated series with zero intrusive popups</p>
              </div>
            </div>
            <Link
              to="/manga"
              className="text-xs sm:text-sm font-semibold text-purple-400 hover:text-purple-300 transition-colors"
            >
              Explore Manga Library →
            </Link>
          </div>

          {loadingManga ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[2/3] bg-dark-300 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {trendingManga.slice(0, 6).map((manga) => (
                <Link
                  key={manga.malId}
                  to={`/manga/${manga.malId}`}
                  className="group relative bg-dark-200/80 rounded-xl overflow-hidden border border-white/5 hover:border-purple-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 flex flex-col justify-between"
                >
                  <div className="relative aspect-[2/3] overflow-hidden bg-dark-300">
                    <img
                      src={manga.imageUrl}
                      alt={manga.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Score */}
                    {manga.score && (
                      <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-bold text-yellow-400 border border-white/10 flex items-center gap-0.5">
                        <StarIcon className="w-3 h-3 fill-yellow-400" />
                        <span>{Number(manga.score).toFixed(1)}</span>
                      </div>
                    )}

                    {/* Chapters badge */}
                    {manga.chapters && (
                      <div className="absolute bottom-2 left-2 bg-purple-600 px-2 py-0.5 rounded text-white text-[10px] font-extrabold uppercase">
                        {manga.chapters} CH
                      </div>
                    )}
                  </div>

                  <div className="p-2.5">
                    <h3 className="text-xs font-semibold text-white truncate group-hover:text-purple-400 transition-colors">
                      {manga.title || manga.titleEnglish}
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {manga.type || 'Manga'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* =========================================================================
            6. TOP RATED ALL-TIME GRID
        ========================================================================= */}
        {topAnime.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-lg bg-yellow-500/20 text-yellow-400">
                  <StarIcon className="w-5 h-5 fill-yellow-400" />
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white">All-Time Top Anime</h2>
              </div>
              <Link to="/anime/top" className="text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                View Full Top 100 →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {topAnime.slice(0, 18).map((anime, index) => (
                <Link
                  key={anime.malId}
                  to={`/anime/${anime.malId}`}
                  className="group relative bg-dark-200/80 rounded-xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 flex flex-col justify-between"
                >
                  <div className="relative aspect-[2/3] overflow-hidden bg-dark-300">
                    <img
                      src={anime.imageUrl}
                      alt={anime.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Rank Number */}
                    <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-0.5 rounded text-[11px] font-black">
                      #{index + 1}
                    </div>

                    {/* Score */}
                    {anime.score && (
                      <div className="absolute top-2 right-2 bg-black/75 backdrop-blur-sm px-2 py-0.5 rounded text-[11px] font-bold text-yellow-400 border border-white/10 flex items-center gap-0.5">
                        <StarIcon className="w-3 h-3 fill-yellow-400" />
                        <span>{Number(anime.score).toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  <div className="p-2.5">
                    <h3 className="text-xs font-semibold text-white truncate group-hover:text-primary transition-colors">
                      {anime.title}
                    </h3>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {anime.type} {anime.year ? `• ${anime.year}` : ''}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Home;
