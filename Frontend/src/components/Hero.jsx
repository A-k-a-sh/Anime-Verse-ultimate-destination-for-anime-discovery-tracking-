import { Link } from 'react-router-dom';
import { PlayIcon, PlusIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

const Hero = ({ anime }) => {
  if (!anime) return null;

  const backdropUrl = anime.bannerImage || anime.imageUrl || anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url;
  const score = anime.score ? anime.score.toFixed(1) : 'N/A';
  const year = anime.year || new Date(anime.aired?.from).getFullYear() || 'N/A';
  const episodes = anime.episodes || '?';
  const status = anime.status || 'Unknown';

  return (
    <div className="relative h-[500px] md:h-[600px] w-full overflow-hidden">
      {/* Background Image with Gradient Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${backdropUrl})`,
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0f0f23] via-transparent to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center">
        <div className="max-w-2xl">
          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 drop-shadow-lg">
            {anime.title}
          </h1>

          {/* Japanese Title */}
          {anime.title_japanese && anime.title_japanese !== anime.title && (
            <p className="text-xl text-gray-300 mb-4">{anime.title_japanese}</p>
          )}

          {/* Stats */}
          <div className="flex flex-wrap items-center gap-4 mb-6 text-sm md:text-base">
            <div className="flex items-center gap-2 bg-yellow-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-yellow-500/30">
              <span className="text-yellow-400">⭐</span>
              <span className="text-white font-semibold">{score}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <span>📺</span>
              <span>{episodes} eps</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <span>📅</span>
              <span>{year}</span>
            </div>
            <div className="px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm">
              {status}
            </div>
          </div>

          {/* Synopsis */}
          <p className="text-gray-300 text-base md:text-lg mb-8 line-clamp-3">
            {anime.synopsis || 'No synopsis available.'}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <Link
              to={`/watch/${anime.mal_id || anime.malId}/1`}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <PlayIcon className="w-5 h-5" />
              <span>Watch Now</span>
            </Link>
            <Link
              to={`/anime/${anime.mal_id || anime.malId}`}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 border border-white/20"
            >
              <InformationCircleIcon className="w-5 h-5" />
              <span>Details</span>
            </Link>
          </div>

          {/* Genres */}
          {anime.genres && anime.genres.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
              {anime.genres.slice(0, 5).map((genre) => (
                <span
                  key={genre.mal_id}
                  className="px-3 py-1 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-sm text-gray-300"
                >
                  {genre.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Hero;
