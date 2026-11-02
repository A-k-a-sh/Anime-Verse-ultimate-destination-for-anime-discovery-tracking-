import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { mangaService } from '../services/mangaService';
import { watchlistService } from '../services/watchlistService';
import { useAuth } from '../context/AuthContext';
import ImageGallery from '../components/ImageGallery';
import CharacterCard from '../components/CharacterCard';
import Loader from '../components/Loader';
import AddToWatchlistModal from '../components/AddToWatchlistModal';
import { PlusIcon, ShareIcon, ChevronDownIcon, ChevronUpIcon, CheckIcon } from '@heroicons/react/24/outline';
import { StarIcon } from '@heroicons/react/24/solid';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const MangaDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [manga, setManga] = useState(null);

  // Dynamic Browser Tab Title
  const mangaTitle = manga?.title || manga?.titleEnglish || '';
  useDocumentTitle(mangaTitle || 'Manga Details');
  const [characters, setCharacters] = useState([]);
  const [pictures, setPictures] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFullSynopsis, setShowFullSynopsis] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [watchlistEntry, setWatchlistEntry] = useState(null);

  useEffect(() => {
    const fetchMangaDetails = async () => {
      try {
        setLoading(true);

        // Fetch main manga data first
        const mangaData = await mangaService.getById(id);
        setManga(mangaData.data);

        // Helper function to add delay between requests
        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

        // Fetch remaining data sequentially with delays to avoid rate limiting
        await delay(400);
        const charactersData = await mangaService.getCharacters(id);
        setCharacters(charactersData.data || []);

        await delay(400);
        const picturesData = await mangaService.getPictures(id);
        console.log('[MangaDetails] Pictures data:', picturesData);
        setPictures(picturesData.data || []);

        await delay(400);
        const recsData = await mangaService.getRecommendations(id);
        console.log('[MangaDetails] Recommendations data:', recsData);
        setRecommendations(recsData.data?.slice(0, 10) || []);
      } catch (error) {
        console.error('Error fetching manga details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMangaDetails();
  }, [id]);

  // Separate useEffect for watchlist status check
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      checkWatchlistStatus();
    } else if (!authLoading && !isAuthenticated) {
      setWatchlistEntry(null);
    }
  }, [id, isAuthenticated, authLoading]);

  const checkWatchlistStatus = async () => {
    try {
      const entry = await watchlistService.checkInWatchlist(parseInt(id));
      console.log('Watchlist check for manga malId:', parseInt(id), 'Result:', entry);
      setWatchlistEntry(entry);
    } catch (error) {
      console.error('Error checking watchlist:', error);
    }
  };

  const handleAddToList = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/manga/${id}` } });
      return;
    }
    setShowModal(true);
  };

  if (loading) return <Loader fullScreen />;

  if (!manga) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😢</div>
          <h2 className="text-2xl font-bold text-white mb-2">Manga Not Found</h2>
          <p className="text-gray-400 mb-6">The manga you're looking for doesn't exist.</p>
          <Link to="/manga" className="text-primary hover:text-primary/80">
            Browse Manga →
          </Link>
        </div>
      </div>
    );
  }

  const imageUrl = manga.imageUrl || manga.images?.jpg?.large_image_url || manga.images?.jpg?.image_url;
  const bannerUrl = manga.bannerImage || imageUrl;
  const synopsis = manga.synopsis || 'No synopsis available.';
  const shouldTruncateSynopsis = synopsis.length > 300;

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: manga.title,
          text: `Check out ${manga.title} on AnimeVerse!`,
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

  return (
    <div className="min-h-screen">
      {/* Hero Header */}
      <div className="relative h-[400px] w-full overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bannerUrl})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f23] via-transparent to-transparent"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
          <div className="flex items-end h-full pb-12 gap-6">
            <img src={imageUrl} alt={manga.title} className="hidden md:block w-48 rounded-lg shadow-2xl" />
            <div className="flex-1">
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">{manga.title}</h1>
              {manga.titleJapanese && <p className="text-xl text-gray-300 mb-4">{manga.titleJapanese}</p>}
              <div className="flex flex-wrap items-center gap-4">
                {manga.score && (
                  <div className="flex items-center gap-2 bg-yellow-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-yellow-500/30">
                    <StarIcon className="w-5 h-5 text-yellow-400" />
                    <span className="text-white font-bold">{manga.score.toFixed(2)}</span>
                  </div>
                )}
                <span className="text-gray-300">{manga.type || 'Manga'}</span>
                {manga.chapters && <span className="text-gray-300">📖 {manga.chapters} chapters</span>}
                {manga.volumes && <span className="text-gray-300">📚 {manga.volumes} volumes</span>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={handleAddToList}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 shadow-lg ${
                  watchlistEntry
                    ? watchlistEntry.status === 'watching'
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : watchlistEntry.status === 'completed'
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : watchlistEntry.status === 'plan-to-watch'
                      ? 'bg-orange-500 hover:bg-orange-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-primary hover:bg-primary/90 text-white'
                }`}
              >
                {watchlistEntry ? (
                  <>
                    {watchlistEntry.status === 'watching' && (
                      <>
                        <span className="text-xl">📖</span>
                        <span>Reading</span>
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
                        <span>Plan to Read</span>
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
                  className="flex items-center gap-2 bg-dark-200 hover:bg-dark-300 text-white px-4 py-3 rounded-lg font-semibold transition-all"
                >
                  <ShareIcon className="w-5 h-5" />
                </button>
                {showShareTooltip && (
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-3 py-1 rounded text-sm whitespace-nowrap flex items-center gap-1">
                    <CheckIcon className="w-4 h-4" />
                    Link copied!
                  </div>
                )}
              </div>
            </div>

            {/* Synopsis */}
            <div className="bg-dark-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Synopsis</h2>
              <p className="text-gray-300 leading-relaxed whitespace-pre-line">
                {showFullSynopsis || !shouldTruncateSynopsis ? synopsis : `${synopsis.slice(0, 300)}...`}
              </p>
              {shouldTruncateSynopsis && (
                <button onClick={() => setShowFullSynopsis(!showFullSynopsis)} className="text-primary mt-3 flex items-center gap-1">
                  {showFullSynopsis ? <><span>Show Less</span><ChevronUpIcon className="w-4 h-4" /></> : <><span>Read More</span><ChevronDownIcon className="w-4 h-4" /></>}
                </button>
              )}
            </div>

            {/* Pictures */}
            {pictures.length > 0 && (
              <div className="bg-dark-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Pictures</h2>
                <ImageGallery images={pictures} />
              </div>
            )}

            {/* Characters */}
            {characters.length > 0 && (
              <div className="bg-dark-200 rounded-lg p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Characters</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {characters.slice(0, 12).map((char, index) => {
                    const charData = char.character || char;
                    const charId = charData.mal_id || charData.malId || `char-${index}`;
                    return <CharacterCard key={charId} character={char} />;
                  })}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="bg-dark-200 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-4">You Might Also Like</h2>
              {recommendations.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {recommendations.map((rec, index) => {
                    const item = rec.entry || rec;
                    const recId = item.mal_id || item.malId;
                    const title = item.title || item.titleEnglish || 'Unknown Title';
                    const img = item.images?.jpg?.image_url || item.imageUrl || '';
                    if (!recId) return null;
                    return (
                      <Link key={`${recId}-${index}`} to={`/manga/${recId}`} className="group">
                        <img 
                          src={img} 
                          alt={title} 
                          className="w-full rounded-lg group-hover:scale-105 transition-transform aspect-[2/3] object-cover"
                        />
                        <p className="text-sm text-white mt-2 truncate">{title}</p>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">No recommendations available at the moment.</p>
              )}
            </div>
          </div>

          {/* Info Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-dark-200 rounded-lg p-6 sticky top-24">
              <h3 className="text-xl font-bold text-white mb-4">Information</h3>
              <dl className="space-y-3">
                <div><dt className="text-sm text-gray-400">Type</dt><dd className="text-white font-medium">{manga.type}</dd></div>
                <div><dt className="text-sm text-gray-400">Chapters</dt><dd className="text-white font-medium">{manga.chapters || '?'}</dd></div>
                <div><dt className="text-sm text-gray-400">Volumes</dt><dd className="text-white font-medium">{manga.volumes || '?'}</dd></div>
                <div><dt className="text-sm text-gray-400">Status</dt><dd className="text-white font-medium">{manga.status}</dd></div>
                {manga.authors && manga.authors.length > 0 && (
                  <div>
                    <dt className="text-sm text-gray-400">Authors</dt>
                    <dd className="text-white font-medium">
                      {manga.authors.map(a => typeof a === 'string' ? a : a.name).filter(Boolean).join(', ')}
                    </dd>
                  </div>
                )}
              </dl>

              {manga.genres && manga.genres.length > 0 && (
                <div className="mt-6 pt-4 border-t border-gray-700/50">
                  <h4 className="text-sm text-gray-400 mb-2">Genres</h4>
                  <div className="flex flex-wrap gap-2">
                    {manga.genres.map((g, index) => (
                      <span key={typeof g === 'string' ? `${g}-${index}` : g.mal_id} className="px-2 py-1 bg-primary/20 text-primary text-xs rounded">{typeof g === 'string' ? g : g.name}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-6 pt-4 border-t border-gray-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Score</span>
                  <span className="text-2xl font-bold text-yellow-400">⭐ {manga.score ? manga.score.toFixed(2) : 'N/A'}</span>
                </div>
                {manga.scoredBy && <p className="text-xs text-gray-500">{manga.scoredBy.toLocaleString()} users</p>}
                {manga.rank && <p className="text-sm text-gray-400 mt-2">Ranked #{manga.rank}</p>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add to Watchlist Modal */}
      <AddToWatchlistModal
        anime={manga}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={async () => {
          await checkWatchlistStatus();
          setShowModal(false);
        }}
        isManga={true}
      />
    </div>
  );
};

export default MangaDetails;
