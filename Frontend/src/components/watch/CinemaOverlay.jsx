import { useEffect } from 'react';
import { LightBulbIcon } from '@heroicons/react/24/solid';

/**
 * Cinema Lights-Off Backdrop Overlay
 */
const CinemaOverlay = ({ isLightsOff = false, onClose }) => {
  useEffect(() => {
    if (!isLightsOff) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightsOff, onClose]);

  if (!isLightsOff) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-40 bg-black/90 backdrop-blur-sm transition-opacity duration-300 flex flex-col justify-between p-4 cursor-pointer"
      title="Click anywhere to turn lights on (Esc)"
    >
      <div className="flex items-center justify-center pt-2 opacity-70 hover:opacity-100 transition-opacity">
        <span className="flex items-center gap-2 text-xs text-gray-300 bg-white/10 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
          <LightBulbIcon className="w-3.5 h-3.5 text-yellow-300" />
          <span>Cinema Mode Active • Click anywhere or press <strong>Esc</strong> to turn lights on</span>
        </span>
      </div>
      <div />
    </div>
  );
};

export default CinemaOverlay;
