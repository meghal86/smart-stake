import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface XPData {
  currentXP: number;
  level: number;
  nextLevelXP: number;
  progressPercent: number;
  badges: Badge[];
  totalQuestsCompleted: number;
  weeklyXP: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress?: number;
}

// XP thresholds for each level
const LEVEL_THRESHOLDS = [
  0,    // Level 1
  100,  // Level 2
  250,  // Level 3
  500,  // Level 4
  1000, // Level 5
  2000, // Level 6
  3500, // Level 7
  5500, // Level 8
  8500, // Level 9
  12500 // Level 10
];

// Badge definitions
const BADGE_DEFINITIONS: Badge[] = [
  {
    id: 'first_quest',
    name: 'First Steps',
    description: 'Complete your first quest',
    icon: '🎯'
  },
  {
    id: 'staking_pro',
    name: 'Staking Pro',
    description: 'Complete 10 staking quests',
    icon: '💎'
  },
  {
    id: 'nft_collector',
    name: 'NFT Collector',
    description: 'Complete 5 NFT quests',
    icon: '🖼️'
  },
  {
    id: 'airdrop_hunter',
    name: 'Airdrop Hunter',
    description: 'Claim 15 airdrops',
    icon: '🪂'
  },
  {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reach Level 5',
    icon: '⭐'
  },
  {
    id: 'level_10',
    name: 'Legendary Hunter',
    description: 'Reach Level 10',
    icon: '👑'
  },
  {
    id: 'week_streak_7',
    name: 'Consistent Hunter',
    description: 'Complete quests 7 days in a row',
    icon: '🔥'
  }
];

function calculateLevel(xp: number): { level: number; nextLevelXP: number; progressPercent: number } {
  let level = 1;
  let nextLevelXP = LEVEL_THRESHOLDS[1];
  
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      nextLevelXP = i < LEVEL_THRESHOLDS.length - 1 ? LEVEL_THRESHOLDS[i + 1] : LEVEL_THRESHOLDS[i];
      break;
    }
  }
  
  const currentLevelXP = level > 1 ? LEVEL_THRESHOLDS[level - 1] : 0;
  const xpInCurrentLevel = xp - currentLevelXP;
  const xpNeededForNextLevel = nextLevelXP - currentLevelXP;
  const progressPercent = Math.min((xpInCurrentLevel / xpNeededForNextLevel) * 100, 100);
  
  return { level, nextLevelXP, progressPercent };
}

export function useHunterXP() {
  const { user } = useAuth();
  const [xpData, setXPData] = useState<XPData>({
    currentXP: 0,
    level: 1,
    nextLevelXP: LEVEL_THRESHOLDS[1],
    progressPercent: 0,
    badges: [],
    totalQuestsCompleted: 0,
    weeklyXP: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    loadXPData();
  }, [user]);

  const loadXPData = async () => {
    if (!user) return;

    try {
      // Fetch user's XP and quest data
      const { data: profile, error: profileError } = await supabase
        .from('users_metadata')
        .select('metadata')
        .eq('user_id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading XP data:', profileError);
        setIsLoading(false);
        return;
      }

      const metadata = profile?.metadata || {};
      const currentXP = metadata.hunter_xp || 0;
      const completedQuests = metadata.completed_quests || 0;
      const weeklyXP = metadata.weekly_xp || 0;
      const unlockedBadges = metadata.unlocked_badges || [];

      // Calculate level and progress
      const { level, nextLevelXP, progressPercent } = calculateLevel(currentXP);

      // Map unlocked badges
      const badges = BADGE_DEFINITIONS.map(badge => ({
        ...badge,
        unlockedAt: unlockedBadges.find((b: { id: string; unlockedAt?: Date }) => b.id === badge.id)?.unlockedAt
      })).filter(badge => badge.unlockedAt);

      setXPData({
        currentXP,
        level,
        nextLevelXP,
        progressPercent,
        badges,
        totalQuestsCompleted: completedQuests,
        weeklyXP
      });
    } catch (error) {
      console.error('Error loading XP data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addXP = async (amount: number, reason: string = 'quest_completed') => {
    if (!user) return;

    try {
      const newXP = xpData.currentXP + amount;
      const { level: newLevel } = calculateLevel(newXP);
      const { level: oldLevel } = calculateLevel(xpData.currentXP);

      // Update database
      const { error } = await supabase.rpc('update_hunter_xp', {
        p_user_id: user.id,
        p_xp_amount: amount,
        p_reason: reason
      });

      if (error) throw error;

      // Reload XP data
      await loadXPData();

      // Check for level up
      if (newLevel > oldLevel) {
        return { leveledUp: true, newLevel };
      }

      return { leveledUp: false, newLevel: oldLevel };
    } catch (error) {
      console.error('Error adding XP:', error);
      return { leveledUp: false, newLevel: xpData.level };
    }
  };

  const unlockBadge = async (badgeId: string) => {
    if (!user) return;

    try {
      const badge = BADGE_DEFINITIONS.find(b => b.id === badgeId);
      if (!badge) return;

      const { error } = await supabase.rpc('unlock_hunter_badge', {
        p_user_id: user.id,
        p_badge_id: badgeId
      });

      if (error) throw error;

      await loadXPData();
      return badge;
    } catch (error) {
      console.error('Error unlocking badge:', error);
      return null;
    }
  };

  return {
    xpData,
    isLoading,
    addXP,
    unlockBadge,
    refresh: loadXPData
  };
}




