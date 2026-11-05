import { useState, useEffect, useRef } from 'react';
import { animeService } from '../../services/animeService';
import { mangaService } from '../../services/mangaService';
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  FilmIcon,
  BookOpenIcon,
  PlusIcon
} from '@heroicons/react/24/outline';

const MediaTagSelector = ({ value = [], onChange }) => {
  const [mediaType, setMediaType] = useState('anime'); // 'anime' | 'manga'
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const containerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

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

  // Debounced live search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim() || query.trim().length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        if (mediaType === 'anime') {
          const res = await animeService.search(query.trim(), { limit: 6 });
          const items = res?.data || res || [];
          setResults(Array.isArray(items) ? items.slice(0, 6) : []);
        } else {
          const res = await mangaService.search(query.trim(), { limit: 6 });
          const items = res?.data || res || [];
          setResults(Array.isArray(items) ? items.slice(0, 6) : []);
        }
        setIsOpen(true);
      } catch (err) {
        console.error('MediaTagSelector search error:', err);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeoutRef.current);
  }, [query, mediaType]);

  const handleSelect = (item) => {
    const malId = item.malId || item.id || item._id;
    const title = item.titleEnglish || item.title || item.titleJapanese;
    const imageUrl = item.imageUrl || item.images?.jpg?.image_url;

    // Check if already selected
    const alreadySelected = value.some(
      m => Number(m.malId) === Number(malId) && m.type === mediaType
    );

    if (!alreadySelected) {
      const newItem = {
        malId: Number(malId),
        type: mediaType,
        title,
        imageUrl
      };
      onChange?.([...value, newItem]);
    }

    setQuery('');
    setIsOpen(false);
    setResults([]);
  };

  const handleRemove = (malId, type) => {
    const updated = value.filter(
      m => !(Number(m.malId) === Number(malId) && m.type === type)
    );
    onChange?.(updated);
  };

  return (
    <div className="space-y-3" ref={containerRef}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
          <span>Linked Anime & Manga</span>
          <span className="text-xs font-normal text-gray-400">
            (Connect your Pulse to titles in the catalog)
          </span>
        </label>
        <span className="text-xs text-gray-400">{value.length} linked</span>
      </div>

      {/* Selected Media Pills */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((media) => (
            <div
              key={`${media.type}-${media.malId}`}
              className="group inline-flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl bg-dark-100 border border-white/10 hover:border-white/25 transition-all text-xs text-gray-200 shadow-sm"
            >
              {media.imageUrl ? (
                <img
                  src={media.imageUrl}
                  alt={media.title}
                  className="w-5 h-5 rounded-lg object-cover"
                />
              ) : media.type === 'anime' ? (
                <FilmIcon className="w-4 h-4 text-primary ml-1" />
              ) : (
                <BookOpenIcon className="w-4 h-4 text-secondary ml-1" />
              )}
              <span className="font-medium max-w-[150px] sm:max-w-[200px] truncate">
                {media.title}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-gray-400 bg-white/5 px-1 rounded">
                {media.type}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(media.malId, media.type)}
                className="text-gray-400 hover:text-rose-400 transition-colors ml-0.5"
                title="Remove link"
              >
                <XMarkIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search & Type Toggle Capsule */}
      <div className="relative">
        <div className="flex items-center rounded-xl bg-dark-100 border border-white/10 focus-within:border-primary/50 transition-all overflow-hidden">
          {/* Anime / Manga toggle */}
          <div className="flex items-center bg-dark-200/80 border-r border-white/10 p-1">
            <button
              type="button"
              onClick={() => {
                setMediaType('anime');
                setResults([]);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                mediaType === 'anime'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <FilmIcon className="w-3.5 h-3.5" />
              Anime
            </button>
            <button
              type="button"
              onClick={() => {
                setMediaType('manga');
                setResults([]);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                mediaType === 'manga'
                  ? 'bg-secondary text-dark-100 font-bold shadow-sm'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BookOpenIcon className="w-3.5 h-3.5" />
              Manga
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 flex items-center px-3">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
            <input
              type="text"
              placeholder={`Search ${mediaType === 'anime' ? 'anime titles (e.g. Attack on Titan)...' : 'manga titles (e.g. Berserk)...'}`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                if (results.length > 0) setIsOpen(true);
              }}
              className="w-full py-2 bg-transparent text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none"
            />
            {isLoading && (
              <div className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
            )}
          </div>
        </div>

        {/* Dropdown Results */}
        {isOpen && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-30 mt-1.5 bg-dark-200/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl overflow-hidden max-h-64 overflow-y-auto">
            {results.map((item) => {
              const malId = item.malId || item.id || item._id;
              const title = item.titleEnglish || item.title || item.titleJapanese;
              const img = item.imageUrl || item.images?.jpg?.image_url;
              const score = item.score;
              const isSelected = value.some(
                m => Number(m.malId) === Number(malId) && m.type === mediaType
              );

              return (
                <button
                  key={`${mediaType}-${malId}`}
                  type="button"
                  onClick={() => handleSelect(item)}
                  disabled={isSelected}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors border-b border-white/5 last:border-b-0 ${
                    isSelected
                      ? 'opacity-40 bg-white/5 cursor-not-allowed'
                      : 'hover:bg-white/10 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {img ? (
                      <img
                        src={img}
                        alt={title}
                        className="w-8 h-10 rounded-md object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-10 rounded-md bg-dark-100 flex items-center justify-center flex-shrink-0">
                        <FilmIcon className="w-4 h-4 text-gray-500" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs sm:text-sm font-semibold text-white truncate">
                        {title}
                      </div>
                      <div className="text-[11px] text-gray-400 flex items-center gap-2">
                        <span className="uppercase text-[10px] text-primary">{item.type || mediaType}</span>
                        {score ? <span>★ {score}</span> : null}
                        {item.year ? <span>{item.year}</span> : null}
                      </div>
                    </div>
                  </div>

                  <div className="ml-2 flex-shrink-0">
                    {isSelected ? (
                      <span className="text-[11px] text-emerald-400 font-medium">Added</span>
                    ) : (
                      <PlusIcon className="w-4 h-4 text-gray-400 group-hover:text-white" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaTagSelector;
