import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
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
  BoltIcon,
  FireIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/solid';

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
    mangaUrl: '/manga/121496',
    badge: 'Trending Worldwide',
    accentColor: 'from-purple-400 via-fuchsia-500 to-indigo-400',
    glowColor: 'rgba(168, 85, 247, 0.45)',
    tag: '#1 Most Anticipated',
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
    mangaUrl: '/manga/113138',
    badge: 'Peak Supernatural Action',
    accentColor: 'from-blue-400 via-cyan-400 to-indigo-400',
    glowColor: 'rgba(59, 130, 246, 0.45)',
    tag: 'Shibuya Climax',
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
    mangaUrl: '/manga/96792',
    badge: 'Award-Winning Animation',
    accentColor: 'from-amber-400 via-orange-500 to-red-500',
    glowColor: 'rgba(245, 158, 11, 0.45)',
    tag: 'Infinity Castle Arc',
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
    mangaUrl: '/manga/12',
    badge: 'Legendary Shonen Return',
    accentColor: 'from-red-500 via-rose-500 to-orange-400',
    glowColor: 'rgba(239, 68, 68, 0.45)',
    tag: 'Final Arc',
  },
];

const COMPARISON_ITEMS = [
  {
    feature: 'Intrusive Popups & Redirects',
    sketchy: '4–5 spam tabs per click',
    animeverse: '100% Zero spam redirects or popups',
  },
  {
    feature: 'Streaming Server Redundancy',
    sketchy: 'Single server that buffers or dies',
    animeverse: 'Dual High-Speed CDN (MegaPlay + Zoko)',
  },
  {
    feature: 'Manga Reading Integration',
    sketchy: 'Separate ad-ridden manga site required',
    animeverse: 'Integrated MangaDex continuous Webtoon reader',
  },
  {
    feature: 'Watch Progress & Resume',
    sketchy: 'Lost on refresh or device change',
    animeverse: 'Auto-saves at 85% progress & cloud sync',
  },
  {
    feature: 'Player Controls & Cinema',
    sketchy: 'Generic player with no shortcuts',
    animeverse: 'Theater Mode, Lights Off & keyboard shortcuts',
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

  // Interactive mock server state for the Bento player card
  const [mockServer, setMockServer] = useState('server1');
  const [mockProgressPercent, setMockProgressPercent] = useState(85);

  const activeScene = SCENES[activeSceneIndex];
  const videoRef = useRef(null);

  // Section Refs for Parallax Scrolling Calculations
  const trendingSectionRef = useRef(null);
  const bentoSectionRef = useRef(null);
  const compareSectionRef = useRef(null);
  const ctaSectionRef = useRef(null);

  // ==========================================
  // PARALLAX SCROLL HOOKS
  // ==========================================
  // 1. Trending Section Parallax
  const { scrollYProgress: trendingScroll } = useScroll({
    target: trendingSectionRef,
    offset: ['start end', 'end start'],
  });
  const trendingBgY = useTransform(trendingScroll, [0, 1], ['-12%', '14%']);
  const trendingGlyphY = useTransform(trendingScroll, [0, 1], [60, -90]);

  // 2. Bento Section Parallax
  const { scrollYProgress: bentoScroll } = useScroll({
    target: bentoSectionRef,
    offset: ['start end', 'end start'],
  });
  const bentoBgY = useTransform(bentoScroll, [0, 1], ['-15%', '18%']);
  const bentoCol1Y = useTransform(bentoScroll, [0, 1], [30, -30]);
  const bentoCol2Y = useTransform(bentoScroll, [0, 1], [70, -70]);
  const bentoGlyphY = useTransform(bentoScroll, [0, 1], [-80, 80]);

  // 3. Comparison Section Parallax
  const { scrollYProgress: compareScroll } = useScroll({
    target: compareSectionRef,
    offset: ['start end', 'end start'],
  });
  const compareBgY = useTransform(compareScroll, [0, 1], ['-12%', '15%']);

  // 4. CTA Portal Parallax & Scale
  const { scrollYProgress: ctaScroll } = useScroll({
    target: ctaSectionRef,
    offset: ['start end', 'end start'],
  });
  const ctaBgScale = useTransform(ctaScroll, [0, 1], [1.02, 1.18]);
  const ctaBgY = useTransform(ctaScroll, [0, 1], ['-6%', '10%']);

  // Auto-advance hero scenes every 8 seconds
  useEffect(() => {
    if (!isPlaying) return;

    const intervalTime = 50;
    const totalDuration = 8000;
    const step = (intervalTime / totalDuration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          return 100;
        }
        return prev + step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, activeSceneIndex]);

  // When progress reaches 100%, advance to the next scene sequentially
  useEffect(() => {
    if (progress >= 100) {
      setActiveSceneIndex((prev) => (prev + 1) % SCENES.length);
      setProgress(0);
      setVideoLoaded(false);
    }
  }, [progress]);

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
    <div className="min-h-screen bg-dark-100 text-white overflow-x-hidden selection:bg-primary selection:text-white -mt-20 sm:-mt-24">
      {/* =========================================================================
          HERO SECTION: MULTI-SCENE CINEMATIC SHOWCASE (HIGH VISIBILITY VIDEO)
      ========================================================================= */}
      <section className="relative min-h-[92vh] sm:min-h-[95vh] flex flex-col justify-between overflow-hidden">
        {/* Background Visuals Layer */}
        <div className="absolute inset-0 z-0">
          {/* Static 4K Poster (Visible instantly while video loads) */}
          <img
            key={`poster-${activeScene.id}`}
            src={activeScene.poster}
            alt={activeScene.title}
            className="absolute inset-0 w-full h-full object-cover object-center filter brightness-100 contrast-105 transition-opacity duration-700"
          />

          {/* Looped Sakuga Video Loop (High Visibility, Brightness boosted) */}
          <video
            key={`video-${activeScene.id}`}
            ref={videoRef}
            src={activeScene.video}
            autoPlay
            loop
            muted
            playsInline
            onCanPlay={() => setVideoLoaded(true)}
            className={`absolute inset-0 w-full h-full object-cover object-center filter brightness-105 contrast-105 transition-opacity duration-1000 ${
              videoLoaded ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Precision Gradient Overlays:
              - Left vignette only covers ~55% of the width so the right side is 100% visible & punchy.
              - Top fade restricted to top 32px for Navbar.
              - Bottom fade restricted to bottom 40px to blend into next section. */}
          <div className="absolute inset-0 bg-gradient-to-r from-dark-100/90 via-dark-100/40 via-55% to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-dark-100/80 via-transparent to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-dark-100 via-dark-100/60 to-transparent z-10 pointer-events-none" />

          {/* Dynamic Scene Ambient Neon Aura */}
          <div
            className="absolute -top-24 -left-24 w-[500px] h-[500px] rounded-full blur-[160px] pointer-events-none transition-all duration-1000 z-10 opacity-70"
            style={{ backgroundColor: activeScene.glowColor }}
          />
        </div>

        {/* Hero Content Overlay */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32 pb-12 w-full flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScene.id}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 30 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="max-w-2xl sm:max-w-3xl space-y-4 sm:space-y-6"
            >
              {/* Badge & Native Japanese Title */}
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-extrabold tracking-wider uppercase bg-black/60 backdrop-blur-md border border-white/20 text-white shadow-lg">
                  <SparklesIcon className="w-4 h-4 text-primary fill-primary" />
                  <span>{activeScene.badge}</span>
                </span>
                <span className="text-xs text-white/80 font-semibold tracking-widest uppercase bg-black/40 px-3 py-1 rounded-full backdrop-blur-md border border-white/10 hidden sm:inline">
                  {activeScene.titleJapanese}
                </span>
                <span className="text-xs text-primary font-bold tracking-wide uppercase hidden md:inline">
                  {activeScene.tag}
                </span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black text-white tracking-tight leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)]">
                {activeScene.title}
              </h1>

              {/* Tagline */}
              <p
                className={`text-base sm:text-2xl font-bold bg-gradient-to-r ${activeScene.accentColor} bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]`}
              >
                {activeScene.tagline}
              </p>

              {/* Description */}
              <p className="text-sm sm:text-base text-gray-200 max-w-2xl leading-relaxed drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] line-clamp-3 sm:line-clamp-none font-medium">
                {activeScene.description}
              </p>

              {/* Primary Call-to-Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2 sm:pt-4">
                {/* Main Enter Catalog Button */}
                <Link
                  to="/home"
                  className="inline-flex items-center gap-2.5 px-7 sm:px-9 py-4 bg-gradient-to-r from-primary via-red-600 to-secondary hover:shadow-[0_0_30px_rgba(230,57,70,0.5)] text-white rounded-xl font-extrabold text-sm sm:text-base shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 group"
                >
                  <span>Explore Catalog</span>
                  <ArrowRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>

                {/* Direct Watch Episode 1 for Active Scene */}
                <Link
                  to={activeScene.watchUrl}
                  className="inline-flex items-center gap-2 px-6 py-4 bg-black/60 hover:bg-black/80 text-white rounded-xl font-bold text-sm sm:text-base backdrop-blur-md border border-white/25 hover:border-white/50 hover:scale-105 active:scale-95 transition-all duration-200 shadow-xl"
                >
                  <PlayIcon className="w-5 h-5 text-primary fill-primary" />
                  <span>Watch Ep 1</span>
                </Link>

                {/* Manga Details Link */}
                <Link
                  to={activeScene.mangaUrl || '/manga'}
                  className="inline-flex items-center gap-2 px-5 py-4 text-gray-200 hover:text-white rounded-xl font-semibold text-sm hover:bg-white/10 backdrop-blur-sm border border-transparent hover:border-white/10 transition-all duration-200"
                >
                  <BookOpenIcon className="w-5 h-5" />
                  <span>Read Manga</span>
                </Link>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Interactive Bottom Timeline / Scene Switcher */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 w-full">
          <div className="bg-black/60 backdrop-blur-2xl border border-white/15 rounded-2xl p-2.5 sm:p-3 shadow-[0_10px_40px_rgba(0,0,0,0.6)] flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Scene Selector Tabs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full md:w-auto flex-1">
              {SCENES.map((scene, idx) => {
                const isActive = idx === activeSceneIndex;
                return (
                  <button
                    key={scene.id}
                    type="button"
                    onClick={() => handleSelectScene(idx)}
                    className={`relative p-3 rounded-xl text-left transition-all overflow-hidden group cursor-pointer ${
                      isActive
                        ? 'bg-white/15 text-white shadow-lg border border-white/20'
                        : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    {/* Active Animated Progress Bar Indicator */}
                    {isActive && (
                      <div
                        className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-secondary transition-all ease-linear shadow-[0_0_10px_rgba(230,57,70,0.8)]"
                        style={{ width: `${progress}%` }}
                      />
                    )}

                    <div className="flex items-center justify-between text-[11px] font-black tracking-wider uppercase text-gray-400 mb-0.5">
                      <span className={isActive ? 'text-primary font-bold' : ''}>0{idx + 1}</span>
                      {isActive && isPlaying && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs sm:text-sm font-bold truncate">
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
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-white/10 transition-all cursor-pointer"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsPlaying(!isPlaying)}
                aria-label={isPlaying ? 'Pause Auto-Play' : 'Resume Auto-Play'}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-primary border border-white/10 transition-all cursor-pointer"
              >
                {isPlaying ? <PauseIcon className="w-4 h-4 fill-primary" /> : <PlayIcon className="w-4 h-4 fill-primary" />}
              </button>
              <button
                type="button"
                onClick={handleNextScene}
                aria-label="Next Scene"
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-gray-300 hover:text-white border border-white/10 transition-all cursor-pointer"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: CINEMATIC NOW TRENDING SHOWCASE WITH PARALLAX DEEP BG
      ========================================================================= */}
      <section
        ref={trendingSectionRef}
        className="relative py-24 border-y border-white/10 bg-dark-100 overflow-hidden"
      >
        {/* PARALLAX DEEP BACKGROUND IMAGE (Demon Slayer Hinokami Fire Scenery) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          <motion.img
            style={{ y: trendingBgY }}
            src="/images/hero/demon-slayer.jpg"
            alt=""
            className="absolute -top-32 inset-x-0 w-full h-[145%] object-cover opacity-80 filter blur-[2px] brightness-110 contrast-125 mix-blend-screen"
          />
          {/* Deep Vignette Mask for Content Readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-dark-100 via-dark-100/75 to-dark-100" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0f0f23_80%)]" />

          {/* Floating Parallax Japanese Glyphs (全集中 - Total Concentration) */}
          <motion.div
            style={{ y: trendingGlyphY }}
            className="absolute top-12 right-12 text-7xl sm:text-9xl font-black text-amber-500/10 tracking-widest font-display select-none pointer-events-none uppercase"
          >
            全集中
          </motion.div>
        </div>

        {/* Ambient Cosmic Glow Blobs */}
        <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-primary/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-amber-600/15 rounded-full blur-[140px] pointer-events-none" />

        {/* Subtle Cyberpunk Dot Mesh Grid */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff12_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-widest bg-primary/10 border border-primary/30 text-primary mb-2 shadow-[0_0_15px_rgba(230,57,70,0.3)]">
                <FireIcon className="w-4 h-4 fill-primary" />
                <span>Live Broadcast Spotlight</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight">
                Now Trending in the Universe
              </h2>
              <p className="text-sm text-gray-400 mt-1">
                Highest ranked anime broadcast this week with instant 1080p stream availability.
              </p>
            </div>
            <Link
              to="/home"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-primary text-white font-bold text-xs sm:text-sm border border-white/10 hover:border-primary transition-all duration-300 group hover:shadow-[0_0_20px_rgba(230,57,70,0.5)] shrink-0"
            >
              <span>View Full Catalog</span>
              <ChevronRightIcon className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loadingTrending ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-dark-300 rounded-2xl animate-pulse border border-white/5" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-5">
              {trendingAnime.map((item, index) => {
                const id = item.malId || item.mal_id || item.id;
                const title = item.title || item.titleEnglish || 'Unknown Anime';
                const image = item.imageUrl || item.image || item.images?.jpg?.large_image_url;
                const score = item.score ? Number(item.score).toFixed(1) : null;

                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.08 }}
                  >
                    <Link
                      to={`/anime/${id}`}
                      className="group relative rounded-2xl overflow-hidden bg-dark-200/90 border border-white/10 hover:border-primary/80 transition-all duration-300 hover:-translate-y-2.5 hover:shadow-[0_15px_35px_-5px_rgba(230,57,70,0.35)] flex flex-col h-full block"
                    >
                      <div className="aspect-[3/4] relative overflow-hidden bg-dark-300">
                        {image && (
                          <img
                            src={image}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 filter brightness-95 group-hover:brightness-105"
                          />
                        )}

                        {/* Top Rank Badge */}
                        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-[10px] font-black uppercase text-white border border-white/15">
                          <span className="text-primary">#0{index + 1}</span>
                        </div>

                        {/* Rating Badge */}
                        {score && (
                          <div className="absolute top-2.5 right-2.5 flex items-center gap-1 bg-black/80 backdrop-blur-md px-2 py-0.5 rounded-lg text-[11px] font-bold text-yellow-400 border border-white/15">
                            <StarIcon className="w-3.5 h-3.5 fill-yellow-400" />
                            <span>{score}</span>
                          </div>
                        )}

                        {/* Hover Overlay with Animated Play Trigger */}
                        <div className="absolute inset-0 bg-gradient-to-t from-dark-100 via-dark-100/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                          <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-[0_0_25px_rgba(230,57,70,0.8)] transform scale-75 group-hover:scale-100 transition-transform duration-300">
                            <PlayIcon className="w-6 h-6 ml-0.5 fill-white" />
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-gradient-to-t from-dark-300/90 to-dark-200">
                        <h3 className="text-xs font-bold text-white truncate group-hover:text-primary transition-colors">
                          {title}
                        </h3>
                        <div className="flex items-center justify-between text-[11px] text-gray-400 mt-1">
                          <span>{item.type || 'TV'}</span>
                          <span>{item.year || '2024'}</span>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: BENTO GRID WITH PARALLAX DEEP BG & MULTI-SPEED COLUMNS
      ========================================================================= */}
      <section
        ref={bentoSectionRef}
        className="relative py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        {/* PARALLAX DEEP BACKGROUND IMAGE (JJK Cosmic Domain Scenery) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          <motion.img
            style={{ y: bentoBgY }}
            src="/images/hero/jujutsu-kaisen.jpg"
            alt=""
            className="absolute -top-36 inset-x-0 w-full h-[150%] object-cover opacity-90 filter blur-[2px] brightness-110 contrast-125 mix-blend-screen"
          />
          {/* Deep Vignette Mask */}
          <div className="absolute inset-0 bg-gradient-to-b from-dark-100 via-dark-100/80 to-dark-100" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,#0f0f23_85%)]" />

          {/* Floating Parallax Japanese Glyphs (領域展開 - Domain Expansion) */}
          <motion.div
            style={{ y: bentoGlyphY }}
            className="absolute top-24 left-8 text-7xl sm:text-9xl font-black text-cyan-500/10 tracking-widest font-display select-none pointer-events-none uppercase"
          >
            領域展開
          </motion.div>
        </div>

        {/* Ambient Radial Glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-primary/10 rounded-full blur-[180px] pointer-events-none" />

        <div className="relative z-10 text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase bg-primary/10 border border-primary/30 text-primary">
            <BoltIcon className="w-3.5 h-3.5 fill-primary" />
            <span>Architecture & Experience</span>
          </div>
          <h2 className="text-3xl sm:text-5xl font-display font-black text-white mt-3 tracking-tight">
            Engineered Beyond Ordinary Streaming
          </h2>
          <p className="text-sm sm:text-base text-gray-400 mt-3 leading-relaxed">
            Every feature on AnimeVerse is designed from scratch to remove friction, kill disruptive ads, and give you an unparalleled viewing sanctuary.
          </p>
        </div>

        {/* Bento Grid Layout with Multi-Speed Parallax Columns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 relative z-10">
          {/* ==========================================
              BENTO CARD 1: CINEMA WEB PLAYER (Span 7)
          ========================================== */}
          <motion.div
            style={{ y: bentoCol1Y }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="md:col-span-7 bg-gradient-to-br from-dark-200/90 via-dark-300/80 to-dark-200/90 rounded-3xl p-6 sm:p-8 border border-white/15 relative overflow-hidden shadow-2xl flex flex-col justify-between group hover:border-primary/50 transition-all duration-300"
          >
            {/* Ambient Background Grid */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/15 rounded-full blur-[100px] pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/30 text-primary flex items-center justify-center shadow-lg">
                  <TvIcon className="w-6 h-6 fill-primary/80" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-white/10 text-white border border-white/10">
                  Custom Player Engine
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Cinema-Grade Web Player
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed max-w-xl">
                Stream without intrusive popups. Switch seamlessly between Server 1 (MegaPlay) and Server 2 (Zoko) with auto-skip intro, theater mode, and cinema lights-off.
              </p>
            </div>

            {/* LIVE INTERACTIVE PLAYER MOCKUP */}
            <div className="mt-8 bg-black/85 rounded-2xl p-4 border border-white/10 shadow-2xl">
              {/* Player Topbar */}
              <div className="flex items-center justify-between text-xs pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-semibold text-gray-200">
                    {mockServer === 'server1' ? 'Server 1: MegaPlay' : 'Server 2: Zoko'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-primary/20 text-primary text-[10px] font-bold">
                    1080p HD
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMockServer('server1')}
                    className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      mockServer === 'server1'
                        ? 'bg-primary text-white'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    Server 1
                  </button>
                  <button
                    type="button"
                    onClick={() => setMockServer('server2')}
                    className={`px-2 py-1 rounded text-[11px] font-bold cursor-pointer transition-colors ${
                      mockServer === 'server2'
                        ? 'bg-primary text-white'
                        : 'bg-white/5 text-gray-400 hover:text-white'
                    }`}
                  >
                    Server 2
                  </button>
                </div>
              </div>

              {/* Player Screen Frame */}
              <div className="relative aspect-video rounded-xl overflow-hidden mt-3 bg-dark-100 flex items-center justify-center group/screen">
                <img
                  src="/images/hero/solo-leveling.jpg"
                  alt="Player Demo"
                  className="absolute inset-0 w-full h-full object-cover filter brightness-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

                {/* Simulated Play Trigger */}
                <div className="relative z-10 w-14 h-14 rounded-full bg-primary/90 text-white flex items-center justify-center shadow-[0_0_30px_rgba(230,57,70,0.8)]">
                  <PlayIcon className="w-7 h-7 ml-0.5 fill-white" />
                </div>

                {/* Animated Equalizer Wave */}
                <div className="absolute bottom-3 left-4 flex items-end gap-1 h-5">
                  <span className="w-1 bg-primary animate-pulse h-3 rounded-full" />
                  <span className="w-1 bg-primary animate-pulse h-5 rounded-full [animation-delay:150ms]" />
                  <span className="w-1 bg-primary animate-pulse h-2 rounded-full [animation-delay:300ms]" />
                  <span className="w-1 bg-primary animate-pulse h-4 rounded-full [animation-delay:450ms]" />
                  <span className="text-[10px] text-gray-300 ml-2 font-mono font-bold">18:42 / 24:10</span>
                </div>

                <div className="absolute bottom-3 right-4 flex items-center gap-2 text-[10px] text-gray-300 font-bold bg-black/60 px-2 py-1 rounded backdrop-blur-sm">
                  <span>Sub & Dub</span>
                </div>
              </div>

              {/* Keyboard Shortcuts Interactive Pill Preview */}
              <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-1.5 text-[11px]">
                <span className="px-2 py-1 rounded bg-dark-100 border border-white/10 text-gray-300">
                  <kbd className="font-mono text-primary font-bold">[N]</kbd> Next
                </span>
                <span className="px-2 py-1 rounded bg-dark-100 border border-white/10 text-gray-300">
                  <kbd className="font-mono text-primary font-bold">[P]</kbd> Prev
                </span>
                <span className="px-2 py-1 rounded bg-dark-100 border border-white/10 text-gray-300">
                  <kbd className="font-mono text-primary font-bold">[S]</kbd> Server
                </span>
                <span className="px-2 py-1 rounded bg-dark-100 border border-white/10 text-gray-300">
                  <kbd className="font-mono text-primary font-bold">[T]</kbd> Theater
                </span>
                <span className="px-2 py-1 rounded bg-dark-100 border border-white/10 text-gray-300">
                  <kbd className="font-mono text-primary font-bold">[L]</kbd> Lights
                </span>
                <span className="px-2 py-1 rounded bg-dark-100 border border-white/10 text-gray-300">
                  <kbd className="font-mono text-primary font-bold">[F]</kbd> Fullscreen
                </span>
              </div>
            </div>
          </motion.div>

          {/* ==========================================
              BENTO CARD 2: MANGA SANCTUARY (Span 5)
          ========================================== */}
          <motion.div
            style={{ y: bentoCol2Y }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="md:col-span-5 bg-gradient-to-br from-purple-950/40 via-dark-200/90 to-dark-300/90 rounded-3xl p-6 sm:p-8 border border-white/15 relative overflow-hidden shadow-2xl flex flex-col justify-between group hover:border-purple-500/50 transition-all duration-300"
          >
            {/* Ambient Purple Blob */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/20 rounded-full blur-[120px] pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center shadow-lg">
                  <BookOpenIcon className="w-6 h-6 fill-purple-400/80" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  MangaDex Reader
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Built-in Manga Sanctuary
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Read thousands of official and scanlated manga series with zero popup ads. Full chapter selector and continuous Webtoon vertical scrolling for mobile.
              </p>
            </div>

            {/* 3D Floating Manga Spread Preview */}
            <div className="mt-8 relative h-48 bg-black/60 rounded-2xl p-4 border border-white/10 overflow-hidden flex items-center justify-center">
              {/* Tilted Card 1 */}
              <div className="absolute w-36 h-48 bg-dark-100 rounded-xl border border-white/20 shadow-2xl transform -rotate-6 -translate-x-12 translate-y-4 overflow-hidden">
                <img
                  src="/images/hero/jujutsu-kaisen.jpg"
                  alt="Manga Preview"
                  className="w-full h-full object-cover filter brightness-90"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-white truncate">
                  JJK Chapter 265
                </div>
              </div>

              {/* Tilted Card 2 (Front) */}
              <div className="absolute w-40 h-52 bg-dark-200 rounded-xl border border-purple-500/40 shadow-2xl transform rotate-6 translate-x-8 translate-y-2 overflow-hidden">
                <img
                  src="/images/hero/solo-leveling.jpg"
                  alt="Manga Preview"
                  className="w-full h-full object-cover filter brightness-90"
                />
                <div className="absolute bottom-2 left-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] font-bold text-purple-300 truncate">
                  Solo Leveling Ch. 179
                </div>
              </div>

              {/* Webtoon Pill */}
              <div className="absolute top-3 left-3 bg-purple-500/90 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-full shadow-lg z-20">
                Webtoon Infinite Scroll
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5">
              <Link
                to="/manga"
                className="inline-flex items-center gap-2 text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors"
              >
                <span>Browse Manga Library</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* ==========================================
              BENTO CARD 3: SMART AUTO-PROGRESS (Span 5)
          ========================================== */}
          <motion.div
            style={{ y: bentoCol2Y }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="md:col-span-5 bg-gradient-to-br from-emerald-950/40 via-dark-200/90 to-dark-300/90 rounded-3xl p-6 sm:p-8 border border-white/15 relative overflow-hidden shadow-2xl flex flex-col justify-between group hover:border-emerald-500/50 transition-all duration-300"
          >
            {/* Ambient Emerald Blob */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-600/20 rounded-full blur-[120px] pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg">
                  <BookmarkSquareIcon className="w-6 h-6 fill-emerald-400/80" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  Cloud Watchlist
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Smart Auto-Progress
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed">
                Never lose your spot again. Episodes automatically mark as watched at 85% completion. Organise your lists into Watching, Completed, and Plan to Watch.
              </p>
            </div>

            {/* LIVE AUTO-PROGRESS SIMULATION WIDGET */}
            <div className="mt-8 bg-black/60 rounded-2xl p-4 border border-white/10 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-white">Demon Slayer — Episode 11</span>
                </div>
                <span className="text-emerald-400 font-mono font-bold text-xs">
                  {mockProgressPercent}% Watched
                </span>
              </div>

              {/* Interactive Progress Bar */}
              <div className="h-2 w-full bg-dark-100 rounded-full overflow-hidden border border-white/5">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${mockProgressPercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1">
                <span>Auto-Saved to History</span>
                <span className="text-gray-300 font-medium">Ready for Episode 12</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5">
              <Link
                to="/watchlist"
                className="inline-flex items-center gap-2 text-sm font-bold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <span>Open Watchlist Tracker</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </motion.div>

          {/* ==========================================
              BENTO CARD 4: ANILIST & MAL INTEL (Span 7)
          ========================================== */}
          <motion.div
            style={{ y: bentoCol1Y }}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-7 bg-gradient-to-br from-amber-950/40 via-dark-200/90 to-dark-300/90 rounded-3xl p-6 sm:p-8 border border-white/15 relative overflow-hidden shadow-2xl flex flex-col justify-between group hover:border-amber-500/50 transition-all duration-300"
          >
            {/* Ambient Amber Blob */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-amber-600/20 rounded-full blur-[120px] pointer-events-none" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-lg">
                  <SparklesIcon className="w-6 h-6 fill-amber-400/80" />
                </div>
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  AniList & MAL Synced
                </span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Deep Studio & Community Data
              </h3>
              <p className="text-sm text-gray-300 leading-relaxed max-w-xl">
                Every title features official 4K studio banner art, voice actor production rosters, community review scores, and recommendation graphs updated in real time.
              </p>
            </div>

            {/* Simulated Live Community Rating Chips */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 bg-black/60 rounded-xl border border-white/10">
                <div className="text-[11px] text-gray-400 font-semibold">AniList Community</div>
                <div className="text-lg font-extrabold text-white flex items-center gap-1 mt-0.5">
                  <StarIcon className="w-4 h-4 fill-yellow-400" />
                  <span>9.2 / 10</span>
                </div>
                <div className="text-[10px] text-gray-500">340k+ user ratings</div>
              </div>

              <div className="p-3 bg-black/60 rounded-xl border border-white/10">
                <div className="text-[11px] text-gray-400 font-semibold">Studio Production</div>
                <div className="text-sm font-extrabold text-white mt-1 truncate">
                  MAPPA & ufotable
                </div>
                <div className="text-[10px] text-gray-500">Official Licensors</div>
              </div>

              <div className="p-3 bg-black/60 rounded-xl border border-white/10 col-span-2 sm:col-span-1">
                <div className="text-[11px] text-gray-400 font-semibold">Streaming Ad Count</div>
                <div className="text-lg font-extrabold text-green-400 mt-0.5">
                  0 Popups
                </div>
                <div className="text-[10px] text-gray-500">Pure clean playback</div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex flex-wrap items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheckIcon className="w-4 h-4 text-primary" />
                <span>Zero Malware or Fake Buttons</span>
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheckIcon className="w-4 h-4 text-primary" />
                <span>Daily Broadcast Schedule</span>
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: WHY ANIMEVERSE COMPARISON MATRIX WITH PARALLAX DEEP BG
      ========================================================================= */}
      <section
        ref={compareSectionRef}
        className="relative py-24 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden"
      >
        {/* PARALLAX DEEP BACKGROUND IMAGE (Bleach Twilight Scenery) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          <motion.img
            style={{ y: compareBgY }}
            src="/images/hero/bleach.jpg"
            alt=""
            className="absolute -top-28 inset-x-0 w-full h-[145%] object-cover opacity-20 filter blur-[2px] brightness-105 contrast-125 mix-blend-luminosity"
          />
          {/* Deep Vignette Mask */}
          <div className="absolute inset-0 bg-gradient-to-b from-dark-100 via-dark-100/80 to-dark-100" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_10%,#0f0f23_85%)]" />
        </div>

        <div className="relative z-10 text-center max-w-2xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black tracking-widest uppercase bg-primary/10 border border-primary/30 text-primary">
            <CheckCircleIcon className="w-3.5 h-3.5" />
            <span>The Clear Difference</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-black text-white mt-3 tracking-tight">
            Why Fans Switch to AnimeVerse
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            See how AnimeVerse completely redefines free anime streaming and reading.
          </p>
        </div>

        <div className="relative z-10 bg-gradient-to-b from-dark-200/90 to-dark-300/90 rounded-3xl p-6 sm:p-8 border border-white/15 shadow-2xl overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs sm:text-sm font-extrabold uppercase tracking-wider text-gray-400">
                  <th className="py-4 px-4">Experience Feature</th>
                  <th className="py-4 px-4 text-red-400">Other Anime Sites</th>
                  <th className="py-4 px-4 text-primary font-black bg-primary/5 rounded-t-xl">
                    AnimeVerse
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs sm:text-sm">
                {COMPARISON_ITEMS.map((item, idx) => (
                  <tr key={idx} className="hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4 font-semibold text-white">
                      {item.feature}
                    </td>
                    <td className="py-4 px-4 text-gray-400 flex items-center gap-2">
                      <XCircleIcon className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{item.sketchy}</span>
                    </td>
                    <td className="py-4 px-4 font-bold text-white bg-primary/5">
                      <span className="flex items-center gap-2 text-emerald-400">
                        <CheckCircleIcon className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-gray-100">{item.animeverse}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 5: PLATFORM STATS STRIP (NEON HOLOGRAM COUNTER)
      ========================================================================= */}
      <section className="py-14 bg-gradient-to-r from-dark-200 via-dark-300 to-dark-200 border-y border-white/10 relative overflow-hidden">
        {/* Glow lights */}
        <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-80 h-32 bg-primary/20 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute top-1/2 right-1/3 -translate-y-1/2 w-80 h-32 bg-purple-600/20 rounded-full blur-[90px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-4xl sm:text-5xl font-black text-white font-display mb-1 tracking-tight">
                15,000+
              </div>
              <div className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-wider">
                Anime Episodes
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-4xl sm:text-5xl font-black text-primary font-display mb-1 tracking-tight shadow-primary">
                8,000+
              </div>
              <div className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-wider">
                Manga Chapters
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-4xl sm:text-5xl font-black text-white font-display mb-1 tracking-tight">
                1080p
              </div>
              <div className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-wider">
                Ultra HD Streams
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <div className="text-4xl sm:text-5xl font-black text-secondary font-display mb-1 tracking-tight">
                0
              </div>
              <div className="text-xs sm:text-sm text-gray-400 font-bold uppercase tracking-wider">
                Disruptive Ads
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 6: FAQ ACCORDION (GLOW-BORDER GLASS CARDS)
      ========================================================================= */}
      <section className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-5xl font-display font-black text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-gray-400 mt-2">
            Everything you need to know about streaming, reading, and syncing on AnimeVerse.
          </p>
        </div>

        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={idx}
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${
                  isOpen
                    ? 'bg-dark-200/90 border-primary/50 shadow-[0_5px_30px_rgba(230,57,70,0.15)]'
                    : 'bg-dark-200/60 border-white/10 hover:border-white/20'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 sm:p-6 text-left text-sm sm:text-base font-bold text-white hover:text-primary transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <span className={`p-1.5 rounded-lg shrink-0 ml-3 transition-colors ${
                    isOpen ? 'bg-primary text-white' : 'bg-white/5 text-gray-400'
                  }`}>
                    {isOpen ? <MinusIcon className="w-4 h-4" /> : <PlusIcon className="w-4 h-4" />}
                  </span>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="px-5 pb-6 sm:px-6 sm:pb-7 text-xs sm:text-sm text-gray-300 leading-relaxed border-t border-white/5 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </section>

      {/* =========================================================================
          SECTION 7: FINAL CINEMATIC CALL-TO-ACTION (MULTIVERSE PORTAL WITH PARALLAX)
      ========================================================================= */}
      <section
        ref={ctaSectionRef}
        className="py-28 relative overflow-hidden border-t border-white/10 bg-dark-100"
      >
        {/* PARALLAX DEEP BACKGROUND IMAGE (Solo Leveling Shadow Monarch Gate Scenery) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none select-none">
          <motion.img
            style={{ scale: ctaBgScale, y: ctaBgY }}
            src="/images/hero/solo-leveling.jpg"
            alt=""
            className="absolute -top-28 inset-x-0 w-full h-[150%] object-cover opacity-25 filter blur-[2px] brightness-110 contrast-125 mix-blend-screen"
          />
          {/* Deep Portal Vignette Mask */}
          <div className="absolute inset-0 bg-gradient-to-b from-dark-100 via-dark-100/75 to-dark-100" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#0f0f23_85%)]" />
        </div>

        {/* Multiverse glowing portal rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/25 via-purple-600/25 to-secondary/25 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest bg-white/10 border border-white/20 text-white mb-6 backdrop-blur-md shadow-lg">
            <SparklesIcon className="w-4 h-4 text-primary fill-primary" />
            <span>Enter the Multiverse</span>
          </div>

          <h2 className="text-4xl sm:text-6xl font-display font-black text-white tracking-tight leading-tight drop-shadow-xl">
            Your Ultimate Anime Journey Begins Now
          </h2>
          <p className="text-sm sm:text-lg text-gray-300 max-w-xl mx-auto mt-4 leading-relaxed font-medium">
            Stream your favorite series in crystal-clear 1080p, read new manga chapters, and track your watch journey for free.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/home"
              className="px-9 py-4 bg-gradient-to-r from-primary via-red-600 to-secondary hover:shadow-[0_0_35px_rgba(230,57,70,0.6)] text-white rounded-xl font-black text-base shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 inline-flex items-center gap-2.5 group"
            >
              <span>Enter AnimeVerse Catalog</span>
              <ArrowRightIcon className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/browse"
              className="px-7 py-4 bg-white/5 hover:bg-white/15 text-gray-200 hover:text-white rounded-xl font-bold text-base border border-white/15 transition-all duration-200 backdrop-blur-sm"
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
