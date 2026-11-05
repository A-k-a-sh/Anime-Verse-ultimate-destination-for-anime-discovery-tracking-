import { Link } from 'react-router-dom';
import PulseVoting from './PulseVoting';
import {
  ClockIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  FilmIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const past = new Date(dateString);
  const diffInDays = Math.floor((now - past) / (1000 * 60 * 60 * 24));

  if (diffInDays === 0) return 'Today';
  if (diffInDays === 1) return 'Yesterday';
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return past.toLocaleDateString();
};

const PulseCard = ({ pulse, onVoteChange }) => {
  if (!pulse) return null;

  const coverUrl = pulse.coverImage?.url;
  const primaryMedia = pulse.relatedMedia?.[0];

  return (
    <article className="group bg-dark-200/60 hover:bg-dark-200/90 border border-white/10 hover:border-white/25 rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-[0_16px_40px_rgba(0,0,0,0.7)] flex flex-col justify-between hover:-translate-y-1">
      <div>
        {/* Cover Image / Banner */}
        <Link to={`/pulse/${pulse.slug}`} className="block relative aspect-[16/9] overflow-hidden bg-dark-100">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={pulse.title}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-dark-200 via-dark-100 to-dark-300 p-6 text-center">
              <span className="text-3xl font-extrabold text-white/20 tracking-wider uppercase font-display">
                ⚡ Otaku Pulse
              </span>
              <span className="text-xs text-gray-500 mt-1">AnimeVerse Fandom Theory</span>
            </div>
          )}

          {/* Top Overlays: Spoiler Alert & Status Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
            {pulse.hasSpoilers ? (
              <span className="px-2.5 py-1 rounded-full bg-rose-500/90 text-white text-[11px] font-black tracking-wider uppercase backdrop-blur-md flex items-center gap-1 shadow-lg shadow-rose-500/30">
                <ExclamationTriangleIcon className="w-3.5 h-3.5" />
                Spoilers
              </span>
            ) : (
              <span />
            )}

            {pulse.status === 'draft' && (
              <span className="px-2.5 py-1 rounded-full bg-amber-500/90 text-dark-100 text-[11px] font-black tracking-wider uppercase backdrop-blur-md shadow-lg">
                Draft
              </span>
            )}
          </div>

          {/* Bottom Floating Pill: Linked Media */}
          {primaryMedia && (
            <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/75 backdrop-blur-md border border-white/15 text-[11px] font-semibold text-white shadow-lg">
                {primaryMedia.type === 'anime' ? (
                  <FilmIcon className="w-3.5 h-3.5 text-primary" />
                ) : (
                  <BookOpenIcon className="w-3.5 h-3.5 text-secondary" />
                )}
                <span className="truncate max-w-[180px]">{primaryMedia.title}</span>
              </div>
            </div>
          )}
        </Link>

        {/* Card Body */}
        <div className="p-4 sm:p-5">
          {/* Tags */}
          {pulse.tags?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {pulse.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] uppercase font-bold tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded-md"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-primary transition-colors line-clamp-2 leading-snug mb-2">
            <Link to={`/pulse/${pulse.slug}`}>{pulse.title}</Link>
          </h3>

          {/* Excerpt */}
          <p className="text-xs sm:text-sm text-gray-400 line-clamp-2 leading-relaxed mb-4">
            {pulse.excerpt || 'Read the full theory, chapter breakdown, and community lore discussion...'}
          </p>
        </div>
      </div>

      {/* Footer: Author Byline & Voting */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-3 border-t border-white/5 flex items-center justify-between gap-3">
        {/* Author Byline */}
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={pulse.author?.avatar || `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(pulse.author?.username || 'O')}`}
            alt={pulse.author?.username}
            className="w-7 h-7 rounded-full object-cover border border-white/10 flex-shrink-0"
          />
          <div className="min-w-0">
            <div className="text-xs font-bold text-gray-200 truncate">
              @{pulse.author?.username || 'otaku'}
            </div>
            <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
              <span>{formatTimeAgo(pulse.createdAt)}</span>
              <span>•</span>
              <span className="flex items-center gap-0.5">
                <ClockIcon className="w-3 h-3" />
                {pulse.readingTimeMinutes || 3}m
              </span>
            </div>
          </div>
        </div>

        {/* Horizontal Pulse Score Widget */}
        <div className="flex-shrink-0">
          <PulseVoting
            pulseId={pulse._id}
            initialScore={pulse.pulseScore || 0}
            initialUserVote={pulse.userVote}
            direction="horizontal"
            size="sm"
            onChange={onVoteChange}
          />
        </div>
      </div>
    </article>
  );
};

export default PulseCard;
