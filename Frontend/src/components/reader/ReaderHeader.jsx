import { motion } from 'framer-motion';
import {
  ArrowLeftIcon,
  Cog6ToothIcon,
  QueueListIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

const ReaderHeader = ({
  visible = true,
  mangaTitle = '',
  currentChapter = '1',
  chapterTitle = '',
  readingMode = 'webtoon',
  isFullscreen = false,
  onBack,
  onOpenDrawer,
  onOpenSettings,
  onToggleFullscreen
}) => {
  const modeLabels = {
    webtoon: 'Webtoon',
    single: 'Single Page',
    double: 'Double Spread'
  };

  return (
    <motion.header
      initial={false}
      animate={{ y: visible ? 0 : -100, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="fixed top-0 left-0 right-0 z-50 bg-[#0B0C15]/90 backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.8)]"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        {/* Left: Back & Manga Title Breadcrumbs */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-dark-200/80 hover:bg-dark-300 text-gray-300 hover:text-white border border-white/10 transition-all active:scale-95 flex-shrink-0"
            title="Return to Manga Details"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>

          <div className="flex flex-col min-w-0">
            <span className="text-xs text-primary font-medium tracking-wide uppercase truncate hidden sm:block">
              {mangaTitle || 'Manga Reader'}
            </span>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white truncate max-w-[180px] sm:max-w-xs md:max-w-md">
                Chapter {currentChapter}
                {chapterTitle ? ` — ${chapterTitle}` : ''}
              </h1>
            </div>
          </div>
        </div>

        {/* Right: Quick Chapter Drawer, Mode Badge, Settings & Fullscreen */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 flex-shrink-0">
          {/* Chapter Drawer Toggle */}
          <button
            onClick={onOpenDrawer}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-200/80 hover:bg-dark-300 text-gray-200 hover:text-white border border-white/10 transition-all text-xs font-semibold active:scale-95"
            title="View Chapters List"
          >
            <QueueListIcon className="w-4 h-4 text-primary" />
            <span className="hidden sm:inline">Chapters</span>
          </button>

          {/* Reading Mode Badge / Shortcut */}
          <button
            onClick={onOpenSettings}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-dark-100 hover:bg-dark-300 text-gray-300 hover:text-white border border-white/10 transition-all text-xs font-medium"
            title="Current Reading Mode (Click to change)"
          >
            <BookOpenIcon className="w-3.5 h-3.5 text-secondary" />
            <span>{modeLabels[readingMode] || 'Mode'}</span>
          </button>

          {/* Settings Modal Toggle */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl bg-dark-200/80 hover:bg-dark-300 text-gray-300 hover:text-white border border-white/10 transition-all active:scale-95"
            title="Reader Settings"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={onToggleFullscreen}
            className="p-2 rounded-xl bg-dark-200/80 hover:bg-dark-300 text-gray-300 hover:text-white border border-white/10 transition-all active:scale-95"
            title={isFullscreen ? 'Exit Fullscreen (F)' : 'Fullscreen (F)'}
          >
            {isFullscreen ? (
              <ArrowsPointingInIcon className="w-5 h-5 text-primary" />
            ) : (
              <ArrowsPointingOutIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </motion.header>
  );
};

export default ReaderHeader;
