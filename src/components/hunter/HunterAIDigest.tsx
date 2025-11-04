import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Shield, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHunterXP } from '@/hooks/useHunterXP';

interface HunterAIDigestProps {
  topOpportunitiesCount: number;
  riskLevel: 'low' | 'medium' | 'high';
  weeklyGoalProgress: number;
  className?: string;
}

export default function HunterAIDigest({
  topOpportunitiesCount,
  riskLevel,
  weeklyGoalProgress,
  className
}: HunterAIDigestProps) {
  const { xpData } = useHunterXP();

  const getRiskColor = () => {
    switch (riskLevel) {
      case 'low':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'medium':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'high':
        return 'text-red-400 bg-red-500/10 border-red-500/30';
    }
  };

  const getRiskLabel = () => {
    switch (riskLevel) {
      case 'low':
        return 'Low Risk';
      case 'medium':
        return 'Medium Risk';
      case 'high':
        return 'High Risk';
    }
  };

  const getCopilotRecommendation = () => {
    if (topOpportunitiesCount === 0) {
      return "No new opportunities at the moment. Check back soon!";
    }
    if (topOpportunitiesCount === 1) {
      return `Found ${topOpportunitiesCount} high-potential opportunity worth exploring today.`;
    }
    return `Found ${topOpportunitiesCount} high-potential opportunities worth exploring today.`;
  };

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-slate-800/60",
        "backdrop-blur-xl border border-white/10",
        "shadow-2xl shadow-slate-900/50",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
    >
      {/* Animated background gradient */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-cyan-500/10 to-emerald-500/10 opacity-50"
        animate={{
          x: ['-100%', '100%']
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      <div className="relative z-10 p-4 md:p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <motion.div
              className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30"
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </motion.div>
            <div>
              <h3 className="font-semibold text-sm md:text-base text-slate-100">
                AI Copilot Digest
              </h3>
              <p className="text-xs text-slate-400">Real-time analysis</p>
            </div>
          </div>

          {/* Risk Badge */}
          <div className={cn(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium",
            getRiskColor()
          )}>
            <Shield className="w-3.5 h-3.5" />
            {getRiskLabel()}
          </div>
        </div>

        {/* Recommendation */}
        <motion.div
          className="mb-4 p-3 rounded-xl bg-slate-950/40 border border-slate-700/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-sm text-slate-300 leading-relaxed">
            <span className="text-emerald-400 font-medium">Copilot recommends:</span>
            {' '}
            {getCopilotRecommendation()}
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          {/* Opportunities */}
          <motion.div
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/40 border border-slate-700/50"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <TrendingUp className="w-5 h-5 text-emerald-400 mb-1.5" />
            <div className="text-xl md:text-2xl font-bold text-slate-100">
              {topOpportunitiesCount}
            </div>
            <div className="text-xs text-slate-400 text-center">
              Top Picks
            </div>
          </motion.div>

          {/* Weekly Goal */}
          <motion.div
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/40 border border-slate-700/50"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <Zap className="w-5 h-5 text-cyan-400 mb-1.5" />
            <div className="text-xl md:text-2xl font-bold text-slate-100">
              {weeklyGoalProgress}%
            </div>
            <div className="text-xs text-slate-400 text-center">
              Weekly Goal
            </div>
          </motion.div>

          {/* Level */}
          <motion.div
            className="flex flex-col items-center justify-center p-3 rounded-xl bg-slate-950/40 border border-slate-700/50"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="text-lg mb-1.5">🏆</div>
            <div className="text-xl md:text-2xl font-bold text-slate-100">
              {xpData.level}
            </div>
            <div className="text-xs text-slate-400 text-center">
              Level
            </div>
          </motion.div>
        </div>

        {/* Weekly XP Progress Bar */}
        {xpData.weeklyXP > 0 && (
          <motion.div
            className="mt-4 pt-4 border-t border-slate-700/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-400">This Week's XP</span>
              <span className="text-xs font-semibold text-emerald-400">
                +{xpData.weeklyXP} XP
              </span>
            </div>
            <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((xpData.weeklyXP / 100) * 100, 100)}%` }}
                transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}




