import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useAuth } from '../context/AuthContext';
import pulseService from '../services/pulseService';
import PulseVoting from '../components/pulse/PulseVoting';
import PulseCommentSection from '../components/pulse/PulseCommentSection';
import {
  ClockIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  ShareIcon,
  PencilSquareIcon,
  ArrowLeftIcon,
  FilmIcon,
  BookOpenIcon,
  CheckIcon,
  ArrowPathIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

const PulseDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [pulse, setPulse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  const contentRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPulse = async () => {
      try {
        setIsLoading(true);
        setErrorMsg('');
        const res = await pulseService.getPulseBySlug(slug);
        if (res?.success && isMounted) {
          setPulse(res.data);
        }
      } catch (err) {
        console.error('Failed to load pulse:', err);
        if (isMounted) setErrorMsg(err.response?.data?.message || 'Pulse not found or has been removed.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchPulse();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  // Click-to-reveal event listener for .anime-spoiler-blur marks
  useEffect(() => {
    if (!contentRef.current) return;

    const handleContentClick = (e) => {
      const spoilerEl = e.target.closest('.anime-spoiler-blur');
      if (spoilerEl) {
        spoilerEl.classList.toggle('unblurred');
      }
    };

    const container = contentRef.current;
    container.addEventListener('click', handleContentClick);

    return () => {
      container.removeEventListener('click', handleContentClick);
    };
  }, [pulse]);

  const handleShare = async () => {
    try {
      const currentUrl = window.location.href;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(currentUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      }
    } catch (err) {
      console.warn('Failed to copy share link:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <ArrowPathIcon className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-gray-400 font-medium">Loading Pulse...</p>
      </div>
    );
  }

  if (errorMsg || !pulse) {
    return (
      <div className="min-h-[60vh] max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="p-4 rounded-2xl bg-dark-200 border border-white/10 text-primary w-16 h-16 mx-auto flex items-center justify-center mb-4">
          <BoltIcon className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Pulse Not Found</h2>
        <p className="text-sm text-gray-400 mb-6">{errorMsg || 'This community post could not be found.'}</p>
        <Link
          to="/pulse"
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-primary text-white text-sm font-bold shadow-lg shadow-primary/25"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Otaku Pulse</span>
        </Link>
      </div>
    );
  }

  const isAuthor = user && pulse.author?._id && String(user._id) === String(pulse.author._id);
  const primaryMedia = pulse.relatedMedia?.[0];

  // Sanitize TipTap HTML content
  const sanitizedContent = DOMPurify.sanitize(pulse.content || '', {
    ADD_TAGS: ['iframe', 'span'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling', 'data-spoiler', 'target', 'rel']
  });

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-32">
      {/* Back Button & Top Navigation */}
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/pulse"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Otaku Pulse</span>
        </Link>

        {/* Author Edit Shortcut */}
        {isAuthor && (
          <Link
            to={`/pulse/edit/${pulse._id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-dark-200 hover:bg-dark-300 border border-white/10 text-xs font-bold text-gray-200 hover:text-white transition-all shadow-sm"
          >
            <PencilSquareIcon className="w-4 h-4 text-primary" />
            <span>Edit Pulse</span>
          </Link>
        )}
      </div>

      {/* Article Header */}
      <header className="space-y-4 mb-8">
        {/* Tags & Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {pulse.hasSpoilers && (
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/90 text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-500/25">
              <ExclamationTriangleIcon className="w-3.5 h-3.5" />
              Major Spoilers
            </span>
          )}

          {pulse.tags?.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-xs font-bold text-primary uppercase tracking-wider"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
          {pulse.title}
        </h1>

        {/* Author Byline & Article Metrics */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-y border-white/10">
          <div className="flex items-center gap-3">
            <img
              src={pulse.author?.avatar || `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(pulse.author?.username || 'O')}`}
              alt={pulse.author?.username}
              className="w-11 h-11 rounded-full object-cover border-2 border-primary shadow-lg"
            />
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>@{pulse.author?.username || 'otaku'}</span>
                <span className="text-[10px] uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">Author</span>
              </div>
              <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                <span>{new Date(pulse.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <ClockIcon className="w-3.5 h-3.5" />
                  {pulse.readingTimeMinutes || 3} min read
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <EyeIcon className="w-3.5 h-3.5" />
                  {pulse.views || 0} views
                </span>
              </div>
            </div>
          </div>

          {/* Social Share & Voting */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleShare}
              className="p-2.5 rounded-2xl bg-dark-200 hover:bg-dark-300 border border-white/10 text-gray-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-semibold shadow-sm"
              title="Copy link to clipboard"
            >
              {copiedLink ? (
                <>
                  <CheckIcon className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <ShareIcon className="w-4 h-4" />
                  <span>Share</span>
                </>
              )}
            </button>

            <PulseVoting
              pulseId={pulse._id}
              initialScore={pulse.pulseScore || 0}
              initialUserVote={pulse.userVote}
              direction="horizontal"
              size="md"
            />
          </div>
        </div>
      </header>

      {/* Linked Anime / Manga Catalog Banner */}
      {primaryMedia && (
        <div className="mb-8 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-dark-200 via-dark-200/90 to-dark-100 border border-white/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3 min-w-0">
            {primaryMedia.imageUrl ? (
              <img
                src={primaryMedia.imageUrl}
                alt={primaryMedia.title}
                className="w-12 h-16 rounded-xl object-cover shadow-md flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-16 rounded-xl bg-dark-100 border border-white/10 flex items-center justify-center flex-shrink-0">
                {primaryMedia.type === 'anime' ? <FilmIcon className="w-6 h-6 text-primary" /> : <BookOpenIcon className="w-6 h-6 text-secondary" />}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider text-primary">Discussed In This Pulse</span>
              <h3 className="text-base sm:text-lg font-bold text-white truncate">{primaryMedia.title}</h3>
              <p className="text-xs text-gray-400 capitalize">{primaryMedia.type} Catalog Entry</p>
            </div>
          </div>

          <Link
            to={primaryMedia.type === 'anime' ? `/anime/${primaryMedia.malId}` : `/manga/${primaryMedia.malId}`}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-bold transition-all text-center flex-shrink-0 flex items-center justify-center gap-2 shadow-sm"
          >
            {primaryMedia.type === 'anime' ? 'Stream Anime' : 'Read Manga'}
            <span>→</span>
          </Link>
        </div>
      )}

      {/* Featured Cover Image */}
      {pulse.coverImage?.url && (
        <div className="mb-10 rounded-3xl overflow-hidden border border-white/10 shadow-2xl aspect-[21/9] max-h-[440px] bg-dark-100">
          <img
            src={pulse.coverImage.url}
            alt={pulse.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Rendered TipTap Prose Article Body */}
      <article
        ref={contentRef}
        className="prose prose-invert prose-lg max-w-none text-gray-200 leading-relaxed font-sans mb-16"
        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
      />

      {/* Author Bio Footer Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-dark-200/80 border border-white/10 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left mb-16 shadow-xl">
        <img
          src={pulse.author?.avatar || `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(pulse.author?.username || 'O')}`}
          alt={pulse.author?.username}
          className="w-16 h-16 rounded-full object-cover border-2 border-primary shadow-xl flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-bold text-white">Pulsed by @{pulse.author?.username}</h4>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 leading-relaxed">
            Community theorist and anime enthusiast. Writing deep-dive analyses, chapter breakdowns, and fandom discussions on AnimeVerse.
          </p>
        </div>
        <Link
          to={`/pulse?author=${pulse.author?._id}`}
          className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-colors flex-shrink-0"
        >
          More from Author
        </Link>
      </div>

      {/* Threaded Discussion Comments Section */}
      <PulseCommentSection
        pulseId={pulse._id}
        commentsEnabled={pulse.commentsEnabled}
      />
    </div>
  );
};

export default PulseDetail;
