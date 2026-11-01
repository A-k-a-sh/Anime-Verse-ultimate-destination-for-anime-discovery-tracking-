import { Link } from 'react-router-dom';

const InfoSidebar = ({ anime }) => {
  if (!anime) return null;

  const getName = (item) => {
    if (!item) return '';
    if (typeof item === 'string') return item;
    return item.name || '';
  };

  const InfoRow = ({ label, value }) => {
    if (!value) return null;
    return (
      <div className="py-2 border-b border-gray-700/50">
        <dt className="text-sm text-gray-400 mb-1">{label}</dt>
        <dd className="text-sm text-white font-medium">{value}</dd>
      </div>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'currently airing':
      case 'airing':
        return 'bg-green-500/20 text-green-300 border-green-500/30';
      case 'finished airing':
      case 'completed':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'not yet aired':
      case 'upcoming':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-500/30';
    }
  };

  const validStudios = (anime.studios || []).map(getName).filter(Boolean);
  const validProducers = (anime.producers || []).map(getName).filter(Boolean);
  const validLicensors = (anime.licensors || []).map(getName).filter(name => name && name !== 'None found');

  return (
    <div className="bg-dark-200 rounded-lg p-6 sticky top-24">
      <h3 className="text-xl font-bold text-white mb-4">Information</h3>
      
      <dl className="space-y-1">
        <InfoRow label="Type" value={anime.type} />
        <InfoRow label="Episodes" value={anime.episodes || '?'} />
        
        {anime.status && (
          <div className="py-2 border-b border-gray-700/50">
            <dt className="text-sm text-gray-400 mb-1">Status</dt>
            <dd>
              <span className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getStatusColor(anime.status)}`}>
                {anime.status}
              </span>
            </dd>
          </div>
        )}
        
        <InfoRow 
          label="Aired" 
          value={
            anime.aired?.from 
              ? `${formatDate(anime.aired.from)}${anime.aired.to ? ` to ${formatDate(anime.aired.to)}` : ' to ?'}`
              : null
          } 
        />
        
        {anime.broadcast?.string && (
          <InfoRow label="Broadcast" value={anime.broadcast.string} />
        )}
        
        <InfoRow 
          label="Season" 
          value={
            anime.season && anime.year 
              ? `${anime.season.charAt(0).toUpperCase() + anime.season.slice(1)} ${anime.year}`
              : null
          } 
        />
        
        <InfoRow label="Duration" value={anime.duration} />
        <InfoRow label="Source" value={anime.source} />
        
        {validStudios.length > 0 && (
          <div className="py-2 border-b border-gray-700/50">
            <dt className="text-sm text-gray-400 mb-1">Studios</dt>
            <dd className="text-sm text-white font-medium">
              {validStudios.join(', ')}
            </dd>
          </div>
        )}
        
        {validProducers.length > 0 && (
          <div className="py-2 border-b border-gray-700/50">
            <dt className="text-sm text-gray-400 mb-1">Producers</dt>
            <dd className="text-sm text-white font-medium">
              {validProducers.slice(0, 3).join(', ')}
              {validProducers.length > 3 && ` +${validProducers.length - 3} more`}
            </dd>
          </div>
        )}
        
        {validLicensors.length > 0 && (
          <div className="py-2 border-b border-gray-700/50">
            <dt className="text-sm text-gray-400 mb-1">Licensors</dt>
            <dd className="text-sm text-white font-medium">
              {validLicensors.join(', ')}
            </dd>
          </div>
        )}
        
        <InfoRow label="Rating" value={anime.rating} />
      </dl>

      {/* Genres */}
      {anime.genres && anime.genres.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <h4 className="text-sm text-gray-400 mb-2">Genres</h4>
          <div className="flex flex-wrap gap-2">
            {anime.genres.map((genre, index) => {
              const name = getName(genre);
              const genreId = typeof genre === 'object' && genre.mal_id ? genre.mal_id : name;
              if (!name) return null;
              return (
                <Link
                  key={`${name}-${index}`}
                  to={`/browse?genre=${encodeURIComponent(genreId)}`}
                  className="px-2 py-1 bg-primary/20 hover:bg-primary/30 text-primary text-xs rounded border border-primary/30 transition-colors"
                >
                  {name}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Themes */}
      {anime.themes && anime.themes.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm text-gray-400 mb-2">Themes</h4>
          <div className="flex flex-wrap gap-2">
            {anime.themes.map((theme, index) => {
              const name = getName(theme);
              if (!name) return null;
              return (
                <span
                  key={`${name}-${index}`}
                  className="px-2 py-1 bg-secondary/20 text-secondary text-xs rounded border border-secondary/30"
                >
                  {name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Demographics */}
      {anime.demographics && anime.demographics.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm text-gray-400 mb-2">Demographic</h4>
          <div className="flex flex-wrap gap-2">
            {anime.demographics.map((demo, index) => {
              const name = getName(demo);
              if (!name) return null;
              return (
                <span
                  key={`${name}-${index}`}
                  className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded border border-purple-500/30"
                >
                  {name}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Score Stats */}
      <div className="mt-6 pt-4 border-t border-gray-700/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-400">Score</span>
          <span className="text-2xl font-bold text-yellow-400">
            ⭐ {anime.score ? anime.score.toFixed(2) : 'N/A'}
          </span>
        </div>
        {(anime.scored_by || anime.scoredBy) && (
          <p className="text-xs text-gray-500">{(anime.scored_by || anime.scoredBy).toLocaleString()} users</p>
        )}
        {anime.rank && (
          <p className="text-sm text-gray-400 mt-2">Ranked #{anime.rank}</p>
        )}
        {anime.popularity && (
          <p className="text-sm text-gray-400">Popularity #{anime.popularity}</p>
        )}
      </div>
    </div>
  );
};

export default InfoSidebar;
