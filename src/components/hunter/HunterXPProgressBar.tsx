import { motion } from 'framer-motion';
import { Sparkles, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HunterXPProgressBarProps {
  currentXP: number;
  level: number;
  nextLevelXP: number;
  progressPercent: number;
  className?: string;
  showDetails?: boolean;
}

export default function HunterXPProgressBar({
  currentXP,
  level,
  nextLevelXP,
  progressPercent,
  className,
  showDetails = true
}: HunterXPProgressBarProps) {
  const xpToNextLevel = nextLevelXP - currentXP;

  return (
    <motion.div
      className={cn(
        "flex items-center gap-3",
        className
      )}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      {/* Level Badge */}
      <motion.div
        className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 backdrop-blur-xl"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex flex-col items-center justify-center">
          <Trophy className="w-4 h-4 text-emerald-400 mb-0.5" />
          <span className="text-xs font-bold text-emerald-300">{level}</span>
        </div>
      </motion.div>

      {/* Progress Bar Container */}
      <div className="flex-1 min-w-0">
        {showDetails && (
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-medium text-slate-300">
              Level {level} Hunter
            </span>
            <span className="text-xs text-slate-400">
              {xpToNextLevel} XP to Level {level + 1}
            </span>
          </div>
        )}

        {/* Progress Bar */}
        <div className="relative h-2 bg-slate-800/50 rounded-full overflow-hidden border border-slate-700/50">
          {/* Animated background glow */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 via-cyan-500/20 to-emerald-500/20"
            animate={{
              x: ['-100%', '100%']
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
          />

          {/* Progress fill */}
          <motion.div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
          >
            {/* Shimmer effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{
                x: ['-100%', '100%']
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
                repeatDelay: 1
              }}
            />
          </motion.div>

          {/* Sparkle particles */}
          {progressPercent > 10 && (
            <motion.div
              className="absolute top-1/2 -translate-y-1/2"
              style={{ left: `${progressPercent}%` }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="w-3 h-3 text-white -translate-x-1.5" />
            </motion.div>
          )}
        </div>

        {showDetails && (
          <div className="flex items-center justify-between mt-1">
            <span className="text-xs text-slate-500">
              {currentXP.toLocaleString()} XP
            </span>
            <span className="text-xs font-semibold text-emerald-400">
              {progressPercent.toFixed(0)}%
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}




