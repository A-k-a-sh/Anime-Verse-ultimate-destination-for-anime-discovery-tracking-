import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { animeService } from '../services/animeService';
import AnimeGrid from '../components/AnimeGrid';
import { FunnelIcon } from '@heroicons/react/24/outline';

const Browse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [anime, setAnime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    status: searchParams.get('status') || '',
    rating: searchParams.get('rating') || '',
    order_by: searchParams.get('sort') || 'popularity',
    genre: searchParams.get('genre') || '',
  });

  useEffect(() => {
    fetchAnime();
  }, [filters, page]);

  const fetchAnime = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page,
        limit: 25,
      };

      // Remove empty filters
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key];
      });

      // Use search endpoint which supports all filters
      const response = await animeService.search('', params);
      
      if (page === 1) {
        setAnime(response.data || []);
      } else {
        setAnime(prev => [...prev, ...(response.data || [])]);
      }
      
      setHasNextPage(response.pagination?.has_next_page || false);
    } catch (error) {
      console.error('Error fetching anime:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
    setAnime([]);
    
    // Update URL params
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const loadMore = () => {
    if (hasNextPage && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const resetFilters = () => {
    setFilters({
      type: '',
      status: '',
      rating: '',
      order_by: 'popularity',
      genre: '',
    });
    setPage(1);
    setAnime([]);
    setSearchParams({});
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Browse Anime</h1>
            <p className="text-gray-400">Discover anime with advanced filters</p>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden flex items-center gap-2 bg-dark-200 hover:bg-dark-300 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <FunnelIcon className="w-5 h-5" />
            <span>Filters</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className={`lg:block ${showFilters ? 'block' : 'hidden'}`}>
            <div className="bg-dark-200 rounded-lg p-6 sticky top-24 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">Filters</h2>
                <button
                  onClick={resetFilters}
                  className="text-sm text-primary hover:text-primary/80"
                >
                  Reset
                </button>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.order_by}
                  onChange={(e) => handleFilterChange('order_by', e.target.value)}
                  className="w-full bg-dark-100 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                >
                  <option value="popularity">Popularity</option>
                  <option value="score">Score</option>
                  <option value="start_date">Start Date</option>
                  <option value="end_date">End Date</option>
                  <option value="title">Title</option>
                </select>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full bg-dark-100 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                >
                  <option value="">All Types</option>
                  <option value="tv">TV</option>
                  <option value="movie">Movie</option>
                  <option value="ova">OVA</option>
                  <option value="special">Special</option>
                  <option value="ona">ONA</option>
                  <option value="music">Music</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full bg-dark-100 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                >
                  <option value="">All Status</option>
                  <option value="airing">Airing</option>
                  <option value="complete">Completed</option>
                  <option value="upcoming">Upcoming</option>
                </select>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Rating
                </label>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  className="w-full bg-dark-100 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                >
                  <option value="">All Ratings</option>
                  <option value="g">G - All Ages</option>
                  <option value="pg">PG - Children</option>
                  <option value="pg13">PG-13 - Teens 13+</option>
                  <option value="r17">R - 17+</option>
                  <option value="r">R+ - Mild Nudity</option>
                  <option value="rx">Rx - Hentai</option>
                </select>
              </div>

              {/* Popular Genres */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Genre
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 1, name: 'Action' },
                    { id: 2, name: 'Adventure' },
                    { id: 4, name: 'Comedy' },
                    { id: 8, name: 'Drama' },
                    { id: 10, name: 'Fantasy' },
                    { id: 22, name: 'Romance' },
                    { id: 24, name: 'Sci-Fi' },
                    { id: 27, name: 'Shounen' },
                    { id: 37, name: 'Supernatural' },
                  ].map((genre) => (
                    <button
                      key={genre.id}
                      onClick={() => handleFilterChange('genre', (filters.genre === genre.name || filters.genre === String(genre.id)) ? '' : genre.name)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                        (filters.genre === genre.name || filters.genre === String(genre.id))
                          ? 'bg-primary text-white'
                          : 'bg-dark-100 text-gray-300 hover:bg-dark-300'
                      }`}
                    >
                      {genre.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Anime Grid */}
          <div className="lg:col-span-3">
            {/* Results Count */}
            <div className="mb-6 text-gray-400">
              {loading && page === 1 ? (
                <span>Loading...</span>
              ) : (
                <span>{anime.length} anime found</span>
              )}
            </div>

            {/* Grid */}
            <AnimeGrid anime={anime} loading={loading && page === 1} columns={4} />

            {/* Load More Button */}
            {hasNextPage && !loading && anime.length > 0 && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                >
                  Load More
                </button>
              </div>
            )}

            {/* Loading More Indicator */}
            {loading && page > 1 && (
              <div className="mt-8 text-center">
                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Browse;
