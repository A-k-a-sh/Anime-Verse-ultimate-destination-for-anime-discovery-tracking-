import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  StarIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/solid';
import { animeService } from '../services/animeService';

/**
 * Live Search Autocomplete Component with Debounce & Keyboard Navigation
 */
const SearchAutocomplete = ({ isMobile = false, onSelect }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const navigate = useNavigate();

  // Debounced search query
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const response = await animeService.search(trimmed, { limit: 5 });
        if (response?.success && Array.isArray(response.data)) {
          setResults(response.data);
          setIsOpen(true);
        } else {
          setResults([]);
        }
      } catch (err) {
        console.warn('Search autocomplete error:', err);
        setResults([]);
      } finally {
        setLoading(false);
        setSelectedIndex(-1);
      }
    }, 220);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigateToAnime = useCallback(
    (anime) => {
      const targetId = anime.malId || anime.mal_id || anime.id;
      if (!targetId) return;
      setIsOpen(false);
      setQuery('');
      onSelect?.();
      navigate(`/anime/${targetId}`);
    },
    [navigate, onSelect]
  );

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (selectedIndex >= 0 && results[selectedIndex]) {
      handleNavigateToAnime(results[selectedIndex]);
      return;
    }

    if (query.trim()) {
      setIsOpen(false);
      const targetQuery = query.trim();
      setQuery('');
      onSelect?.();
      navigate(`/search?q=${encodeURIComponent(targetQuery)}`);
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen || results.length === 0) {
      if (e.key === 'Enter') {
        handleSubmit(e);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        handleSubmit(e);
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search Input Form */}
      <form onSubmit={handleSubmit} className="relative w-full">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search anime by title, genre..."
          className={`w-full bg-dark-300/60 border border-dark-400 rounded-full px-4 py-2 pl-10 pr-9 text-sm text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 ${
            isOpen ? 'rounded-b-none border-b-0' : ''
          }`}
        />
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

        {/* Clear / Spinner Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
          {loading ? (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </form>

      {/* Floating Suggestions Dropdown */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 z-50 bg-dark-200/95 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden transition-all duration-200 ${
            isMobile
              ? 'top-full rounded-b-xl max-h-[70vh]'
              : 'top-full rounded-b-xl max-h-[480px]'
          }`}
        >
          {results.length > 0 ? (
            <div className="py-1 divide-y divide-white/5 overflow-y-auto max-h-[380px] scrollbar-thin scrollbar-thumb-white/10">
              {results.map((anime, idx) => {
                const targetId = anime.malId || anime.mal_id || anime.id;
                const isSelected = idx === selectedIndex;
                const score = anime.score ? Number(anime.score).toFixed(1) : null;
                const year = anime.year || (anime.aired?.from ? new Date(anime.aired.from).getFullYear() : null);
                const format = anime.rating || anime.type || 'TV';

                return (
                  <div
                    key={targetId || idx}
                    onClick={() => handleNavigateToAnime(anime)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer transition-colors group ${
                      isSelected
                        ? 'bg-primary/25 text-white border-l-4 border-primary pl-2.5'
                        : 'hover:bg-dark-100 text-gray-200'
                    }`}
                  >
                    {/* Poster Thumbnail */}
                    <div className="w-10 h-14 bg-dark-100 rounded-md overflow-hidden shrink-0 shadow-md">
                      {anime.imageUrl ? (
                        <img
                          src={anime.imageUrl}
                          alt={anime.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-600">
                          N/A
                        </div>
                      )}
                    </div>

                    {/* Meta Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold truncate group-hover:text-primary transition-colors">
                        {anime.title || anime.titleEnglish}
                      </h4>
                      {anime.titleJapanese && (
                        <p className="text-xs text-gray-500 truncate">
                          {anime.titleJapanese}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-gray-400">
                        {format && (
                          <span className="px-1.5 py-0.5 rounded bg-dark-100 text-gray-300 font-medium">
                            {format}
                          </span>
                        )}
                        {year && <span>{year}</span>}
                        {anime.episodes && (
                          <span>{anime.episodes} eps</span>
                        )}
                        {score && (
                          <span className="flex items-center gap-0.5 text-yellow-400 font-bold ml-auto">
                            <StarIcon className="w-3 h-3" />
                            <span>{score}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : !loading && query.trim().length >= 2 ? (
            <div className="py-6 px-4 text-center text-xs text-gray-400">
              No anime found for &ldquo;<span className="text-white">{query}</span>&rdquo;
            </div>
          ) : null}

          {/* Footer Row: View all results */}
          {query.trim().length >= 2 && (
            <button
              onClick={handleSubmit}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-dark-300/80 hover:bg-primary/20 text-xs font-semibold text-primary hover:text-white border-t border-white/5 transition-colors"
            >
              <span>View all results for &ldquo;{query.trim()}&rdquo;</span>
              <ArrowRightIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchAutocomplete;
