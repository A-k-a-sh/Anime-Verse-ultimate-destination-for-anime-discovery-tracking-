import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { mangaService } from '../services/mangaService';
import AnimeGrid from '../components/AnimeGrid';
import CollapsibleGenreFilter from '../components/CollapsibleGenreFilter';
import { FunnelIcon } from '@heroicons/react/24/outline';

const MangaBrowse = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [manga, setManga] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    type: searchParams.get('type') || '',
    status: searchParams.get('status') || '',
    adult: searchParams.get('adult') || '',
    order_by: searchParams.get('sort') || 'popularity',
    genre: searchParams.get('genre') || '',
  });

  useEffect(() => {
    fetchManga();
  }, [filters, page]);

  const fetchManga = async () => {
    try {
      setLoading(true);
      const params = { ...filters, page, limit: 25 };
      Object.keys(params).forEach(key => !params[key] && delete params[key]);

      const response = await mangaService.search('', params);
      
      if (page === 1) {
        setManga(response.data || []);
      } else {
        setManga(prev => [...prev, ...(response.data || [])]);
      }
      
      setHasNextPage(response.pagination?.has_next_page || false);
    } catch (error) {
      console.error('Error fetching manga:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPage(1);
    setManga([]);
    
    const newParams = new URLSearchParams(searchParams);
    value ? newParams.set(key, value) : newParams.delete(key);
    setSearchParams(newParams);
  };

  const loadMore = () => {
    if (hasNextPage && !loading) {
      setPage(prev => prev + 1);
    }
  };

  const resetFilters = () => {
    setFilters({ type: '', status: '', adult: '', order_by: 'popularity', genre: '' });
    setPage(1);
    setManga([]);
    setSearchParams({});
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Browse Manga</h1>
            <p className="text-gray-400">Explore manga and light novels</p>
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
                <button onClick={resetFilters} className="text-sm text-primary hover:text-primary/80">
                  Reset
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                <select
                  value={filters.order_by}
                  onChange={(e) => handleFilterChange('order_by', e.target.value)}
                  className="w-full bg-dark-100 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                >
                  <option value="popularity">Popularity</option>
                  <option value="score">Score</option>
                  <option value="start_date">Start Date</option>
                  <option value="title">Title</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full bg-dark-100 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                >
                  <option value="">All Types</option>
                  <option value="manga">Manga</option>
                  <option value="novel">Light Novel</option>
                  <option value="oneshot">One-shot</option>
                  <option value="manhwa">Manhwa</option>
                  <option value="manhua">Manhua</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full bg-dark-100 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                >
                  <option value="">All Status</option>
                  <option value="publishing">Publishing</option>
                  <option value="complete">Completed</option>
                  <option value="upcoming">Upcoming</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Age Rating / Scope</label>
                <select
                  value={filters.adult}
                  onChange={(e) => handleFilterChange('adult', e.target.value)}
                  className="w-full bg-dark-100 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                >
                  <option value="">All Safe Content</option>
                  <option value="all">Include 18+ / Adult</option>
                  <option value="only_adult">18+ / Adult & Hentai Only</option>
                </select>
              </div>

              {/* Collapsible Genre Filter */}
              <CollapsibleGenreFilter
                selectedGenre={filters.genre}
                onSelectGenre={(val) => handleFilterChange('genre', val)}
              />
            </div>
          </div>

          {/* Manga Grid */}
          <div className="lg:col-span-3">
            <div className="mb-6 text-gray-400">
              {loading && page === 1 ? <span>Loading...</span> : <span>{manga.length} manga found</span>}
            </div>

            <AnimeGrid anime={manga} loading={loading && page === 1} columns={4} type="manga" />

            {hasNextPage && !loading && manga.length > 0 && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                >
                  Load More
                </button>
              </div>
            )}

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

export default MangaBrowse;
