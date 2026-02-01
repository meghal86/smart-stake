/**
 * Unit Tests: Quest Progress Tracking
 * 
 * Tests multi-step quest completion logic and XP reward calculation
 * 
 * Requirements: 5.1-5.11
 */

import { describe, test, expect, beforeEach } from 'vitest';

// Mock quest opportunity
interface QuestOpportunity {
  id: string;
  title: string;
  quest_steps: Array<{ step: number; title: string; completed: boolean }>;
  xp_reward: number;
}

// Mock quest progress
interface QuestProgress {
  user_id: string;
  opportunity_id: string;
  wallet_address: string;
  current_step: number;
  completed_steps: number[];
  xp_earned: number;
  started_at: Date;
  completed_at: Date | null;
}

/**
 * Calculate quest completion status
 */
function isQuestCompleted(quest: QuestOpportunity, completedSteps: number[]): boolean {
  return completedSteps.length === quest.quest_steps.length;
}

/**
 * Calculate XP earned based on completed steps
 */
function calculateXpEarned(quest: QuestOpportunity, completedSteps: number[]): number {
  if (isQuestCompleted(quest, completedSteps)) {
    return quest.xp_reward;
  }
  
  // Partial XP: proportional to completed steps
  const completionRatio = completedSteps.length / quest.quest_steps.length;
  return Math.floor(quest.xp_reward * completionRatio);
}

/**
 * Update quest progress
 */
function updateQuestProgress(
  quest: QuestOpportunity,
  currentProgress: QuestProgress,
  newCompletedStep: number
): QuestProgress {
  // Add new step to completed steps if not already there
  const completedSteps = currentProgress.completed_steps.includes(newCompletedStep)
    ? currentProgress.completed_steps
    : [...currentProgress.completed_steps, newCompletedStep].sort((a, b) => a - b);

  // Calculate current step (next incomplete step)
  let currentStep = 0;
  for (let i = 0; i < quest.quest_steps.length; i++) {
    if (!completedSteps.includes(i)) {
      currentStep = i;
      break;
    }
  }

  // If all steps completed, set current_step to last step
  if (completedSteps.length === quest.quest_steps.length) {
    currentStep = quest.quest_steps.length - 1;
  }

  const xpEarned = calculateXpEarned(quest, completedSteps);
  const isCompleted = isQuestCompleted(quest, completedSteps);

  return {
    ...currentProgress,
    current_step: currentStep,
    completed_steps: completedSteps,
    xp_earned: xpEarned,
    completed_at: isCompleted ? new Date() : null,
  };
}

describe('Quest Progress Tracking', () => {
  let mockQuest: QuestOpportunity;
  let mockProgress: QuestProgress;

  beforeEach(() => {
    mockQuest = {
      id: 'quest-1',
      title: 'Base Onchain Summer Quest',
      quest_steps: [
        { step: 0, title: 'Bridge to Base', completed: false },
        { step: 1, title: 'Swap on Uniswap', completed: false },
        { step: 2, title: 'Mint an NFT', completed: false },
        { step: 3, title: 'Provide liquidity', completed: false },
      ],
      xp_reward: 500,
    };

    mockProgress = {
      user_id: 'user-1',
      opportunity_id: 'quest-1',
      wallet_address: '0x1234567890123456789012345678901234567890',
      current_step: 0,
      completed_steps: [],
      xp_earned: 0,
      started_at: new Date(),
      completed_at: null,
    };
  });

  describe('Multi-step quest completion logic', () => {
    test('should mark first step as completed', () => {
      const updated = updateQuestProgress(mockQuest, mockProgress, 0);

      expect(updated.completed_steps).toEqual([0]);
      expect(updated.current_step).toBe(1); // Next step
      expect(updated.completed_at).toBeNull();
    });

    test('should mark multiple steps as completed in order', () => {
      let progress = mockProgress;

      // Complete step 0
      progress = updateQuestProgress(mockQuest, progress, 0);
      expect(progress.completed_steps).toEqual([0]);
      expect(progress.current_step).toBe(1);

      // Complete step 1
      progress = updateQuestProgress(mockQuest, progress, 1);
      expect(progress.completed_steps).toEqual([0, 1]);
      expect(progress.current_step).toBe(2);

      // Complete step 2
      progress = updateQuestProgress(mockQuest, progress, 2);
      expect(progress.completed_steps).toEqual([0, 1, 2]);
      expect(progress.current_step).toBe(3);
    });

    test('should mark quest as completed when all steps done', () => {
      let progress = mockProgress;

      // Complete all steps
      for (let i = 0; i < mockQuest.quest_steps.length; i++) {
        progress = updateQuestProgress(mockQuest, progress, i);
      }

      expect(progress.completed_steps).toEqual([0, 1, 2, 3]);
      expect(progress.completed_at).not.toBeNull();
      expect(progress.xp_earned).toBe(mockQuest.xp_reward);
    });

    test('should handle steps completed out of order', () => {
      let progress = mockProgress;

      // Complete step 2 first (out of order)
      progress = updateQuestProgress(mockQuest, progress, 2);
      expect(progress.completed_steps).toEqual([2]);
      expect(progress.current_step).toBe(0); // Still on step 0 (first incomplete)

      // Complete step 0
      progress = updateQuestProgress(mockQuest, progress, 0);
      expect(progress.completed_steps).toEqual([0, 2]);
      expect(progress.current_step).toBe(1); // Next incomplete step

      // Complete step 1
      progress = updateQuestProgress(mockQuest, progress, 1);
      expect(progress.completed_steps).toEqual([0, 1, 2]);
      expect(progress.current_step).toBe(3); // Next incomplete step
    });

    test('should not duplicate completed steps', () => {
      let progress = mockProgress;

      // Complete step 0
      progress = updateQuestProgress(mockQuest, progress, 0);
      expect(progress.completed_steps).toEqual([0]);

      // Try to complete step 0 again
      progress = updateQuestProgress(mockQuest, progress, 0);
      expect(progress.completed_steps).toEqual([0]); // No duplicate
    });

    test('should handle single-step quest', () => {
      const singleStepQuest: QuestOpportunity = {
        id: 'quest-2',
        title: 'Simple Quest',
        quest_steps: [{ step: 0, title: 'Complete task', completed: false }],
        xp_reward: 100,
      };

      const progress: QuestProgress = {
        user_id: 'user-1',
        opportunity_id: 'quest-2',
        wallet_address: '0x1234567890123456789012345678901234567890',
        current_step: 0,
        completed_steps: [],
        xp_earned: 0,
        started_at: new Date(),
        completed_at: null,
      };

      const updated = updateQuestProgress(singleStepQuest, progress, 0);

      expect(updated.completed_steps).toEqual([0]);
      expect(updated.completed_at).not.toBeNull();
      expect(updated.xp_earned).toBe(100);
    });
  });

  describe('XP reward calculation', () => {
    test('should award full XP when quest is completed', () => {
      const completedSteps = [0, 1, 2, 3];
      const xp = calculateXpEarned(mockQuest, completedSteps);

      expect(xp).toBe(500);
    });

    test('should award partial XP based on completion ratio', () => {
      // 1 of 4 steps = 25%
      let xp = calculateXpEarned(mockQuest, [0]);
      expect(xp).toBe(125); // 500 * 0.25

      // 2 of 4 steps = 50%
      xp = calculateXpEarned(mockQuest, [0, 1]);
      expect(xp).toBe(250); // 500 * 0.5

      // 3 of 4 steps = 75%
      xp = calculateXpEarned(mockQuest, [0, 1, 2]);
      expect(xp).toBe(375); // 500 * 0.75
    });

    test('should award zero XP when no steps completed', () => {
      const xp = calculateXpEarned(mockQuest, []);
      expect(xp).toBe(0);
    });

    test('should floor partial XP to integer', () => {
      const quest: QuestOpportunity = {
        id: 'quest-3',
        title: 'Odd XP Quest',
        quest_steps: [
          { step: 0, title: 'Step 1', completed: false },
          { step: 1, title: 'Step 2', completed: false },
          { step: 2, title: 'Step 3', completed: false },
        ],
        xp_reward: 100,
      };

      // 1 of 3 steps = 33.33%
      const xp = calculateXpEarned(quest, [0]);
      expect(xp).toBe(33); // Floor of 33.33
    });

    test('should handle high XP rewards', () => {
      const highXpQuest: QuestOpportunity = {
        id: 'quest-4',
        title: 'Epic Quest',
        quest_steps: [
          { step: 0, title: 'Step 1', completed: false },
          { step: 1, title: 'Step 2', completed: false },
        ],
        xp_reward: 10000,
      };

      // 1 of 2 steps = 50%
      const xp = calculateXpEarned(highXpQuest, [0]);
      expect(xp).toBe(5000);
    });
  });

  describe('Quest completion status', () => {
    test('should return false when no steps completed', () => {
      const isCompleted = isQuestCompleted(mockQuest, []);
      expect(isCompleted).toBe(false);
    });

    test('should return false when some steps completed', () => {
      const isCompleted = isQuestCompleted(mockQuest, [0, 1]);
      expect(isCompleted).toBe(false);
    });

    test('should return true when all steps completed', () => {
      const isCompleted = isQuestCompleted(mockQuest, [0, 1, 2, 3]);
      expect(isCompleted).toBe(true);
    });

    test('should return true even if steps completed out of order', () => {
      const isCompleted = isQuestCompleted(mockQuest, [3, 1, 0, 2]);
      expect(isCompleted).toBe(true);
    });
  });

  describe('Edge cases', () => {
    test('should handle quest with no steps', () => {
      const emptyQuest: QuestOpportunity = {
        id: 'quest-5',
        title: 'Empty Quest',
        quest_steps: [],
        xp_reward: 0,
      };

      const isCompleted = isQuestCompleted(emptyQuest, []);
      expect(isCompleted).toBe(true); // No steps = completed

      const xp = calculateXpEarned(emptyQuest, []);
      expect(xp).toBe(0);
    });

    test('should handle invalid step indices gracefully', () => {
      let progress = mockProgress;

      // Try to complete step that doesn't exist
      progress = updateQuestProgress(mockQuest, progress, 99);

      // Should add to completed_steps but not affect current_step calculation
      expect(progress.completed_steps).toContain(99);
      expect(progress.current_step).toBe(0); // Still on first step
    });

    test('should handle negative step indices', () => {
      let progress = mockProgress;

      // Try to complete negative step
      progress = updateQuestProgress(mockQuest, progress, -1);

      expect(progress.completed_steps).toContain(-1);
      expect(progress.current_step).toBe(0);
    });
  });
});
