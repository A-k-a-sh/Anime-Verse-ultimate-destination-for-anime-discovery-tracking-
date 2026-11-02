import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { animeService } from '../services/animeService';
import { mangaService } from '../services/mangaService';
import AnimeGrid from '../components/AnimeGrid';
import Loader from '../components/Loader';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  // Dynamic Browser Tab Title
  useDocumentTitle(query ? `Search results for "${query}"` : 'Search Anime & Manga');

  const [activeTab, setActiveTab] = useState('anime'); // 'anime' | 'manga'
  const [initialLoading, setInitialLoading] = useState(false);

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

  // Initial Search when query changes
  useEffect(() => {
    if (!query) {
      setAnimeResults([]);
      setMangaResults([]);
      return;
    }

    const fetchInitialResults = async () => {
      try {
        setInitialLoading(true);
        setAnimePage(1);
        setMangaPage(1);

        const [animeRes, mangaRes] = await Promise.all([
          animeService.search(query, { page: 1, limit: 24 }),
          mangaService.search(query, { page: 1, limit: 24 }),
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
        console.error('Error performing initial search:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchInitialResults();
  }, [query]);

  // Load More Anime (Page Increment with AniList write-through fallback)
  const handleLoadMoreAnime = async () => {
    if (loadingAnimeMore || !animeHasNextPage) return;
    const nextPage = animePage + 1;
    try {
      setLoadingAnimeMore(true);
      const res = await animeService.search(query, { page: nextPage, limit: 24 });
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
      const res = await mangaService.search(query, { page: nextPage, limit: 24 });
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

  if (!query) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center p-6">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-white mb-2">Search for Anime & Manga</h2>
          <p className="text-gray-400">Use the search bar above or explore via the A-Z directory</p>
        </div>
      </div>
    );
  }

  if (initialLoading) return <Loader fullScreen />;

  const totalLoaded = animeResults.length + mangaResults.length;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Summary */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-display font-black text-white mb-2">
            Search Results for <span className="text-gradient">"{query}"</span>
          </h1>
          <p className="text-gray-400 text-sm">
            Loaded {totalLoaded} titles ({animeResults.length} anime, {mangaResults.length} manga)
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex gap-4 mb-8 border-b border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('anime')}
            className={`pb-3 px-4 font-semibold text-sm transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'anime'
                ? 'text-primary border-b-2 border-primary font-bold'
                : 'text-gray-400 hover:text-white'
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
            className={`pb-3 px-4 font-semibold text-sm transition-colors cursor-pointer flex items-center gap-2 ${
              activeTab === 'manga'
                ? 'text-primary border-b-2 border-primary font-bold'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>Manga</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-medium">
              {mangaResults.length}
            </span>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'anime' ? (
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
        ) : (
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
      </div>
    </div>
  );
};

export default Search;
