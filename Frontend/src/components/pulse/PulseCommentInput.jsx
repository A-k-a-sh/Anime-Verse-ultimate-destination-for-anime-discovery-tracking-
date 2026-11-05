import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import pulseService from '../../services/pulseService';
import { PaperAirplaneIcon, ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';

const PulseCommentInput = ({
  pulseId,
  parentId = null,
  replyingToUsername = null,
  onCommentAdded,
  onCancel,
  autoFocus = false,
  placeholder = 'Join the discussion... (Markdown supported)'
}) => {
  const { user, isAuthenticated } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const textareaRef = useRef(null);

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setErrorMsg('');

      const res = await pulseService.createComment(pulseId, {
        content: content.trim(),
        parentId
      });

      if (res?.success) {
        setContent('');
        onCommentAdded?.(res.data);
        onCancel?.();
      }
    } catch (err) {
      console.error('Failed to post comment:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to post reply. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="p-4 sm:p-5 rounded-2xl bg-dark-200/60 border border-white/10 text-center flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-sm text-gray-300">
          <span className="font-semibold text-white">Feel the Fandom?</span> Log in to join this Pulse discussion and share your theory.
        </div>
        <Link
          to="/login"
          className="px-4 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-600 text-white transition-all shadow-md shadow-primary/20 flex-shrink-0"
        >
          Sign In to Reply
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      {replyingToUsername && (
        <div className="flex items-center justify-between text-xs text-gray-400 bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
          <span>
            Replying to <span className="font-bold text-primary">@{replyingToUsername}</span>
          </span>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-white"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      <div className="relative rounded-2xl bg-dark-100 border border-white/10 focus-within:border-primary/50 transition-all p-3 shadow-inner">
        <div className="flex items-start gap-3">
          <img
            src={user?.avatar || `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(user?.username || 'U')}`}
            alt={user?.username}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-white/10 mt-0.5"
          />
          <div className="flex-1 min-w-0">
            <textarea
              ref={textareaRef}
              rows={parentId ? 2 : 3}
              value={content}
              maxLength={2500}
              onChange={(e) => setContent(e.target.value)}
              placeholder={placeholder}
              className="w-full bg-transparent text-sm text-gray-200 placeholder-gray-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>
        </div>

        {errorMsg && (
          <div className="text-xs text-rose-400 px-2 py-1 mt-1 font-medium">
            {errorMsg}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
          <span className="text-[11px] text-gray-500">
            {content.length}/2500
          </span>
          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!content.trim() || isSubmitting}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary-600 disabled:opacity-40 text-white transition-all flex items-center gap-1.5 shadow-md shadow-primary/25 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-3.5 h-3.5" />
                  <span>{parentId ? 'Reply' : 'Post Echo'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};

export default PulseCommentInput;
