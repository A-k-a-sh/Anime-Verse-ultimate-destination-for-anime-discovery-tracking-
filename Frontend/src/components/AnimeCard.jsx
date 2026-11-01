import { Link } from 'react-router-dom';
import { StarIcon, PlayIcon, PlusIcon } from '@heroicons/react/24/solid';
import { BookmarkIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import { formatScore, getStatusColor } from '../utils/helpers';
import { useState } from 'react';
import AddToWatchlistModal from './AddToWatchlistModal';

const AnimeCard = ({ anime, index = 0, type = 'anime' }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="group relative bg-dark-200 rounded-xl overflow-hidden hover:shadow-glow-md transition-all duration-300 transform hover:scale-105"
    >
      <Link to={`/${type}/${anime.malId || anime.mal_id}`}>
        {/* Image Container */}
        <div className="relative aspect-[2/3] overflow-hidden bg-dark-100">
          {/* Skeleton loader */}
          {!imageLoaded && (anime.imageUrl || anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url) && (
            <div className="absolute inset-0 skeleton" />
          )}
          
          {/* Anime Image */}
          <img
            src={anime.imageUrl || anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || 'https://via.placeholder.com/300x450?text=No+Cover'}
            alt={anime.title || anime.titleEnglish}
            onLoad={handleImageLoad}
            onError={() => setImageLoaded(true)}
            className={`w-full h-full object-cover transition-all duration-500 ${
              imageLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            } group-hover:scale-110`}
          />

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Score Badge */}
          {(anime.score || anime.rating) && (
            <div className="absolute top-2 right-2 bg-dark-200/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center space-x-1">
              <StarIcon className="w-4 h-4 text-yellow-400" />
              <span className="text-sm font-semibold text-white">
                {formatScore(anime.score || anime.rating)}
              </span>
            </div>
          )}

          {/* Status Badge */}
          {anime.status && (
            <div className={`absolute top-2 left-2 text-xs font-medium px-2 py-1 rounded bg-dark-200/90 backdrop-blur-sm ${getStatusColor(anime.status)}`}>
              {anime.status}
            </div>
          )}

          {/* Quick Actions (on hover) */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex space-x-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setShowModal(true);
                }}
                className="p-3 bg-primary/90 backdrop-blur-sm rounded-full text-white hover:bg-primary transform hover:scale-110 transition-all duration-200"
              >
                <PlusIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="p-4">
          <h3 className="text-white font-semibold text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors duration-200">
            {anime.title || anime.titleEnglish}
          </h3>
          
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>{anime.type || 'TV'}</span>
            <span>
              {anime.episodes ? `${anime.episodes} eps` : anime.year || 'N/A'}
            </span>
          </div>

          {/* Genres */}
          {anime.genres && anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {anime.genres.slice(0, 2).map((genre, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2 py-1 bg-dark-300 text-gray-300 rounded"
                >
                  {typeof genre === 'string' ? genre : genre.name}
                </span>
              ))}
              {anime.genres.length > 2 && (
                <span className="text-xs px-2 py-1 bg-dark-300 text-gray-300 rounded">
                  +{anime.genres.length - 2}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>

      <AddToWatchlistModal
        anime={anime}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => setShowModal(false)}
        isManga={type === 'manga'}
      />
    </motion.div>
  );
};

export default AnimeCard;
