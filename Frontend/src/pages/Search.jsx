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
  const [activeTab, setActiveTab] = useState('anime');
  const [animeResults, setAnimeResults] = useState([]);
  const [mangaResults, setMangaResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (query) {
      searchAll();
    }
  }, [query]);

  const searchAll = async () => {
    try {
      setLoading(true);
      const [anime, manga] = await Promise.all([
        animeService.search(query, { limit: 24 }),
        mangaService.search(query, { limit: 24 }),
      ]);
      setAnimeResults(anime.data || []);
      setMangaResults(manga.data || []);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!query) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-white mb-2">Search for Anime & Manga</h2>
          <p className="text-gray-400">Use the search bar above to find your favorites</p>
        </div>
      </div>
    );
  }

  if (loading) return <Loader fullScreen />;

  const totalResults = animeResults.length + mangaResults.length;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
          Search Results for "{query}"
        </h1>
        <p className="text-gray-400 mb-8">
          Found {totalResults} results ({animeResults.length} anime, {mangaResults.length} manga)
        </p>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('anime')}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'anime'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Anime ({animeResults.length})
          </button>
          <button
            onClick={() => setActiveTab('manga')}
            className={`pb-3 px-4 font-semibold transition-colors ${
              activeTab === 'manga'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Manga ({mangaResults.length})
          </button>
        </div>

        {/* Results */}
        {activeTab === 'anime' ? (
          <AnimeGrid anime={animeResults} columns={5} />
        ) : (
          <AnimeGrid anime={mangaResults} columns={5} />
        )}
      </div>
    </div>
  );
};

export default Search;
