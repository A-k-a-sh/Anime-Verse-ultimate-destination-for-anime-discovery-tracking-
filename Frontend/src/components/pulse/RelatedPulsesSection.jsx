import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import pulseService from '../../services/pulseService';
import PulseCard from './PulseCard';
import {
  BoltIcon,
  PlusIcon,
  SparklesIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const RelatedPulsesSection = ({
  mediaId,
  mediaType = 'anime',
  mediaTitle = '',
  mediaImage = null
}) => {
  const [pulses, setPulses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchRelatedPulses = async () => {
      if (!mediaId) return;
      try {
        setIsLoading(true);
        const res = await pulseService.getAllPulses({
          mediaId,
          limit: 6,
          sort: 'top'
        });
        if (res?.success && isMounted) {
          setPulses(res.data || []);
        }
      } catch (err) {
        console.error('Failed to load related pulses:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchRelatedPulses();

    return () => {
      isMounted = false;
    };
  }, [mediaId]);

  const handleWritePulse = () => {
    navigate('/pulse/write', {
      state: {
        prefillMedia: {
          malId: Number(mediaId),
          type: mediaType,
          title: mediaTitle,
          imageUrl: mediaImage
        }
      }
    });
  };

  return (
    <section className="bg-dark-200/60 rounded-3xl border border-white/10 p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-dark-100 border border-white/10 text-primary">
            <BoltIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Community Pulses & Theories
              </h2>
              {pulses.length > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold border border-primary/30">
                  {pulses.length}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Fan analyses, lore breakdowns, and chapter theories for {mediaTitle || 'this title'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleWritePulse}
          className="px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary-600 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-primary/25 flex items-center gap-2 w-fit flex-shrink-0"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Write a Theory</span>
        </button>
      </div>

      {/* Content Area */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-500">
          <ArrowPathIcon className="w-6 h-6 animate-spin text-primary" />
          <span className="text-xs">Loading community Pulses...</span>
        </div>
      ) : pulses.length === 0 ? (
        <div className="py-10 px-4 rounded-2xl bg-dark-100/50 border border-dashed border-white/10 text-center">
          <div className="max-w-md mx-auto flex flex-col items-center gap-2">
            <SparklesIcon className="w-6 h-6 text-primary" />
            <h3 className="text-sm font-bold text-white">No Pulses for this title yet</h3>
            <p className="text-xs text-gray-400">
              Have an interesting theory, power scaling analysis, or ending breakdown about {mediaTitle}?
            </p>
            <button
              type="button"
              onClick={handleWritePulse}
              className="mt-2 text-xs font-bold text-primary hover:text-primary-400 hover:underline"
            >
              + Drop the first Pulse for {mediaTitle}
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {pulses.map((pulse) => (
            <PulseCard key={pulse._id} pulse={pulse} />
          ))}
        </div>
      )}
    </section>
  );
};

export default RelatedPulsesSection;
