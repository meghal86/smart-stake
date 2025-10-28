import { motion } from 'framer-motion';
import { X, Trophy, Lock, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useHunterXP } from '@/hooks/useHunterXP';
import { Progress } from '@/components/ui/progress';

interface HunterAchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HunterAchievementsModal({
  isOpen,
  onClose
}: HunterAchievementsModalProps) {
  const { xpData, isLoading } = useHunterXP();

  // Extended badge definitions with progress tracking
  const allBadges = [
    {
      id: 'first_quest',
      name: 'First Steps',
      description: 'Complete your first quest',
      icon: '🎯',
      requirement: 'Complete 1 quest',
      unlocked: xpData.badges.some(b => b.id === 'first_quest'),
      progress: Math.min(xpData.totalQuestsCompleted, 1),
      total: 1
    },
    {
      id: 'staking_pro',
      name: 'Staking Pro',
      description: 'Complete 10 staking quests',
      icon: '💎',
      requirement: 'Complete 10 staking quests',
      unlocked: xpData.badges.some(b => b.id === 'staking_pro'),
      progress: 0, // Would track staking quests specifically
      total: 10
    },
    {
      id: 'nft_collector',
      name: 'NFT Collector',
      description: 'Complete 5 NFT quests',
      icon: '🖼️',
      requirement: 'Complete 5 NFT quests',
      unlocked: xpData.badges.some(b => b.id === 'nft_collector'),
      progress: 0,
      total: 5
    },
    {
      id: 'airdrop_hunter',
      name: 'Airdrop Hunter',
      description: 'Claim 15 airdrops',
      icon: '🪂',
      requirement: 'Claim 15 airdrops',
      unlocked: xpData.badges.some(b => b.id === 'airdrop_hunter'),
      progress: 0,
      total: 15
    },
    {
      id: 'level_5',
      name: 'Rising Star',
      description: 'Reach Level 5',
      icon: '⭐',
      requirement: 'Reach Level 5',
      unlocked: xpData.level >= 5,
      progress: Math.min(xpData.level, 5),
      total: 5
    },
    {
      id: 'level_10',
      name: 'Legendary Hunter',
      description: 'Reach Level 10',
      icon: '👑',
      requirement: 'Reach Level 10',
      unlocked: xpData.level >= 10,
      progress: Math.min(xpData.level, 10),
      total: 10
    },
    {
      id: 'week_streak_7',
      name: 'Consistent Hunter',
      description: 'Complete quests 7 days in a row',
      icon: '🔥',
      requirement: '7-day streak',
      unlocked: xpData.badges.some(b => b.id === 'week_streak_7'),
      progress: 0, // Would track streak
      total: 7
    }
  ];

  const unlockedBadges = allBadges.filter(b => b.unlocked);
  const lockedBadges = allBadges.filter(b => !b.unlocked);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay className="fixed inset-0 z-[9998] bg-black/80" />
        <DialogContent
          className={cn(
            "max-w-3xl p-0 overflow-hidden max-h-[80vh] fixed left-[50%] top-[50%] z-[9999] translate-x-[-50%] translate-y-[-50%] grid w-full gap-4 shadow-lg duration-200",
            "bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl",
            "border border-white/10 dark:border-slate-800/50",
            "shadow-2xl"
          )}
        >
        {/* Animated background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 pointer-events-none"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="p-6 border-b border-slate-800/50">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <motion.div
                  className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30"
                  animate={{
                    rotate: [0, -5, 5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Trophy className="w-6 h-6 text-amber-400" />
                </motion.div>
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-100">
                    Achievements
                  </DialogTitle>
                  <p className="text-sm text-slate-400">
                    {unlockedBadges.length} of {allBadges.length} unlocked
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-lg hover:bg-slate-800/50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Overall Progress */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">Overall Progress</span>
                <span className="text-sm font-semibold text-emerald-400">
                  {Math.round((unlockedBadges.length / allBadges.length) * 100)}%
                </span>
              </div>
              <Progress
                value={(unlockedBadges.length / allBadges.length) * 100}
                className="h-2"
              />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
            {/* Unlocked Badges */}
            {unlockedBadges.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-slate-300">
                    Unlocked Achievements
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {unlockedBadges.map((badge, index) => (
                    <motion.div
                      key={badge.id}
                      className="relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                        animate={{
                          x: ['-100%', '100%']
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 3
                        }}
                      />

                      <div className="relative z-10 flex items-start gap-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-2xl flex-shrink-0">
                          {badge.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-amber-100 mb-0.5">
                            {badge.name}
                          </h4>
                          <p className="text-xs text-slate-400 mb-2">
                            {badge.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-amber-400">
                            <Trophy className="w-3 h-3" />
                            <span>Unlocked</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Locked Badges */}
            {lockedBadges.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Lock className="w-4 h-4 text-slate-500" />
                  <h3 className="text-sm font-semibold text-slate-300">
                    Locked Achievements
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lockedBadges.map((badge, index) => (
                    <motion.div
                      key={badge.id}
                      className="relative p-4 rounded-xl bg-slate-950/40 border border-slate-700/50"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: unlockedBadges.length * 0.1 + index * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-slate-800/50 border border-slate-700/50 text-2xl flex-shrink-0 grayscale opacity-50">
                          {badge.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className="font-semibold text-slate-400">
                              {badge.name}
                            </h4>
                            <Lock className="w-3 h-3 text-slate-600" />
                          </div>
                          <p className="text-xs text-slate-500 mb-3">
                            {badge.description}
                          </p>
                          
                          {/* Progress Bar */}
                          {badge.progress > 0 && (
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500">Progress</span>
                                <span className="text-slate-400">
                                  {badge.progress} / {badge.total}
                                </span>
                              </div>
                              <div className="h-1.5 bg-slate-800/50 rounded-full overflow-hidden">
                                <motion.div
                                  className="h-full bg-gradient-to-r from-slate-600 to-slate-500 rounded-full"
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(badge.progress / badge.total) * 100}%` }}
                                  transition={{ duration: 1, delay: 0.5 }}
                                />
                              </div>
                            </div>
                          )}
                          
                          {badge.progress === 0 && (
                            <div className="text-xs text-slate-600">
                              {badge.requirement}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
}

