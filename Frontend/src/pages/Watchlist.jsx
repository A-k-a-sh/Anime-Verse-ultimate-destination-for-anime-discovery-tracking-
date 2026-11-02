import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { watchlistService } from '../services/watchlistService';
import Loader from '../components/Loader';
import AddToWatchlistModal from '../components/AddToWatchlistModal';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

const Watchlist = () => {
  const [activeTab, setActiveTab] = useState('watching');
  const [watchlist, setWatchlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchWatchlist();
  }, [activeTab]);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const response = await watchlistService.getWatchlist({ status: activeTab });
      setWatchlist(response.data || []);
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      setWatchlist([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Remove from watchlist?')) {
      try {
        await watchlistService.removeFromWatchlist(id);
        fetchWatchlist();
      } catch (error) {
        console.error('Error deleting:', error);
      }
    }
  };

  const tabs = [
    { id: 'watching', label: 'Watching', icon: '📺' },
    { id: 'completed', label: 'Completed', icon: '✔️' },
    { id: 'plan-to-watch', label: 'Plan to Watch', icon: '📝' },
    { id: 'dropped', label: 'Dropped', icon: '🚫' },
  ];

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">My Watchlist</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-white'
                  : 'bg-dark-200 text-gray-400 hover:bg-dark-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Watchlist Items */}
        {loading ? (
          <Loader />
        ) : watchlist.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📁</div>
            <h3 className="text-2xl font-semibold text-gray-300 mb-2">No Anime Here</h3>
            <p className="text-gray-400 mb-6">Start adding anime to your {activeTab} list</p>
            <Link to="/browse" className="inline-block bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-semibold">
              Browse Anime
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {watchlist.map((item) => {
              // Backend returns: item.anime = { ...animeData, malId, isManga }
              const anime = item.anime || {};
              const contentPath = anime.isManga ? 'manga' : 'anime';
              const malId = anime.malId || item.malId;
              
              return (
              <div key={item._id} className="bg-dark-200 rounded-lg p-4 flex items-center gap-4 hover:bg-dark-300 transition-colors">
                <Link to={`/${contentPath}/${malId}`} className="flex-shrink-0 ">
                  <img
                    src={anime.imageUrl || 'https://via.placeholder.com/80x120'}
                    alt={anime.title || 'Unknown Title'}
                    className="w-20 h-28 object-cover rounded"
                  />
                </Link>
                <div className=" flex-1 min-w-0">
                  <Link to={`/${contentPath}/${malId}`}>
                    <h3 className="text-lg font-semibold text-white mb-1 hover:text-primary transition-colors">
                      {anime.title || 'Unknown Title'}
                    </h3>
                  </Link>
                  {activeTab === 'watching' && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between text-sm text-gray-400 mb-1">
                        <span>Progress ({anime.isManga ? 'Chapters' : 'Episodes'})</span>
                        <span>{item.episodesWatched || 0} / {anime.episodes || '?'}</span>
                      </div>
                      <div className="w-full bg-dark-100 rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(((item.episodesWatched || 0) / (anime.episodes || 1)) * 100, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                  {item.userRating && (
                    <div className="flex items-center gap-1 text-yellow-400 text-sm">
                      <span>⭐</span>
                      <span>{item.userRating}/10</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {activeTab === 'watching' && (
                    anime.isManga ? (
                      <Link
                        to={`/read/${malId}/${Math.max(1, (item.episodesWatched || 0) + 1)}`}
                        className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow transition-all active:scale-95 whitespace-nowrap"
                        title="Resume reading next chapter"
                      >
                        Resume Ch {Math.max(1, (item.episodesWatched || 0) + 1)}
                      </Link>
                    ) : (
                      <Link
                        to={`/watch/${malId}/${Math.max(1, (item.episodesWatched || 0) + 1)}`}
                        className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-semibold shadow transition-all active:scale-95 whitespace-nowrap"
                        title="Resume watching next episode"
                      >
                        Resume Ep {Math.max(1, (item.episodesWatched || 0) + 1)}
                      </Link>
                    )
                  )}
                  <button 
                    onClick={() => {
                      setEditingItem(item);
                      setShowModal(true);
                    }}
                    className="p-2 bg-dark-100 hover:bg-dark-300 text-gray-400 hover:text-white rounded-lg transition-colors"
                  >
                    <PencilIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-2 bg-dark-100 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )})}
          </div>
        )}
      </div>

      <AddToWatchlistModal
        anime={editingItem?.anime ? { ...editingItem.anime, malId: editingItem.anime.malId || editingItem.malId } : null}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingItem(null);
        }}
        onSuccess={() => {
          setShowModal(false);
          setEditingItem(null);
          fetchWatchlist();
        }}
        isManga={editingItem?.anime?.isManga || editingItem?.isManga || false}
      />
    </div>
  );
};

export default Watchlist;
