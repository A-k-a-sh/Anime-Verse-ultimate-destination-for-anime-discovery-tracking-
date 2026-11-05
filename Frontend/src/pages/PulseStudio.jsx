import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import pulseService from '../services/pulseService';
import TipTapStudio from '../components/pulse/studio/TipTapStudio';
import MediaTagSelector from '../components/pulse/MediaTagSelector';
import {
  ArrowLeftIcon,
  PhotoIcon,
  XMarkIcon,
  BoltIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  TagIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const POPULAR_TAGS = ['theory', 'review', 'analysis', 'lore', 'discussion', 'shonen', 'character-study', 'ending-explained'];

const PulseStudio = () => {
  const { id } = useParams();
  const isEditMode = Boolean(id);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Form State
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState({ url: null, publicId: null });
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [relatedMedia, setRelatedMedia] = useState([]);
  const [hasSpoilers, setHasSpoilers] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);

  // Status & Progress State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const [isUploadingInline, setIsUploadingInline] = useState(false);
  const [isLoadingPulse, setIsLoadingPulse] = useState(isEditMode);
  const [autoSaveStatus, setAutoSaveStatus] = useState('All changes saved');
  const [errorMsg, setErrorMsg] = useState('');
  const [showDraftRestoredNotice, setShowDraftRestoredNotice] = useState(false);

  const coverInputRef = useRef(null);
  const lastSavedRef = useRef(null);

  const draftKey = `animeverse_pulse_draft_${id || 'new'}`;

  // 1. Load initial data (if editing) or restore from localStorage draft
  useEffect(() => {
    let isMounted = true;

    const loadInitialData = async () => {
      if (isEditMode) {
        try {
          setIsLoadingPulse(true);
          const res = await pulseService.getPulseById(id);
          const p = res?.data;
          if (p && isMounted) {
            setTitle(p.title || '');
            setContent(p.content || '');
            setExcerpt(p.excerpt || '');
            setCoverImage(p.coverImage || { url: null, publicId: null });
            setTags(p.tags || []);
            setRelatedMedia(p.relatedMedia || []);
            setHasSpoilers(Boolean(p.hasSpoilers));
            setCommentsEnabled(p.commentsEnabled !== false);
          }
        } catch (err) {
          console.error('Failed to load pulse for editing:', err);
          if (isMounted) setErrorMsg('Failed to load pulse. It may have been deleted or you lack permission.');
        } finally {
          if (isMounted) setIsLoadingPulse(false);
        }
      } else {
        // Check for autosaved local draft
        try {
          const savedDraft = localStorage.getItem(draftKey);
          if (savedDraft) {
            const parsed = JSON.parse(savedDraft);
            if (parsed.title || parsed.content) {
              setTitle(parsed.title || '');
              setContent(parsed.content || '');
              setExcerpt(parsed.excerpt || '');
              setCoverImage(parsed.coverImage || { url: null, publicId: null });
              setTags(parsed.tags || []);
              setRelatedMedia(parsed.relatedMedia || []);
              setHasSpoilers(Boolean(parsed.hasSpoilers));
              setCommentsEnabled(parsed.commentsEnabled !== false);
              setShowDraftRestoredNotice(true);
            }
          } else if (location.state?.prefillMedia) {
            setRelatedMedia([location.state.prefillMedia]);
          }
        } catch (err) {
          console.warn('Error reading saved draft from localStorage:', err);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [id, isEditMode, draftKey]);

  // 2. 5-Second Autosave to LocalStorage
  useEffect(() => {
    if (isLoadingPulse) return;

    const timer = setInterval(() => {
      const payload = {
        title,
        content,
        excerpt,
        coverImage,
        tags,
        relatedMedia,
        hasSpoilers,
        commentsEnabled,
        updatedAt: new Date().toISOString()
      };

      const payloadString = JSON.stringify(payload);
      if (payloadString !== lastSavedRef.current) {
        try {
          localStorage.setItem(draftKey, payloadString);
          lastSavedRef.current = payloadString;
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          setAutoSaveStatus(`Draft saved at ${timeStr}`);
        } catch (err) {
          console.warn('Draft autosave error:', err);
        }
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [title, content, excerpt, coverImage, tags, relatedMedia, hasSpoilers, commentsEnabled, draftKey, isLoadingPulse]);

  // Discard draft
  const handleDiscardDraft = () => {
    localStorage.removeItem(draftKey);
    setTitle('');
    setContent('');
    setExcerpt('');
    setCoverImage({ url: null, publicId: null });
    setTags([]);
    setRelatedMedia([]);
    setHasSpoilers(false);
    setCommentsEnabled(true);
    setShowDraftRestoredNotice(false);
    setAutoSaveStatus('Draft cleared');
  };

  // Word count & reading time calculation
  const wordCount = content
    ? content.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length
    : 0;
  const estimatedReadTime = Math.max(1, Math.ceil(wordCount / 200));

  // Cover image upload
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingCover(true);
      setErrorMsg('');
      const res = await pulseService.uploadPulseImage(file);
      if (res?.url) {
        setCoverImage({ url: res.url, publicId: res.publicId || null });
      }
    } catch (err) {
      console.error('Cover upload error:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to upload cover image. Please verify image format & size.');
    } finally {
      setIsUploadingCover(false);
      e.target.value = '';
    }
  };

  // Inline image upload for TipTap Studio
  const handleInlineImageUpload = async (file) => {
    try {
      setIsUploadingInline(true);
      setErrorMsg('');
      const res = await pulseService.uploadPulseImage(file);
      return res.url;
    } catch (err) {
      console.error('Inline image upload error:', err);
      setErrorMsg('Failed to upload inline image to Cloudinary.');
      throw err;
    } finally {
      setIsUploadingInline(false);
    }
  };

  // Tag addition
  const handleAddTag = (tagToAdd) => {
    const clean = tagToAdd.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (clean && !tags.includes(clean) && tags.length < 8) {
      setTags([...tags, clean]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Submission handler
  const handleSubmit = async (targetStatus = 'published') => {
    setErrorMsg('');

    if (!title.trim()) {
      setErrorMsg('Please enter a title for your Pulse');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!content.trim() || content === '<p></p>') {
      setErrorMsg('Pulse content cannot be empty');
      return;
    }

    try {
      setIsSubmitting(true);

      const payload = {
        title: title.trim(),
        content,
        excerpt: excerpt.trim(),
        coverImage,
        tags,
        relatedMedia,
        hasSpoilers,
        commentsEnabled,
        status: targetStatus
      };

      let result;
      if (isEditMode) {
        result = await pulseService.updatePulse(id, payload);
      } else {
        result = await pulseService.createPulse(payload);
      }

      // Clear local draft upon successful save
      localStorage.removeItem(draftKey);

      const pulseSlug = result?.data?.slug;
      if (pulseSlug) {
        navigate(`/pulse/${pulseSlug}`);
      } else {
        navigate('/pulse');
      }
    } catch (err) {
      console.error('Error submitting Pulse:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to publish Pulse. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingPulse) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <ArrowPathIcon className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm text-gray-400">Loading Pulse Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-24">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-dark-200/80 border border-white/10 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Go back"
          >
            <ArrowLeftIcon className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Otaku Pulse Studio</span>
              <span className="text-gray-600">•</span>
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <DocumentCheckIcon className="w-3.5 h-3.5 text-emerald-400 inline" />
                {autoSaveStatus}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {isEditMode ? 'Edit Pulse' : 'Drop a Pulse ⚡'}
            </h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleSubmit('draft')}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-dark-200 hover:bg-dark-300 border border-white/10 text-gray-300 hover:text-white transition-all disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSubmit('published')}
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-primary hover:bg-primary-600 text-white shadow-lg shadow-primary/30 flex items-center gap-1.5 transition-all transform active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <BoltIcon className="w-4 h-4" />
                <span>{isEditMode ? 'Update Pulse' : 'Drop Pulse'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Draft Restored Banner */}
      {showDraftRestoredNotice && (
        <div className="mb-6 p-3 sm:p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-3 text-xs sm:text-sm text-gray-200">
          <div className="flex items-center gap-2">
            <DocumentCheckIcon className="w-5 h-5 text-primary flex-shrink-0" />
            <span>Restored unsaved writing from your browser's local storage.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDiscardDraft}
              className="text-gray-400 hover:text-rose-400 font-medium underline"
            >
              Discard Draft
            </button>
            <button
              type="button"
              onClick={() => setShowDraftRestoredNotice(false)}
              className="text-gray-400 hover:text-white p-1"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error Notice */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-3">
          <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Cover Image Uploader */}
        <div className="space-y-2">
          {coverImage.url ? (
            <div className="relative group rounded-3xl overflow-hidden border border-white/10 aspect-[21/9] max-h-72 bg-dark-100 shadow-2xl">
              <img
                src={coverImage.url}
                alt="Pulse Cover"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-colors"
                >
                  Change Cover
                </button>
                <button
                  type="button"
                  onClick={() => setCoverImage({ url: null, publicId: null })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-500/80 hover:bg-rose-500 text-white backdrop-blur-md transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <div
              onClick={() => coverInputRef.current?.click()}
              className="border-2 border-dashed border-white/15 hover:border-primary/50 rounded-3xl p-6 sm:p-8 text-center cursor-pointer transition-all bg-dark-200/40 hover:bg-dark-200/70 group"
            >
              <div className="max-w-md mx-auto flex flex-col items-center gap-2">
                <div className="p-3.5 rounded-2xl bg-dark-100 border border-white/10 text-gray-400 group-hover:text-primary transition-colors">
                  {isUploadingCover ? (
                    <ArrowPathIcon className="w-6 h-6 animate-spin text-primary" />
                  ) : (
                    <PhotoIcon className="w-6 h-6" />
                  )}
                </div>
                <div className="text-sm font-semibold text-gray-200 group-hover:text-white">
                  {isUploadingCover ? 'Uploading cover to Cloudinary...' : 'Add a Cover Image'}
                </div>
                <p className="text-xs text-gray-500">
                  PNG, JPG, or WebP. 16:9 or 21:9 banner recommended (Max 10MB)
                </p>
              </div>
            </div>
          )}
          <input
            type="file"
            ref={coverInputRef}
            onChange={handleCoverUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {/* Title Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Pulse Title</span>
            <span className={`text-xs ${title.length > 140 ? 'text-amber-400' : 'text-gray-500'}`}>
              {title.length}/150
            </span>
          </div>
          <input
            type="text"
            placeholder="Enter an eye-catching theory or review title..."
            value={title}
            maxLength={150}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl sm:text-3xl font-extrabold text-white placeholder-gray-600 bg-transparent border-b border-white/10 pb-3 focus:outline-none focus:border-primary tracking-tight"
          />
        </div>

        {/* Excerpt Input (Optional) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">
              Excerpt / Hook <span className="font-normal lowercase text-gray-600">(optional - auto-extracted if empty)</span>
            </span>
            <span className="text-xs text-gray-500">{excerpt.length}/300</span>
          </div>
          <textarea
            placeholder="A short, compelling teaser for the feed card preview..."
            value={excerpt}
            maxLength={300}
            rows={2}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-dark-100/80 border border-white/10 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-primary resize-none"
          />
        </div>

        {/* Catalog Media Cross-Linker */}
        <div className="p-4 rounded-2xl bg-dark-200/50 border border-white/10">
          <MediaTagSelector
            value={relatedMedia}
            onChange={setRelatedMedia}
          />
        </div>

        {/* Rich TipTap Studio Container */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-200">
              Pulse Content
            </label>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span>{wordCount} words</span>
              <span>•</span>
              <span>~{estimatedReadTime} min read</span>
            </div>
          </div>

          <TipTapStudio
            content={content}
            onChange={setContent}
            onImageUpload={async (file) => {
              const url = await handleInlineImageUpload(file);
              return url;
            }}
            isUploadingImage={isUploadingInline}
          />
        </div>

        {/* Tags & Taxonomy */}
        <div className="p-4 sm:p-5 rounded-2xl bg-dark-200/50 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-200 flex items-center gap-2">
              <TagIcon className="w-4 h-4 text-primary" />
              <span>Tags ({tags.length}/8)</span>
            </label>
            <span className="text-xs text-gray-500">Press Enter or comma to add</span>
          </div>

          {/* Active Tags */}
          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 text-xs font-medium text-white border border-white/10"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-gray-400 hover:text-rose-400"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}

            <input
              type="text"
              placeholder={tags.length >= 8 ? 'Max tags reached' : 'Add a tag (e.g. jjk, spoiler, theory)...'}
              value={tagInput}
              disabled={tags.length >= 8}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  handleAddTag(tagInput);
                }
              }}
              className="px-3 py-1 bg-dark-100 border border-white/10 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-primary disabled:opacity-50"
            />
          </div>

          {/* Suggested Quick Tags */}
          <div className="pt-1">
            <span className="text-xs text-gray-500 mr-2">Suggested:</span>
            <div className="inline-flex flex-wrap gap-1.5 mt-1">
              {POPULAR_TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => handleAddTag(t)}
                  disabled={tags.includes(t) || tags.length >= 8}
                  className={`text-[11px] px-2 py-0.5 rounded-lg border transition-all ${
                    tags.includes(t)
                      ? 'opacity-40 border-transparent text-gray-600 bg-white/5 cursor-not-allowed'
                      : 'border-white/10 text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  +{t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Preferences & Flags */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Spoilers Toggle */}
          <div
            onClick={() => setHasSpoilers(!hasSpoilers)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
              hasSpoilers
                ? 'bg-amber-500/10 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]'
                : 'bg-dark-200/50 border-white/10 hover:border-white/20'
            }`}
          >
            <div className={`p-2 rounded-xl ${hasSpoilers ? 'bg-amber-500/20 text-amber-400' : 'bg-dark-100 text-gray-500'}`}>
              <ExclamationTriangleIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Contains Major Spoilers</span>
                {hasSpoilers && <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">Active</span>}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Displays a prominent spoiler warning badge over your Pulse in public feeds.
              </p>
            </div>
          </div>

          {/* Comments Toggle */}
          <div
            onClick={() => setCommentsEnabled(!commentsEnabled)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-3 ${
              commentsEnabled
                ? 'bg-dark-200/50 border-white/10 hover:border-white/20'
                : 'bg-rose-500/10 border-rose-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
            }`}
          >
            <div className={`p-2 rounded-xl ${commentsEnabled ? 'bg-dark-100 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              <ChatBubbleLeftRightIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Allow Community Comments</span>
                {!commentsEnabled && <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-500/20 px-1.5 py-0.5 rounded">Locked</span>}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {commentsEnabled
                  ? 'Readers can post replies and join the threaded discussion.'
                  : 'Discussions are locked. Readers will only be able to view and vote.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PulseStudio;
