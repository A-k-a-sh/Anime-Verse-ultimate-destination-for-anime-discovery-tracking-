import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { animeService } from '../services/animeService';
import {
  PlayIcon,
  PauseIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  SparklesIcon,
  TvIcon,
  BookOpenIcon,
  BookmarkSquareIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  PlusIcon,
  MinusIcon,
  StarIcon,
} from '@heroicons/react/24/outline';

const SCENES = [
  {
    id: 'solo-leveling',
    title: 'Solo Leveling',
    titleJapanese: '나 혼자만 레벨업',
    tagline: 'Arise in Darkness — The Monarch of Shadows Awakens',
    description:
      "From the world's weakest E-rank hunter to the immortal Monarch of Shadows. Witness Sung Jin-Woo command an unstoppable legion in breathtaking animation.",
    video: '/videos/hero/solo-leveling.mp4',
    poster: '/images/hero/solo-leveling.jpg',
    watchUrl: '/watch/151807/1',
    detailsUrl: '/anime/151807',
    badge: 'Trending Worldwide',
    accentColor: 'from-purple-500 to-indigo-500',
    glowColor: 'rgba(168, 85, 247, 0.25)',
  },
  {
    id: 'jujutsu-kaisen',
    title: 'Jujutsu Kaisen',
    titleJapanese: '呪術廻戦',
    tagline: 'Unlimited Void — Transcend Beyond Human Limits',
    description:
      'Step into the cosmic domain of Satoru Gojo and Ryomen Sukuna. Experience peerless supernatural combat, dark cursed spirits, and god-tier sakuga.',
    video: '/videos/hero/jujutsu-kaisen.mp4',
    poster: '/images/hero/jujutsu-kaisen.jpg',
    watchUrl: '/watch/40748/1',
    detailsUrl: '/anime/40748',
    badge: 'Peak Supernatural Action',
    accentColor: 'from-blue-500 to-cyan-400',
    glowColor: 'rgba(59, 130, 246, 0.25)',
  },
  {
    id: 'demon-slayer',
    title: 'Demon Slayer',
    titleJapanese: '鬼滅の刃',
    tagline: 'Set Your Heart Ablaze — Master the Dance of Fire',
    description:
      'Tanjiro Kamado wields the ancient Hinokami Kagura amidst blazing embers. ufotable’s legendary animation brings every sword slash to life in 1080p.',
    video: '/videos/hero/demon-slayer.mp4',
    poster: '/images/hero/demon-slayer.jpg',
    watchUrl: '/watch/38000/1',
    detailsUrl: '/anime/38000',
    badge: 'Award-Winning Animation',
    accentColor: 'from-amber-500 to-red-500',
    glowColor: 'rgba(245, 158, 11, 0.25)',
  },
  {
    id: 'bleach',
    title: 'Bleach: TYBW',
    titleJapanese: 'BLEACH 千年血戦篇',
    tagline: 'The Final Blood Warfare — Bankai Reborn',
    description:
      'The thousand-year war between the Soul Reapers and Quincies erupts. Devastating Bankai, spiritual pressure, and Ichigo Kurosaki’s ultimate clash.',
    video: '/videos/hero/bleach.mp4',
    poster: '/images/hero/bleach.jpg',
    watchUrl: '/watch/41467/1',
    detailsUrl: '/anime/41467',
    badge: 'Legendary Shonen Return',
    accentColor: 'from-red-600 to-orange-500',
    glowColor: 'rgba(239, 68, 68, 0.25)',
  },
];

const FAQS = [
  {
    q: 'What is AnimeVerse?',
    a: 'AnimeVerse is an all-in-one streaming and reading hub built for anime and manga enthusiasts. We combine HD video playback, an ad-free manga reader, and real-time AniList community databases in one clean interface.',
  },
  {
    q: 'Is AnimeVerse free to use?',
    a: 'Yes, 100% free. You can browse, stream anime in 1080p, read thousands of manga chapters, and search without any paywalls or subscriptions.',
  },
  {
    q: 'How does the Web Player work?',
    a: 'Our custom player features dual-server redundancy (Server 1 MegaPlay & Server 2 Zoko), Cinema Lights-Off mode, Theater mode, auto-skip intro, and instant keyboard shortcuts ([N] Next, [P] Prev, [S] Server, [T] Theater, [F] Fullscreen).',
  },
  {
    q: 'Does it save my watch & reading progress?',
    a: 'Yes! AnimeVerse automatically logs your progress locally as you watch, marking episodes complete at 85% and saving your last watched episode so you can continue where you left off on any visit.',
  },
  {
    q: 'Can I read manga on mobile devices?',
    a: 'Absolutely. Our manga reader offers vertical continuous Webtoon scrolling optimized for smartphones and tablets, as well as traditional paginated view for desktop.',
  },
];

const Landing = () => {
  const navigate = useNavigate();
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [trendingAnime, setTrendingAnime] = useState([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [expandedFaq, setExpandedFaq] = useState(null);

  const activeScene = SCENES[activeSceneIndex];
  const videoRef = useRef(null);

  // Auto-advance scenes every 8 seconds (8000ms) with a 50ms progress interval
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = 50;
    const totalDuration = 8000;
    const step = (intervalTime / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setActiveSceneIndex((idx) => (idx + 1) % SCENES.length);
          setVideoLoaded(false);
          return 0;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, activeSceneIndex]);

  // Reset video loaded flag on scene change
  useEffect(() => {
    setVideoLoaded(false);
  }, [activeSceneIndex]);

  // Fetch top trending anime for the quick preview strip
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoadingTrending(true);
        const res = await animeService.getTopAnime({ limit: 6 });
        if (res?.success && Array.isArray(res.data)) {
          setTrendingAnime(res.data);
        }
      } catch (err) {
        console.warn('Could not fetch trending preview:', err);
      } finally {
        setLoadingTrending(false);
      }
    };
    fetchTrending();
  }, []);

  const handleSelectScene = (index) => {
    if (index === activeSceneIndex) return;
    setActiveSceneIndex(index);
    setProgress(0);
    setVideoLoaded(false);
  };

  const handleNextScene = () => {
    setActiveSceneIndex((prev) => (prev + 1) % SCENES.length);
    setProgress(0);
    setVideoLoaded(false);
  };

  const handlePrevScene = () => {
    setActiveSceneIndex((prev) => (prev - 1 + SCENES.length) % SCENES.length);
    setProgress(0);
    setVideoLoaded(false);
  };

  return (
    <div className="min-h-screen bg-dark-100 text-white overflow-x-hidden">
      {/* =========================================================================
          HERO SECTION: MULTI-SCENE CINEMATIC SHOWCASE
      ========================================================================= */}
      <section className="relative min-h-[92vh] sm:min-h-[95vh] flex flex-col justify-between overflow-hidden">
        {/* Background Visuals Layer */}
        <div className="absolute inset-0 z-0">
          {/* Static 4K Poster (Visible instantly while video loads) */}
          <img
            key={`poster-${activeScene.id}`}
            src={activeScene.poster}
            alt={activeScene.title}
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-90 transition-opacity duration-700"
          />

          {/* Looped Sakuga Video Loop */}
          <video
            key={`video-${activeScene.id}`}
            ref={videoRef}
            src={activeScene.video}
            autoPlay
            loop
            muted
            playsInline
            onCanPlay={() => setVideoLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-1000 ${
              videoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Cinematic Gradient Masks */}
          {/* Dark vignette left to right for typography contrast */}
          <div className="absolute inset-0 bg-gradient-to-r from-dark-100/95 via-dark-100/70 to-transparent z-10" />
          {/* Top fade for Navbar */}
          <div className="absolute inset-0 bg-gradient-to-b from-dark-100/80 via-transparent to-transparent z-10" />
          {/* Bottom melt into next section */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-100 via-dark-100/75 to-transparent z-10" />

          {/* Dynamic Scene Accent Glow */}
          <div
            className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[140px] pointer-events-none transition-all duration-1000 z-10"
            style={{ backgroundColor: activeScene.glowColor }}
          />
        </div>

        {/* Hero Content Overlay */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-12 w-full flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScene.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="max-w-3xl space-y-4 sm:space-y-6"
            >
              {/* Badge & Native Japanese Title */}
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-white/10 backdrop-blur-md border border-white/20 text-white">
                  <SparklesIcon className="w-3.5 h-3.5 text-primary" />
                  <span>{activeScene.badge}</span>
                </span>
                <span className="text-xs text-gray-400 font-medium tracking-widest hidden sm:inline">
                  {activeScene.titleJapanese}
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-extrabold text-white tracking-tight leading-none drop-shadow-xl">
                {activeScene.title}
              </h1>

              {/* Tagline */}
              <p
                className={`text-base sm:text-xl font-semibold bg-gradient-to-r ${activeScene.accentColor} bg-clip-text text-transparent drop-shadow`}
              >
                {activeScene.tagline}
              </p>

              {/* Description */}
              <p className="text-sm sm:text-base text-gray-300 max-w-2xl leading-relaxed drop-shadow line-clamp-3 sm:line-clamp-none">
                {activeScene.description}
              </p>

              {/* Primary Call-to-Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2 sm:pt-4">
                {/* Main Enter Catalog Button */}
                <Link
                  to="/home"
                  className="inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  <span>Explore Catalog</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>

                {/* Direct Watch Episode 1 for Active Scene */}
                <Link
                  to={activeScene.watchUrl}
                  className="inline-flex items-center gap-2 px-5 sm:px-6 py-3.5 bg-dark-200/80 hover:bg-dark-300 text-white rounded-xl font-semibold text-sm sm:text-base backdrop-blur-md border border-white/15 hover:border-white/30 hover:scale-105 active:scale-95 transition-all duration-200 shadow-md"
                >
                  <PlayIcon className="w-4 h-4 text-primary fill-primary" />
                  <span>Watch Ep 1</span>
                </Link>

                {/* Manga Sanctuary Link */}
                <Link
                  to="/manga"
                  className="inline-flex items-center gap-2 px-4 sm:px-5 py-3.5 text-gray-300 hover:text-white rounded-xl font-medium text-sm hover:bg-white/5 transition-all duration-200"
                >
                  <BookOpenIcon className="w-4 h-4" />
                  <span>Read Manga</span>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Interactive Bottom Timeline / Scene Switcher */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
          <div className="bg-dark-200/70 backdrop-blur-xl border border-white/10 rounded-2xl p-2 sm:p-3 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Scene Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto flex-1">
              {SCENES.map((scene, idx) => {
                const isActive = idx === activeSceneIndex;
                return (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => handleSelectScene(idx)}
                    className={`relative p-2.5 sm:p-3 rounded-xl text-left transition-all overflow-hidden group cursor-pointer ${
                      isActive
                        ? 'bg-white/10 text-white shadow-inner'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {/* Active Animated Progress Bar Indicator */}
                    {isActive && (
                      <div
                        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary to-secondary transition-all ease-linear"
                        style={{ width: `${progress}%` }}
                      />
                    )}

                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 mb-0.5">
                      <span className={isActive ? 'text-primary font-bold' : ''}>0{idx + 1}</span>
                      {isActive && isPlaying && (
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm font-semibold truncate">
                      {scene.title}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Play/Pause & Step Controls */}
            <div className="flex items-center gap-2 shrink-0 self-end md:self-center pr-1">
              <button
                type="button"
                onClick={handlePrevScene}
                aria-label="Previous Scene"
                className="p-2 rounded-lg bg-dark-100 hover:bg-dark-300 text-gray-400 hover:text-white border border-white/5 transition-colors cursor-pointer"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                aria-label={isPlaying ? 'Pause Auto-Play' : 'Resume Auto-Play'}
                className="p-2 rounded-lg bg-dark-100 hover:bg-dark-300 text-primary border border-white/5 transition-colors cursor-pointer"
              >
                {isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={handleNextScene}
                aria-label="Next Scene"
                className="p-2 rounded-lg bg-dark-100 hover:bg-dark-300 text-gray-400 hover:text-white border border-white/5 transition-colors cursor-pointer"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: LIVE NOW TRENDING QUICK STRIP
      ========================================================================= */}
      <section className="py-12 border-y border-white/5 bg-dark-200/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider mb-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Live Broadcast
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Now Trending on AnimeVerse</h2>
            </div>
            <Link
              to="/home"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <span>View Full Catalog</span>
              <ChevronRightIcon className="w-4 h-4" />
            </Link>
          </div>

          {loadingTrending ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-dark-300 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {trendingAnime.map((item) => {
                const id = item.malId || item.mal_id || item.id;
                const title = item.title || item.titleEnglish || 'Unknown Anime';
                const image = item.imageUrl || item.image || item.images?.jpg?.large_image_url;
                const score = item.score ? Number(item.score).toFixed(1) : null;

                return (
                  <Link
                    key={id}
                    to={`/anime/${id}`}
                    className="group relative rounded-xl overflow-hidden bg-dark-200 border border-white/5 hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10 flex flex-col"
                  >
                    <div className="aspect-[3/4] relative overflow-hidden bg-dark-300">
                      {image && (
                        <img
                          src={image}
                          alt={title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                          <PlayIcon className="w-5 h-5 ml-0.5 fill-white" />
                        </div>
                      </div>
                      {score && (
                        <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/70 backdrop-blur-md px-1.5 py-0.5 rounded text-[11px] font-bold text-yellow-400 border border-white/10">
                          <StarIcon className="w-3 h-3 fill-yellow-400" />
                          <span>{score}</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2.5">
                      <h3 className="text-xs font-semibold text-white truncate group-hover:text-primary transition-colors">
                        {title}
                      </h3>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {item.type || 'TV'} {item.year ? `• ${item.year}` : ''}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: BENTO GRID FEATURE SHOWCASE
      ========================================================================= */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            Engineered For Anime & Manga Fans
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-3 tracking-tight">
            Everything You Need In One Multiverse
          </h2>
          <p className="text-sm sm:text-base text-gray-400 mt-3 leading-relaxed">
            Forget annoying ads, broken players, and scattered bookmarks. AnimeVerse combines streaming, manga, and progress tracking in a single seamless platform.
          </p>
        </div>

        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Bento Card 1: Web Player (Span 7) */}
          <div className="md:col-span-7 bg-gradient-to-br from-dark-200 to-dark-300/80 rounded-2xl p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-5">
                <TvIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Cinema-Grade Web Player
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed max-w-xl">
                Dual-server streaming with MegaPlay & Zoko redundancy. Enjoy Lights-Off cinema mode, Theater view, auto-next episode triggers, and keyboard shortcuts.
              </p>
            </div>

            {/* Keyboard Shortcuts Interactive Pill Preview */}
            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                Instant Keyboard Shortcuts:
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-md bg-dark-100 border border-white/10 text-gray-300">
                  <kbd className="font-mono text-primary font-bold">[N]</kbd> Next Ep
                </span>
                <span className="px-2.5 py-1 rounded-md bg-dark-100 border border-white/10 text-gray-300">
                  <kbd className="font-mono text-primary font-bold">[P]</kbd> Prev Ep
                </span>
                <span className="px-2.5 py-1 rounded-md bg-dark-100 border border-white/10 text-gray-300">
                  <kbd className="font-mono text-primary font-bold">[S]</kbd> Switch Server
                </span>
                <span className="px-2.5 py-1 rounded-md bg-dark-100 border border-white/10 text-gray-300">
                  <kbd className="font-mono text-primary font-bold">[T]</kbd> Theater
                </span>
                <span className="px-2.5 py-1 rounded-md bg-dark-100 border border-white/10 text-gray-300">
                  <kbd className="font-mono text-primary font-bold">[L]</kbd> Lights Off
                </span>
                <span className="px-2.5 py-1 rounded-md bg-dark-100 border border-white/10 text-gray-300">
                  <kbd className="font-mono text-primary font-bold">[F]</kbd> Fullscreen
                </span>
              </div>
            </div>
          </div>

          {/* Bento Card 2: Manga Sanctuary (Span 5) */}
          <div className="md:col-span-5 bg-gradient-to-br from-dark-200 to-dark-300/80 rounded-2xl p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-5">
                <BookOpenIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Built-in Manga Sanctuary
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Read thousands of official and scanlated manga series with MangaDex integration. Full chapter selector and continuous Webtoon vertical scrolling for mobile.
              </p>
            </div>
            <div className="mt-6">
              <Link
                to="/manga"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
              >
                <span>Browse Manga Catalog</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Bento Card 3: Auto-Progress & Watchlist (Span 5) */}
          <div className="md:col-span-5 bg-gradient-to-br from-dark-200 to-dark-300/80 rounded-2xl p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center mb-5">
                <BookmarkSquareIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Smart Watchlist & Auto-Save
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Never lose your spot again. Episodes automatically mark as watched at 85% progress. Organise your lists into Watching, Completed, and Plan to Watch.
              </p>
            </div>
            <div className="mt-6">
              <Link
                to="/watchlist"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-400 hover:text-green-300 transition-colors"
              >
                <span>View Your Watchlist</span>
                <ChevronRightIcon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Bento Card 4: AniList & MAL Intelligence (Span 7) */}
          <div className="md:col-span-7 bg-gradient-to-br from-dark-200 to-dark-300/80 rounded-2xl p-6 sm:p-8 border border-white/10 relative overflow-hidden shadow-xl flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5">
                <SparklesIcon className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                Powered by AniList & MyAnimeList
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Every title is backed by high-resolution studio banner art, voice actor staff listings, community review scores, and related anime recommendations updated in real time.
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheckIcon className="w-4 h-4 text-primary" />
                <span>Zero Intrusive Popups</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheckIcon className="w-4 h-4 text-primary" />
                <span>100% Free Access</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheckIcon className="w-4 h-4 text-primary" />
                <span>Daily Broadcast Updates</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: PLATFORM STATS STRIP
      ========================================================================= */}
      <section className="py-12 bg-dark-200/50 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-display mb-1">
                15,000+
              </div>
              <div className="text-xs sm:text-sm text-gray-400 font-medium">Anime Episodes</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-primary font-display mb-1">
                8,000+
              </div>
              <div className="text-xs sm:text-sm text-gray-400 font-medium">Manga Chapters</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-display mb-1">
                1080p
              </div>
              <div className="text-xs sm:text-sm text-gray-400 font-medium">Ultra HD Quality</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-extrabold text-secondary font-display mb-1">
                0
              </div>
              <div className="text-xs sm:text-sm text-gray-400 font-medium">Disruptive Ads</div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: FAQ ACCORDION
      ========================================================================= */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            Everything you need to know about streaming and reading on AnimeVerse.
          </p>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="bg-dark-200/80 border border-white/5 rounded-xl overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm sm:text-base font-semibold text-white hover:text-primary transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className="p-1 rounded-md bg-dark-100 text-gray-400 shrink-0 ml-3">
                    {isOpen ? <MinusIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                  </span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-6 text-xs sm:text-sm text-gray-300 leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: FINAL CINEMATIC CALL-TO-ACTION (CTA)
      ========================================================================= */}
      <section className="py-20 relative overflow-hidden border-t border-white/10 bg-gradient-to-b from-dark-200/50 to-dark-100">
        <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Ready to Step into the Multiverse?
          </h2>
          <p className="text-sm sm:text-base text-gray-300 max-w-xl mx-auto mt-4 leading-relaxed">
            Stream your favorite series in crystal-clear 1080p, read new manga chapters, and track your watch journey for free.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/home"
              className="px-8 py-4 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white rounded-xl font-bold text-base shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all duration-200 inline-flex items-center gap-2"
            >
              <span>Enter AnimeVerse Catalog</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <Link
              to="/browse"
              className="px-6 py-4 bg-dark-200 hover:bg-dark-300 text-gray-200 hover:text-white rounded-xl font-semibold text-base border border-white/10 transition-all duration-200"
            >
              Browse All Genres
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Landing;
