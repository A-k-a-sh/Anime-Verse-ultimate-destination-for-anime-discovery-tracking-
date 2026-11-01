import {
  ChevronLeftIcon,
  ChevronRightIcon,
  TvIcon,
  LightBulbIcon,
  ForwardIcon,
  ArrowsPointingOutIcon,
} from '@heroicons/react/24/solid';

/**
 * Player Navigation and Quick Action Toggles Bar
 */
const PlayerControls = ({
  currentEpisode = 1,
  totalEpisodes = null,
  isMovie = false,
  onPrevEpisode,
  onNextEpisode,
  autoNext = true,
  onToggleAutoNext,
  autoSkip = true,
  onToggleAutoSkip,
  isTheater = false,
  onToggleTheater,
  isLightsOff = false,
  onToggleLights,
  onToggleFullscreen,
}) => {
  const isFirst = currentEpisode <= 1;
  const isLast = totalEpisodes && currentEpisode >= totalEpisodes;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 bg-dark-200/90 rounded-xl border border-white/5">
      {/* Navigation Buttons (Prev / Next) */}
      {!isMovie && (
        <div className="flex items-center gap-2">
          <button
            onClick={onPrevEpisode}
            disabled={isFirst}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isFirst
                ? 'bg-dark-100/50 text-gray-600 cursor-not-allowed border border-white/5'
                : 'bg-dark-100 hover:bg-dark-300 text-gray-200 hover:text-white border border-white/10 active:scale-95'
            }`}
            title="Previous Episode (P)"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            <span>Prev</span>
          </button>

          <span className="text-xs text-gray-400 font-medium px-1">
            Ep <strong className="text-white">{currentEpisode}</strong>
            {totalEpisodes ? ` / ${totalEpisodes}` : ''}
          </span>

          <button
            onClick={onNextEpisode}
            disabled={isLast}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isLast
                ? 'bg-dark-100/50 text-gray-600 cursor-not-allowed border border-white/5'
                : 'bg-dark-100 hover:bg-dark-300 text-gray-200 hover:text-white border border-white/10 active:scale-95'
            }`}
            title="Next Episode (N)"
          >
            <span>Next</span>
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      )}

      {isMovie && (
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-primary/20 text-primary border border-primary/30 rounded-md text-xs font-semibold">
            Feature Film / Movie
          </span>
        </div>
      )}

      {/* Feature Toggles */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Auto-Next */}
        <button
          onClick={onToggleAutoNext}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            autoNext
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              : 'bg-dark-100 text-gray-400 border border-white/5 hover:text-gray-200'
          }`}
          title="Automatically play next episode when current finishes"
        >
          <ForwardIcon className="w-3.5 h-3.5" />
          <span>Auto-Next</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              autoNext ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'
            }`}
          />
        </button>

        {/* Auto-Skip Intro/Outro */}
        <button
          onClick={onToggleAutoSkip}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            autoSkip
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'bg-dark-100 text-gray-400 border border-white/5 hover:text-gray-200'
          }`}
          title="Auto-skip Intro and Outro (Server 1)"
        >
          <span>Auto-Skip</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              autoSkip ? 'bg-purple-400' : 'bg-gray-600'
            }`}
          />
        </button>

        {/* Theater Mode */}
        <button
          onClick={onToggleTheater}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isTheater
              ? 'bg-primary/20 text-primary border border-primary/30'
              : 'bg-dark-100 text-gray-400 border border-white/5 hover:text-gray-200'
          }`}
          title="Theater Mode (T)"
        >
          <TvIcon className="w-3.5 h-3.5" />
          <span>Theater</span>
        </button>

        {/* Lights Off (Cinema Mode) */}
        <button
          onClick={onToggleLights}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            isLightsOff
              ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
              : 'bg-dark-100 text-gray-400 border border-white/5 hover:text-gray-200'
          }`}
          title="Lights On/Off (L / Esc)"
        >
          <LightBulbIcon className="w-3.5 h-3.5" />
          <span>{isLightsOff ? 'Lights On' : 'Lights Off'}</span>
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={onToggleFullscreen}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-dark-100 hover:bg-dark-300 text-gray-400 hover:text-white border border-white/5 transition-all"
          title="Fullscreen (F)"
        >
          <ArrowsPointingOutIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default PlayerControls;

