import { useState, useEffect } from 'react';
import { ArrowPathIcon, ExclamationTriangleIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

const SpreadImage = ({ page, alt, isSolo = false }) => {
  const [src, setSrc] = useState(page?.rawCdnUrl || page?.proxyUrl);
  const [hasFailedOnce, setHasFailedOnce] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (page) {
      setSrc(page.rawCdnUrl || page.proxyUrl);
      setHasFailedOnce(false);
      setHasError(false);
      setIsLoaded(false);
    }
  }, [page]);

  const handleError = () => {
    if (!hasFailedOnce && page?.proxyUrl && src !== page.proxyUrl) {
      setHasFailedOnce(true);
      setSrc(page.proxyUrl);
    } else {
      setHasError(true);
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoaded(false);
    setSrc(`${page?.proxyUrl}&retry=${Date.now()}`);
  };

  if (!page) return <div className="flex-1" />;

  return (
    <div className={`relative flex items-center justify-center ${isSolo ? 'max-w-xl' : 'flex-1 max-w-[50%]'}`}>
      {!isLoaded && !hasError && (
        <div className="w-64 h-[65vh] bg-dark-200/40 rounded-lg animate-pulse flex items-center justify-center text-gray-500 text-xs">
          Page {page.pageNumber}
        </div>
      )}

      {hasError ? (
        <div className="p-4 bg-dark-200/80 border border-white/10 rounded-xl text-center z-10">
          <ExclamationTriangleIcon className="w-6 h-6 text-amber-500 mx-auto mb-1" />
          <p className="text-xs text-gray-300">Failed Page {page.pageNumber}</p>
          <button
            onClick={handleRetry}
            className="mt-2 px-2.5 py-1 bg-dark-300 hover:bg-dark-100 text-white rounded text-[11px] flex items-center gap-1 mx-auto"
          >
            <ArrowPathIcon className="w-3 h-3" />
            <span>Retry</span>
          </button>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
          className={`max-h-[85vh] w-auto object-contain select-none shadow-2xl transition-opacity duration-200 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
};

const DoublePageView = ({
  pages = [],
  currentPage = 1,
  direction = 'rtl', // 'rtl' (default) | 'ltr'
  onNextSpread,
  onPrevSpread,
  onTapCenter
}) => {
  // Page 1 is traditionally a cover / solo spread
  const isSoloCover = currentPage === 1;

  let pageLeft = null;
  let pageRight = null;

  if (isSoloCover) {
    pageRight = pages[0];
  } else {
    // Normal 2-page spread
    // Normalize to even pairs: if current page is 2, pair is (2, 3). If current page is 3, pair is (2, 3)
    const baseIdx = currentPage % 2 === 0 ? currentPage - 1 : currentPage - 2;
    const firstPage = pages[baseIdx] || null;
    const secondPage = pages[baseIdx + 1] || null;

    if (direction === 'rtl') {
      // In Japanese RTL: first read page is on the RIGHT, second is on the LEFT
      pageRight = firstPage;
      pageLeft = secondPage;
    } else {
      // LTR: first read page is on the LEFT, second is on the RIGHT
      pageLeft = firstPage;
      pageRight = secondPage;
    }
  }

  // Preload upcoming spread
  useEffect(() => {
    if (!pages.length) return;
    const nextIdx = isSoloCover ? 1 : currentPage + 2;
    [nextIdx, nextIdx + 1].forEach((idx) => {
      if (idx < pages.length && pages[idx]) {
        const img = new Image();
        img.src = pages[idx].rawCdnUrl || pages[idx].proxyUrl;
      }
    });
  }, [currentPage, isSoloCover, pages]);

  const handleZoneClick = (zone) => {
    if (zone === 'center') {
      if (onTapCenter) onTapCenter();
      return;
    }

    if (direction === 'rtl') {
      if (zone === 'left') onNextSpread();
      else if (zone === 'right') onPrevSpread();
    } else {
      if (zone === 'left') onPrevSpread();
      else if (zone === 'right') onNextSpread();
    }
  };

  return (
    <div className="relative w-full min-h-[85vh] flex items-center justify-center select-none overflow-hidden py-2 sm:py-4 px-2">
      {/* Click Navigation Overlay Zones */}
      <div className="absolute inset-0 z-20 flex pointer-events-auto">
        <div
          onClick={() => handleZoneClick('left')}
          className="w-[30%] h-full cursor-pointer flex items-center justify-start pl-4 group"
          title={direction === 'rtl' ? 'Next Spread' : 'Previous Spread'}
        >
          <div className="opacity-0 group-hover:opacity-40 transition-opacity bg-black/50 p-2 rounded-full text-white">
            <ChevronLeftIcon className="w-6 h-6" />
          </div>
        </div>

        <div
          onClick={() => handleZoneClick('center')}
          className="w-[40%] h-full cursor-pointer"
          title="Toggle Controls"
        />

        <div
          onClick={() => handleZoneClick('right')}
          className="w-[30%] h-full cursor-pointer flex items-center justify-end pr-4 group"
          title={direction === 'rtl' ? 'Previous Spread' : 'Next Spread'}
        >
          <div className="opacity-0 group-hover:opacity-40 transition-opacity bg-black/50 p-2 rounded-full text-white">
            <ChevronRightIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Double Spread Stage */}
      <div className="flex items-center justify-center gap-1 sm:gap-2 max-w-7xl w-full">
        {isSoloCover ? (
          <SpreadImage page={pageRight} alt="Cover Page" isSolo />
        ) : (
          <>
            <SpreadImage page={pageLeft} alt={`Page ${pageLeft?.pageNumber || ''}`} />
            <SpreadImage page={pageRight} alt={`Page ${pageRight?.pageNumber || ''}`} />
          </>
        )}
      </div>
    </div>
  );
};

export default DoublePageView;
