import { useState } from 'react';
import {
  ExclamationTriangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowTopRightOnSquareIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';

/**
 * Checks whether an anime is classified as adult / 18+ content (Rx rating or Hentai / Erotica genre)
 */
export const isAdultAnime = (anime) => {
  if (!anime) return false;
  if (anime.isAdult === true) return true;

  const genres = anime.genres || [];
  const genreNames = genres.map((g) =>
    (typeof g === 'string' ? g : g?.name || g?.title || '').toLowerCase()
  );
  if (genreNames.some((g) => g.includes('hentai') || g.includes('erotica'))) {
    return true;
  }

  if (typeof anime.rating === 'string') {
    const ratingLower = anime.rating.toLowerCase();
    if (ratingLower.includes('rx') || ratingLower.includes('hentai')) {
      return true;
    }
  }

  return false;
};

/**
 * Collapsible helper alert rendered on Watch page for 18+ / Rx titles.
 * Provides context on why standard video servers (MegaPlay / Zoko) may return a 404,
 * and provides external links to dedicated adult platforms (Hanime.tv, HentaiMama).
 */
const AdultStreamNotice = ({ anime }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isAdultAnime(anime)) return null;

  const searchTitle = anime.title || anime.titleEnglish || '';
  const altTitle = anime.titleJapanese || anime.title_japanese || anime.titleEnglish || '';

  const handleCopyTitle = (textToCopy) => {
    if (!textToCopy) return;
    navigator.clipboard?.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-dark-200/90 border border-amber-500/25 rounded-xl p-3 sm:p-4 text-xs text-gray-300 transition-all shadow-sm">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left gap-3 focus:outline-none group cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1 rounded-md bg-amber-500/10 text-amber-400 shrink-0">
            <ExclamationTriangleIcon className="w-4 h-4" />
          </span>
          <span className="font-medium text-gray-200 group-hover:text-white transition-colors truncate">
            Video not playing or showing 404?
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-amber-400/90 group-hover:text-amber-300 font-semibold shrink-0 text-[11px] sm:text-xs">
          <span>{isOpen ? 'Hide Notice' : 'Why is this?'}</span>
          {isOpen ? (
            <ChevronUpIcon className="w-3.5 h-3.5" />
          ) : (
            <ChevronDownIcon className="w-3.5 h-3.5" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-white/5 space-y-3">
          <p className="text-gray-400 leading-relaxed text-xs">
            Standard video servers (Server 1 & Server 2) frequently restrict or do not host explicit 18+ (Rx) content. If this video returns a 404 error or does not play, you may find full streams on dedicated adult networks:
          </p>

          {/* Platform External Links */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="https://hanime.tv"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-100 hover:bg-dark-300 text-white border border-white/10 hover:border-primary/40 rounded-lg font-semibold transition-all hover:scale-105 shadow-sm"
            >
              <span>Hanime.tv</span>
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-primary" />
            </a>

            <a
              href="https://hentaimama.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-dark-100 hover:bg-dark-300 text-white border border-white/10 hover:border-primary/40 rounded-lg font-semibold transition-all hover:scale-105 shadow-sm"
            >
              <span>HentaiMama</span>
              <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5 text-primary" />
            </a>

            {/* Quick Copy Title Helper */}
            {searchTitle && (
              <button
                type="button"
                onClick={() => handleCopyTitle(searchTitle)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-dark-100 hover:bg-dark-300 text-gray-300 hover:text-white border border-white/10 rounded-lg transition-colors ml-auto text-[11px] cursor-pointer"
                title="Copy anime title to clipboard for easy searching"
              >
                {copied ? (
                  <>
                    <ClipboardDocumentCheckIcon className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-green-400 font-medium">Copied Title!</span>
                  </>
                ) : (
                  <>
                    <ClipboardDocumentIcon className="w-3.5 h-3.5 text-gray-400" />
                    <span>Copy Title ({searchTitle.slice(0, 20)}{searchTitle.length > 20 ? '...' : ''})</span>
                  </>
                )}
              </button>
            )}
          </div>

          {altTitle && altTitle !== searchTitle && (
            <p className="text-[11px] text-gray-500">
              Alternative Name: <span className="text-gray-400 italic">{altTitle}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AdultStreamNotice;
