import { motion } from 'framer-motion';
import {
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/solid';

const ReaderFooter = ({
  visible = true,
  currentPage = 1,
  totalPages = 1,
  navigation = { hasPrev: false, prevChapter: null, hasNext: false, nextChapter: null },
  onPageChange,
  onPrevChapter,
  onNextChapter
}) => {
  const progressPercent = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;

  return (
    <motion.footer
      initial={false}
      animate={{ y: visible ? 0 : 100, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#0B0C15]/90 backdrop-blur-2xl border-t border-white/10 shadow-[0_-4px_30px_rgba(0,0,0,0.8)]"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-3 sm:gap-6">
        {/* Prev Chapter Button */}
        <button
          onClick={onPrevChapter}
          disabled={!navigation.hasPrev}
          className={`flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            !navigation.hasPrev
              ? 'bg-dark-100/50 text-gray-600 border border-white/5 cursor-not-allowed opacity-50'
              : 'bg-dark-200/90 hover:bg-dark-300 text-gray-200 hover:text-white border border-white/10 active:scale-95 shadow-lg'
          }`}
          title={navigation.hasPrev ? `Jump to Chapter ${navigation.prevChapter} ([)` : 'First Chapter'}
        >
          <ChevronLeftIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Prev Ch</span>
          {navigation.hasPrev && (
            <span className="text-[11px] text-gray-400 font-normal hidden md:inline">
              ({navigation.prevChapter})
            </span>
          )}
        </button>

        {/* Center: Interactive Scrubber Slider */}
        <div className="flex-1 flex flex-col items-center gap-1 max-w-md">
          <div className="w-full flex items-center justify-between text-xs text-gray-300 px-1 font-medium">
            <span>
              Page <strong className="text-white text-sm">{currentPage}</strong> of{' '}
              <span className="text-gray-400">{totalPages || 1}</span>
            </span>
            <span className="text-[11px] text-primary font-semibold">{progressPercent}%</span>
          </div>

          <div className="w-full relative flex items-center">
            <input
              type="range"
              min={1}
              max={totalPages || 1}
              value={currentPage}
              onChange={(e) => onPageChange(parseInt(e.target.value, 10))}
              className="w-full h-1.5 bg-dark-300 rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Next Chapter Button */}
        <button
          onClick={onNextChapter}
          disabled={!navigation.hasNext}
          className={`flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
            !navigation.hasNext
              ? 'bg-dark-100/50 text-gray-600 border border-white/5 cursor-not-allowed opacity-50'
              : 'bg-primary/90 hover:bg-primary text-white border border-primary/30 active:scale-95 shadow-lg'
          }`}
          title={navigation.hasNext ? `Jump to Chapter ${navigation.nextChapter} (])` : 'Latest Chapter'}
        >
          <span className="hidden sm:inline">Next Ch</span>
          {navigation.hasNext && (
            <span className="text-[11px] text-white/80 font-normal hidden md:inline">
              ({navigation.nextChapter})
            </span>
          )}
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </motion.footer>
  );
};

export default ReaderFooter;
