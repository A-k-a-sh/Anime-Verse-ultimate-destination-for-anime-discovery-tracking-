import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { PlayIcon, StarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

/**
 * Related / Recommended Anime List for Watch Page
 * Horizontal X-Axis scrollable rail with smooth arrow navigation
 */
const RelatedAnimeList = ({ recommendations = [], loading = false }) => {
  const scrollRef = useRef(null);

  const handleScroll = (direction) => {
    if (scrollRef.current) {
      const offset = direction === 'left' ? -380 : 380;
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className="bg-dark-200 rounded-xl p-4 border border-white/5">
        <h3 className="text-base font-bold text-white mb-3">You May Also Like</h3>
        <div className="flex gap-3 overflow-hidden pb-1">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="shrink-0 w-32 sm:w-36 aspect-[2/3] bg-dark-100 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  // Normalize anime entries (can come from recommendations endpoint or anime search)
  const items = recommendations.slice(0, 18).map((item) => {
    const anime = item.entry || item;
    const malId = anime.mal_id || anime.malId;
    const title = anime.title || anime.titleEnglish || 'Unknown Title';
    const imageUrl =
      anime.images?.jpg?.image_url ||
      anime.images?.jpg?.large_image_url ||
      anime.imageUrl ||
      '';
    const score = anime.score ? Number(anime.score).toFixed(1) : null;

    return { malId, title, imageUrl, score };
  });

  return (
    <div className="bg-dark-200 rounded-xl p-4 border border-white/5">
      {/* Header with Navigation Arrows */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>You May Also Like</span>
        </h3>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleScroll('left')}
            aria-label="Scroll left"
            className="p-1 rounded-lg bg-dark-100 hover:bg-dark-300 text-gray-400 hover:text-white border border-white/5 transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleScroll('right')}
            aria-label="Scroll right"
            className="p-1 rounded-lg bg-dark-100 hover:bg-dark-300 text-gray-400 hover:text-white border border-white/5 transition-colors"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scrollable Rail */}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent snap-x"
      >
        {items.map((item) => (
          <div
            key={item.malId}
            className="shrink-0 w-32 sm:w-36 snap-start group relative bg-dark-100 rounded-lg overflow-hidden border border-white/5 hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
          >
            <Link to={`/anime/${item.malId}`} className="block">
              {/* Image Container */}
              <div className="relative aspect-[2/3] overflow-hidden bg-black/40">
                {item.imageUrl ? (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">
                    No Image
                  </div>
                )}

                {/* Score badge */}
                {item.score && (
                  <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] text-yellow-400 font-semibold flex items-center gap-0.5">
                    <StarIcon className="w-2.5 h-2.5" />
                    <span>{item.score}</span>
                  </div>
                )}

                {/* Quick Watch Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Link
                    to={`/watch/${item.malId}/1`}
                    className="p-2.5 bg-primary hover:bg-primary/90 text-white rounded-full shadow-lg transform scale-90 group-hover:scale-100 transition-transform"
                    title={`Watch ${item.title}`}
                  >
                    <PlayIcon className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Title */}
              <div className="p-2">
                <h4
                  className="text-xs font-medium text-gray-200 line-clamp-1 group-hover:text-primary transition-colors"
                  title={item.title}
                >
                  {item.title}
                </h4>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RelatedAnimeList;
