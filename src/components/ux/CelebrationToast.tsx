/**
 * Celebration Toast Component
 * 
 * Enhanced toast component for celebrations with animations and emojis.
 * Provides delightful moments for key user actions.
 * 
 * Requirements: R16.MICROCOPY.CELEBRATIONS, R16.MICROCOPY.ENCOURAGING
 */

import React from 'react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export interface CelebrationToastProps {
  title: string;
  description?: string;
  emoji?: string;
  variant?: 'success' | 'milestone' | 'achievement';
  duration?: number;
  className?: string;
}

/**
 * Show a celebration toast with enhanced animations
 */
export const showCelebrationToast = ({
  title,
  description,
  emoji = '🎉',
  variant = 'success',
  duration = 4000,
  className
}: CelebrationToastProps) => {
  const celebrationContent = (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 20,
        duration: 0.3 
      }}
      className={cn(
        "flex items-center space-x-3",
        className
      )}
    >
      <motion.div
        initial={{ rotate: 0, scale: 1 }}
        animate={{ 
          rotate: [0, -10, 10, -10, 0],
          scale: [1, 1.2, 1, 1.1, 1]
        }}
        transition={{ 
          duration: 0.6,
          ease: "easeInOut"
        }}
        className="text-2xl"
      >
        {emoji}
      </motion.div>
      
      <div className="flex-1">
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.3 }}
          className="font-semibold text-sm"
        >
          {title}
        </motion.div>
        
        {description && (
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="text-sm opacity-90 mt-1"
          >
            {description}
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  return toast({
    title: celebrationContent,
    variant: 'success',
    duration,
    className: cn(
      "border-green-200 bg-green-50 text-green-900",
      variant === 'milestone' && "border-blue-200 bg-blue-50 text-blue-900",
      variant === 'achievement' && "border-purple-200 bg-purple-50 text-purple-900"
    )
  });
};

/**
 * Celebration Toast Component for direct use
 */
export const CelebrationToast: React.FC<CelebrationToastProps> = (props) => {
  React.useEffect(() => {
    showCelebrationToast(props);
  }, []);

  return null;
};

/**
 * Confetti animation component for major celebrations
 */
export const ConfettiCelebration: React.FC<{
  trigger: boolean;
  onComplete?: () => void;
}> = ({ trigger, onComplete }) => {
  const [isAnimating, setIsAnimating] = React.useState(false);

  React.useEffect(() => {
    if (trigger && !isAnimating) {
      setIsAnimating(true);
      
      // Simple confetti effect using CSS animations
      const confettiElements = Array.from({ length: 20 }, (_, i) => {
        const element = document.createElement('div');
        element.className = 'confetti-piece';
        element.style.cssText = `
          position: fixed;
          top: -10px;
          left: ${Math.random() * 100}vw;
          width: 8px;
          height: 8px;
          background: ${['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'][Math.floor(Math.random() * 5)]};
          animation: confetti-fall ${2 + Math.random() * 2}s linear forwards;
          z-index: 9999;
          pointer-events: none;
        `;
        
        document.body.appendChild(element);
        
        setTimeout(() => {
          element.remove();
        }, 4000);
        
        return element;
      });

      // Add CSS animation if not already present
      if (!document.getElementById('confetti-styles')) {
        const style = document.createElement('style');
        style.id = 'confetti-styles';
        style.textContent = `
          @keyframes confetti-fall {
            0% {
              transform: translateY(-100vh) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }
        `;
        document.head.appendChild(style);
      }

      setTimeout(() => {
        setIsAnimating(false);
        onComplete?.();
      }, 3000);
    }
  }, [trigger, isAnimating, onComplete]);

  return null;
};

/**
 * Preset celebration functions for common scenarios
 */
export const celebrationPresets = {
  walletConnected: (isFirstTime: boolean = false) => 
    showCelebrationToast({
      title: isFirstTime ? 'Wallet Connected!' : 'Welcome back!',
      description: isFirstTime 
        ? 'Welcome to the DeFi universe! Your journey begins now.'
        : 'Ready to explore personalized DeFi opportunities!',
      emoji: '🔗',
      variant: isFirstTime ? 'milestone' : 'success',
      duration: isFirstTime ? 5000 : 3000
    }),

  questJoined: (questName?: string) =>
    showCelebrationToast({
      title: 'Quest Joined!',
      description: questName 
        ? `"${questName}" quest started! Time to earn rewards.`
        : 'Time to earn rewards and learn something new!',
      emoji: '🎯',
      variant: 'success',
      duration: 4000
    }),

  scanCompleted: (risksFound: number) =>
    showCelebrationToast({
      title: risksFound === 0 ? 'All Clear!' : 'Scan Complete!',
      description: risksFound === 0
        ? 'No risks detected - your wallet security looks great!'
        : `Found ${risksFound} item${risksFound > 1 ? 's' : ''} to review. Knowledge is power!`,
      emoji: '🛡️',
      variant: 'success',
      duration: 4000
    }),

  opportunityFound: (count: number = 1) =>
    showCelebrationToast({
      title: 'Opportunity Discovered!',
      description: count === 1
        ? 'We found a personalized DeFi opportunity just for you!'
        : `We found ${count} personalized opportunities just for you!`,
      emoji: '💎',
      variant: 'success',
      duration: 4000
    }),

  milestoneReached: (milestone: string, description?: string) =>
    showCelebrationToast({
      title: `${milestone}!`,
      description: description || 'You\'re making great progress!',
      emoji: '🏆',
      variant: 'milestone',
      duration: 5000
    }),

  achievementUnlocked: (achievement: string, description?: string) =>
    showCelebrationToast({
      title: `Achievement Unlocked!`,
      description: description || `You've earned: ${achievement}`,
      emoji: '🏅',
      variant: 'achievement',
      duration: 5000
    }),

  settingsSaved: () =>
    showCelebrationToast({
      title: 'Settings Saved!',
      description: 'Your preferences have been updated successfully.',
      emoji: '⚙️',
      variant: 'success',
      duration: 3000
    }),

  alertCreated: () =>
    showCelebrationToast({
      title: 'Alert Created!',
      description: 'You\'ll be notified when conditions are met.',
      emoji: '🔔',
      variant: 'success',
      duration: 3000
    })
};

export default CelebrationToast;