import { useEffect } from 'react';

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
      className="fixed inset-0 z-40 bg-black/90 backdrop-blur-sm transition-opacity duration-300 cursor-pointer"
      title="Click anywhere to turn lights on (Esc)"
    />
  );
};

export default CinemaOverlay;

