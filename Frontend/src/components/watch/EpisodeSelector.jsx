import { useState, useEffect, useRef, useMemo } from 'react';
import {
  MagnifyingGlassIcon,
  PlayIcon,
  CheckIcon,
  Squares2X2Icon,
  ListBulletIcon,
} from '@heroicons/react/24/solid';
import { watchStorage } from '../../utils/watchStorage';

const EPISODES_PER_TAB = 50;

/**
 * Interactive Episode Selector with Range Pagination, Search,
 * Grid/List View Modes, and Persistent Watched Status.
 */
const EpisodeSelector = ({
  totalEpisodes = 1,
  currentEpisode = 1,
  watchedEpisodes = [],
  episodeList = [],
  onSelectEpisode,
  isMovie = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState(() => watchStorage.getEpisodeViewMode());
  const activeEpisodeRef = useRef(null);

  // Compute total count (fallback to currentEpisode if not specified)
  const count = Math.max(
    1,
    totalEpisodes || episodeList.length || currentEpisode || 1
  );

  // Map of episode titles from API
  const episodeTitleMap = useMemo(() => {
    const map = new Map();
    if (Array.isArray(episodeList)) {
      episodeList.forEach((ep) => {
        const epNum = ep.episode || ep.mal_id;
        if (epNum) {
          map.set(Number(epNum), ep.title || ep.fullTitle || `Episode ${epNum}`);
        }
      });
    }
    return map;
  }, [episodeList]);

  // Determine active tab range index based on currentEpisode
  const initialTabIndex = Math.floor((Math.max(1, currentEpisode) - 1) / EPISODES_PER_TAB);
  const [selectedRangeIndex, setSelectedRangeIndex] = useState(initialTabIndex);

  // Update selected tab whenever currentEpisode jumps outside current tab
  useEffect(() => {
    const newTabIndex = Math.floor((Math.max(1, currentEpisode) - 1) / EPISODES_PER_TAB);
    setSelectedRangeIndex(newTabIndex);
  }, [currentEpisode]);

  // Compute range tabs
  const rangeTabs = useMemo(() => {
    const tabs = [];
    const totalTabs = Math.ceil(count / EPISODES_PER_TAB);
    for (let i = 0; i < totalTabs; i++) {
      const start = i * EPISODES_PER_TAB + 1;
      const end = Math.min((i + 1) * EPISODES_PER_TAB, count);
      tabs.push({ index: i, start, end, label: `${start} - ${end}` });
    }
    return tabs;
  }, [count]);

  // Scroll active episode into view
  useEffect(() => {
    if (activeEpisodeRef.current) {
      activeEpisodeRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest',
      });
    }
  }, [currentEpisode, selectedRangeIndex, viewMode]);

  // Set of watched episode numbers for fast lookup
  const watchedSet = useMemo(() => {
    return new Set((watchedEpisodes || []).map(Number));
  }, [watchedEpisodes]);

  // Current tab range
  const currentTab = rangeTabs[selectedRangeIndex] || rangeTabs[0];

  // List of episodes for current view (filtered by search if present)
  const visibleEpisodes = useMemo(() => {
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const list = [];
      for (let i = 1; i <= count; i++) {
        const title = (episodeTitleMap.get(i) || '').toLowerCase();
        if (String(i).includes(q) || title.includes(q)) {
          list.push(i);
        }
      }
      return list;
    }

    if (!currentTab) return [];
    const list = [];
    for (let i = currentTab.start; i <= currentTab.end; i++) {
      list.push(i);
    }
    return list;
  }, [count, currentTab, searchQuery, episodeTitleMap]);

  const handleToggleViewMode = (mode) => {
    setViewMode(mode);
    watchStorage.setEpisodeViewMode(mode);
  };

  return (
    <div className="bg-dark-200 rounded-xl p-4 border border-white/5 flex flex-col max-h-[580px] w-full shadow-lg">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-white text-base">Episodes</h3>
          <span className="text-xs bg-dark-100 text-gray-400 px-2 py-0.5 rounded-full border border-white/5 font-medium">
            {isMovie ? '1 Movie' : `${count} total`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Grid / List View Toggle */}
          {!isMovie && (
            <div className="flex items-center bg-dark-100 p-0.5 rounded-lg border border-white/5">
              <button
                onClick={() => handleToggleViewMode('grid')}
                className={`p-1 rounded text-xs transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Grid View (Episode Numbers)"
              >
                <Squares2X2Icon className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleToggleViewMode('list')}
                className={`p-1 rounded text-xs transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="List View (with Episode Titles)"
              >
                <ListBulletIcon className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Quick Search */}
          {!isMovie && count > 12 && (
            <div className="relative w-28 sm:w-32">
              <MagnifyingGlassIcon className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2 py-1 text-xs bg-dark-100 text-white rounded-lg border border-white/10 focus:border-primary focus:outline-none placeholder-gray-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* Range Tabs (for series with > 50 episodes) */}
      {!isMovie && rangeTabs.length > 1 && !searchQuery && (
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-thin scrollbar-thumb-white/10 shrink-0">
          {rangeTabs.map((tab) => (
            <button
              key={tab.index}
              onClick={() => setSelectedRangeIndex(tab.index)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium whitespace-nowrap transition-all ${
                selectedRangeIndex === tab.index
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-dark-100 text-gray-400 hover:text-white hover:bg-dark-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Episode Container */}
      <div className="overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {isMovie ? (
          <button
            onClick={() => onSelectEpisode(1)}
            className="w-full py-4 px-3 rounded-lg bg-primary/20 border-2 border-primary text-white font-bold flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
          >
            <PlayIcon className="w-5 h-5 text-primary" />
            <span>Play Full Movie</span>
          </button>
        ) : viewMode === 'list' ? (
          /* ================= LIST VIEW (with Titles) ================= */
          <div className="space-y-1.5">
            {visibleEpisodes.map((epNum) => {
              const isCurrent = epNum === currentEpisode;
              const isWatched = watchedSet.has(epNum);
              const epTitle = episodeTitleMap.get(epNum) || `Episode ${epNum}`;

              return (
                <button
                  key={epNum}
                  ref={isCurrent ? activeEpisodeRef : null}
                  onClick={() => onSelectEpisode(epNum)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs transition-all text-left group ${
                    isCurrent
                      ? 'bg-primary/20 border-l-4 border-primary text-white shadow-sm'
                      : isWatched
                      ? 'bg-dark-100/60 text-gray-400 hover:text-gray-200 border-l-4 border-emerald-600/50 hover:bg-dark-100'
                      : 'bg-dark-100 text-gray-300 hover:text-white hover:bg-dark-300 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <span
                      className={`w-6 h-6 rounded flex items-center justify-center font-bold text-[11px] shrink-0 ${
                        isCurrent
                          ? 'bg-primary text-white'
                          : isWatched
                          ? 'bg-dark-300 text-gray-400'
                          : 'bg-dark-200 text-gray-300'
                      }`}
                    >
                      {epNum}
                    </span>
                    <span
                      className={`truncate font-medium ${
                        isCurrent ? 'text-white font-bold' : ''
                      }`}
                    >
                      {epTitle}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCurrent && (
                      <span className="flex items-center gap-1 text-[10px] text-primary font-bold uppercase tracking-wider bg-primary/20 px-1.5 py-0.5 rounded">
                        <PlayIcon className="w-2.5 h-2.5 animate-pulse" />
                        Playing
                      </span>
                    )}
                    {isWatched && !isCurrent && (
                      <span className="text-emerald-500" title="Watched">
                        <CheckIcon className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* ================= GRID VIEW (Compact Numbers) ================= */
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-4 xl:grid-cols-5 gap-2">
            {visibleEpisodes.map((epNum) => {
              const isCurrent = epNum === currentEpisode;
              const isWatched = watchedSet.has(epNum);
              const epTitle = episodeTitleMap.get(epNum) || `Episode ${epNum}`;

              return (
                <button
                  key={epNum}
                  ref={isCurrent ? activeEpisodeRef : null}
                  onClick={() => onSelectEpisode(epNum)}
                  className={`relative py-2.5 px-2 rounded-lg text-xs font-semibold flex flex-col items-center justify-center transition-all group ${
                    isCurrent
                      ? 'bg-primary/25 border-2 border-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.5)] scale-[1.03]'
                      : isWatched
                      ? 'bg-dark-300/40 text-gray-500 hover:text-gray-300 border border-gray-800 hover:border-gray-700'
                      : 'bg-dark-100 text-gray-300 hover:text-white border border-white/5 hover:border-primary/50'
                  }`}
                  title={`Ep ${epNum}: ${epTitle}${isWatched ? ' (Watched)' : ''}`}
                >
                  {/* Watched Checkmark */}
                  {isWatched && !isCurrent && (
                    <span className="absolute top-1 right-1 text-emerald-500/70">
                      <CheckIcon className="w-3 h-3" />
                    </span>
                  )}

                  {/* Playing Indicator */}
                  {isCurrent && (
                    <span className="text-primary animate-pulse mb-0.5">
                      <PlayIcon className="w-3.5 h-3.5" />
                    </span>
                  )}

                  <span>{epNum}</span>
                </button>
              );
            })}
          </div>
        )}

        {visibleEpisodes.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-xs">
            No episode found matching &ldquo;{searchQuery}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
};

export default EpisodeSelector;
