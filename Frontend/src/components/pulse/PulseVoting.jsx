import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import pulseService from '../../services/pulseService';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/solid';

const PulseVoting = ({
  pulseId,
  initialScore = 0,
  initialUserVote = null,
  direction = 'vertical', // 'vertical' | 'horizontal'
  size = 'md', // 'sm' | 'md' | 'lg'
  onChange
}) => {
  const { isAuthenticated } = useAuth();
  const [score, setScore] = useState(initialScore);
  const [userVote, setUserVote] = useState(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);

  useEffect(() => {
    setScore(initialScore);
  }, [initialScore]);

  useEffect(() => {
    setUserVote(initialUserVote);
  }, [initialUserVote]);

  const handleVote = async (dir) => {
    if (!isAuthenticated) {
      alert('Please log in to vote on Pulses and shape community rankings.');
      return;
    }

    if (!pulseId || isVoting) return;

    // Save previous state for rollback
    const prevScore = score;
    const prevVote = userVote;

    // Calculate optimistic state
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

    // Apply optimistic update
    setScore(nextScore);
    setUserVote(nextVote);
    onChange?.({ pulseScore: nextScore, userVote: nextVote });

    try {
      setIsVoting(true);
      const res = await pulseService.votePulse(pulseId, dir);
      if (res?.success) {
        setScore(res.pulseScore);
        setUserVote(res.userVote);
        onChange?.({ pulseScore: res.pulseScore, userVote: res.userVote });
      }
    } catch (err) {
      console.error('Pulse voting failed:', err);
      // Rollback on failure
      setScore(prevScore);
      setUserVote(prevVote);
      onChange?.({ pulseScore: prevScore, userVote: prevVote });
    } finally {
      setIsVoting(false);
    }
  };

  const isVertical = direction === 'vertical';

  const sizeClasses = {
    sm: {
      btn: 'p-1',
      icon: 'w-3.5 h-3.5',
      text: 'text-xs font-bold px-1',
      container: 'gap-0.5'
    },
    md: {
      btn: 'p-1.5',
      icon: 'w-4 h-4',
      text: 'text-xs sm:text-sm font-extrabold px-1.5',
      container: 'gap-1'
    },
    lg: {
      btn: 'p-2',
      icon: 'w-5 h-5',
      text: 'text-sm sm:text-base font-extrabold px-2',
      container: 'gap-1.5'
    }
  }[size] || sizeClasses.md;

  const scoreColor =
    score > 0
      ? 'text-emerald-400'
      : score < 0
      ? 'text-rose-400'
      : 'text-gray-400';

  const formattedScore = score > 0 ? `+${score}` : `${score}`;

  return (
    <div
      className={`inline-flex items-center rounded-2xl bg-dark-100/90 border border-white/10 p-1 backdrop-blur-md shadow-inner ${
        isVertical ? 'flex-col' : 'flex-row'
      } ${sizeClasses.container}`}
    >
      {/* Upvote Button */}
      <button
        type="button"
        onClick={() => handleVote('up')}
        disabled={isVoting}
        title="Upvote Pulse"
        className={`rounded-xl transition-all duration-150 transform active:scale-90 ${sizeClasses.btn} ${
          userVote === 'up'
            ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.35)]'
            : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
      >
        <ChevronUpIcon className={sizeClasses.icon} />
      </button>

      {/* Pulse Score Count */}
      <span className={`tabular-nums tracking-tight select-none ${sizeClasses.text} ${scoreColor}`}>
        {formattedScore}
      </span>

      {/* Downvote Button */}
      <button
        type="button"
        onClick={() => handleVote('down')}
        disabled={isVoting}
        title="Downvote Pulse"
        className={`rounded-xl transition-all duration-150 transform active:scale-90 ${sizeClasses.btn} ${
          userVote === 'down'
            ? 'bg-rose-500/20 text-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.35)]'
            : 'text-gray-400 hover:text-white hover:bg-white/10'
        }`}
      >
        <ChevronDownIcon className={sizeClasses.icon} />
      </button>
    </div>
  );
};

export default PulseVoting;
