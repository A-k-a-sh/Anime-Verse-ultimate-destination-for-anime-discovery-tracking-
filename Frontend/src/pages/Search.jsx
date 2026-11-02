import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { animeService } from '../services/animeService';
import { mangaService } from '../services/mangaService';
import AnimeGrid from '../components/AnimeGrid';
import Loader from '../components/Loader';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  FireIcon,
  ClockIcon,
  AdjustmentsHorizontalIcon,
  SparklesIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { POPULAR_GENRES } from '../constants/genres';

const RECENT_SEARCHES_KEY = 'animeverse_recent_searches';

const TRENDING_SEARCHES = [
  'Solo Leveling',
  'Jujutsu Kaisen',
  'Demon Slayer',
  'Frieren',
  'Chainsaw Man',
  'One Piece',
  'Bleach',
  'Attack on Titan',
  'DanDaDan',
  'Blue Lock',
];

const getStoredRecentSearches = () => {
  try {
    const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const storeRecentSearch = (term) => {
  if (!term || !term.trim()) return;
  const clean = term.trim();
  try {
    const existing = getStoredRecentSearches().filter((t) => t.toLowerCase() !== clean.toLowerCase());
    const updated = [clean, ...existing].slice(0, 8);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Could not save recent search:', err);
  }
};

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const navigate = useNavigate();

  // Dynamic Browser Tab Title
  useDocumentTitle(query ? `Search results for "${query}"` : 'Search & Discovery Hub');

  // Search Input State for in-page searching
  const [searchInput, setSearchInput] = useState(query);
  const [recentSearches, setRecentSearches] = useState(getStoredRecentSearches());

  // Active Tab: 'anime' | 'manga'
  const [activeTab, setActiveTab] = useState('anime');
  const [initialLoading, setInitialLoading] = useState(false);

  // In-Page Filter States
  const [showFilterBar, setShowFilterBar] = useState(false);
  const [sortBy, setSortBy] = useState('popularity'); // 'popularity' | 'score' | 'start_date' | 'title'
  const [formatFilter, setFormatFilter] = useState(''); // '' | 'tv' | 'movie' | 'ova' (or manga types)
  const [statusFilter, setStatusFilter] = useState(''); // '' | 'airing' | 'complete'

  // Anime Pagination States
  const [animeResults, setAnimeResults] = useState([]);
  const [animePage, setAnimePage] = useState(1);
  const [animeHasNextPage, setAnimeHasNextPage] = useState(false);
  const [animeTotal, setAnimeTotal] = useState(0);
  const [loadingAnimeMore, setLoadingAnimeMore] = useState(false);

  // Manga Pagination States
  const [mangaResults, setMangaResults] = useState([]);
  const [mangaPage, setMangaPage] = useState(1);
  const [mangaHasNextPage, setMangaHasNextPage] = useState(false);
  const [mangaTotal, setMangaTotal] = useState(0);
  const [loadingMangaMore, setLoadingMangaMore] = useState(false);

  // Sync search input when URL query changes
  useEffect(() => {
    setSearchInput(query);
    if (query) {
      storeRecentSearch(query);
      setRecentSearches(getStoredRecentSearches());
    }
  }, [query]);

  // Execute Search query when query or in-page filters change
  useEffect(() => {
    if (!query) {
      setAnimeResults([]);
      setMangaResults([]);
      return;
    }

    const fetchSearchResults = async () => {
      try {
        setInitialLoading(true);
        setAnimePage(1);
        setMangaPage(1);

        const animeFilters = {
          page: 1,
          limit: 24,
          order_by: sortBy,
          type: formatFilter,
          status: statusFilter,
        };

        const mangaFilters = {
          page: 1,
          limit: 24,
          order_by: sortBy,
          type: formatFilter,
          status: statusFilter,
        };

        const [animeRes, mangaRes] = await Promise.all([
          animeService.search(query, animeFilters),
          mangaService.search(query, mangaFilters),
        ]);

        // Process Anime Results
        if (animeRes?.success && Array.isArray(animeRes.data)) {
          setAnimeResults(animeRes.data);
          setAnimeHasNextPage(Boolean(animeRes.pagination?.has_next_page));
          setAnimeTotal(animeRes.pagination?.total_items || animeRes.data.length);
        } else {
          setAnimeResults([]);
          setAnimeHasNextPage(false);
          setAnimeTotal(0);
        }

        // Process Manga Results
        if (mangaRes?.success && Array.isArray(mangaRes.data)) {
          setMangaResults(mangaRes.data);
          setMangaHasNextPage(Boolean(mangaRes.pagination?.has_next_page));
          setMangaTotal(mangaRes.pagination?.total_items || mangaRes.data.length);
        } else {
          setMangaResults([]);
          setMangaHasNextPage(false);
          setMangaTotal(0);
        }
      } catch (error) {
        console.error('Error performing search:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchSearchResults();
  }, [query, sortBy, formatFilter, statusFilter]);

  // Handle in-page search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const clean = searchInput.trim();
    if (clean) {
      setSearchParams({ q: clean });
    }
  };

  // Run a tag click search
  const handleTagClick = (tag) => {
    setSearchInput(tag);
    setSearchParams({ q: tag });
  };

  // Remove a single recent search term
  const handleRemoveRecent = (e, term) => {
    e.stopPropagation();
    try {
      const updated = recentSearches.filter((t) => t.toLowerCase() !== term.toLowerCase());
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
    } catch (err) {
      console.warn('Could not remove recent search:', err);
    }
  };

  // Clear all recent searches
  const handleClearAllRecent = () => {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch (err) {
      console.warn('Could not clear all recent searches:', err);
    }
  };

  // Load More Anime (Page Increment with AniList write-through fallback)
  const handleLoadMoreAnime = async () => {
    if (loadingAnimeMore || !animeHasNextPage) return;
    const nextPage = animePage + 1;
    try {
      setLoadingAnimeMore(true);
      const res = await animeService.search(query, {
        page: nextPage,
        limit: 24,
        order_by: sortBy,
        type: formatFilter,
        status: statusFilter,
      });

      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setAnimeResults((prev) => {
          const existingIds = new Set(prev.map((item) => item.malId || item.id));
          const fresh = res.data.filter((item) => !existingIds.has(item.malId || item.id));
          return [...prev, ...fresh];
        });
        setAnimePage(nextPage);
        setAnimeHasNextPage(Boolean(res.pagination?.has_next_page));
      } else {
        setAnimeHasNextPage(false);
      }
    } catch (err) {
      console.error('Error loading more anime:', err);
    } finally {
      setLoadingAnimeMore(false);
    }
  };

  // Load More Manga (Page Increment with AniList write-through fallback)
  const handleLoadMoreManga = async () => {
    if (loadingMangaMore || !mangaHasNextPage) return;
    const nextPage = mangaPage + 1;
    try {
      setLoadingMangaMore(true);
      const res = await mangaService.search(query, {
        page: nextPage,
        limit: 24,
        order_by: sortBy,
        type: formatFilter,
        status: statusFilter,
      });

      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        setMangaResults((prev) => {
          const existingIds = new Set(prev.map((item) => item.malId || item.id));
          const fresh = res.data.filter((item) => !existingIds.has(item.malId || item.id));
          return [...prev, ...fresh];
        });
        setMangaPage(nextPage);
        setMangaHasNextPage(Boolean(res.pagination?.has_next_page));
      } else {
        setMangaHasNextPage(false);
      }
    } catch (err) {
      console.error('Error loading more manga:', err);
    } finally {
      setLoadingMangaMore(false);
    }
  };

  const totalLoaded = animeResults.length + mangaResults.length;

  return (
    <div className="min-h-screen py-8 sm:py-12 bg-dark-100 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* =====================================================================
            1. IN-PAGE HERO SEARCH BAR
        ===================================================================== */}
        <div className="max-w-3xl mx-auto mb-10">
          <form onSubmit={handleSearchSubmit} className="relative group">
            <div className="relative flex items-center">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search anime, manga, characters, genres..."
                className="w-full bg-white/[0.06] hover:bg-white/[0.09] focus:bg-dark-200/90 border border-white/10 hover:border-white/20 focus:border-primary/60 rounded-2xl py-3.5 pl-12 pr-28 text-sm sm:text-base text-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary/20 shadow-xl transition-all duration-200"
              />
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-4 pointer-events-none group-focus-within:text-primary transition-colors" />

              <div className="absolute right-3 flex items-center gap-2">
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      setSearchParams({});
                    }}
                    className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                    title="Clear search"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-md transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                >
                  Search
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* =====================================================================
            2. EMPTY QUERY VIEW: DISCOVERY & TRENDING HUB
        ===================================================================== */}
        {!query && (
          <div className="max-w-4xl mx-auto space-y-10 py-6 animate-fade-in">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-300">
                    <ClockIcon className="w-4 h-4 text-primary" />
                    <span>Recent Searches</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearAllRecent}
                    className="text-xs text-gray-400 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                    <span>Clear History</span>
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((term) => (
                    <div
                      key={term}
                      onClick={() => handleTagClick(term)}
                      className="group/chip inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-primary/40 text-xs font-medium text-gray-200 hover:text-white cursor-pointer transition-all"
                    >
                      <span>{term}</span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveRecent(e, term)}
                        className="text-gray-400 hover:text-red-400 p-0.5 rounded-full"
                        title="Remove term"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Searches */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-300">
                <FireIcon className="w-4 h-4 text-primary fill-primary" />
                <span>Trending Searches</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {TRENDING_SEARCHES.map((title) => (
                  <button
                    key={title}
                    type="button"
                    onClick={() => handleTagClick(title)}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-white/[0.04] to-white/[0.08] hover:from-primary/20 hover:to-secondary/20 border border-white/10 hover:border-primary/50 text-xs sm:text-sm font-semibold text-gray-200 hover:text-white transition-all transform hover:scale-105 active:scale-95 cursor-pointer shadow-sm"
                  >
                    {title}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick Explore by Genre */}
            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-300">
                <SparklesIcon className="w-4 h-4 text-secondary" />
                <span>Explore Popular Genres</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_GENRES.slice(0, 12).map((genre) => (
                  <Link
                    key={genre}
                    to={`/browse?genre=${encodeURIComponent(genre)}`}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 text-xs text-gray-300 hover:text-white transition-colors"
                  >
                    {genre}
                  </Link>
                ))}
              </div>
            </div>

            {/* Surprise Me Banner */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/10 to-transparent border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-base font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                  <span>Don't know what to watch?</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Roll the dice and discover a completely randomized anime or manga gem.
                </p>
              </div>
              <Link
                to="/random"
                className="bg-gradient-to-r from-primary to-secondary text-white text-xs font-bold px-5 py-2.5 rounded-xl shadow-lg hover:shadow-glow-sm transform hover:scale-105 transition-all shrink-0"
              >
                Roll Random Anime 🎲
              </Link>
            </div>
          </div>
        )}

        {/* =====================================================================
            3. ACTIVE QUERY RESULTS VIEW
        ===================================================================== */}
        {query && (
          <div>
            {/* Header & Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
              <div>
                <h2 className="text-2xl sm:text-3xl font-display font-black text-white">
                  Results for <span className="text-gradient">"{query}"</span>
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Loaded {totalLoaded} titles ({animeResults.length} anime, {mangaResults.length} manga)
                </p>
              </div>

              {/* Filter Bar Toggle Button */}
              <button
                type="button"
                onClick={() => setShowFilterBar(!showFilterBar)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                  showFilterBar || formatFilter || statusFilter || sortBy !== 'popularity'
                    ? 'bg-primary/20 text-primary border-primary/40'
                    : 'bg-white/5 text-gray-300 hover:text-white border-white/10'
                }`}
              >
                <AdjustmentsHorizontalIcon className="w-4 h-4" />
                <span>Filters & Sorting</span>
                {(formatFilter || statusFilter || sortBy !== 'popularity') && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            </div>

            {/* Expandable Filter / Sort Bar */}
            {showFilterBar && (
              <div className="mb-8 p-4 rounded-2xl bg-white/[0.03] border border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
                {/* Sort Option */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full bg-dark-200 border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="popularity">Most Popular 🔥</option>
                    <option value="score">Highest Rated ★</option>
                    <option value="start_date">Newest Release 📅</option>
                    <option value="title">Title A-Z 🔤</option>
                  </select>
                </div>

                {/* Format Filter */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Format
                  </label>
                  <select
                    value={formatFilter}
                    onChange={(e) => setFormatFilter(e.target.value)}
                    className="w-full bg-dark-200 border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">All Formats</option>
                    {activeTab === 'anime' ? (
                      <>
                        <option value="tv">TV Series</option>
                        <option value="movie">Movie</option>
                        <option value="ova">OVA</option>
                        <option value="special">Special</option>
                      </>
                    ) : (
                      <>
                        <option value="manga">Manga</option>
                        <option value="novel">Light Novel</option>
                        <option value="manhwa">Manhwa</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Release Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full bg-dark-200 border border-white/10 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-primary cursor-pointer"
                  >
                    <option value="">All Statuses</option>
                    <option value="airing">Airing / Publishing</option>
                    <option value="complete">Completed</option>
                  </select>
                </div>
              </div>
            )}

            {/* Media Tabs */}
            <div className="flex gap-3 mb-8">
              <button
                type="button"
                onClick={() => setActiveTab('anime')}
                className={`pb-2.5 px-4 font-semibold text-sm transition-colors cursor-pointer flex items-center gap-2 border-b-2 ${
                  activeTab === 'anime'
                    ? 'text-primary border-primary font-bold'
                    : 'text-gray-400 hover:text-white border-transparent'
                }`}
              >
                <span>Anime</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-medium">
                  {animeResults.length}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('manga')}
                className={`pb-2.5 px-4 font-semibold text-sm transition-colors cursor-pointer flex items-center gap-2 border-b-2 ${
                  activeTab === 'manga'
                    ? 'text-primary border-primary font-bold'
                    : 'text-gray-400 hover:text-white border-transparent'
                }`}
              >
                <span>Manga</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-medium">
                  {mangaResults.length}
                </span>
              </button>
            </div>

            {/* Loading Indicator */}
            {initialLoading ? (
              <div className="py-20 flex justify-center">
                <Loader />
              </div>
            ) : (
              <>
                {/* Anime Tab Content */}
                {activeTab === 'anime' && (
                  <div>
                    <AnimeGrid anime={animeResults} columns={5} type="anime" />

                    {/* Load More Anime */}
                    {animeHasNextPage && (
                      <div className="mt-10 text-center">
                        <button
                          type="button"
                          onClick={handleLoadMoreAnime}
                          disabled={loadingAnimeMore}
                          className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer inline-flex items-center gap-2 shadow-lg hover:shadow-glow-sm"
                        >
                          {loadingAnimeMore ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Fetching next page...</span>
                            </>
                          ) : (
                            <span>Load More Anime</span>
                          )}
                        </button>
                      </div>
                    )}

                    {!animeHasNextPage && animeResults.length > 0 && (
                      <p className="mt-10 text-center text-xs text-gray-400">
                        You've reached the end of anime results for "{query}".
                      </p>
                    )}
                  </div>
                )}

                {/* Manga Tab Content */}
                {activeTab === 'manga' && (
                  <div>
                    <AnimeGrid anime={mangaResults} columns={5} type="manga" />

                    {/* Load More Manga */}
                    {mangaHasNextPage && (
                      <div className="mt-10 text-center">
                        <button
                          type="button"
                          onClick={handleLoadMoreManga}
                          disabled={loadingMangaMore}
                          className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-bold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer inline-flex items-center gap-2 shadow-lg hover:shadow-glow-sm"
                        >
                          {loadingMangaMore ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Fetching next page...</span>
                            </>
                          ) : (
                            <span>Load More Manga</span>
                          )}
                        </button>
                      </div>
                    )}

                    {!mangaHasNextPage && mangaResults.length > 0 && (
                      <p className="mt-10 text-center text-xs text-gray-400">
                        You've reached the end of manga results for "{query}".
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
