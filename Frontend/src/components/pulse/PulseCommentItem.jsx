import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import pulseService from '../../services/pulseService';
import PulseCommentInput from './PulseCommentInput';
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ChatBubbleLeftIcon,
  TrashIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const past = new Date(dateString);
  const diffInSec = Math.floor((now - past) / 1000);

  if (diffInSec < 60) return 'just now';
  const diffInMin = Math.floor(diffInSec / 60);
  if (diffInMin < 60) return `${diffInMin}m ago`;
  const diffInHours = Math.floor(diffInMin / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return past.toLocaleDateString();
};

const PulseCommentItem = ({
  comment,
  pulseId,
  commentsEnabled = true,
  onCommentDeleted,
  onReplyAdded
}) => {
  const { user, isAuthenticated } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [score, setScore] = useState(comment.score || 0);
  const [userVote, setUserVote] = useState(comment.userVote || null);
  const [isVoting, setIsVoting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAuthor = user && comment.author?._id && String(user._id) === String(comment.author._id);

  const handleVote = async (dir) => {
    if (!isAuthenticated) {
      alert('Please log in to vote on discussion comments.');
      return;
    }
    if (isVoting || comment.isDeleted) return;

    const prevScore = score;
    const prevVote = userVote;

    let nextScore = prevScore;
    let nextVote = prevVote;

    if (dir === 'up') {
      if (prevVote === 'up') {
        nextVote = null;
        nextScore = prevScore - 1;
      } else if (prevVote === 'down') {
        nextVote = 'up';
        nextScore = prevScore + 2;
      } else {
        nextVote = 'up';
        nextScore = prevScore + 1;
      }
    } else if (dir === 'down') {
      if (prevVote === 'down') {
        nextVote = null;
        nextScore = prevScore + 1;
      } else if (prevVote === 'up') {
        nextVote = 'down';
        nextScore = prevScore - 2;
      } else {
        nextVote = 'down';
        nextScore = prevScore - 1;
      }
    }

    setScore(nextScore);
    setUserVote(nextVote);

    try {
      setIsVoting(true);
      const res = await pulseService.voteComment(pulseId, comment._id, dir);
      if (res?.success) {
        setScore(res.score);
        setUserVote(res.userVote);
      }
    } catch (err) {
      console.error('Comment vote failed:', err);
      setScore(prevScore);
      setUserVote(prevVote);
    } finally {
      setIsVoting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this reply?')) return;

    try {
      setIsDeleting(true);
      const res = await pulseService.deleteComment(pulseId, comment._id);
      if (res?.success) {
        onCommentDeleted?.(comment._id, res.isDeleted);
      }
    } catch (err) {
      console.error('Failed to delete comment:', err);
      alert('Failed to delete comment. You may not have permission.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReplySuccess = (newReply) => {
    setIsReplying(false);
    onReplyAdded?.(newReply);
  };

  const repliesCount = (comment.replies || []).length;

  return (
    <div className="relative group/comment">
      {/* Comment Card Body */}
      <div className={`p-3 sm:p-4 rounded-2xl transition-all ${
        comment.isDeleted
          ? 'bg-dark-200/30 border border-white/5 opacity-75'
          : 'bg-dark-200/60 border border-white/10 hover:border-white/15 shadow-sm'
      }`}>
        {/* Header: Author Avatar, Username, Timestamp, Collapse Toggle */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            {comment.isDeleted ? (
              <div className="w-6 h-6 rounded-full bg-dark-100 border border-white/10 flex items-center justify-center text-[10px] text-gray-500">
                ✕
              </div>
            ) : (
              <img
                src={comment.author?.avatar || `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(comment.author?.username || 'U')}`}
                alt={comment.author?.username}
                className="w-6 h-6 rounded-full object-cover border border-white/10 flex-shrink-0"
              />
            )}

            <div className="flex items-center gap-2 min-w-0">
              <span className={`text-xs font-bold truncate ${comment.isDeleted ? 'text-gray-500' : 'text-gray-200 hover:text-primary transition-colors'}`}>
                {comment.isDeleted ? '[deleted]' : `@${comment.author?.username || 'otaku'}`}
              </span>
              <span className="text-gray-600 text-xs">•</span>
              <span className="text-[11px] text-gray-500 flex-shrink-0">
                {formatTimeAgo(comment.createdAt)}
              </span>
            </div>
          </div>

          {/* Collapse/Expand Toggle */}
          {repliesCount > 0 && (
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="text-[11px] text-gray-500 hover:text-gray-300 font-medium px-2 py-0.5 rounded-lg hover:bg-white/5 transition-all flex items-center gap-1"
            >
              <span>{isCollapsed ? `[+${repliesCount}]` : '[-]'}</span>
            </button>
          )}
        </div>

        {/* Comment Content */}
        {!isCollapsed && (
          <>
            <div className={`text-xs sm:text-sm leading-relaxed mb-3 break-words ${
              comment.isDeleted ? 'text-gray-500 italic font-serif' : 'text-gray-200 whitespace-pre-wrap'
            }`}>
              {comment.content}
            </div>

            {/* Actions Bar: Voting, Reply, Delete */}
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <div className="flex items-center gap-3">
                {/* Voting Pills (hidden if deleted) */}
                {!comment.isDeleted && (
                  <div className="inline-flex items-center rounded-xl bg-dark-100 border border-white/10 px-1 py-0.5 gap-1">
                    <button
                      type="button"
                      onClick={() => handleVote('up')}
                      disabled={isVoting}
                      title="Upvote comment"
                      className={`p-1 rounded-lg transition-colors ${
                        userVote === 'up'
                          ? 'text-emerald-400 bg-emerald-500/20'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <ChevronUpIcon className="w-3.5 h-3.5" />
                    </button>
                    <span className={`text-[11px] font-extrabold tabular-nums select-none ${
                      score > 0 ? 'text-emerald-400' : score < 0 ? 'text-rose-400' : 'text-gray-400'
                    }`}>
                      {score > 0 ? `+${score}` : `${score}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleVote('down')}
                      disabled={isVoting}
                      title="Downvote comment"
                      className={`p-1 rounded-lg transition-colors ${
                        userVote === 'down'
                          ? 'text-rose-400 bg-rose-500/20'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <ChevronDownIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Reply Button */}
                {commentsEnabled && !comment.isDeleted && (
                  <button
                    type="button"
                    onClick={() => setIsReplying(!isReplying)}
                    className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                  >
                    <ChatBubbleLeftIcon className="w-3.5 h-3.5" />
                    <span>Reply</span>
                  </button>
                )}
              </div>

              {/* Delete Button (for author or admin) */}
              {!comment.isDeleted && isAuthor && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="p-1 text-gray-500 hover:text-rose-400 transition-colors"
                  title="Delete comment"
                >
                  <TrashIcon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Nested Reply Input */}
            {isReplying && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <PulseCommentInput
                  pulseId={pulseId}
                  parentId={comment._id}
                  replyingToUsername={comment.author?.username}
                  onCommentAdded={handleReplySuccess}
                  onCancel={() => setIsReplying(false)}
                  autoFocus
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Recursive Nested Replies Tree */}
      {!isCollapsed && repliesCount > 0 && (
        <div className="pl-3 sm:pl-5 border-l-2 border-white/10 hover:border-primary/40 transition-colors mt-2.5 space-y-2.5">
          {comment.replies.map((childReply) => (
            <PulseCommentItem
              key={childReply._id}
              comment={childReply}
              pulseId={pulseId}
              commentsEnabled={commentsEnabled}
              onCommentDeleted={onCommentDeleted}
              onReplyAdded={onReplyAdded}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PulseCommentItem;
