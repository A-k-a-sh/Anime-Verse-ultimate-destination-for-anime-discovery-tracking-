import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import pulseService from '../services/pulseService';
import PulseCard from '../components/pulse/PulseCard';
import PulseHeroSpotlight from '../components/pulse/PulseHeroSpotlight';
import {
  BoltIcon,
  MagnifyingGlassIcon,
  FireIcon,
  ClockIcon,
  SparklesIcon,
  PlusIcon,
  DocumentTextIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const QUICK_TAGS = [
  { id: '', label: 'All Pulses' },
  { id: 'theory', label: 'Theories' },
  { id: 'review', label: 'Reviews' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'lore', label: 'Lore' },
  { id: 'spoiler', label: 'Spoilers' },
  { id: 'ending-explained', label: 'Endings' }
];

const PulseFeed = () => {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const currentSort = searchParams.get('sort') || 'trending';
  const currentTag = searchParams.get('tag') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const [pulses, setPulses] = useState([]);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [searchInput, setSearchInput] = useState(currentSearch);

  useEffect(() => {
    let isMounted = true;

    const fetchPulses = async () => {
      try {
        setIsLoading(true);
        const res = await pulseService.getAllPulses({
          sort: currentSort,
          tag: currentTag || undefined,
          search: currentSearch || undefined,
          page: currentPage,
          limit: 12
        });

        if (res?.success && isMounted) {
          setPulses(res.data || []);
          setPagination(res.pagination || { current: 1, pages: 1, total: 0 });
        }
      } catch (err) {
        console.error('Failed to load pulses:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchPulses();

    return () => {
      isMounted = false;
    };
  }, [currentSort, currentTag, currentSearch, currentPage]);

  const updateParam = (key, val) => {
    const params = new URLSearchParams(searchParams);
    if (val) {
      params.set(key, val);
    } else {
      params.delete(key);
    }
    params.set('page', '1'); // Reset to page 1 on filter change
    setSearchParams(params);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    updateParam('search', searchInput.trim());
  };

  const spotlightPulse = !currentSearch && !currentTag && currentPage === 1 ? pulses[0] : null;
  const feedList = spotlightPulse ? pulses.slice(1) : pulses;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">
      {/* Platform Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-r from-dark-200 via-dark-200/90 to-dark-100 border border-white/10 p-6 sm:p-10 mb-8 overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 text-primary border border-primary/30 text-xs font-black uppercase tracking-wider mb-3">
              <BoltIcon className="w-4 h-4" />
              Community Fandom Platform
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-2">
              Otaku Pulse ⚡
            </h1>
            <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
              Feel the fandom. Dive into in-depth episode analyses, wild manga theories, character dissections, and seasonal rankings written by anime fans.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3">
            {isAuthenticated && (
              <Link
                to="/pulse/my-pulses"
                className="px-5 py-3 rounded-2xl bg-dark-100 hover:bg-dark-300 border border-white/10 text-gray-200 hover:text-white text-xs sm:text-sm font-semibold transition-all flex items-center gap-2"
              >
                <DocumentTextIcon className="w-4 h-4 text-secondary" />
                <span>My Pulses</span>
              </Link>
            )}
            <Link
              to="/pulse/write"
              className="px-6 py-3 rounded-2xl bg-primary hover:bg-primary-600 text-white text-xs sm:text-sm font-bold transition-all shadow-xl shadow-primary/30 flex items-center gap-2 transform active:scale-95"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Drop a Pulse</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Search & Sort Controls Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
        {/* Sort Tabs */}
        <div className="flex items-center bg-dark-200/80 border border-white/10 rounded-2xl p-1 gap-1 w-fit shadow-md">
          <button
            type="button"
            onClick={() => updateParam('sort', 'trending')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              currentSort === 'trending'
                ? 'bg-primary text-white shadow-md shadow-primary/25'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FireIcon className="w-4 h-4" />
            <span>Trending</span>
          </button>
          <button
            type="button"
            onClick={() => updateParam('sort', 'top')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              currentSort === 'top'
                ? 'bg-primary text-white shadow-md shadow-primary/25'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <SparklesIcon className="w-4 h-4" />
            <span>Top Rated</span>
          </button>
          <button
            type="button"
            onClick={() => updateParam('sort', 'latest')}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all ${
              currentSort === 'latest'
                ? 'bg-primary text-white shadow-md shadow-primary/25'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ClockIcon className="w-4 h-4" />
            <span>Latest</span>
          </button>
        </div>

        {/* Live Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search pulses by title, theory or tag..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-20 py-2.5 rounded-2xl bg-dark-200/80 border border-white/10 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-primary shadow-inner"
          />
          {currentSearch && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                updateParam('search', '');
              }}
              className="absolute right-14 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors"
          >
            Find
          </button>
        </form>
      </div>

      {/* Quick Category Tag Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 scrollbar-none">
        {QUICK_TAGS.map((t) => {
          const isActive = currentTag === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => updateParam('tag', t.id)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-white text-dark-100 border-white shadow-md'
                  : 'bg-dark-200/50 text-gray-400 hover:text-white border-white/10 hover:border-white/20'
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Spotlight Feature (Hero) */}
      {spotlightPulse && <PulseHeroSpotlight pulse={spotlightPulse} />}

      {/* Pulses Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <ArrowPathIcon className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-gray-400 font-medium">Summoning community Pulses...</p>
        </div>
      ) : feedList.length === 0 && !spotlightPulse ? (
        <div className="py-20 px-4 rounded-3xl bg-dark-200/40 border border-dashed border-white/10 text-center">
          <div className="max-w-md mx-auto flex flex-col items-center gap-3">
            <div className="p-4 rounded-2xl bg-dark-100 border border-white/10 text-primary">
              <BoltIcon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No Pulses Found</h3>
            <p className="text-xs sm:text-sm text-gray-400">
              {currentSearch || currentTag
                ? 'No community articles matched your search or tag filters. Try clearing your search.'
                : 'Be the pioneer! Share the very first anime theory or chapter analysis on Otaku Pulse.'}
            </p>
            <Link
              to="/pulse/write"
              className="mt-2 px-6 py-2.5 rounded-2xl bg-primary hover:bg-primary-600 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-primary/25"
            >
              Write First Pulse
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {feedList.map((pulse) => (
            <PulseCard key={pulse._id} pulse={pulse} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {pagination.pages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => updateParam('page', String(currentPage - 1))}
            disabled={currentPage <= 1}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-dark-200 border border-white/10 text-gray-300 hover:text-white disabled:opacity-40 transition-colors"
          >
            Previous
          </button>
          <div className="text-xs text-gray-400 px-3">
            Page <span className="font-bold text-white">{currentPage}</span> of{' '}
            <span className="font-bold text-white">{pagination.pages}</span>
          </div>
          <button
            type="button"
            onClick={() => updateParam('page', String(currentPage + 1))}
            disabled={currentPage >= pagination.pages}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-dark-200 border border-white/10 text-gray-300 hover:text-white disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default PulseFeed;
