import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  BookOpenIcon
} from '@heroicons/react/24/solid';

const ChapterDrawer = ({
  isOpen = false,
  onClose,
  chapters = [],
  currentChapter = '1',
  readChapters = [],
  onSelectChapter
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const activeItemRef = useRef(null);

  // Filter chapters based on search query
  const filteredChapters = useMemo(() => {
    if (!searchQuery.trim()) return chapters;
    const q = searchQuery.toLowerCase().trim();
    return chapters.filter((ch) => {
      const matchNum = String(ch.chapter).toLowerCase().includes(q);
      const matchTitle = (ch.title || '').toLowerCase().includes(q);
      return matchNum || matchTitle;
    });
  }, [chapters, searchQuery]);

  // Scroll active chapter into view when drawer opens
  useEffect(() => {
    if (isOpen && activeItemRef.current) {
      setTimeout(() => {
        activeItemRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }, 150);
    }
  }, [isOpen]);

  // Escape key listener to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex justify-end">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          />

          {/* Slide-over Drawer Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-full max-w-sm sm:max-w-md h-full bg-[#0B0C15] border-l border-white/10 shadow-2xl flex flex-col z-10"
          >
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpenIcon className="w-5 h-5 text-primary" />
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Chapter Directory
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-dark-200 text-gray-400 font-semibold border border-white/5">
                  {chapters.length}
                </span>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-dark-200/80 hover:bg-dark-300 text-gray-400 hover:text-white border border-white/10 transition-colors"
                title="Close Drawer (Esc)"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input Filter */}
            <div className="p-3 sm:p-4 border-b border-white/5">
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter chapters (e.g. 12, special)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-dark-200/80 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary/50 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Chapter List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5 custom-scrollbar">
              {filteredChapters.length === 0 ? (
                <div className="text-center py-12 text-gray-500 text-sm">
                  No chapters matching "{searchQuery}"
                </div>
              ) : (
                filteredChapters.map((ch) => {
                  const isActive = String(ch.chapter).trim() === String(currentChapter).trim();
                  const isRead = readChapters.includes(String(ch.chapter).trim());

                  return (
                    <button
                      key={ch.id || ch.chapter}
                      ref={isActive ? activeItemRef : null}
                      onClick={() => {
                        onSelectChapter(ch.chapter);
                        onClose();
                      }}
                      className={`w-full text-left p-3 rounded-xl flex items-center justify-between gap-3 transition-all ${
                        isActive
                          ? 'bg-primary/20 border border-primary/50 text-white shadow-[0_0_20px_rgba(255,107,107,0.2)]'
                          : 'bg-dark-200/50 hover:bg-dark-200 text-gray-300 hover:text-white border border-white/5'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span
                            className={`font-semibold text-sm ${
                              isActive ? 'text-primary' : 'text-gray-200'
                            }`}
                          >
                            Chapter {ch.chapter}
                          </span>
                          {ch.volume && (
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                              Vol {ch.volume}
                            </span>
                          )}
                        </div>
                        {ch.title && ch.title !== `Chapter ${ch.chapter}` && (
                          <p className="text-xs text-gray-400 truncate mt-0.5">
                            {ch.title}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isRead && (
                          <span
                            title="Completed"
                            className="text-emerald-400 flex items-center gap-1 text-xs"
                          >
                            <CheckCircleIcon className="w-4 h-4" />
                          </span>
                        )}
                        {isActive && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/30 text-primary font-bold">
                            Current
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ChapterDrawer;
