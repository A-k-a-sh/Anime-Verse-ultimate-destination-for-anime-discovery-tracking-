import { useState, useEffect } from 'react';
import { animeService } from '../services/animeService';
import AnimeGrid from '../components/AnimeGrid';
import Loader from '../components/Loader';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const Seasonal = () => {
  const [anime, setAnime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedSeason, setSelectedSeason] = useState(getCurrentSeason());

  // Dynamic Browser Tab Title according to selected season & year
  const seasonName = (selectedSeason || '').charAt(0).toUpperCase() + (selectedSeason || '').slice(1);
  useDocumentTitle(`${seasonName} ${selectedYear} Seasonal Anime`);

  const seasons = ['winter', 'spring', 'summer', 'fall'];
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    fetchSeasonalAnime();
  }, [selectedYear, selectedSeason]);

  function getCurrentSeason() {
    const month = new Date().getMonth() + 1;
    if (month >= 1 && month <= 3) return 'winter';
    if (month >= 4 && month <= 6) return 'spring';
    if (month >= 7 && month <= 9) return 'summer';
    return 'fall';
  }

  const fetchSeasonalAnime = async () => {
    try {
      setLoading(true);
      const response = await animeService.getSeasonalAnime(selectedYear, selectedSeason);
      setAnime(response.data || []);
    } catch (error) {
      console.error('Error fetching seasonal anime:', error);
      setAnime([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Seasonal Anime</h1>
          <p className="text-gray-400">Anime by season and year</p>
        </div>

        {/* Season/Year Selector */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Season</label>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="bg-dark-200 border border-dark-400 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {seasons.map((season) => (
                <option key={season} value={season}>
                  {season.charAt(0).toUpperCase() + season.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="bg-dark-200 border border-dark-400 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <Loader />
        ) : anime.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📺</div>
            <h3 className="text-2xl font-semibold text-white mb-2">No Anime Found</h3>
            <p className="text-gray-400">Try selecting a different season or year</p>
          </div>
        ) : (
          <AnimeGrid anime={anime} loading={false} columns={5} />
        )}
      </div>
    </div>
  );
};

export default Seasonal;
