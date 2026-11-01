import { useState, useEffect } from 'react';
import { animeService } from '../services/animeService';
import AnimeGrid from '../components/AnimeGrid';
import Loader from '../components/Loader';

const Recommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [page]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await animeService.getTopAnime({ page, limit: 25 });
      if (response.success && response.data) {
        if (page === 1) {
          setRecommendations(response.data);
        } else {
          setRecommendations(prev => [...prev, ...response.data]);
        }
        setHasNextPage(response.pagination?.has_next_page || false);
      }
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = () => {
    if (hasNextPage && !loading) {
      setPage(prev => prev + 1);
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Recommended for You
          </h1>
          <p className="text-gray-400">
            Based on popular and top-rated anime
          </p>
        </div>

        {loading && page === 1 ? (
          <Loader />
        ) : (
          <>
            <AnimeGrid anime={recommendations} loading={false} columns={5} />

            {hasNextPage && !loading && recommendations.length > 0 && (
              <div className="mt-8 text-center">
                <button
                  onClick={loadMore}
                  className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:scale-105"
                >
                  Load More
                </button>
              </div>
            )}

            {loading && page > 1 && (
              <div className="mt-8 text-center">
                <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Recommendations;
