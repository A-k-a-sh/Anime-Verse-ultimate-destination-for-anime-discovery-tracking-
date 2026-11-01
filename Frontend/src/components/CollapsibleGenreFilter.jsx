import { useState, useMemo, useEffect } from 'react';
import { ChevronDownIcon, ChevronUpIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { ALL_GENRES, POPULAR_GENRES } from '../constants/genres';

const CollapsibleGenreFilter = ({ selectedGenre, onSelectGenre }) => {
  const isSelectedOutsidePopular = useMemo(() => {
    if (!selectedGenre) return false;
    return !POPULAR_GENRES.some((g) => g.toLowerCase() === selectedGenre.toLowerCase());
  }, [selectedGenre]);

  const [isExpanded, setIsExpanded] = useState(isSelectedOutsidePopular);

  // If selected genre changes to one outside popular list, ensure it's visible
  useEffect(() => {
    if (isSelectedOutsidePopular && !isExpanded) {
      setIsExpanded(true);
    }
  }, [isSelectedOutsidePopular]);

  const displayedGenres = isExpanded ? ALL_GENRES : POPULAR_GENRES;

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-300">
          Genres {selectedGenre && <span className="text-primary font-bold">({selectedGenre})</span>}
        </label>
        {selectedGenre && (
          <button
            type="button"
            onClick={() => onSelectGenre('')}
            className="text-xs text-primary hover:text-primary/80 flex items-center gap-0.5 cursor-pointer"
          >
            <XMarkIcon className="w-3 h-3" />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Genre Pills */}
      <div className="flex flex-wrap gap-1.5 max-h-[320px] overflow-y-auto scrollbar-thin pr-1">
        {displayedGenres.map((genre) => {
          const isSelected = selectedGenre?.toLowerCase() === genre.toLowerCase();
          return (
            <button
              key={genre}
              type="button"
              onClick={() => onSelectGenre(isSelected ? '' : genre)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isSelected
                  ? 'bg-primary text-white shadow-md font-bold'
                  : 'bg-dark-100 text-gray-300 hover:bg-dark-300 hover:text-white border border-white/5'
              }`}
            >
              {genre}
            </button>
          );
        })}
      </div>

      {/* Expand / Collapse Button */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-center gap-1.5 pt-1.5 text-xs text-primary hover:text-primary/80 font-semibold transition-colors cursor-pointer"
      >
        <span>{isExpanded ? 'Show Fewer Genres' : `Show All ${ALL_GENRES.length} Genres`}</span>
        {isExpanded ? (
          <ChevronUpIcon className="w-3.5 h-3.5" />
        ) : (
          <ChevronDownIcon className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
};

export default CollapsibleGenreFilter;
