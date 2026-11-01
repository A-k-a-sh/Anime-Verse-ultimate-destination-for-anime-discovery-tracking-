import { Link } from 'react-router-dom';

const CharacterCard = ({ character }) => {
  if (!character) return null;

  const charData = character.character || character;
  const malId = charData.mal_id || charData.malId || charData.id;
  const name = charData.name || 'Unknown';
  const imageUrl = charData.images?.jpg?.image_url || charData.imageUrl || '';
  const role = character.role || 'Supporting';

  const voiceActors = character.voice_actors || character.voiceActors || [];
  const mainVA = voiceActors.find((va) => (va.language === 'Japanese' || va.languageV2 === 'Japanese')) || voiceActors[0];
  const vaName = mainVA?.person?.name || mainVA?.name;
  const vaImage = mainVA?.person?.images?.jpg?.image_url || mainVA?.imageUrl;
  const vaLang = mainVA?.language || mainVA?.languageV2 || 'Japanese';

  return (
    <Link
      to={`/character/${malId}`}
      className="group relative bg-dark-200 rounded-lg overflow-hidden hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 hover:-translate-y-1 block"
    >
      {/* Character Image */}
      <div className="aspect-[3/4] overflow-hidden bg-dark-100">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
            No Image
          </div>
        )}
      </div>

      {/* Character Info */}
      <div className="p-3">
        <h4 className="font-semibold text-white text-sm mb-1 line-clamp-2">
          {name}
        </h4>
        
        {/* Role Badge */}
        <span
          className={`inline-block px-2 py-0.5 rounded text-xs font-medium mb-2 ${
            role === 'Main'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              : 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
          }`}
        >
          {role}
        </span>

        {/* Voice Actor */}
        {mainVA && vaName && (
          <div className="flex items-center gap-2 mt-2">
            {vaImage ? (
              <img
                src={vaImage}
                alt={vaName}
                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-dark-100 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400 truncate">{vaName}</p>
              <p className="text-xs text-gray-500">🇯🇵 {vaLang}</p>
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};

export default CharacterCard;
