import { Link } from 'react-router-dom';
import PulseVoting from './PulseVoting';
import {
  SparklesIcon,
  ArrowRightIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  FilmIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

const PulseHeroSpotlight = ({ pulse }) => {
  if (!pulse) return null;

  const coverUrl = pulse.coverImage?.url;
  const primaryMedia = pulse.relatedMedia?.[0];

  return (
    <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-dark-200/90 shadow-[0_20px_60px_rgba(0,0,0,0.8)] group mb-10">
      {/* Background Cover Image with Gradient Overlay */}
      {coverUrl && (
        <div className="absolute inset-0 z-0">
          <img
            src={coverUrl}
            alt={pulse.title}
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-35 filter blur-[2px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-dark-100 via-dark-100/80 to-dark-100/40" />
        </div>
      )}

      {/* Content Container */}
      <div className="relative z-10 p-6 sm:p-10 flex flex-col justify-end min-h-[380px] sm:min-h-[440px]">
        {/* Badges Bar */}
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-rose-600 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-primary/30">
            <SparklesIcon className="w-3.5 h-3.5" />
            Spotlight Pulse
          </span>

          {pulse.hasSpoilers && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/80 backdrop-blur-md text-white text-xs font-bold uppercase tracking-wider">
              <ExclamationTriangleIcon className="w-3.5 h-3.5" />
              Spoilers
            </span>
          )}

          {primaryMedia && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md text-gray-200 text-xs font-medium border border-white/10">
              {primaryMedia.type === 'anime' ? (
                <FilmIcon className="w-3.5 h-3.5 text-primary" />
              ) : (
                <BookOpenIcon className="w-3.5 h-3.5 text-secondary" />
              )}
              <span>{primaryMedia.title}</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight mb-3 max-w-3xl group-hover:text-primary transition-colors">
          <Link to={`/pulse/${pulse.slug}`}>{pulse.title}</Link>
        </h2>

        {/* Excerpt */}
        <p className="text-sm sm:text-base text-gray-300 line-clamp-2 max-w-2xl leading-relaxed mb-6 font-medium">
          {pulse.excerpt || 'Explore this in-depth fandom breakdown, community theory, and deep lore dissection...'}
        </p>

        {/* Author Byline & CTA Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <img
              src={pulse.author?.avatar || `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(pulse.author?.username || 'O')}`}
              alt={pulse.author?.username}
              className="w-10 h-10 rounded-full object-cover border-2 border-primary shadow-lg"
            />
            <div>
              <div className="text-sm font-bold text-white">
                @{pulse.author?.username || 'otaku'}
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-2">
                <span>Pulsed community author</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ClockIcon className="w-3.5 h-3.5" />
                  {pulse.readingTimeMinutes || 4} min read
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <PulseVoting
              pulseId={pulse._id}
              initialScore={pulse.pulseScore || 0}
              initialUserVote={pulse.userVote}
              direction="horizontal"
              size="md"
            />

            <Link
              to={`/pulse/${pulse.slug}`}
              className="px-6 py-2.5 rounded-2xl bg-primary hover:bg-primary-600 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-xl shadow-primary/30 group-hover:gap-3"
            >
              <span>Read Pulse</span>
              <ArrowRightIcon className="w-4 h-4 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PulseHeroSpotlight;
