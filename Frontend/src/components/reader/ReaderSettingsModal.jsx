import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  ArrowsRightLeftIcon,
  SwatchIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';

const ReaderSettingsModal = ({
  isOpen = false,
  onClose,
  settings = {},
  onUpdateSettings
}) => {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const readingModes = [
    { id: 'webtoon', label: 'Webtoon / Long Strip', desc: 'Vertical continuous scrolling stream' },
    { id: 'single', label: 'Single Page Flip', desc: 'One page per view with keyboard/click turn' },
    { id: 'double', label: 'Double Page Spread', desc: 'Two pages side-by-side (Japanese Tankōbon)' }
  ];

  const fitModes = [
    { id: 'width', label: 'Fit Width' },
    { id: 'height', label: 'Fit Height' },
    { id: 'original', label: 'Original Size' }
  ];

  const directions = [
    { id: 'rtl', label: 'Right to Left (RTL)', desc: 'Japanese Manga Standard' },
    { id: 'ltr', label: 'Left to Right (LTR)', desc: 'Western Comic Standard' }
  ];

  const themes = [
    { id: 'black', label: 'Pure Black', bg: '#000000', border: 'border-white/20' },
    { id: 'dark', label: 'Dark Slate', bg: '#121212', border: 'border-white/20' },
    { id: 'sepia', label: 'Soft Sepia', bg: '#1f1b16', border: 'border-amber-700/40' }
  ];

  const maxWidths = [
    { id: '700px', label: '700px (Narrow)' },
    { id: '900px', label: '900px (Default)' },
    { id: '1200px', label: '1200px (Wide)' },
    { id: '100%', label: '100% (Full)' }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-[#0E101A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AdjustmentsHorizontalIcon className="w-5 h-5 text-primary" />
                <h2 className="text-base sm:text-lg font-bold text-white">Reader Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-xl bg-dark-200 hover:bg-dark-300 text-gray-400 hover:text-white border border-white/10 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Settings Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar text-sm">
              {/* 1. Reading Mode */}
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                  Reading Mode
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {readingModes.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => onUpdateSettings({ mode: m.id })}
                      className={`w-full p-3 rounded-xl text-left border transition-all flex items-center justify-between ${
                        settings.mode === m.id
                          ? 'bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(255,107,107,0.2)]'
                          : 'bg-dark-200/50 hover:bg-dark-200 border-white/5 text-gray-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-sm">{m.label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{m.desc}</div>
                      </div>
                      {settings.mode === m.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Reading Direction (Only for single or double) */}
              {settings.mode !== 'webtoon' && (
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                    <ArrowsRightLeftIcon className="w-4 h-4 text-secondary" />
                    Reading Direction
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {directions.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => onUpdateSettings({ direction: d.id })}
                        className={`p-2.5 rounded-xl text-left border transition-all ${
                          settings.direction === d.id
                            ? 'bg-secondary/20 border-secondary text-white'
                            : 'bg-dark-200/50 hover:bg-dark-200 border-white/5 text-gray-300'
                        }`}
                      >
                        <div className="font-semibold text-xs">{d.label}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{d.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Fit Mode */}
              {settings.mode !== 'webtoon' && (
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                    <ArrowsPointingOutIcon className="w-4 h-4 text-primary" />
                    Page Fit
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {fitModes.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => onUpdateSettings({ fit: f.id })}
                        className={`p-2.5 rounded-xl text-center border text-xs font-semibold transition-all ${
                          settings.fit === f.id
                            ? 'bg-primary/20 border-primary text-white'
                            : 'bg-dark-200/50 hover:bg-dark-200 border-white/5 text-gray-300'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Canvas Theme */}
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                  <SwatchIcon className="w-4 h-4 text-primary" />
                  Canvas Background Theme
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {themes.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => onUpdateSettings({ theme: t.id })}
                      className={`p-2.5 rounded-xl flex items-center gap-2 border transition-all ${
                        settings.theme === t.id
                          ? 'border-primary bg-dark-200 text-white ring-1 ring-primary'
                          : 'border-white/10 bg-dark-200/50 hover:bg-dark-200 text-gray-300'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full border ${t.border}`}
                        style={{ backgroundColor: t.bg }}
                      />
                      <span className="text-xs font-medium">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Max Container Width (Webtoon Mode) */}
              {settings.mode === 'webtoon' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">
                    Stream Max Width Constraint
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {maxWidths.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => onUpdateSettings({ maxWidth: w.id })}
                        className={`p-2 rounded-xl text-center border text-xs font-semibold transition-all ${
                          settings.maxWidth === w.id
                            ? 'bg-primary/20 border-primary text-white'
                            : 'bg-dark-200/50 hover:bg-dark-200 border-white/5 text-gray-400'
                        }`}
                      >
                        {w.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10 bg-dark-100 flex justify-end">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-semibold text-xs shadow-lg transition-all"
              >
                Done
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReaderSettingsModal;
