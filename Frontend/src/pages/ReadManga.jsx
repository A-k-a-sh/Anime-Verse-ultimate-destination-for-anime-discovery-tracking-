import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mangaService } from '../services/mangaService';
import { watchlistService } from '../services/watchlistService';
import { readStorage } from '../utils/readStorage';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// Reader Subcomponents
import ReaderHeader from '../components/reader/ReaderHeader';
import ReaderFooter from '../components/reader/ReaderFooter';
import ChapterDrawer from '../components/reader/ChapterDrawer';
import ReaderSettingsModal from '../components/reader/ReaderSettingsModal';
import WebtoonView from '../components/reader/WebtoonView';
import SinglePageView from '../components/reader/SinglePageView';
import DoublePageView from '../components/reader/DoublePageView';

import Loader from '../components/Loader';
import { ExclamationTriangleIcon, ArrowPathIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';

const ReadManga = () => {
  const { id, chapter } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const containerRef = useRef(null);

  // Core Data States
  const [manga, setManga] = useState(null);
  const [chaptersList, setChaptersList] = useState([]);
  const [chapterPayload, setChapterPayload] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Reading Navigation State
  const [currentPage, setCurrentPage] = useState(1);
  const [readChapters, setReadChapters] = useState(() => readStorage.getReadChapters(id));

  // Settings & HUD States
  const [settings, setSettings] = useState(() => readStorage.getReaderSettings());
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-hide controls timer and scroll tracking
  const hideTimerRef = useRef(null);
  const lastScrollY = useRef(0);

  // Dynamic Browser Tab Title
  const mangaTitle = manga?.title || manga?.titleEnglish || 'Manga';
  const currentChapterNum = chapter || '1';
  useDocumentTitle(`${mangaTitle} - Chapter ${currentChapterNum}`);

  // 1. Initial redirect: if no chapter in URL, route to last read chapter (or first)
  useEffect(() => {
    if (!chapter && id) {
      const lastCh = readStorage.getLastReadChapter(id) || '1';
      navigate(`/read/${id}/${lastCh}`, { replace: true });
    }
  }, [id, chapter, navigate]);

  // 2. Fetch Manga Metadata
  useEffect(() => {
    if (!id) return;
    let isMounted = true;

    const fetchMangaDetails = async () => {
      try {
        const res = await mangaService.getById(id);
        if (isMounted && res.data) {
          setManga(res.data);
        }
      } catch (err) {
        console.warn('[ReadManga] Could not fetch manga details:', err.message);
      }
    };

    fetchMangaDetails();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // 3. Fetch Chapter List & Chapter Pages
  const loadChapterData = useCallback(async () => {
    if (!id || !chapter) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch chapter directory (cached in MongoDB)
      const chaptersRes = await mangaService.getChapters(id, manga?.title);
      const allChapters = chaptersRes?.data?.chapters || [];
      setChaptersList(allChapters);

      // Fetch pages for target chapter
      const pagesRes = await mangaService.getChapterPages(id, chapter, manga?.title);
      if (pagesRes?.success && pagesRes?.data) {
        setChapterPayload(pagesRes.data);
        setCurrentPage(1);
        // Scroll to top on chapter change
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else {
        throw new Error(pagesRes?.message || 'Failed to load chapter pages');
      }
    } catch (err) {
      console.error('[ReadManga] Error loading chapter:', err);
      setError(err.message || 'Failed to load chapter pages. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id, chapter, manga?.title]);

  useEffect(() => {
    loadChapterData();
  }, [loadChapterData]);

  // 4. Progress Tracking Sync (Guest + Authenticated)
  const syncProgress = useCallback(
    (pageNumber) => {
      if (!id || !chapter || !chapterPayload) return;
      const totalPages = chapterPayload.totalPages || chapterPayload.pages?.length || 1;

      // Mark as read if user viewed at least 85% of pages or reached final page
      if (pageNumber >= Math.floor(totalPages * 0.85) || pageNumber >= totalPages) {
        const updated = readStorage.markChapterRead(id, chapter);
        setReadChapters(updated);

        // Sync with MongoDB watchlist if logged in
        if (isAuthenticated) {
          const totalChapters = chaptersList.length || manga?.chapters || null;
          watchlistService.updateMangaProgress(id, chapter, manga, totalChapters);
        }
      }
    },
    [id, chapter, chapterPayload, chaptersList.length, manga, isAuthenticated]
  );

  // 5. HUD Controls Auto-Hide Behavior
  const resetHideTimer = useCallback(() => {
    setIsControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);

    // Only auto-hide if drawer and settings are closed
    if (!isDrawerOpen && !isSettingsOpen) {
      hideTimerRef.current = setTimeout(() => {
        setIsControlsVisible(false);
      }, 3500);
    }
  }, [isDrawerOpen, isSettingsOpen]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [resetHideTimer]);

  // Scroll listener for Webtoon mode (hide on scroll down, show on scroll up)
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (Math.abs(currentScrollY - lastScrollY.current) > 40) {
        if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
          // Scrolling down -> hide HUD
          setIsControlsVisible(false);
        } else {
          // Scrolling up -> show HUD
          setIsControlsVisible(true);
        }
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse move listener for desktop
  useEffect(() => {
    const handleMouseMove = () => {
      resetHideTimer();
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [resetHideTimer]);

  // 6. Navigation Handlers
  const handlePrevChapter = useCallback(() => {
    if (chapterPayload?.navigation?.hasPrev && chapterPayload.navigation.prevChapter) {
      navigate(`/read/${id}/${chapterPayload.navigation.prevChapter}`);
    }
  }, [id, chapterPayload, navigate]);

  const handleNextChapter = useCallback(() => {
    if (chapterPayload?.navigation?.hasNext && chapterPayload.navigation.nextChapter) {
      navigate(`/read/${id}/${chapterPayload.navigation.nextChapter}`);
    }
  }, [id, chapterPayload, navigate]);

  const totalPages = chapterPayload?.totalPages || chapterPayload?.pages?.length || 1;

  const handlePageChange = useCallback(
    (newPageNum) => {
      const clamped = Math.max(1, Math.min(newPageNum, totalPages));
      setCurrentPage(clamped);
      syncProgress(clamped);

      // In Webtoon mode, scroll smoothly to the target page element
      if (settings.mode === 'webtoon') {
        const targetEl = document.querySelector(`[data-page-number="${clamped}"]`);
        if (targetEl) {
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    },
    [totalPages, syncProgress, settings.mode]
  );

  const handleNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      handlePageChange(currentPage + 1);
    } else if (chapterPayload?.navigation?.hasNext) {
      handleNextChapter();
    }
  }, [currentPage, totalPages, handlePageChange, chapterPayload, handleNextChapter]);

  const handlePrevPage = useCallback(() => {
    if (currentPage > 1) {
      handlePageChange(currentPage - 1);
    } else if (chapterPayload?.navigation?.hasPrev) {
      handlePrevChapter();
    }
  }, [currentPage, handlePageChange, chapterPayload, handlePrevChapter]);

  // Next / Prev spread for Double Page mode
  const handleNextSpread = useCallback(() => {
    if (currentPage === 1) {
      handlePageChange(2);
    } else if (currentPage + 2 <= totalPages) {
      handlePageChange(currentPage + 2);
    } else if (chapterPayload?.navigation?.hasNext) {
      handleNextChapter();
    }
  }, [currentPage, totalPages, handlePageChange, chapterPayload, handleNextChapter]);

  const handlePrevSpread = useCallback(() => {
    if (currentPage <= 2) {
      handlePageChange(1);
    } else if (currentPage - 2 >= 1) {
      handlePageChange(currentPage - 2);
    } else if (chapterPayload?.navigation?.hasPrev) {
      handlePrevChapter();
    }
  }, [currentPage, handlePageChange, chapterPayload, handlePrevChapter]);

  // 7. Fullscreen Toggle
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // 8. Global Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in search input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          if (settings.mode === 'webtoon') {
            handleNextChapter();
          } else if (settings.mode === 'double') {
            settings.direction === 'rtl' ? handlePrevSpread() : handleNextSpread();
          } else {
            settings.direction === 'rtl' ? handlePrevPage() : handleNextPage();
          }
          break;

        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          if (settings.mode === 'webtoon') {
            handlePrevChapter();
          } else if (settings.mode === 'double') {
            settings.direction === 'rtl' ? handleNextSpread() : handlePrevSpread();
          } else {
            settings.direction === 'rtl' ? handleNextPage() : handlePrevPage();
          }
          break;

        case 'BracketRight': // ']'
          e.preventDefault();
          handleNextChapter();
          break;

        case 'BracketLeft': // '['
          e.preventDefault();
          handlePrevChapter();
          break;

        case 'KeyF':
          e.preventDefault();
          handleToggleFullscreen();
          break;

        case 'KeyM':
          e.preventDefault();
          // Cycle modes: webtoon -> single -> double -> webtoon
          setSettings((prev) => {
            const cycle = { webtoon: 'single', single: 'double', double: 'webtoon' };
            const nextMode = cycle[prev.mode] || 'webtoon';
            const updated = { ...prev, mode: nextMode };
            readStorage.saveReaderSettings(updated);
            return updated;
          });
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    settings.mode,
    settings.direction,
    handleNextPage,
    handlePrevPage,
    handleNextSpread,
    handlePrevSpread,
    handleNextChapter,
    handlePrevChapter
  ]);

  // Update Settings Handler
  const handleUpdateSettings = (partial) => {
    const updated = readStorage.saveReaderSettings(partial);
    setSettings(updated);
  };

  // Canvas Background Theme Styles
  const themeBgClasses = useMemo(() => {
    switch (settings.theme) {
      case 'black':
        return 'bg-[#000000] text-gray-200';
      case 'sepia':
        return 'bg-[#1f1b16] text-[#dfd4c5]';
      case 'dark':
      default:
        return 'bg-[#121212] text-gray-200';
    }
  }, [settings.theme]);

  // Loading State
  if (loading) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center ${themeBgClasses}`}>
        <Loader fullScreen={false} />
        <p className="mt-4 text-sm text-gray-400 font-medium animate-pulse">
          Loading Chapter {currentChapterNum} pages...
        </p>
      </div>
    );
  }

  // Error State
  if (error || !chapterPayload) {
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 ${themeBgClasses}`}>
        <div className="max-w-md w-full p-8 rounded-2xl bg-dark-200/90 border border-white/10 text-center shadow-2xl">
          <ExclamationTriangleIcon className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Chapter Not Available</h2>
          <p className="text-xs text-gray-400 mb-6 leading-relaxed">
            {error || 'Unable to load pages for this chapter.'}
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate(`/manga/${id}`)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-dark-300 hover:bg-dark-100 text-gray-200 text-xs font-semibold border border-white/10 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back to Manga</span>
            </button>
            <button
              onClick={loadChapterData}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow-lg transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Retry Chapter</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const pages = chapterPayload.pages || [];

  return (
    <div
      ref={containerRef}
      className={`min-h-screen w-full relative transition-colors duration-300 ${themeBgClasses} select-none`}
    >
      {/* 1. Top Floating Header HUD */}
      <ReaderHeader
        visible={isControlsVisible}
        mangaTitle={mangaTitle}
        currentChapter={currentChapterNum}
        chapterTitle={chapterPayload.chapterTitle}
        readingMode={settings.mode}
        isFullscreen={isFullscreen}
        onBack={() => navigate(`/manga/${id}`)}
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onToggleFullscreen={handleToggleFullscreen}
      />

      {/* 2. Main Reader View Container */}
      <main className="w-full min-h-screen pt-14 pb-16 flex flex-col items-center justify-center">
        {settings.mode === 'webtoon' && (
          <WebtoonView
            pages={pages}
            currentPage={currentPage}
            onVisiblePageChange={(pageNum) => {
              setCurrentPage(pageNum);
              syncProgress(pageNum);
            }}
            maxWidth={settings.maxWidth}
            onTapCenter={() => setIsControlsVisible((prev) => !prev)}
            navigation={chapterPayload.navigation}
            onNextChapter={handleNextChapter}
          />
        )}

        {settings.mode === 'single' && (
          <SinglePageView
            pages={pages}
            currentPage={currentPage}
            direction={settings.direction}
            fit={settings.fit}
            onNextPage={handleNextPage}
            onPrevPage={handlePrevPage}
            onTapCenter={() => setIsControlsVisible((prev) => !prev)}
          />
        )}

        {settings.mode === 'double' && (
          <DoublePageView
            pages={pages}
            currentPage={currentPage}
            direction={settings.direction}
            onNextSpread={handleNextSpread}
            onPrevSpread={handlePrevSpread}
            onTapCenter={() => setIsControlsVisible((prev) => !prev)}
          />
        )}
      </main>

      {/* 3. Bottom Floating Footer HUD */}
      <ReaderFooter
        visible={isControlsVisible}
        currentPage={currentPage}
        totalPages={totalPages}
        navigation={chapterPayload.navigation}
        onPageChange={handlePageChange}
        onPrevChapter={handlePrevChapter}
        onNextChapter={handleNextChapter}
      />

      {/* 4. Slide-over Chapter Directory Drawer */}
      <ChapterDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        chapters={chaptersList}
        currentChapter={currentChapterNum}
        readChapters={readChapters}
        onSelectChapter={(targetCh) => navigate(`/read/${id}/${targetCh}`)}
      />

      {/* 5. Reader Configuration Settings Modal */}
      <ReaderSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={handleUpdateSettings}
      />
    </div>
  );
};

export default ReadManga;
