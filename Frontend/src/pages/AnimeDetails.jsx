import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { animeService } from '../services/animeService';
import { watchlistService } from '../services/watchlistService';
import { useAuth } from '../context/AuthContext';
import { watchStorage } from '../utils/watchStorage';
import InfoSidebar from '../components/InfoSidebar';
import ImageGallery from '../components/ImageGallery';
import CharacterCard from '../components/CharacterCard';
import Carousel from '../components/Carousel';
import AnimeCard from '../components/AnimeCard';
import Loader from '../components/Loader';
import AddToWatchlistModal from '../components/AddToWatchlistModal';
import { PlusIcon, ShareIcon, ChevronDownIcon, ChevronUpIcon, CheckIcon } from '@heroicons/react/24/outline';
import { PlayIcon } from '@heroicons/react/24/solid';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const AnimeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [anime, setAnime] = useState(null);

  // Dynamic Browser Tab Title
  const animeTitle = anime?.title || anime?.titleEnglish || '';
  useDocumentTitle(animeTitle || 'Anime Details');
  const [characters, setCharacters] = useState([]);
  const [staff, setStaff] = useState([]);
  const [pictures, setPictures] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCharacters, setLoadingCharacters] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(true);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const [showStaff, setShowStaff] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [watchlistEntry, setWatchlistEntry] = useState(null);
  const [checkingWatchlist, setCheckingWatchlist] = useState(false);

  useEffect(() => {
    console.log('[AnimeDetails useEffect] Running with:', { id, isAuthenticated, authLoading });
    const fetchAnimeDetails = async () => {
      try {
        setLoading(true);

        // Fetch main anime data first
        const animeData = await animeService.getById(id);
        setAnime(animeData.data);
        // Main content is loaded, render page immediately
        setLoading(false);

        // Fetch sub-resources in parallel non-blocking
        setLoadingCharacters(true);
        animeService.getCharacters(id)
          .then(res => setCharacters(res.data || []))
          .catch(err => { console.error('Error fetching characters:', err); setCharacters([]); })
          .finally(() => setLoadingCharacters(false));

        setLoadingStaff(true);
        animeService.getStaff(id)
          .then(res => setStaff(res.data || []))
          .catch(err => { console.error('Error fetching staff:', err); setStaff([]); })
          .finally(() => setLoadingStaff(false));

        animeService.getPictures(id)
          .then(res => setPictures(res.data || []))
          .catch(err => { console.error('Error fetching pictures:', err); setPictures([]); });

        // Load recommendations and reviews in background with retry logic
        fetchRecommendationsWithRetry(id);
        fetchReviewsWithRetry(id);
      } catch (error) {
        console.error('Error fetching anime details:', error);
        setLoading(false);
      }
    };

    const fetchRecommendationsWithRetry = async (animeId, retries = 2) => {
      setLoadingRecommendations(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Non-blocking stagger
        const recsData = await animeService.getRecommendations(animeId);
        console.log('[AnimeDetails] Recommendations data:', recsData);
        setRecommendations(recsData.data?.slice(0, 10) || []);
      } catch (error) {
        console.error('Error fetching recommendations:', error);
        if (retries > 0) {
          console.log(`Retrying recommendations... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1500));
          return fetchRecommendationsWithRetry(animeId, retries - 1);
        }
      } finally {
        setLoadingRecommendations(false);
      }
    };

    const fetchReviewsWithRetry = async (animeId, retries = 2) => {
      setLoadingReviews(true);
      try {
        await new Promise(resolve => setTimeout(resolve, 800)); // Non-blocking stagger
        const reviewsData = await animeService.getReviews(animeId);
        console.log('[AnimeDetails] Reviews data:', reviewsData);
        setReviews(reviewsData.data?.slice(0, 5) || []);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        if (retries > 0) {
          console.log(`Retrying reviews... (${retries} attempts left)`);
          await new Promise(resolve => setTimeout(resolve, 1500));
          return fetchReviewsWithRetry(animeId, retries - 1);
        }
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchAnimeDetails();
  }, [id]);

  // Separate useEffect for watchlist status check
  useEffect(() => {
    console.log('[AnimeDetails watchlist check] Auth state:', { isAuthenticated, authLoading });
    if (!authLoading && isAuthenticated) {
      console.log('[AnimeDetails] Checking watchlist status...');
      checkWatchlistStatus();
    } else {
      console.log('[AnimeDetails] Skipping watchlist check:', { authLoading, isAuthenticated });
      // Clear watchlist entry if not authenticated
      if (!authLoading && !isAuthenticated) {
        setWatchlistEntry(null);
      }
    }
  }, [id, isAuthenticated, authLoading]);

  // Scroll to hash anchor (e.g., #trailer) after page loads
  useEffect(() => {
    if (!loading && location.hash) {
      // Wait a bit for content to render, then scroll
      const timer = setTimeout(() => {
        const element = document.querySelector(location.hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading, location.hash]);

  const checkWatchlistStatus = async () => {
    try {
      setCheckingWatchlist(true);
      const entry = await watchlistService.checkInWatchlist(parseInt(id));
      console.log('Watchlist check for malId:', parseInt(id), 'Result:', entry);
      setWatchlistEntry(entry);
    } catch (error) {
      console.error('Error checking watchlist:', error);
    } finally {
      setCheckingWatchlist(false);
    }
  };

  const handleAddToList = () => {
    if (!isAuthenticated) {
      // Redirect to login with return URL
      navigate('/login', { state: { from: `/anime/${id}` } });
      return;
    }
    setShowModal(true);
  };

  if (loading) {
    return <Loader fullScreen />;
  }

  if (!anime) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold text-white mb-2">Anime Not Found</h2>
          <p className="text-gray-400 mb-6">The anime you're looking for doesn't exist.</p>
          <Link to="/browse" className="text-primary hover:text-primary/80">
            Browse Anime →
          </Link>
        </div>
      </div>
    );
  }

  const backdropUrl = anime.bannerImage || anime.imageUrl || anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
  const trailerUrl = anime.trailerUrl || anime.trailer?.embed_url;
  const synopsis = anime.synopsis || 'No synopsis available.';
  const shouldTruncateSynopsis = synopsis.length > 300;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: anime.title,
          text: `Check out ${anime.title} on AnimeVerse!`,
          url: url,
        });
      } catch (err) {
        console.log('Share canceled');
      }
    } else {
      navigator.clipboard.writeText(url);
      setShowShareTooltip(true);
      setTimeout(() => setShowShareTooltip(false), 2000);
    }
  };

  // Determine watch progress & target episode for "Watch Now" / "Continue"
  const isMovie = anime?.type === 'Movie' || anime?.episodes === 1;
  const lastWatchedLocal = watchStorage.getLastWatched(id);
  const epFromWatchlist = watchlistEntry?.episodesWatched || 0;
  const totalEps = anime?.episodes || 0;
  const highestWatched = Math.max(lastWatchedLocal || 0, epFromWatchlist);

  let targetEpisode = 1;
  let watchButtonLabel = isMovie ? 'Watch Movie' : 'Watch Episode 1';

  if (isMovie) {
    targetEpisode = 1;
    watchButtonLabel = 'Watch Movie';
  } else if (highestWatched > 0) {
    if (totalEps > 0 && highestWatched >= totalEps) {
      targetEpisode = 1;
      watchButtonLabel = 'Re-watch (Ep 1)';
    } else {
      targetEpisode = highestWatched + 1;
      watchButtonLabel = `Continue Ep ${targetEpisode}`;
    }
  }

  return (
    <div className="min-h-screen">
      {/* Hero Header Section */}
      <div className="relative h-[400px] w-full overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${backdropUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f23] via-transparent to-transparent"></div>
        </div>

        {/* Content Overlay */}
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-end pb-8">
          <div className="flex items-end gap-6">
            {/* Poster Thumbnail */}
            <img
              src={backdropUrl}
              alt={anime.title}
              className="hidden md:block w-48 h-72 object-cover rounded-lg shadow-2xl border-4 border-white/10"
            />

            {/* Title and Quick Stats */}
            <div className="flex-1 mb-2">
              <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                {anime.title}
              </h1>
              {anime.title_japanese && anime.title_japanese !== anime.title && (
                <p className="text-lg text-gray-300 mb-4">{anime.title_japanese}</p>
              )}

              {/* Quick Stats Row */}
              <div className="flex flex-wrap items-center gap-3 mb-4">
                {anime.score && (
                  <div className="flex items-center gap-1 bg-yellow-500/20 backdrop-blur-sm px-3 py-1.5 rounded-full border border-yellow-500/30">
                    <span className="text-yellow-400">⭐</span>
                    <span className="text-white font-semibold">{anime.score.toFixed(1)}</span>
                  </div>
                )}
                <span className="text-gray-300">📺 {anime.episodes || '?'} eps</span>
                <span className="text-gray-300">📅 {anime.year || 'N/A'}</span>
                {anime.status && (
                  <span className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm">
                    {anime.status}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Link
                  to={`/watch/${id}/${targetEpisode}`}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg shadow-primary/30"
                >
                  <PlayIcon className="w-5 h-5 text-white" />
                  <span>{watchButtonLabel}</span>
                </Link>

                <button 
                  onClick={handleAddToList}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg ${
                    watchlistEntry
                      ? watchlistEntry.status === 'watching'
                        ? 'bg-blue-500 hover:bg-blue-600 text-white'
                        : watchlistEntry.status === 'completed'
                        ? 'bg-green-500 hover:bg-green-600 text-white'
                        : watchlistEntry.status === 'plan-to-watch'
                        ? 'bg-orange-500 hover:bg-orange-600 text-white'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                  }`}
                >
                  {watchlistEntry ? (
                    <>
                      {watchlistEntry.status === 'watching' && (
                        <>
                          <span className="text-xl">👁️</span>
                          <span>Watching</span>
                        </>
                      )}
                      {watchlistEntry.status === 'completed' && (
                        <>
                          <CheckIcon className="w-5 h-5" />
                          <span>Completed</span>
                        </>
                      )}
                      {watchlistEntry.status === 'plan-to-watch' && (
                        <>
                          <span className="text-xl">📌</span>
                          <span>Plan to Watch</span>
                        </>
                      )}
                      {watchlistEntry.status === 'dropped' && (
                        <>
                          <span className="text-xl">💔</span>
                          <span>Dropped</span>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <PlusIcon className="w-5 h-5" />
                      <span>Add to List</span>
                    </>
                  )}
                </button>
                <div className="relative">
                  <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2.5 rounded-lg transition-all duration-300 border border-white/20"
                  >
                    <ShareIcon className="w-5 h-5" />
                    <span>Share</span>
                  </button>
                  {showShareTooltip && (
                    <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded text-sm whitespace-nowrap flex items-center gap-1">
                      <CheckIcon className="w-4 h-4" />
                      Link copied!
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Column Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Synopsis Card */}
            <section className="bg-dark-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Synopsis</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {shouldTruncateSynopsis && !showFullSynopsis
                  ? synopsis.slice(0, 300) + '...'
                  : synopsis}
              </p>
              {shouldTruncateSynopsis && (
                <button
                  onClick={() => setShowFullSynopsis(!showFullSynopsis)}
                  className="mt-4 text-primary hover:text-primary/80 font-medium flex items-center gap-1"
                >
                  {showFullSynopsis ? 'Show Less' : 'Read More'}
                  {showFullSynopsis ? (
                    <ChevronUpIcon className="w-4 h-4" />
                  ) : (
                    <ChevronDownIcon className="w-4 h-4" />
                  )}
                </button>
              )}

              {anime.background && (
                <div className="mt-6 pt-6 border-t border-gray-700/50">
                  <h3 className="text-lg font-semibold text-white mb-3">Background</h3>
                  <p className="text-gray-300 leading-relaxed">{anime.background}</p>
                </div>
              )}
            </section>

            {/* Trailer Card */}
            {trailerUrl && (
              <section id="trailer" className="bg-dark-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Trailer</h2>
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  <iframe
                    src={trailerUrl}
                    title="Anime Trailer"
                    className="w-full h-full"
                    allowFullScreen
                    loading="lazy"
                    autoplay={false}
                    muted
                  ></iframe>
                </div>
              </section>
            )}

            {/* Pictures/Screenshots Section */}
            {pictures.length > 0 && (
              <section className="bg-dark-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Pictures & Artwork</h2>
                <ImageGallery images={pictures} />
              </section>
            )}

            {/* Characters Section */}
            <section className="bg-dark-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Characters</h2>
              {loadingCharacters ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : characters.length > 0 ? (
                <Carousel
                  items={characters.slice(0, 12)}
                  slidesToShow={5}
                  renderItem={(character) => <CharacterCard character={character} />}
                />
              ) : (
                <p className="text-gray-400 text-center py-6 text-sm">No characters listed for this title.</p>
              )}
            </section>

            {/* Staff Section (Collapsible) */}
            <section className="bg-dark-200 rounded-lg p-6">
              <button
                onClick={() => setShowStaff(!showStaff)}
                className="w-full flex items-center justify-between text-2xl font-bold text-white mb-4 hover:text-gray-300 transition-colors"
              >
                <span>Staff & Production {staff.length > 0 ? `(${staff.length})` : ''}</span>
                {showStaff ? (
                  <ChevronUpIcon className="w-6 h-6" />
                ) : (
                  <ChevronDownIcon className="w-6 h-6" />
                )}
              </button>
              {showStaff && (
                loadingStaff ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : staff.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {staff.map((member, index) => {
                      const personName = member.person?.name || member.name || 'Unknown';
                      const personImg = member.person?.images?.jpg?.image_url || member.imageUrl;
                      const positions = Array.isArray(member.positions) ? member.positions.join(', ') : (member.position || member.role || 'Staff');
                      return (
                        <div key={index} className="flex items-center gap-3 p-3 bg-dark-100 rounded-lg">
                          {personImg ? (
                            <img
                              src={personImg}
                              alt={personName}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-dark-200" />
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-white text-sm">{personName}</p>
                            <p className="text-xs text-gray-400">{positions}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-6 text-sm">No staff information available for this title.</p>
                )
              )}
            </section>

            {/* MAL Reviews Section */}
            <section className="bg-dark-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-2xl font-bold text-white">Reviews from MyAnimeList</h2>
                <img src="https://cdn.myanimelist.net/img/sp/icon/apple-touch-icon-256.png" alt="MAL" className="w-6 h-6" />
              </div>
              {loadingReviews ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : reviews.length > 0 ? (
                <>
                  <div className="space-y-4">
                  {reviews.map((review, index) => (
                    <div key={index} className="p-4 bg-dark-100 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={review.user.images?.jpg?.image_url || 'https://via.placeholder.com/40'}
                          alt={review.user.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-white">{review.user.username}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(review.date).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-yellow-400">⭐</span>
                          <span className="text-white font-semibold">{review.score}/10</span>
                        </div>
                      </div>
                      <p className="text-gray-300 text-sm line-clamp-4">{review.review}</p>
                      {review.reactions?.overall && (
                        <p className="text-xs text-gray-500 mt-2">
                          👍 {review.reactions.overall} found helpful
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                <a
                  href={`https://myanimelist.net/anime/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-center mt-4 text-primary hover:text-primary/80 font-medium"
                >
                  View All Reviews on MyAnimeList →
                </a>
                </>
              ) : (
                <p className="text-gray-400 text-center py-8">No reviews available at the moment.</p>
              )}
            </section>

            {/* Recommendations Section */}
            <section className="bg-dark-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">You Might Also Like</h2>
              {loadingRecommendations ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : recommendations.length > 0 ? (
                <Carousel
                  items={recommendations}
                  slidesToShow={5}
                  renderItem={(rec) => <AnimeCard anime={rec.entry} />}
                />
              ) : (
                <p className="text-gray-400 text-center py-8">No recommendations available at the moment.</p>
              )}
            </section>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <InfoSidebar anime={anime} />
          </div>
        </div>
      </div>

      <AddToWatchlistModal
        anime={anime}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={async () => {
          await checkWatchlistStatus();
          setShowModal(false);
        }}
      />
    </div>
  );
};

export default AnimeDetails;
