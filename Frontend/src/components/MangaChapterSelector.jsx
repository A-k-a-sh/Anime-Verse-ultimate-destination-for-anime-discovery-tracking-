import { useState, useMemo, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  ArrowsUpDownIcon,
  BookOpenIcon,
  CheckCircleIcon
} from '@heroicons/react/24/solid';
import { readStorage } from '../utils/readStorage';

const CHAPTERS_PER_TAB = 50;

const MangaChapterSelector = ({
  mangaId,
  mangaTitle = '',
  mangaImage = '',
  chapters = [],
  resumeChapter = '1',
  loading = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAscending, setIsAscending] = useState(true);
  const activeChapterRef = useRef(null);

  const totalCount = chapters.length;

  // Find index of current / resume chapter in chapters list
  const currentChapterIndex = useMemo(() => {
    return chapters.findIndex(
      (ch) => String(ch.chapter).trim() === String(resumeChapter).trim()
    );
  }, [chapters, resumeChapter]);

  // Compute Range Tabs (e.g. 1-50, 51-100, 101-150...)
  const rangeTabs = useMemo(() => {
    if (totalCount === 0) return [];
    const tabs = [];
    const numTabs = Math.ceil(totalCount / CHAPTERS_PER_TAB);
    for (let i = 0; i < numTabs; i++) {
      const start = i * CHAPTERS_PER_TAB + 1;
      const end = Math.min((i + 1) * CHAPTERS_PER_TAB, totalCount);
      tabs.push({
        index: i,
        start,
        end,
        label: `${start} - ${end}`,
      });
    }
    return tabs;
  }, [totalCount]);

  // Auto-select tab index containing the resume/current chapter
  const defaultTabIndex = useMemo(() => {
    if (currentChapterIndex >= 0) {
      return Math.floor(currentChapterIndex / CHAPTERS_PER_TAB);
    }
    return 0;
  }, [currentChapterIndex]);

  const [selectedTabIndex, setSelectedTabIndex] = useState(defaultTabIndex);

  // Sync selected tab if resumeChapter updates
  useEffect(() => {
    if (defaultTabIndex >= 0 && defaultTabIndex < rangeTabs.length) {
      setSelectedTabIndex(defaultTabIndex);
    }
  }, [defaultTabIndex, rangeTabs.length]);

  // Filter and slice chapters based on search query or active range tab
  const visibleChapters = useMemo(() => {
    if (totalCount === 0) return [];

    let list = [];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = chapters.filter((ch) => {
        const matchNum = String(ch.chapter).toLowerCase().includes(q);
        const matchTitle = (ch.title || '').toLowerCase().includes(q);
        return matchNum || matchTitle;
      });
    } else {
      const activeTab = rangeTabs[selectedTabIndex] || rangeTabs[0];
      if (activeTab) {
        list = chapters.slice(activeTab.start - 1, activeTab.end);
      } else {
        list = chapters;
      }
    }

    if (!isAscending) {
      return [...list].reverse();
    }
    return list;
  }, [chapters, totalCount, searchQuery, rangeTabs, selectedTabIndex, isAscending]);

  // Scroll active chapter into view within the container
  useEffect(() => {
    if (activeChapterRef.current) {
      activeChapterRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedTabIndex, resumeChapter]);

  const handleChapterClick = (chNum) => {
    readStorage.setLastReadChapter(mangaId, chNum);
    readStorage.recordHistory({
      malId: mangaId,
      title: mangaTitle,
      imageUrl: mangaImage,
      chapter: chNum,
      totalChapters: totalCount,
    });
  };

  return (
    <div className="bg-dark-200 rounded-xl p-5 sm:p-6 border border-white/5 shadow-xl">
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <BookOpenIcon className="w-6 h-6 text-primary" />
          <h2 className="text-xl sm:text-2xl font-bold text-white">Chapters</h2>
          {totalCount > 0 && (
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-dark-100 text-gray-300 border border-white/10 font-semibold">
              {totalCount} Available
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Ascending / Descending Toggle */}
          {totalCount > 1 && (
            <button
              type="button"
              onClick={() => setIsAscending((prev) => !prev)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-dark-100 hover:bg-dark-300 text-gray-300 hover:text-white border border-white/10 text-xs font-semibold transition-all active:scale-95"
              title={`Switch to ${isAscending ? 'Latest First' : 'Oldest First'}`}
            >
              <ArrowsUpDownIcon className="w-3.5 h-3.5 text-primary" />
              <span>{isAscending ? '1 → Latest' : 'Latest → 1'}</span>
            </button>
          )}

          {/* Direct Reader Link */}
          <Link
            to={`/read/${mangaId}/${resumeChapter}`}
            onClick={() => handleChapterClick(resumeChapter)}
            className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/20 transition-all"
          >
            <span>Open Reader</span>
            <span>→</span>
          </Link>
        </div>
      </div>

      {/* 2. Search & Range Pagination Tabs */}
      {totalCount > 0 && (
        <div className="space-y-3 mb-4">
          {/* Quick Chapter Search Input */}
          <div className="relative">
            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search chapter number or title (e.g. 102, Special)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-dark-100/90 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* 50-Chapter Range Tabs (Shown when there's more than 50 chapters and no active search) */}
          {!searchQuery.trim() && rangeTabs.length > 1 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {rangeTabs.map((tab) => {
                const isSelected = tab.index === selectedTabIndex;
                return (
                  <button
                    key={tab.index}
                    onClick={() => setSelectedTabIndex(tab.index)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      isSelected
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-dark-100 hover:bg-dark-300 text-gray-400 hover:text-gray-200 border border-white/5'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 3. Chapters Grid */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-gray-400 text-xs animate-pulse">
          <BookOpenIcon className="w-8 h-8 text-primary/50 mb-2" />
          <span>Fetching complete chapter directory...</span>
        </div>
      ) : totalCount === 0 ? (
        <div className="py-8 text-center text-gray-400 text-xs">
          <p className="mb-3">No indexed chapters returned yet.</p>
          <Link
            to={`/read/${mangaId}/1`}
            onClick={() => handleChapterClick('1')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-dark-100 hover:bg-dark-300 text-primary border border-primary/20 text-xs font-semibold transition-colors"
          >
            <BookOpenIcon className="w-4 h-4" />
            <span>Start Reading Chapter 1</span>
          </Link>
        </div>
      ) : visibleChapters.length === 0 ? (
        <div className="py-8 text-center text-gray-400 text-xs">
          No chapters matching "{searchQuery}".
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 max-h-96 overflow-y-auto custom-scrollbar p-1">
          {visibleChapters.map((ch) => {
            const isRead = readStorage.isChapterRead(mangaId, ch.chapter);
            const isCurrent = String(ch.chapter).trim() === String(resumeChapter).trim();

            return (
              <Link
                key={ch.id || ch.chapter}
                ref={isCurrent ? activeChapterRef : null}
                to={`/read/${mangaId}/${ch.chapter}`}
                onClick={() => handleChapterClick(ch.chapter)}
                className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all group ${
                  isCurrent
                    ? 'bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(255,107,107,0.25)]'
                    : 'bg-dark-100/90 hover:bg-dark-300/80 border-white/5 text-gray-300 hover:text-white'
                }`}
                title={ch.title || `Chapter ${ch.chapter}`}
              >
                <div className="truncate min-w-0 pr-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold">Ch {ch.chapter}</span>
                    {ch.volume && (
                      <span className="text-[10px] text-gray-500 uppercase">
                        v{ch.volume}
                      </span>
                    )}
                  </div>
                  {ch.title && ch.title !== `Chapter ${ch.chapter}` && (
                    <p className="text-[11px] text-gray-400 truncate mt-0.5 group-hover:text-gray-300">
                      {ch.title}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  {isRead && (
                    <CheckCircleIcon
                      className="w-4 h-4 text-emerald-400"
                      title="Completed"
                    />
                  )}
                  {isCurrent && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MangaChapterSelector;
