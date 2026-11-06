import {
  BoltIcon,
  RocketLaunchIcon,
  SparklesIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/solid';

/**
 * Server and Audio Track Switcher Component
 * Supports Server 1 (MegaPlay), Server 2 (Zoko), Server 3 (VidLink), and Server 4 (AnimeEmbed)
 */
const ServerSwitcher = ({
  activeServer = 'server1',
  onServerChange,
  track = 'sub',
  onTrackChange,
}) => {
  const servers = [
    {
      id: 'server1',
      name: 'Server 1 (MegaPlay)',
      icon: RocketLaunchIcon,
      activeClass:
        'bg-secondary text-dark-100 shadow-md shadow-secondary/25 font-bold scale-[1.02]',
      iconClass: 'text-dark-100',
      title: 'Server 1: MegaPlay',
    },
    {
      id: 'server2',
      name: 'Server 2 (Zoko)',
      icon: BoltIcon,
      activeClass:
        'bg-primary text-white shadow-md shadow-primary/25 font-bold scale-[1.02]',
      iconClass: 'text-yellow-300',
      title: 'Server 2: Zoko (Auto-Skip)',
    },
    {
      id: 'server3',
      name: 'Server 3 (VidLink)',
      icon: SparklesIcon,
      activeClass:
        'bg-purple-600 text-white shadow-md shadow-purple-600/25 font-bold scale-[1.02]',
      iconClass: 'text-purple-200',
      title: 'Server 3: VidLink (Fast & Low Ads)',
    },
    {
      id: 'server4',
      name: 'Server 4 (AnimeEmbed)',
      icon: ShieldCheckIcon,
      activeClass:
        'bg-emerald-600 text-white shadow-md shadow-emerald-600/25 font-bold scale-[1.02]',
      iconClass: 'text-emerald-200',
      title: 'Server 4: AnimeEmbed (Clean Player)',
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 py-3 px-4 bg-dark-200/80 rounded-xl border border-white/5 backdrop-blur-sm">
      {/* Server Selection Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wider text-gray-400 font-semibold mr-1">
          Server:
        </span>
        {servers.map((srv) => {
          const Icon = srv.icon;
          const isActive = activeServer === srv.id;
          return (
            <button
              key={srv.id}
              onClick={() => onServerChange(srv.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? srv.activeClass
                  : 'bg-dark-100 text-gray-300 hover:text-white hover:bg-dark-300 border border-white/5'
              }`}
              title={srv.title}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive ? srv.iconClass : 'text-gray-400'
                }`}
              />
              <span>{srv.name}</span>
            </button>
          );
        })}
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
        {activeServer === 'server2' && (
          <button
            onClick={() => onTrackChange('hsub')}
            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
              track === 'hsub'
                ? 'bg-white/20 text-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
            title="Hard Subtitled (Zoko)"
          >
            HSUB
          </button>
        )}
      </div>
    </div>
  );
};

export default ServerSwitcher;
