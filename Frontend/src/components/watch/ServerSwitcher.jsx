import { BoltIcon, RocketLaunchIcon } from '@heroicons/react/24/solid';

/**
 * Server and Audio Track Switcher Component
 */
const ServerSwitcher = ({
  activeServer = 'server1',
  onServerChange,
  track = 'sub',
  onTrackChange,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 bg-dark-200/80 rounded-xl border border-white/5 backdrop-blur-sm">
      {/* Server Selection Pills */}
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold mr-1">
          Server:
        </span>
        <button
          onClick={() => onServerChange('server1')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            activeServer === 'server1'
              ? 'bg-primary text-white shadow-md shadow-primary/25 scale-[1.02]'
              : 'bg-dark-100 text-gray-300 hover:text-white hover:bg-dark-300 border border-white/5'
          }`}
          title="Server 1: ZokoAnime"
        >
          <BoltIcon className="w-3.5 h-3.5 text-yellow-300" />
          <span>Server 1 (Zoko)</span>
        </button>

        <button
          onClick={() => onServerChange('server2')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
            activeServer === 'server2'
              ? 'bg-secondary text-dark-100 shadow-md shadow-secondary/25 font-bold scale-[1.02]'
              : 'bg-dark-100 text-gray-300 hover:text-white hover:bg-dark-300 border border-white/5'
          }`}
          title="Server 2: MegaPlay"
        >
          <RocketLaunchIcon className="w-3.5 h-3.5 text-secondary" />
          <span>Server 2 (MegaPlay)</span>
        </button>
      </div>

      {/* Audio Track Selector */}
      <div className="flex items-center gap-1.5 bg-dark-100 p-1 rounded-lg border border-white/5">
        <span className="text-xs text-gray-400 px-2 font-medium">Track:</span>
        <button
          onClick={() => onTrackChange('sub')}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
            track === 'sub'
              ? 'bg-white/20 text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          SUB
        </button>
        <button
          onClick={() => onTrackChange('dub')}
          className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
            track === 'dub'
              ? 'bg-white/20 text-white'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          DUB
        </button>
        {activeServer === 'server1' && (
          <button
            onClick={() => onTrackChange('hsub')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              track === 'hsub'
                ? 'bg-white/20 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Hard Subtitled"
          >
            HSUB
          </button>
        )}
      </div>
    </div>
  );
};

export default ServerSwitcher;

