import { useState, useEffect } from 'react';
import { animeService } from '../services/animeService';
import AnimeGrid from '../components/AnimeGrid';
import Loader from '../components/Loader';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const TopAnime = () => {
  useDocumentTitle('Top Anime of All Time');
  const [anime, setAnime] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);

  useEffect(() => {
    fetchTopAnime();
  }, [page]);

  const fetchTopAnime = async () => {
    try {
      setLoading(true);
      const response = await animeService.getTopAnime({ page, limit: 25 });
      
      if (page === 1) {
        setAnime(response.data || []);
      } else {
        setAnime(prev => [...prev, ...(response.data || [])]);
      }
      
      setHasNextPage(response.pagination?.has_next_page || false);
    } catch (error) {
      console.error('Error fetching top anime:', error);
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
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Top Anime</h1>
          <p className="text-gray-400">Highest rated anime of all time</p>
        </div>

        {loading && page === 1 ? (
          <Loader />
        ) : (
          <>
            <AnimeGrid anime={anime} loading={false} columns={5} />

            {hasNextPage && !loading && anime.length > 0 && (
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

export default TopAnime;
