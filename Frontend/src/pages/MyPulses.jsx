import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import pulseService from '../services/pulseService';
import {
  BoltIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  ChatBubbleLeftRightIcon,
  EyeIcon,
  ArrowPathIcon,
  ArrowLeftIcon,
  LockClosedIcon,
  LockOpenIcon
} from '@heroicons/react/24/outline';

const MyPulses = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [pulses, setPulses] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'published' | 'draft'
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchMyPulses = async () => {
    if (!user?._id) return;
    try {
      setIsLoading(true);
      setErrorMsg('');
      const res = await pulseService.getAllPulses({
        author: user._id,
        status: activeTab === 'all' ? 'all' : activeTab,
        limit: 50
      });
      if (res?.success) {
        setPulses(res.data || []);
      }
    } catch (err) {
      console.error('Failed to load my pulses:', err);
      setErrorMsg('Failed to load your Pulses.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPulses();
  }, [user?._id, activeTab]);

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will permanently delete the post and its comments.`)) {
      return;
    }

    try {
      const res = await pulseService.deletePulse(id);
      if (res?.success) {
        setPulses(pulses.filter(p => p._id !== id));
      }
    } catch (err) {
      console.error('Failed to delete pulse:', err);
      alert('Failed to delete pulse.');
    }
  };

  const handleToggleComments = async (id, currentEnabled) => {
    try {
      const res = await pulseService.toggleComments(id, !currentEnabled);
      if (res?.success) {
        setPulses(pulses.map(p => p._id === id ? { ...p, commentsEnabled: res.commentsEnabled } : p));
      }
    } catch (err) {
      console.error('Failed to toggle comments:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-32">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-8">
        <div>
          <Link
            to="/pulse"
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors mb-2"
          >
            <ArrowLeftIcon className="w-3.5 h-3.5" />
            <span>Back to Otaku Pulse</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <span>My Pulses</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold">
              {pulses.length}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Manage your published fandom theories, chapter reviews, and drafts.
          </p>
        </div>

        <Link
          to="/pulse/write"
          className="px-5 py-2.5 rounded-2xl bg-primary hover:bg-primary-600 text-white text-xs sm:text-sm font-bold transition-all shadow-xl shadow-primary/30 flex items-center gap-2 w-fit"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Write New Pulse</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        {['all', 'published', 'draft'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold capitalize transition-all border ${
              activeTab === tab
                ? 'bg-white text-dark-100 border-white shadow-md'
                : 'bg-dark-200/60 text-gray-400 hover:text-white border-white/10'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Error state */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm mb-6">
          {errorMsg}
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <ArrowPathIcon className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-gray-400">Loading your Pulses...</p>
        </div>
      ) : pulses.length === 0 ? (
        <div className="py-20 px-4 rounded-3xl bg-dark-200/30 border border-dashed border-white/10 text-center">
          <div className="max-w-sm mx-auto flex flex-col items-center gap-3">
            <div className="p-4 rounded-2xl bg-dark-100 border border-white/10 text-primary">
              <BoltIcon className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-white">No {activeTab !== 'all' ? activeTab : ''} Pulses found</h3>
            <p className="text-xs text-gray-400">
              Ready to share a theory with the AnimeVerse community?
            </p>
            <Link
              to="/pulse/write"
              className="mt-2 px-6 py-2.5 rounded-2xl bg-primary text-white text-xs sm:text-sm font-bold shadow-lg shadow-primary/25"
            >
              Drop a Pulse
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {pulses.map((pulse) => (
            <div
              key={pulse._id}
              className="p-4 rounded-2xl bg-dark-200/60 border border-white/10 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Pulse Details */}
              <div className="flex items-center gap-4 min-w-0">
                {pulse.coverImage?.url ? (
                  <img
                    src={pulse.coverImage.url}
                    alt={pulse.title}
                    className="w-16 h-12 rounded-xl object-cover flex-shrink-0 border border-white/10"
                  />
                ) : (
                  <div className="w-16 h-12 rounded-xl bg-dark-100 border border-white/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                    ⚡
                  </div>
                )}

                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${
                      pulse.status === 'published'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                    }`}>
                      {pulse.status}
                    </span>
                    <span className="text-[11px] text-gray-500">
                      {new Date(pulse.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white truncate hover:text-primary transition-colors">
                    <Link to={pulse.status === 'published' ? `/pulse/${pulse.slug}` : `/pulse/edit/${pulse._id}`}>
                      {pulse.title}
                    </Link>
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <span className="text-emerald-400 font-bold">⚡ {pulse.pulseScore || 0}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <EyeIcon className="w-3.5 h-3.5" />
                      {pulse.views || 0}
                    </span>
                    <span>•</span>
                    <span>{pulse.readingTimeMinutes || 3} min read</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                {/* Toggle Comments Button */}
                <button
                  type="button"
                  onClick={() => handleToggleComments(pulse._id, pulse.commentsEnabled)}
                  title={pulse.commentsEnabled ? 'Lock comments' : 'Unlock comments'}
                  className={`p-2 rounded-xl border text-xs transition-colors ${
                    pulse.commentsEnabled
                      ? 'bg-dark-100 text-gray-300 hover:text-white border-white/10'
                      : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {pulse.commentsEnabled ? <LockOpenIcon className="w-4 h-4" /> : <LockClosedIcon className="w-4 h-4" />}
                </button>

                {/* Edit Button */}
                <Link
                  to={`/pulse/edit/${pulse._id}`}
                  className="p-2 rounded-xl bg-dark-100 hover:bg-dark-300 text-gray-300 hover:text-white border border-white/10 transition-colors"
                  title="Edit Pulse"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                </Link>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => handleDelete(pulse._id, pulse.title)}
                  className="p-2 rounded-xl bg-dark-100 hover:bg-rose-500/20 text-gray-400 hover:text-rose-400 border border-white/10 transition-colors"
                  title="Delete Pulse"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyPulses;
