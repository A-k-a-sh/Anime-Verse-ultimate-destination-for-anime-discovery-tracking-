import { useEffect, useRef, useState } from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

const WebtoonImage = ({ page, index }) => {
  const [isInView, setIsInView] = useState(false);
  const [src, setSrc] = useState(null);
  const [hasFailedOnce, setHasFailedOnce] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef(null);
  const retryTimeoutRef = useRef(null);

  // Lazy observation: only assign src when container is within 600px of viewport
  useEffect(() => {
    if (isInView) return; // Once in view, never re-observe or unload

    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          setSrc(page.rawCdnUrl || page.proxyUrl);
          observer.disconnect();
        }
      },
      {
        rootMargin: '600px 0px 600px 0px',
        threshold: 0.01
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [isInView, page.rawCdnUrl, page.proxyUrl]);

  // Clean up retry timer on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, []);

  const handleError = () => {
    if (!hasFailedOnce && page.proxyUrl && src !== page.proxyUrl) {
      // First fallback: raw CDN failed (e.g. hotlink 403), switch to backend streaming proxy
      console.warn(`[Webtoon] Page ${page.pageNumber} raw URL failed, falling back to proxy`);
      setHasFailedOnce(true);
      setSrc(page.proxyUrl);
      return;
    }

    // Auto-retry with backoff up to 2 times before showing error UI (for transient CDN timeouts/429s)
    if (retryCount < 2) {
      const delay = (retryCount + 1) * 700;
      setRetryCount((prev) => prev + 1);
      retryTimeoutRef.current = setTimeout(() => {
        const baseProxy = page.proxyUrl || src;
        const separator = baseProxy && baseProxy.includes('?') ? '&' : '?';
        setSrc(`${baseProxy}${separator}retry=${Date.now()}`);
      }, delay);
    } else {
      setHasError(true);
    }
  };

  const handleManualRetry = () => {
    setHasError(false);
    setIsLoaded(false);
    setRetryCount(0);
    const baseProxy = page.proxyUrl || page.rawCdnUrl;
    const separator = baseProxy && baseProxy.includes('?') ? '&' : '?';
    setSrc(`${baseProxy}${separator}retry=${Date.now()}`);
  };

  return (
    <div
      ref={containerRef}
      data-page-number={page.pageNumber}
      className="relative w-full flex flex-col items-center justify-center min-h-[350px] sm:min-h-[550px] my-0.5"
    >
      {/* Skeleton Loading State */}
      {(!isLoaded || !isInView) && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-dark-200/50 animate-pulse text-gray-500 rounded-lg">
          <div className="text-xs font-semibold mb-1 text-gray-400">Page {page.pageNumber}</div>
          <div className="w-16 h-1 bg-dark-300 rounded-full" />
        </div>
      )}

      {/* Error Retry State */}
      {hasError ? (
        <div className="w-full py-16 flex flex-col items-center justify-center bg-dark-200/60 border border-white/5 rounded-xl text-center px-4 my-2">
          <ExclamationTriangleIcon className="w-8 h-8 text-amber-500 mb-2" />
          <p className="text-sm font-semibold text-gray-300 mb-1">
            Failed to load Page {page.pageNumber}
          </p>
          <p className="text-xs text-gray-500 mb-4 max-w-xs">
            The upstream image server blocked the request or timed out.
          </p>
          <button
            onClick={handleManualRetry}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-dark-300 hover:bg-dark-100 text-gray-200 hover:text-white text-xs font-semibold border border-white/10 transition-colors"
          >
            <ArrowPathIcon className="w-4 h-4" />
            <span>Retry Page</span>
          </button>
        </div>
      ) : (
        isInView && src && (
          <img
            src={src}
            alt={`Page ${page.pageNumber}`}
            onLoad={() => setIsLoaded(true)}
            onError={handleError}
            className={`w-full h-auto object-contain select-none transition-opacity duration-300 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              touchAction: 'pan-y pinch-zoom'
            }}
          />
        )
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
