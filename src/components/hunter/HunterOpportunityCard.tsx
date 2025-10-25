import { motion } from 'framer-motion';
import { Clock, Star, Shield, TrendingUp, Info, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Quest } from '@/types/hunter';
import { useState } from 'react';

interface HunterOpportunityCardProps {
  quest: Quest;
  onClaim: (quest: Quest) => void;
  onExplainability?: (quest: Quest) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (questId: string) => void;
  className?: string;
}

export default function HunterOpportunityCard({
  quest,
  onClaim,
  onExplainability,
  isFavorite = false,
  onToggleFavorite,
  className
}: HunterOpportunityCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getGuardianBadge = (score: number) => {
    if (score >= 90) {
      return {
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        icon: '✅',
        label: 'High Trust'
      };
    } else if (score >= 70) {
      return {
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        icon: '⚠️',
        label: 'Medium Trust'
      };
    } else {
      return {
        color: 'text-red-400 bg-red-500/10 border-red-500/30',
        icon: '🛡️',
        label: 'Low Trust'
      };
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'staking':
        return '💎';
      case 'nft':
        return '🖼️';
      case 'airdrop':
        return '🪂';
      case 'quest':
        return '🎯';
      default:
        return '⚡';
    }
  };

  const guardianBadge = getGuardianBadge(quest.guardianScore);

  return (
    <motion.div
      className={cn(
        "group relative overflow-hidden rounded-2xl",
        "bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl",
        "border border-white/10 dark:border-slate-800/50",
        "shadow-lg hover:shadow-2xl",
        "transition-all duration-300",
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Glow effect on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-cyan-500/0 to-emerald-500/0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
        animate={isHovered ? {
          background: [
            'radial-gradient(circle at 0% 0%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 100% 100%, rgba(6, 182, 212, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 0% 0%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)'
          ]
        } : {}}
        transition={{ duration: 3, repeat: Infinity }}
      />

      <div className="relative z-10 p-5 md:p-6">
        {/* Header Row */}
        <div className="flex items-start justify-between mb-4">
          {/* Left: Category & Title */}
          <div className="flex-1 min-w-0 mr-3">
            {/* Category Badge */}
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant="secondary"
                className="text-xs font-medium bg-slate-800/30 text-slate-300 border-slate-700/50"
              >
                {getCategoryIcon(quest.category)} {quest.category}
              </Badge>
              {quest.isNew && (
                <motion.div
                  className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  New
                </motion.div>
              )}
            </div>

            {/* Project Logo & Name */}
            <div className="flex items-center gap-3 mb-2">
              {quest.imageUrl ? (
                <img
                  src={quest.imageUrl}
                  alt={quest.protocol}
                  className="w-10 h-10 rounded-xl object-cover border border-slate-700/50"
                />
              ) : (
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 flex items-center justify-center text-lg">
                  {getCategoryIcon(quest.category)}
                </div>
              )}
              <h3 className="text-lg font-bold text-slate-100 truncate">
                {quest.protocol}
              </h3>
            </div>
          </div>

          {/* Right: Favorite Star */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleFavorite?.(quest.id)}
            className={cn(
              "h-8 w-8 rounded-lg flex-shrink-0",
              isFavorite ? "text-amber-400" : "text-slate-500 hover:text-amber-400"
            )}
          >
            <Star
              className="w-4 h-4"
              fill={isFavorite ? "currentColor" : "none"}
            />
          </Button>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Reward */}
          <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950/30 border border-slate-700/50">
            <TrendingUp className="w-4 h-4 text-emerald-400 mb-1" />
            <div className="text-sm font-bold text-slate-100">
              ${quest.rewardUSD.toLocaleString()}
            </div>
            <div className="text-[10px] text-slate-400">Reward</div>
          </div>

          {/* APR or Confidence */}
          <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950/30 border border-slate-700/50">
            <div className="text-base mb-1">📊</div>
            <div className="text-sm font-bold text-slate-100">
              {Math.round(quest.confidence * 100)}%
            </div>
            <div className="text-[10px] text-slate-400">Confidence</div>
          </div>

          {/* Time */}
          <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-950/30 border border-slate-700/50">
            <Clock className="w-4 h-4 text-cyan-400 mb-1" />
            <div className="text-sm font-bold text-slate-100">
              {quest.estimatedTime}
            </div>
            <div className="text-[10px] text-slate-400">Duration</div>
          </div>
        </div>

        {/* Guardian Trust Badge */}
        <div className="flex items-center justify-between mb-4 p-3 rounded-xl bg-slate-950/40 border border-slate-700/50">
          <div className="flex items-center gap-2">
            <Shield className={cn("w-4 h-4", guardianBadge.color.split(' ')[0])} />
            <span className="text-sm font-medium text-slate-300">
              Guardian Score
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs font-semibold border", guardianBadge.color)}>
              {guardianBadge.icon} {quest.guardianScore}%
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onExplainability?.(quest)}
              className="h-6 w-6 rounded-lg hover:bg-slate-800/50"
            >
              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-slate-300" />
            </Button>
          </div>
        </div>

        {/* Progress Bar (if completionPercent exists) */}
        {quest.completionPercent !== undefined && quest.completionPercent > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400">Progress</span>
              <span className="text-xs font-semibold text-emerald-400">
                {quest.completionPercent}%
              </span>
            </div>
            <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${quest.completionPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => onClaim(quest)}
            className={cn(
              "w-full h-11 rounded-xl",
              "bg-gradient-to-r from-emerald-500 to-cyan-500",
              "hover:from-emerald-600 hover:to-cyan-600",
              "text-white font-semibold",
              "shadow-lg shadow-emerald-500/25",
              "transition-all duration-200"
            )}
          >
            {quest.completionPercent && quest.completionPercent > 0 ? (
              <>
                Continue Quest
                <ExternalLink className="ml-2 w-4 h-4" />
              </>
            ) : (
              <>
                Join Quest
                <ExternalLink className="ml-2 w-4 h-4" />
              </>
            )}
          </Button>
        </motion.div>

        {/* Network Badge (Bottom) */}
        <div className="mt-3 flex items-center justify-center">
          <span className="text-xs text-slate-500">
            on <span className="text-slate-400 font-medium">{quest.network}</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
}

