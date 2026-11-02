import { useState, useEffect } from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

const SinglePageView = ({
  pages = [],
  currentPage = 1,
  direction = 'rtl', // 'rtl' (default) | 'ltr'
  fit = 'width',     // 'width' | 'height' | 'original'
  onNextPage,
  onPrevPage,
  onTapCenter
}) => {
  const currentIndex = Math.max(0, Math.min(currentPage - 1, pages.length - 1));
  const currentPageData = pages[currentIndex];

  const needsProxy = currentPageData?.provider === 'mangapill' || (currentPageData?.rawCdnUrl && currentPageData.rawCdnUrl.includes('readdetectiveconan'));
  const initialSrc = (needsProxy && currentPageData?.proxyUrl) ? currentPageData.proxyUrl : (currentPageData?.rawCdnUrl || currentPageData?.proxyUrl);

  const [src, setSrc] = useState(initialSrc);
  const [hasFailedOnce, setHasFailedOnce] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Update src when page changes & reset states
  useEffect(() => {
    if (currentPageData) {
      const pageNeedsProxy = currentPageData.provider === 'mangapill' || (currentPageData.rawCdnUrl && currentPageData.rawCdnUrl.includes('readdetectiveconan'));
      setSrc((pageNeedsProxy && currentPageData.proxyUrl) ? currentPageData.proxyUrl : (currentPageData.rawCdnUrl || currentPageData.proxyUrl));
      setHasFailedOnce(false);
      setHasError(false);
      setIsLoaded(false);
    }
  }, [currentPage, currentPageData]);

  // Preload the next 2 pages in memory for instantaneous flipping
  useEffect(() => {
    if (!pages.length) return;
    const preloadIndexes = [currentIndex + 1, currentIndex + 2];
    preloadIndexes.forEach((idx) => {
      if (idx < pages.length && pages[idx]) {
        const nextImg = new Image();
        nextImg.src = pages[idx].rawCdnUrl || pages[idx].proxyUrl;
      }
    });
  }, [currentIndex, pages]);

  const handleError = () => {
    if (!hasFailedOnce && currentPageData?.proxyUrl && src !== currentPageData.proxyUrl) {
      console.warn(`[SinglePage] Page ${currentPage} raw CDN failed, trying proxy`);
      setHasFailedOnce(true);
      setSrc(currentPageData.proxyUrl);
    } else {
      setHasError(true);
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoaded(false);
    setSrc(`${currentPageData?.proxyUrl}&retry=${Date.now()}`);
  };

  // Determine fit CSS classes
  const getFitClasses = () => {
    switch (fit) {
      case 'height':
        return 'max-h-[92vh] w-auto object-contain';
      case 'original':
        return 'w-auto h-auto max-w-none';
      case 'width':
      default:
        return 'max-w-full max-h-[92vh] w-auto object-contain';
    }
  };

  // Click zone handling:
  // In RTL: Left zone = NEXT, Right zone = PREV
  // In LTR: Left zone = PREV, Right zone = NEXT
  const handleZoneClick = (zone) => {
    if (zone === 'center') {
      if (onTapCenter) onTapCenter();
      return;
    }

    if (direction === 'rtl') {
      if (zone === 'left') onNextPage();
      else if (zone === 'right') onPrevPage();
    } else {
      if (zone === 'left') onPrevPage();
      else if (zone === 'right') onNextPage();
    }
  };

  if (!currentPageData) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center text-gray-500">
        No page data available.
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[85vh] flex items-center justify-center select-none overflow-hidden py-2 sm:py-4">
      {/* Click Navigation Overlay Zones */}
      <div className="absolute inset-0 z-20 flex pointer-events-auto">
        {/* Left Zone (30% width) */}
        <div
          onClick={() => handleZoneClick('left')}
          className="w-[30%] h-full cursor-pointer flex items-center justify-start pl-4 group"
          title={direction === 'rtl' ? 'Next Page' : 'Previous Page'}
        >
          <div className="opacity-0 group-hover:opacity-40 transition-opacity bg-black/50 p-2 rounded-full text-white">
            <ChevronLeftIcon className="w-6 h-6" />
          </div>
        </div>

        {/* Center Zone (40% width) - Toggles HUD */}
        <div
          onClick={() => handleZoneClick('center')}
          className="w-[40%] h-full cursor-pointer"
          title="Toggle Controls"
        />

        {/* Right Zone (30% width) */}
        <div
          onClick={() => handleZoneClick('right')}
          className="w-[30%] h-full cursor-pointer flex items-center justify-end pr-4 group"
          title={direction === 'rtl' ? 'Previous Page' : 'Next Page'}
        >
          <div className="opacity-0 group-hover:opacity-40 transition-opacity bg-black/50 p-2 rounded-full text-white">
            <ChevronRightIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Single Page Canvas */}
      <div className="relative flex items-center justify-center max-w-full">
        {!isLoaded && !hasError && (
          <div className="w-72 sm:w-96 h-[70vh] bg-dark-200/40 rounded-xl animate-pulse flex flex-col items-center justify-center text-gray-500">
            <span className="text-sm font-semibold">Page {currentPage}</span>
          </div>
        )}

        {hasError ? (
          <div className="p-8 bg-dark-200 border border-white/10 rounded-2xl text-center max-w-sm z-30">
            <ExclamationTriangleIcon className="w-10 h-10 text-amber-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-white mb-1">Failed to load Page {currentPage}</h4>
            <p className="text-xs text-gray-400 mb-4">
              Unable to load the page image from CDN or proxy.
            </p>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 mx-auto transition-colors"
            >
              <ArrowPathIcon className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        ) : (
          <img
            src={src}
            alt={`Page ${currentPage}`}
            onLoad={() => setIsLoaded(true)}
            onError={handleError}
            className={`${getFitClasses()} rounded-sm shadow-2xl transition-opacity duration-200 ${
              isLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />
        )}
      </div>
    </div>
  );
};

export default SinglePageView;
