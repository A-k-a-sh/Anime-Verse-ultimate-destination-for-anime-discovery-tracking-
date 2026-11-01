import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { animeService } from '../services/animeService';
import { PlayIcon, StarIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/solid';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const Home = () => {
  const [spotlightAnime, setSpotlightAnime] = useState([]);
  const [currentSpotlight, setCurrentSpotlight] = useState(0);
  const [trendingAnime, setTrendingAnime] = useState([]);
  const [latestAnime, setLatestAnime] = useState([]);
  const [topAnime, setTopAnime] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        console.log('Fetching home data...');

        // Fetch spotlight anime (top 5 for slider)
        const spotlightResponse = await animeService.getTopAnime({ limit: 5 });
        // console.log('Spotlight response:', spotlightResponse);
        if (spotlightResponse.success && spotlightResponse.data) {
          setSpotlightAnime(spotlightResponse.data);
        }

        // Fetch trending anime (top 10 for sidebar)
        const trendingResponse = await animeService.getTopAnime({ limit: 10, page: 2 });
        // console.log('Trending response:', trendingResponse);
        if (trendingResponse.success && trendingResponse.data) {
          setTrendingAnime(trendingResponse.data);
        }

        // Fetch latest anime (currently airing) - use search endpoint
        const latestResponse = await animeService.search('', {
          status: 'airing',
          order_by: 'start_date',
          sort: 'desc',
          limit: 22,
        });
        // console.log('Latest response:', latestResponse);

        if (latestResponse.success && latestResponse.data) {
          setLatestAnime(latestResponse.data);
        }

        // Fetch top rated for grid - increased to 30
        const topResponse = await animeService.getTopAnime({ limit: 30 });
        // console.log('Top response:', topResponse);
        if (topResponse.success && topResponse.data) {
          setTopAnime(topResponse.data);
        }
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  useEffect(() => {
    if (spotlightAnime.length > 0) {
      const interval = setInterval(() => {
        setCurrentSpotlight((prev) => (prev + 1) % spotlightAnime.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [spotlightAnime.length]);

  const currentAnime = spotlightAnime[currentSpotlight] || {};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Spotlight Slider Section (9anime style) */}
      <div className="relative bg-dark-200">
        <div className="max-w-[1400px] mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Spotlight Slider */}
            <div className="lg:col-span-2">
              {spotlightAnime.length > 0 && (
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden group">
                  {/* Background Image */}
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-all duration-500"
                    style={{
                      backgroundImage: `url(${currentAnime.bannerImage || currentAnime.imageUrl})`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-transparent"></div>
                  </div>

                  {/* Content */}
                  <div className="relative h-full flex flex-col justify-end p-8">
                    {/* Top Badge */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="bg-primary px-3 py-1 rounded text-white text-sm font-bold">
                        #{currentSpotlight + 1} SPOTLIGHT
                      </span>
                      {currentAnime.score && (
                        <span className="bg-yellow-500 px-3 py-1 rounded text-black text-sm font-bold flex items-center gap-1">
                          <StarIcon className="w-4 h-4" />
                          {currentAnime.score}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3 line-clamp-2">
                      {currentAnime.title || currentAnime.titleEnglish}
                    </h2>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-300">
                      {currentAnime.type && (
                        <span className="px-2 py-1 bg-white/10 rounded">{currentAnime.type}</span>
                      )}
                      {currentAnime.duration && (
                        <span className="flex items-center gap-1">
                          <ClockIcon className="w-4 h-4" />
                          {currentAnime.duration}
                        </span>
                      )}
                      {currentAnime.year && (
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4" />
                          {currentAnime.year}
                        </span>
                      )}
                      {currentAnime.episodes && <span>{currentAnime.episodes} episodes</span>}
                    </div>

                    {/* Synopsis */}
                    <p className="text-gray-300 mb-6 line-clamp-2 max-w-2xl">
                      {currentAnime.synopsis}
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-3">
                      <Link
                        to={`/watch/${currentAnime.malId}/1`}
                        className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-6 py-3 rounded-lg font-semibold transition-all"
                      >
                        <PlayIcon className="w-5 h-5" />
                        Watch Now
                      </Link>
                      <Link
                        to={`/anime/${currentAnime.malId}`}
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg font-semibold transition-all backdrop-blur-sm"
                      >
                        Details
                      </Link>
                    </div>
                  </div>

                  {/* Navigation Arrows */}
                  <button
                    onClick={() => setCurrentSpotlight((prev) => (prev - 1 + spotlightAnime.length) % spotlightAnime.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronLeftIcon className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => setCurrentSpotlight((prev) => (prev + 1) % spotlightAnime.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <ChevronRightIcon className="w-6 h-6" />
                  </button>

                  {/* Dots */}
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    {spotlightAnime.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSpotlight(index)}
                        className={`w-2 h-2 rounded-full transition-all ${index === currentSpotlight ? 'bg-primary w-8' : 'bg-white/50 hover:bg-white/80'
                          }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Trending Sidebar */}
            <div className=" bg-dark-100 rounded-xl p-4">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="text-primary">🔥</span>
                Top Trending
              </h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto scrollbar-thin">
                {trendingAnime.slice(0, 10).map((anime, index) => (
                  <Link
                    key={anime.malId}
                    to={`/anime/${anime.malId}`}
                    className="flex gap-3 p-2 rounded-lg hover:bg-dark-200 transition-colors group"
                  >
                    <div className="flex-shrink-0 relative">
                      <span className="absolute -top-1 -left-1 bg-primary text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center z-10">
                        {index + 1}
                      </span>
                      <img
                        src={anime.imageUrl}
                        alt={anime.title}
                        className="w-16 h-20 object-cover rounded"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {anime.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        {anime.score && (
                          <span className="flex items-center gap-1 text-yellow-400">
                            <StarIcon className="w-3 h-3" />
                            {anime.score}
                          </span>
                        )}
                        <span>{anime.type}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1400px] mx-auto px-4 py-8 space-y-12">
        {/* Latest Episodes */}
        {latestAnime.length > 0 && (
          <section>
            <div className=" flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Latest Episodes</h2>
              <Link to="/browse?status=airing" className="text-primary hover:text-primary/80 font-medium">
                View All →
              </Link>
            </div>
            <div className=" grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {latestAnime.slice(0, 12).map((anime) => (
                anime?.genres.includes('Hentai') === false &&
                <Link
                  key={anime.malId}
                  to={`/anime/${anime.malId}`}
                  className="group"
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2">
                    <img
                      src={anime.imageUrl}
                      alt={anime.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="absolute bottom-2 left-2 right-2">
                        <div className="flex items-center gap-1 text-yellow-400 text-sm mb-1">
                          <StarIcon className="w-4 h-4" />
                          <span>{anime.score || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    {anime.episodes && (
                      <div className="absolute top-2 right-2 bg-primary px-2 py-1 rounded text-white text-xs font-bold">
                        EP {anime.episodes}
                      </div>
                    )}
                  </div>
                  <h3 className="text-white text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {anime.title}
                  </h3>
                  <p className="text-gray-400 text-xs mt-1">{anime.type}</p>
                </Link>


              ))}
            </div>
          </section>
        )}

        {/* Top Anime This Week */}
        {topAnime.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Top Anime</h2>
              <Link to="/browse?sort=score" className="text-primary hover:text-primary/80 font-medium">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {topAnime.slice(0, 18).map((anime, index) => (
                <Link
                  key={anime.malId}
                  to={`/anime/${anime.malId}`}
                  className="group relative"
                >
                  <div className="relative aspect-[2/3] rounded-lg overflow-hidden mb-2">
                    <img
                      src={anime.imageUrl}
                      alt={anime.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute top-2 left-2 bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold">
                      #{index + 1}
                    </div>
                    {anime.score && (
                      <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-yellow-400 text-xs font-bold flex items-center gap-1">
                        <StarIcon className="w-3 h-3" />
                        {anime.score}
                      </div>
                    )}
                  </div>
                  <h3 className="text-white text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">
                    {anime.title}
                  </h3>
                  <p className="text-gray-400 text-xs mt-1">{anime.type} · {anime.year}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default Home;
