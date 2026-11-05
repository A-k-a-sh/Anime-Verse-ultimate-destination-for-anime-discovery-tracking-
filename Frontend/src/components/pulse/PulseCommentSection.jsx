import { useState, useEffect } from 'react';
import pulseService from '../../services/pulseService';
import PulseCommentInput from './PulseCommentInput';
import PulseCommentItem from './PulseCommentItem';
import {
  ChatBubbleLeftRightIcon,
  LockClosedIcon,
  ArrowPathIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const PulseCommentSection = ({ pulseId, commentsEnabled = true }) => {
  const [comments, setComments] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchComments = async () => {
    if (!pulseId) return;
    try {
      setIsLoading(true);
      setErrorMsg('');
      const res = await pulseService.getPulseComments(pulseId);
      if (res?.success) {
        setComments(res.data || []);
        setTotalCount(res.count || 0);
      }
    } catch (err) {
      console.error('Failed to load pulse comments:', err);
      setErrorMsg('Failed to load discussion comments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [pulseId]);

  // Recursively add new reply to comment tree
  const insertReplyIntoTree = (tree, newReply) => {
    return tree.map(item => {
      if (String(item._id) === String(newReply.parentId)) {
        return {
          ...item,
          replies: [...(item.replies || []), newReply]
        };
      }
      if (item.replies && item.replies.length > 0) {
        return {
          ...item,
          replies: insertReplyIntoTree(item.replies, newReply)
        };
      }
      return item;
    });
  };

  // Recursively update or remove deleted comment from tree
  const removeOrMaskInTree = (tree, commentId, isMasked) => {
    return tree
      .map(item => {
        if (String(item._id) === String(commentId)) {
          if (isMasked) {
            return {
              ...item,
              isDeleted: true,
              content: '[This comment was deleted by the user]'
            };
          }
          return null; // Will be filtered out
        }
        if (item.replies && item.replies.length > 0) {
          return {
            ...item,
            replies: removeOrMaskInTree(item.replies, commentId, isMasked)
          };
        }
        return item;
      })
      .filter(Boolean);
  };

  const handleCommentAdded = (newComment) => {
    if (!newComment.parentId) {
      // Top level comment
      setComments([newComment, ...comments]);
    } else {
      // Nested reply
      setComments(insertReplyIntoTree(comments, newComment));
    }
    setTotalCount(prev => prev + 1);
  };

  const handleCommentDeleted = (commentId, isMasked) => {
    setComments(removeOrMaskInTree(comments, commentId, isMasked));
    if (!isMasked) {
      setTotalCount(prev => Math.max(0, prev - 1));
    }
  };

  return (
    <section className="space-y-6 pt-8 border-t border-white/10" id="comments">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-dark-200 border border-white/10 text-primary">
            <ChatBubbleLeftRightIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Discussion Echoes</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/20 text-primary font-bold border border-primary/30">
                {totalCount}
              </span>
            </h2>
            <p className="text-xs text-gray-400">Join the fandom debate, share theories and dissect lore</p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchComments}
          disabled={isLoading}
          className="p-2 rounded-xl bg-dark-200 hover:bg-dark-300 text-gray-400 hover:text-white transition-colors border border-white/10"
          title="Refresh comments"
        >
          <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Locked Comments Alert */}
      {!commentsEnabled && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-center gap-3 text-sm">
          <LockClosedIcon className="w-5 h-5 flex-shrink-0 text-rose-400" />
          <div>
            <span className="font-bold text-rose-200">Discussions Locked: </span>
            The author or a moderator has closed new replies for this Pulse. Existing comments remain viewable.
          </div>
        </div>
      )}

      {/* Top-Level Comment Input Box */}
      {commentsEnabled && (
        <PulseCommentInput
          pulseId={pulseId}
          onCommentAdded={handleCommentAdded}
          placeholder="What do you think about this Pulse? Drop your thoughts or counter-theory..."
        />
      )}

      {/* Error state */}
      {errorMsg && (
        <div className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-center">
          {errorMsg}
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-gray-500">
          <ArrowPathIcon className="w-6 h-6 animate-spin text-primary" />
          <span className="text-xs">Loading echoes...</span>
        </div>
      ) : comments.length === 0 ? (
        /* Empty State */
        <div className="py-12 px-4 rounded-3xl bg-dark-200/30 border border-dashed border-white/10 text-center">
          <div className="max-w-sm mx-auto flex flex-col items-center gap-2">
            <div className="p-3.5 rounded-2xl bg-dark-100 border border-white/10 text-primary">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-white">No echoes yet</h3>
            <p className="text-xs text-gray-400">
              Be the first otaku to drop a thought, critique, or wild theory on this Pulse!
            </p>
          </div>
        </div>
      ) : (
        /* Threaded Comments List */
        <div className="space-y-4">
          {comments.map((rootComment) => (
            <PulseCommentItem
              key={rootComment._id}
              comment={rootComment}
              pulseId={pulseId}
              commentsEnabled={commentsEnabled}
              onCommentDeleted={handleCommentDeleted}
              onReplyAdded={handleCommentAdded}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default PulseCommentSection;
