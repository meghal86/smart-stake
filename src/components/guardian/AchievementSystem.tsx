/**
 * Achievement System
 * Gamification with badges, progress tracking, and rewards
 */
import { useState, useEffect } from 'react';
import {
  Shield,
  Crown,
  Zap,
  Flame,
  Eye,
  Star,
  Award,
  TrendingUp,
  Target,
  Lock,
  Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import confetti from 'canvas-confetti';

export type AchievementRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  rarity: AchievementRarity;
  unlocked: boolean;
  unlockedAt?: Date;
  progress: number; // 0-100
  requirement: number; // Total needed
  category: 'security' | 'activity' | 'social' | 'mastery';
}

interface AchievementSystemProps {
  achievements: Achievement[];
  userLevel: number;
  userXP: number;
  nextLevelXP: number;
  onAchievementClick?: (achievement: Achievement) => void;
}

export function AchievementSystem({
  achievements,
  userLevel,
  userXP,
  nextLevelXP,
  onAchievementClick,
}: AchievementSystemProps) {
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showUnlockedModal, setShowUnlockedModal] = useState(false);
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<Achievement | null>(null);

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalCount = achievements.length;
  const completionPercentage = (unlockedCount / totalCount) * 100;

  // Group achievements by category
  const categorizedAchievements = {
    security: achievements.filter((a) => a.category === 'security'),
    activity: achievements.filter((a) => a.category === 'activity'),
    social: achievements.filter((a) => a.category === 'social'),
    mastery: achievements.filter((a) => a.category === 'mastery'),
  };

  // Check for newly unlocked achievements
  useEffect(() => {
    const newlyUnlocked = achievements.find(
      (a) =>
        a.unlocked &&
        a.unlockedAt &&
        Date.now() - a.unlockedAt.getTime() < 3000
    );

    if (newlyUnlocked && !recentlyUnlocked) {
      setRecentlyUnlocked(newlyUnlocked);
      setShowUnlockedModal(true);
      triggerConfetti();
    }
  }, [achievements]);

  return (
    <div className="space-y-6">
      {/* Profile Summary */}
      <div className="glass-card p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <span className="text-2xl font-bold text-white">{userLevel}</span>
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-100">
                  Guardian Level {userLevel}
                </h3>
                <p className="text-sm text-slate-400">
                  {unlockedCount} of {totalCount} achievements unlocked
                </p>
              </div>
            </div>
          </div>

          <Badge
            variant="secondary"
            className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-blue-500/30"
          >
            <Sparkles className="h-3 w-3 mr-1" />
            {completionPercentage.toFixed(0)}% Complete
          </Badge>
        </div>

        {/* XP Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-400">Level Progress</span>
            <span className="text-slate-300 font-medium">
              {userXP} / {nextLevelXP} XP
            </span>
          </div>
          <Progress
            value={(userXP / nextLevelXP) * 100}
            className="h-2 bg-slate-800"
          />
        </div>
      </div>

      {/* Achievement Categories */}
      <div className="space-y-4">
        {Object.entries(categorizedAchievements).map(([category, categoryAchievements]) => (
          <div key={category} className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              {getCategoryIcon(category as unknown)}
              {category}
              <Badge variant="outline" className="ml-auto">
                {categoryAchievements.filter((a) => a.unlocked).length} /{' '}
                {categoryAchievements.length}
              </Badge>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {categoryAchievements.map((achievement) => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  onClick={() => {
                    setSelectedAchievement(achievement);
                    onAchievementClick?.(achievement);
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Achievement Detail Modal */}
      {selectedAchievement && (
        <AchievementDetailModal
          achievement={selectedAchievement}
          open={!!selectedAchievement}
          onOpenChange={(open) => !open && setSelectedAchievement(null)}
        />
      )}

      {/* Unlocked Achievement Celebration Modal */}
      {recentlyUnlocked && (
        <AchievementUnlockedModal
          achievement={recentlyUnlocked}
          open={showUnlockedModal}
          onOpenChange={(open) => {
            setShowUnlockedModal(open);
            if (!open) {
              setTimeout(() => setRecentlyUnlocked(null), 300);
            }
          }}
        />
      )}
    </div>
  );
}

function AchievementCard({
  achievement,
  onClick,
}: {
  achievement: Achievement;
  onClick: () => void;
}) {
  const Icon = achievement.icon;
  const rarityColor = getRarityColor(achievement.rarity);
  const rarityGlow = getRarityGlow(achievement.rarity);

  return (
    <button
      onClick={onClick}
      className={cn(
        'relative p-4 rounded-xl border transition-all hover:scale-105 group',
        achievement.unlocked
          ? `${rarityColor} bg-opacity-10 border-opacity-30 hover:border-opacity-50`
          : 'bg-slate-800/30 border-slate-700 hover:border-slate-600',
        !achievement.unlocked && 'opacity-60 grayscale'
      )}
      style={{
        boxShadow: achievement.unlocked ? rarityGlow : undefined,
      }}
    >
      {/* Rarity Indicator */}
      <div className="absolute top-2 right-2">
        <Badge
          variant="outline"
          className={cn(
            'text-xs px-1.5 py-0 h-5',
            achievement.unlocked ? rarityColor : 'border-slate-600 text-slate-500'
          )}
        >
          {achievement.rarity[0].toUpperCase()}
        </Badge>
      </div>

      {/* Icon */}
      <div
        className={cn(
          'w-12 h-12 rounded-lg flex items-center justify-center mb-3 mx-auto transition-all',
          achievement.unlocked
            ? `${rarityColor} bg-opacity-20 group-hover:scale-110`
            : 'bg-slate-800'
        )}
      >
        {achievement.unlocked ? (
          <Icon className={cn('h-6 w-6', rarityColor.split(' ')[0])} />
        ) : (
          <Lock className="h-6 w-6 text-slate-600" />
        )}
      </div>

      {/* Title */}
      <p
        className={cn(
          'text-sm font-semibold text-center mb-1',
          achievement.unlocked ? 'text-slate-100' : 'text-slate-500'
        )}
      >
        {achievement.title}
      </p>

      {/* Progress Bar (if not unlocked) */}
      {!achievement.unlocked && achievement.progress > 0 && (
        <div className="space-y-1">
          <Progress value={achievement.progress} className="h-1 bg-slate-800" />
          <p className="text-xs text-slate-500 text-center">
            {Math.round(achievement.progress)}%
          </p>
        </div>
      )}

      {/* Unlocked Date */}
      {achievement.unlocked && achievement.unlockedAt && (
        <p className="text-xs text-slate-500 text-center mt-1">
          {achievement.unlockedAt.toLocaleDateString()}
        </p>
      )}
    </button>
  );
}

function AchievementDetailModal({
  achievement,
  open,
  onOpenChange,
}: {
  achievement: Achievement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const Icon = achievement.icon;
  const rarityColor = getRarityColor(achievement.rarity);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900/95 backdrop-blur-xl border-slate-700">
        <DialogHeader>
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            {/* Icon */}
            <div
              className={cn(
                'w-20 h-20 rounded-2xl flex items-center justify-center',
                achievement.unlocked
                  ? `${rarityColor} bg-opacity-20`
                  : 'bg-slate-800'
              )}
            >
              {achievement.unlocked ? (
                <Icon className={cn('h-10 w-10', rarityColor.split(' ')[0])} />
              ) : (
                <Lock className="h-10 w-10 text-slate-600" />
              )}
            </div>

            {/* Title & Rarity */}
            <div>
              <DialogTitle className="text-2xl font-bold mb-2">
                {achievement.title}
              </DialogTitle>
              <Badge
                variant="outline"
                className={cn('text-sm', achievement.unlocked ? rarityColor : 'text-slate-500')}
              >
                {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
              </Badge>
            </div>

            {/* Description */}
            <DialogDescription className="text-center text-slate-300">
              {achievement.description}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Progress/Status */}
        <div className="space-y-4">
          {achievement.unlocked ? (
            <div className="p-4 bg-green-500/10 rounded-lg border border-green-500/20 text-center">
              <p className="text-sm font-medium text-green-400 mb-1">
                ✅ Unlocked!
              </p>
              {achievement.unlockedAt && (
                <p className="text-xs text-slate-400">
                  {achievement.unlockedAt.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Progress</span>
                <span className="text-slate-300 font-medium">
                  {Math.round((achievement.progress / 100) * achievement.requirement)} /{' '}
                  {achievement.requirement}
                </span>
              </div>
              <Progress value={achievement.progress} className="h-2 bg-slate-800" />
            </div>
          )}

          <Button
            variant="outline"
            className="w-full border-slate-700"
            onClick={() => onOpenChange(false)}
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AchievementUnlockedModal({
  achievement,
  open,
  onOpenChange,
}: {
  achievement: Achievement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const Icon = achievement.icon;
  const rarityColor = getRarityColor(achievement.rarity);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-slate-900/95 backdrop-blur-xl border-slate-700">
        <div className="flex flex-col items-center text-center space-y-6 py-6">
          {/* Animated Icon */}
          <div
            className={cn(
              'w-24 h-24 rounded-2xl flex items-center justify-center animate-bounce-in',
              `${rarityColor} bg-opacity-20`
            )}
          >
            <Icon className={cn('h-12 w-12', rarityColor.split(' ')[0])} />
          </div>

          {/* Achievement Unlocked Banner */}
          <div>
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
              Achievement Unlocked!
            </p>
            <h2 className="text-2xl font-bold text-slate-100 mb-2">
              {achievement.title}
            </h2>
            <Badge variant="outline" className={rarityColor}>
              {achievement.rarity.charAt(0).toUpperCase() + achievement.rarity.slice(1)}
            </Badge>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            {achievement.description}
          </p>

          <Button
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            onClick={() => onOpenChange(false)}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Awesome!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function getCategoryIcon(category: Achievement['category']) {
  switch (category) {
    case 'security':
      return <Shield className="h-4 w-4" />;
    case 'activity':
      return <TrendingUp className="h-4 w-4" />;
    case 'social':
      return <Eye className="h-4 w-4" />;
    case 'mastery':
      return <Crown className="h-4 w-4" />;
  }
}

function getRarityColor(rarity: AchievementRarity) {
  switch (rarity) {
    case 'common':
      return 'text-slate-400 border-slate-400';
    case 'uncommon':
      return 'text-green-400 border-green-400';
    case 'rare':
      return 'text-blue-400 border-blue-400';
    case 'epic':
      return 'text-purple-400 border-purple-400';
    case 'legendary':
      return 'text-amber-400 border-amber-400';
  }
}

function getRarityGlow(rarity: AchievementRarity) {
  switch (rarity) {
    case 'common':
      return '0 0 10px rgba(148, 163, 184, 0.3)';
    case 'uncommon':
      return '0 0 15px rgba(74, 222, 128, 0.4)';
    case 'rare':
      return '0 0 20px rgba(96, 165, 250, 0.5)';
    case 'epic':
      return '0 0 25px rgba(192, 132, 252, 0.6)';
    case 'legendary':
      return '0 0 30px rgba(251, 191, 36, 0.7)';
  }
}

function triggerConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;

  const colors = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B'];

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

/**
 * Preset Achievements
 */
export const DEFAULT_ACHIEVEMENTS: Omit<Achievement, 'progress' | 'unlocked' | 'unlockedAt'>[] = [
  {
    id: 'first_scan',
    title: 'Guardian Initiate',
    description: 'Complete your first wallet security scan',
    icon: Shield,
    rarity: 'common',
    requirement: 1,
    category: 'security',
  },
  {
    id: 'perfect_score',
    title: 'Fortress Keeper',
    description: 'Achieve a 100% Trust Score',
    icon: Crown,
    rarity: 'legendary',
    requirement: 1,
    category: 'security',
  },
  {
    id: 'revoke_master',
    title: 'Approval Assassin',
    description: 'Revoke 10+ risky token approvals',
    icon: Zap,
    rarity: 'rare',
    requirement: 10,
    category: 'security',
  },
  {
    id: 'streak_7',
    title: '7-Day Vigilance',
    description: 'Scan your wallet 7 days in a row',
    icon: Flame,
    rarity: 'uncommon',
    requirement: 7,
    category: 'activity',
  },
  {
    id: 'whale_watcher',
    title: 'Whale Watcher',
    description: 'Monitor 5+ different wallets',
    icon: Eye,
    rarity: 'rare',
    requirement: 5,
    category: 'social',
  },
  {
    id: 'quick_responder',
    title: 'Lightning Reflexes',
    description: 'Respond to a critical alert within 5 minutes',
    icon: Zap,
    rarity: 'epic',
    requirement: 1,
    category: 'mastery',
  },
];

