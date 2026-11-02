import { useEffect, useRef, useState } from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

const WebtoonImage = ({ page, index, onVisible }) => {
  const [src, setSrc] = useState(page.rawCdnUrl || page.proxyUrl);
  const [hasFailedOnce, setHasFailedOnce] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef(null);

  const handleError = () => {
    if (!hasFailedOnce && page.proxyUrl && src !== page.proxyUrl) {
      // Automatic fallback to backend streaming proxy on first load failure (e.g. Hotlink 403)
      console.warn(`[Webtoon] Page ${page.pageNumber} raw URL failed, falling back to proxy`);
      setHasFailedOnce(true);
      setSrc(page.proxyUrl);
    } else {
      setHasError(true);
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoaded(false);
    setSrc(`${page.proxyUrl}&retry=${Date.now()}`);
  };

  return (
    <div
      ref={imgRef}
      data-page-number={page.pageNumber}
      className="relative w-full flex flex-col items-center justify-center min-h-[300px] sm:min-h-[500px]"
    >
      {/* Skeleton Loading State */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-200/40 animate-pulse text-gray-500 rounded-lg">
          <div className="text-xs font-semibold mb-1">Page {page.pageNumber}</div>
          <div className="w-12 h-1 bg-dark-300 rounded-full" />
        </div>
      )}

      {/* Error Retry State */}
      {hasError ? (
        <div className="w-full py-16 flex flex-col items-center justify-center bg-dark-200/60 border border-white/5 rounded-xl text-center px-4">
          <ExclamationTriangleIcon className="w-8 h-8 text-amber-500 mb-2" />
          <p className="text-sm font-semibold text-gray-300 mb-1">
            Failed to load Page {page.pageNumber}
          </p>
          <p className="text-xs text-gray-500 mb-4 max-w-xs">
            The upstream image server blocked the request or timed out.
          </p>
          <button
            onClick={handleRetry}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-dark-300 hover:bg-dark-100 text-gray-200 hover:text-white text-xs font-semibold border border-white/10 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Retry Page</span>
          </button>
        </div>
      ) : (
        <img
          src={src}
          alt={`Page ${page.pageNumber}`}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
          className={`w-full h-auto object-contain select-none transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            touchAction: 'pan-y pinch-zoom'
          }}
        />
      )}

      {/* Page Number Watermark Indicator */}
      <span className="absolute bottom-2 right-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-black/60 text-gray-400 select-none pointer-events-none">
        {page.pageNumber}
      </span>
    </div>
  );
};

const WebtoonView = ({
  pages = [],
  currentPage = 1,
  onVisiblePageChange,
  maxWidth = '900px',
  onTapCenter,
  navigation = {},
  onNextChapter
}) => {
  const containerRef = useRef(null);

  // Setup IntersectionObserver to track visible page number
  useEffect(() => {
    if (!containerRef.current || !pages.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const pageNum = parseInt(entry.target.getAttribute('data-page-number'), 10);
            if (!isNaN(pageNum) && onVisiblePageChange) {
              onVisiblePageChange(pageNum);
            }
          }
        });
      },
      {
        root: null,
        rootMargin: '-35% 0px -35% 0px', // Trigger when page enters center 30% of viewport
        threshold: 0.1
      }
    );

    const elements = containerRef.current.querySelectorAll('[data-page-number]');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [pages, onVisiblePageChange]);

  return (
    <div
      ref={containerRef}
      onClick={(e) => {
        // Tap center detection for HUD toggle
        const { clientY, currentTarget } = e;
        const rect = currentTarget.getBoundingClientRect();
        // If clicking images or body, pass click
        if (onTapCenter) onTapCenter();
      }}
      className="w-full flex flex-col items-center mx-auto transition-all duration-200"
      style={{ maxWidth }}
    >
      {pages.map((page, index) => (
        <WebtoonImage
          key={page.pageNumber || index}
          page={page}
          index={index}
        />
      ))}

      {/* Chapter End Card */}
      {pages.length > 0 && (
        <div className="w-full max-w-md my-16 p-6 rounded-2xl bg-dark-200/90 border border-white/10 text-center shadow-2xl mx-4">
          <div className="text-3xl mb-2">🎉</div>
          <h3 className="text-lg font-bold text-white mb-1">
            End of Chapter
          </h3>
          <p className="text-xs text-gray-400 mb-5">
            You've completed all {pages.length} pages of this chapter!
          </p>

          {navigation.hasNext ? (
            <button
              onClick={onNextChapter}
              className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-sm shadow-lg transition-all active:scale-95"
            >
              <span>Next Chapter ({navigation.nextChapter})</span>
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          ) : (
            <p className="text-xs text-emerald-400 font-semibold">
              ✨ You are all caught up with the latest released chapter!
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default WebtoonView;
