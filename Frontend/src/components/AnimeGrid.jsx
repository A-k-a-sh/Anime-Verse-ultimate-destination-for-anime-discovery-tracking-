import AnimeCard from './AnimeCard';

const AnimeGrid = ({ anime, loading = false, columns = 5, type = 'anime' }) => {
  if (loading) {
    return (
      <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${columns} gap-6`}>
        {[...Array(10)].map((_, i) => (
          <div key={i} className="skeleton h-80 rounded-lg"></div>
        ))}
      </div>
    );
  }

  if (!anime || anime.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-2xl font-semibold text-gray-300 mb-2">
          {type === 'manga' ? 'No Manga Found' : 'No Anime Found'}
        </h3>
        <p className="text-gray-400">Try adjusting your filters or search query</p>
      </div>
    );
  }

  const gridClass = {
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5',
    6: 'grid-cols-2 md:grid-cols-4 lg:grid-cols-6',
  }[columns] || 'grid-cols-2 md:grid-cols-3 lg:grid-cols-5';

  return (
    <div className={`grid ${gridClass} gap-6`}>
      {anime.map((item, index) => (
        <AnimeCard 
          key={item.malId || item.mal_id || `item-${index}`} 
          anime={item} 
          type={type} 
          index={index}
        />
      ))}
    </div>
  );
};

export default AnimeGrid;
