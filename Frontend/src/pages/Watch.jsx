import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { animeService } from '../services/animeService';
import { watchlistService } from '../services/watchlistService';
import { watchStorage } from '../utils/watchStorage';

// Watch Sub-components
import VideoPlayer from '../components/watch/VideoPlayer';
import ServerSwitcher from '../components/watch/ServerSwitcher';
import PlayerControls from '../components/watch/PlayerControls';
import EpisodeSelector from '../components/watch/EpisodeSelector';
import CinemaOverlay from '../components/watch/CinemaOverlay';
import RelatedAnimeList from '../components/watch/RelatedAnimeList';
import AdultStreamNotice from '../components/watch/AdultStreamNotice';

// Icons
import {
  ChevronLeftIcon,
  StarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/solid';

const Watch = () => {
  const { id, episode } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const playerContainerRef = useRef(null);

  // Core Data States
  const [anime, setAnime] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [episodeList, setEpisodeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(false);
  const [error, setError] = useState(null);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);

  // Player Configuration States
  const [activeServer, setActiveServer] = useState(() => watchStorage.getServerPreference());
  const [track, setTrack] = useState(() => watchStorage.getTrackPreference());
  const [autoNext, setAutoNext] = useState(() => watchStorage.getAutoNext());
  const [autoSkip, setAutoSkip] = useState(() => watchStorage.getAutoSkip());
  const [isTheater, setIsTheater] = useState(() => watchStorage.getTheaterMode());
  const [isLightsOff, setIsLightsOff] = useState(false);

  // Watch Progress States
  const [watchedEpisodes, setWatchedEpisodes] = useState(() => watchStorage.getWatchedEpisodes(id));

  // Current Episode Number
  const currentEpisode = useMemo(() => {
    const epNum = parseInt(episode, 10);
    return isNaN(epNum) || epNum < 1 ? 1 : epNum;
  }, [episode]);

  // Total Episodes & Movie detection
  const totalEpisodes = useMemo(() => {
    if (!anime) return null;
    return anime.episodes || null;
  }, [anime]);

  const isMovie = useMemo(() => {
    if (!anime) return false;
    return anime.type === 'Movie' || anime.episodes === 1;
  }, [anime]);

  const currentEpisodeInfo = useMemo(() => {
    if (!episodeList || !Array.isArray(episodeList)) return null;
    return episodeList.find((ep) => (ep.episode || ep.mal_id) === currentEpisode);
  }, [episodeList, currentEpisode]);

  const currentEpisodeTitle = currentEpisodeInfo?.title || currentEpisodeInfo?.fullTitle || '';

  // Initial redirect if no episode param provided in URL
  useEffect(() => {
    if (!episode && id) {
      const lastEp = watchStorage.getLastWatched(id) || 1;
      navigate(`/watch/${id}/${lastEp}`, { replace: true });
    }
  }, [id, episode, navigate]);

  // Fetch Anime Details
  useEffect(() => {
    if (!id) return;

    const fetchDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await animeService.getById(id);
        if (res.success && res.data) {
          setAnime(res.data);
        } else {
          setError('Failed to load anime details.');
        }
      } catch (err) {
        console.error('Error fetching anime details for watch page:', err);
        setError('Failed to load anime details.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [id]);

  // Fetch Recommendations (non-blocking)
  useEffect(() => {
    if (!id) return;

    const fetchRecs = async () => {
      try {
        setLoadingRecs(true);
        const res = await animeService.getRecommendations(id);
        if (res.success && res.data) {
          setRecommendations(res.data);
        }
      } catch (err) {
        console.warn('Could not load recommendations:', err);
      } finally {
        setLoadingRecs(false);
      }
    };

    fetchRecs();
  }, [id]);

  // Fetch Episode List with Titles
  useEffect(() => {
    if (!id) return;

    const fetchEpisodes = async () => {
      try {
        const res = await animeService.getEpisodes(id);
        if (res?.success && Array.isArray(res.data)) {
          setEpisodeList(res.data);
        }
      } catch (err) {
        console.warn('Could not load episode list:', err);
      }
    };

    fetchEpisodes();
  }, [id]);

  // Sync Watchlist History for Authenticated Users
  useEffect(() => {
    if (!id || authLoading || !isAuthenticated) return;

    const syncWatchlist = async () => {
      try {
        const entry = await watchlistService.checkInWatchlist(id);
        if (entry && entry.episodesWatched > 0) {
          const list = [];
          for (let i = 1; i <= entry.episodesWatched; i++) {
            list.push(i);
          }
          // Merge remote watched into local state
          setWatchedEpisodes((prev) => {
            const combined = Array.from(new Set([...prev, ...list]));
            return combined;
          });
        }
      } catch (err) {
        console.warn('Watchlist sync check failed:', err);
      }
    };

    syncWatchlist();
  }, [id, isAuthenticated, authLoading]);

  // Mark Episode Watched (Local & Remote)
  const markEpisodeWatched = useCallback(
    (epNum) => {
      if (!id || !epNum) return;
      const num = Number(epNum);

      // Update Local Storage
      watchStorage.markEpisodeWatched(id, num);
      setWatchedEpisodes((prev) => (prev.includes(num) ? prev : [...prev, num]));

      // Update Remote Watchlist if authenticated
      if (isAuthenticated) {
        watchlistService.updateProgress(id, num, anime, totalEpisodes);
      }
    },
    [id, isAuthenticated, anime, totalEpisodes]
  );

  // Set last watched when navigating to an episode
  useEffect(() => {
    if (id && currentEpisode) {
      watchStorage.setLastWatched(id, currentEpisode);
    }
  }, [id, currentEpisode]);

  // Episode Selection Handler
  const handleSelectEpisode = useCallback(
    (epNum) => {
      if (epNum === currentEpisode) return;
      navigate(`/watch/${id}/${epNum}`);
    },
    [id, currentEpisode, navigate]
  );

  // Next / Previous Navigation
  const handleNextEpisode = useCallback(() => {
    if (totalEpisodes && currentEpisode >= totalEpisodes) return;
    const nextEp = currentEpisode + 1;
    handleSelectEpisode(nextEp);
  }, [currentEpisode, totalEpisodes, handleSelectEpisode]);

  const handlePrevEpisode = useCallback(() => {
    if (currentEpisode <= 1) return;
    const prevEp = currentEpisode - 1;
    handleSelectEpisode(prevEp);
  }, [currentEpisode, handleSelectEpisode]);

  // Episode Completion (Auto-Next trigger)
  const handleEpisodeComplete = useCallback(() => {
    markEpisodeWatched(currentEpisode);

    if (autoNext) {
      if (!totalEpisodes || currentEpisode < totalEpisodes) {
        handleNextEpisode();
      }
    }
  }, [markEpisodeWatched, currentEpisode, autoNext, totalEpisodes, handleNextEpisode]);

  // Progress Logger (Auto-mark as watched at 85% progress)
  const handleProgress = useCallback(
    (currentTime, duration) => {
      if (!duration || duration <= 0) return;
      if (currentTime / duration >= 0.85) {
        if (!watchedEpisodes.includes(currentEpisode)) {
          markEpisodeWatched(currentEpisode);
        }
      }
    },
    [currentEpisode, watchedEpisodes, markEpisodeWatched]
  );

  // Toggle Handlers
  const handleServerChange = (server) => {
    setActiveServer(server);
    watchStorage.setServerPreference(server);
  };

  const handleTrackChange = (newTrack) => {
    setTrack(newTrack);
    watchStorage.setTrackPreference(newTrack);
  };

  const handleToggleAutoNext = () => {
    setAutoNext((prev) => {
      const nextVal = !prev;
      watchStorage.setAutoNext(nextVal);
      return nextVal;
    });
  };

  const handleToggleAutoSkip = () => {
    setAutoSkip((prev) => {
      const nextVal = !prev;
      watchStorage.setAutoSkip(nextVal);
      return nextVal;
    });
  };

  const handleToggleTheater = () => {
    setIsTheater((prev) => {
      const nextVal = !prev;
      watchStorage.setTheaterMode(nextVal);
      if (nextVal) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return nextVal;
    });
  };

  const handleToggleLights = () => {
    setIsLightsOff((prev) => !prev);
  };

  const handleToggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      playerContainerRef.current.requestFullscreen?.();
    }
  };

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore keystrokes inside input / textarea
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName) ||
        e.target.isContentEditable
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'n':
          e.preventDefault();
          handleNextEpisode();
          break;
        case 'p':
          e.preventDefault();
          handlePrevEpisode();
          break;
        case 's':
          e.preventDefault();
          handleServerChange(activeServer === 'server1' ? 'server2' : 'server1');
          break;
        case 't':
          e.preventDefault();
          handleToggleTheater();
          break;
        case 'l':
          e.preventDefault();
          handleToggleLights();
          break;
        case 'f':
          e.preventDefault();
          handleToggleFullscreen();
          break;
        case 'escape':
          if (isLightsOff) setIsLightsOff(false);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handleNextEpisode,
    handlePrevEpisode,
    activeServer,
    isLightsOff,
  ]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-400 text-sm font-medium">Loading Anime Stream...</p>
        </div>
      </div>
    );
  }

  if (error || !anime) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-dark-100 px-4">
        <div className="text-center max-w-md bg-dark-200 p-8 rounded-xl border border-white/5">
          <InformationCircleIcon className="w-12 h-12 text-primary mx-auto mb-3" />
          <h2 className="text-xl font-bold text-white mb-2">Anime Not Found</h2>
          <p className="text-gray-400 text-sm mb-6">
            {error || 'Unable to load episode information for this anime.'}
          </p>
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            <span>Browse Anime</span>
          </Link>
        </div>
      </div>
    );
  }

  const title = anime.title || anime.titleEnglish || 'Unknown Anime';
  const synopsis = anime.synopsis || 'No synopsis available.';
  const shouldTruncate = synopsis.length > 320;

  return (
    <div className="min-h-screen bg-dark-100 text-gray-100 pb-16">
      {/* Lights-Off Cinema Backdrop */}
      <CinemaOverlay isLightsOff={isLightsOff} onClose={() => setIsLightsOff(false)} />

      {/* Main Container */}
      <div
        className={`mx-auto px-4 sm:px-6 transition-all duration-300 ${
          isTheater ? 'max-w-[1720px]' : 'max-w-7xl'
        }`}
      >
        {/* Breadcrumb Navigation */}
        <div className="flex items-center justify-between py-2.5 text-xs text-gray-400">
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <Link to="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link to="/browse" className="hover:text-white transition-colors">
              Anime
            </Link>
            <span>/</span>
            <Link to={`/anime/${id}`} className="hover:text-white transition-colors truncate max-w-[200px] sm:max-w-xs">
              {title}
            </Link>
            <span>/</span>
            <span className="text-primary font-semibold">
              {isMovie ? 'Movie' : `Episode ${currentEpisode}`}
            </span>
          </div>

          <Link
            to={`/anime/${id}`}
            className="flex items-center gap-1 text-gray-400 hover:text-white text-xs transition-colors shrink-0"
          >
            <ChevronLeftIcon className="w-3.5 h-3.5" />
            <span>Anime Details</span>
          </Link>
        </div>

        {/* =========================================================================
            THEATER MODE LAYOUT (Single Column Player, Controls & Episodes below)
        ========================================================================= */}
        {isTheater ? (
          <div className="space-y-4">
            {/* Currently Playing Episode Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-1 text-sm">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="px-2.5 py-0.5 rounded-md bg-primary/20 text-primary font-bold text-xs uppercase tracking-wide border border-primary/30 shrink-0">
                  {isMovie ? 'Movie' : `Ep ${currentEpisode}`}
                </span>
                {currentEpisodeTitle ? (
                  <span className="text-white font-semibold text-sm sm:text-base truncate" title={currentEpisodeTitle}>
                    {currentEpisodeTitle}
                  </span>
                ) : (
                  <span className="text-gray-300 font-medium text-sm truncate">
                    {title} - Episode {currentEpisode}
                  </span>
                )}
              </div>
              {totalEpisodes && !isMovie && (
                <span className="text-xs text-gray-500 font-medium shrink-0">
                  {currentEpisode} / {totalEpisodes}
                </span>
              )}
            </div>

            {/* Player Container */}
            <VideoPlayer
              containerRef={playerContainerRef}
              malId={id}
              currentEpisode={currentEpisode}
              activeServer={activeServer}
              track={track}
              autoSkip={autoSkip}
              autoNext={autoNext}
              onEpisodeComplete={handleEpisodeComplete}
              onProgress={handleProgress}
              onServerSwitch={handleServerChange}
              isLightsOff={isLightsOff}
              isTheater={isTheater}
            />

            {/* Server Switcher Bar */}
            <ServerSwitcher
              activeServer={activeServer}
              onServerChange={handleServerChange}
              track={track}
              onTrackChange={handleTrackChange}
            />

            {/* Player Controls Bar */}
            <PlayerControls
              currentEpisode={currentEpisode}
              totalEpisodes={totalEpisodes}
              isMovie={isMovie}
              onPrevEpisode={handlePrevEpisode}
              onNextEpisode={handleNextEpisode}
              autoNext={autoNext}
              onToggleAutoNext={handleToggleAutoNext}
              autoSkip={autoSkip}
              onToggleAutoSkip={handleToggleAutoSkip}
              isTheater={isTheater}
              onToggleTheater={handleToggleTheater}
              isLightsOff={isLightsOff}
              onToggleLights={handleToggleLights}
              onToggleFullscreen={handleToggleFullscreen}
            />

            {/* Adult 18+ Streaming Helper (shown only for Rx / Hentai) */}
            <AdultStreamNotice anime={anime} />

            {/* Below Player in Theater Mode: 2 Columns (Meta + Episodes) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-4">
              <div className="lg:col-span-8 space-y-6">
                {/* Anime Details Card */}
                <div className="bg-dark-200 rounded-xl p-6 border border-white/5">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">
                      {title}
                    </h1>
                    {anime.score && (
                      <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/30">
                        <StarIcon className="w-3.5 h-3.5" />
                        <span>{Number(anime.score).toFixed(1)}</span>
                      </div>
                    )}
                  </div>

                  {anime.title_japanese && (
                    <p className="text-sm text-gray-400 mb-4">{anime.title_japanese}</p>
                  )}

                  {/* Metadata Tags */}
                  <div className="flex flex-wrap gap-2 mb-4 text-xs">
                    {anime.year && (
                      <span className="px-2.5 py-1 bg-dark-100 rounded text-gray-300">
                        📅 {anime.year}
                      </span>
                    )}
                    {anime.status && (
                      <span className="px-2.5 py-1 bg-dark-100 rounded text-gray-300">
                        📺 {anime.status}
                      </span>
                    )}
                    {totalEpisodes && (
                      <span className="px-2.5 py-1 bg-dark-100 rounded text-gray-300">
                        🎞️ {totalEpisodes} episodes
                      </span>
                    )}
                    {anime.genres?.map((g, idx) => {
                      const genreName = typeof g === 'string' ? g : g?.name || g?.title;
                      if (!genreName) return null;
                      return (
                        <span
                          key={g.mal_id || genreName || idx}
                          className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded"
                        >
                          {genreName}
                        </span>
                      );
                    })}
                  </div>

                  {/* Synopsis */}
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                    {shouldTruncate && !showFullSynopsis
                      ? `${synopsis.slice(0, 320)}...`
                      : synopsis}
                  </p>
                  {shouldTruncate && (
                    <button
                      onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                      className="mt-2 text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1"
                    >
                      <span>{showFullSynopsis ? 'Show Less' : 'Read More'}</span>
                      {showFullSynopsis ? (
                        <ChevronUpIcon className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDownIcon className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}

                  {/* Disqus Thread Placeholder */}
                  <div id="disqus_thread" className="mt-8 pt-6 border-t border-white/5" />
                </div>

                {/* Recommendations */}
                <RelatedAnimeList
                  recommendations={recommendations}
                  loading={loadingRecs}
                />
              </div>

              {/* Episode Selector (Right Column in Theater Mode) */}
              <div className="lg:col-span-4 self-start">
                <EpisodeSelector
                  totalEpisodes={totalEpisodes || currentEpisode}
                  currentEpisode={currentEpisode}
                  watchedEpisodes={watchedEpisodes}
                  episodeList={episodeList}
                  onSelectEpisode={handleSelectEpisode}
                  isMovie={isMovie}
                />
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
              DEFAULT 2-COLUMN DESKTOP LAYOUT (Player 70%, Episode Selector 30%)
          ========================================================================= */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Player & Meta (~70%) */}
            <div className="lg:col-span-8 xl:col-span-8 space-y-4">
              {/* Currently Playing Episode Header */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1 text-sm">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="px-2.5 py-0.5 rounded-md bg-primary/20 text-primary font-bold text-xs uppercase tracking-wide border border-primary/30 shrink-0">
                    {isMovie ? 'Movie' : `Ep ${currentEpisode}`}
                  </span>
                  {currentEpisodeTitle ? (
                    <span className="text-white font-semibold text-sm sm:text-base truncate" title={currentEpisodeTitle}>
                      {currentEpisodeTitle}
                    </span>
                  ) : (
                    <span className="text-gray-300 font-medium text-sm truncate">
                      {title} - Episode {currentEpisode}
                    </span>
                  )}
                </div>
                {totalEpisodes && !isMovie && (
                  <span className="text-xs text-gray-500 font-medium shrink-0">
                    {currentEpisode} / {totalEpisodes}
                  </span>
                )}
              </div>

              {/* Player Container */}
              <VideoPlayer
                containerRef={playerContainerRef}
                malId={id}
                currentEpisode={currentEpisode}
                activeServer={activeServer}
                track={track}
                autoSkip={autoSkip}
                autoNext={autoNext}
                onEpisodeComplete={handleEpisodeComplete}
                onProgress={handleProgress}
                onServerSwitch={handleServerChange}
                isLightsOff={isLightsOff}
                isTheater={isTheater}
              />

              {/* Server Switcher Bar */}
              <ServerSwitcher
                activeServer={activeServer}
                onServerChange={handleServerChange}
                track={track}
                onTrackChange={handleTrackChange}
              />

              {/* Controls Bar */}
              <PlayerControls
                currentEpisode={currentEpisode}
                totalEpisodes={totalEpisodes}
                isMovie={isMovie}
                onPrevEpisode={handlePrevEpisode}
                onNextEpisode={handleNextEpisode}
                autoNext={autoNext}
                onToggleAutoNext={handleToggleAutoNext}
                autoSkip={autoSkip}
                onToggleAutoSkip={handleToggleAutoSkip}
                isTheater={isTheater}
                onToggleTheater={handleToggleTheater}
                isLightsOff={isLightsOff}
                onToggleLights={handleToggleLights}
                onToggleFullscreen={handleToggleFullscreen}
              />

              {/* Adult 18+ Streaming Helper (shown only for Rx / Hentai) */}
              <AdultStreamNotice anime={anime} />

              {/* Mobile Episode Selector (appears here only on small screens) */}
              <div className="block lg:hidden">
                <EpisodeSelector
                  totalEpisodes={totalEpisodes || currentEpisode}
                  currentEpisode={currentEpisode}
                  watchedEpisodes={watchedEpisodes}
                  episodeList={episodeList}
                  onSelectEpisode={handleSelectEpisode}
                  isMovie={isMovie}
                />
              </div>

              {/* Anime Meta Details Card */}
              <div className="bg-dark-200 rounded-xl p-6 border border-white/5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-white">
                    {title}
                  </h1>
                  {anime.score && (
                    <div className="flex items-center gap-1 bg-yellow-500/20 text-yellow-400 px-3 py-1 rounded-full text-xs font-bold border border-yellow-500/30">
                      <StarIcon className="w-3.5 h-3.5" />
                      <span>{Number(anime.score).toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {anime.title_japanese && (
                  <p className="text-xs text-gray-400">{anime.title_japanese}</p>
                )}

                {/* Tags */}
                <div className="flex flex-wrap gap-2 text-xs">
                  {anime.year && (
                    <span className="px-2.5 py-1 bg-dark-100 rounded text-gray-300">
                      📅 {anime.year}
                    </span>
                  )}
                  {anime.status && (
                    <span className="px-2.5 py-1 bg-dark-100 rounded text-gray-300">
                      📺 {anime.status}
                    </span>
                  )}
                  {totalEpisodes && (
                    <span className="px-2.5 py-1 bg-dark-100 rounded text-gray-300">
                      🎞️ {totalEpisodes} episodes
                    </span>
                  )}
                  {anime.genres?.map((g, idx) => {
                    const genreName = typeof g === 'string' ? g : g?.name || g?.title;
                    if (!genreName) return null;
                    return (
                      <span
                        key={g.mal_id || genreName || idx}
                        className="px-2.5 py-1 bg-primary/10 text-primary border border-primary/20 rounded"
                      >
                        {genreName}
                      </span>
                    );
                  })}
                </div>

                {/* Synopsis */}
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                  {shouldTruncate && !showFullSynopsis
                    ? `${synopsis.slice(0, 320)}...`
                    : synopsis}
                </p>
                {shouldTruncate && (
                  <button
                    onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                    className="text-xs text-primary hover:text-primary/80 font-semibold flex items-center gap-1"
                  >
                    <span>{showFullSynopsis ? 'Show Less' : 'Read More'}</span>
                    {showFullSynopsis ? (
                      <ChevronUpIcon className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDownIcon className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}

                {/* Disqus Thread Placeholder */}
                <div id="disqus_thread" className="mt-8 pt-6 border-t border-white/5" />
              </div>

              {/* Related / Recommendations */}
              <RelatedAnimeList
                recommendations={recommendations}
                loading={loadingRecs}
              />
            </div>

            {/* Right Column: Sticky Episode Selector (~30%) */}
            <div className="hidden lg:block lg:col-span-4 xl:col-span-4 self-start">
              <div className="sticky top-20">
                <EpisodeSelector
                  totalEpisodes={totalEpisodes || currentEpisode}
                  currentEpisode={currentEpisode}
                  watchedEpisodes={watchedEpisodes}
                  episodeList={episodeList}
                  onSelectEpisode={handleSelectEpisode}
                  isMovie={isMovie}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Watch;

