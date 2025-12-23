/**
 * Encouraging Empty State Component
 * 
 * Provides helpful, encouraging empty states with clear next steps
 * instead of negative messaging.
 * 
 * Requirements: R16.MICROCOPY.ENCOURAGING, R11.EMPTY.HELPFUL_MESSAGES, R11.EMPTY.CLEAR_ACTIONS
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Shield, 
  Target, 
  Wallet, 
  Bell, 
  History,
  RefreshCw,
  Filter,
  Plus,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export interface EncouragingEmptyStateProps {
  context: 'opportunities' | 'risks' | 'quests' | 'portfolio' | 'alerts' | 'history';
  variant?: 'first-time' | 'no-matches' | 'all-caught-up' | 'no-data';
  title?: string;
  description?: string;
  actionText?: string;
  actionHint?: string;
  onAction?: () => void;
  onSecondaryAction?: () => void;
  secondaryActionText?: string;
  className?: string;
  showAnimation?: boolean;
}

const contextIcons = {
  opportunities: Search,
  risks: Shield,
  quests: Target,
  portfolio: Wallet,
  alerts: Bell,
  history: History
};

const contextColors = {
  opportunities: 'text-blue-500',
  risks: 'text-green-500',
  quests: 'text-purple-500',
  portfolio: 'text-cyan-500',
  alerts: 'text-yellow-500',
  history: 'text-gray-500'
};

const getDefaultContent = (
  context: EncouragingEmptyStateProps['context'],
  variant: EncouragingEmptyStateProps['variant'] = 'first-time'
) => {
  const contentMap = {
    opportunities: {
      'first-time': {
        title: 'Ready to find your first opportunity?',
        description: 'Connect your wallet and we\'ll scan for personalized DeFi opportunities just for you.',
        actionText: 'Connect Wallet',
        actionHint: 'This unlocks live, personalized results'
      },
      'no-matches': {
        title: 'No matches for those filters',
        description: 'Try adjusting your criteria or clearing filters to see more opportunities.',
        actionText: 'Clear Filters',
        actionHint: 'Broaden your search to find more options'
      },
      'all-caught-up': {
        title: 'All caught up!',
        description: 'No new opportunities right now, but we\'re constantly scanning. Check back soon!',
        actionText: 'Refresh',
        actionHint: 'New opportunities appear regularly'
      }
    },
    risks: {
      'first-time': {
        title: 'No active risks detected',
        description: 'Great news! Your connected wallets look secure. We\'ll keep monitoring for you.',
        actionText: 'Learn More',
        actionHint: 'Discover how Guardian protects you'
      },
      'no-data': {
        title: '✅ All clear!',
        description: 'No security risks found. Your wallets are looking good!',
        actionText: 'Run New Scan',
        actionHint: 'Stay protected with regular scans'
      }
    },
    quests: {
      'first-time': {
        title: 'Your DeFi adventure awaits!',
        description: 'Complete quests to earn rewards and learn about exciting protocols.',
        actionText: 'Explore Quests',
        actionHint: 'Start with beginner-friendly options'
      },
      'all-caught-up': {
        title: 'Quest master in the making!',
        description: 'You\'ve completed all available quests. New adventures coming soon!',
        actionText: 'View Completed',
        actionHint: 'See your achievements and rewards'
      }
    },
    portfolio: {
      'first-time': {
        title: 'Ready to track your DeFi journey?',
        description: 'Connect your wallet to see your portfolio performance and insights.',
        actionText: 'Connect Wallet',
        actionHint: 'Get personalized portfolio analytics'
      },
      'no-data': {
        title: 'Portfolio is empty',
        description: 'Start your DeFi journey by exploring opportunities or connecting more wallets.',
        actionText: 'Find Opportunities',
        actionHint: 'Discover yield farming and staking options'
      }
    },
    alerts: {
      'first-time': {
        title: 'Stay in the loop!',
        description: 'Set up alerts to never miss important portfolio changes or new opportunities.',
        actionText: 'Create Alert',
        actionHint: 'Get notified about price changes and risks'
      },
      'no-data': {
        title: 'All quiet on the DeFi front',
        description: 'No new alerts. Your portfolio is stable and secure.',
        actionText: 'Manage Alerts',
        actionHint: 'Adjust your notification preferences'
      }
    },
    history: {
      'first-time': {
        title: 'Your journey starts here',
        description: 'As you use AlphaWhale, your activity history will appear here.',
        actionText: 'Get Started',
        actionHint: 'Connect wallet or explore features'
      },
      'no-data': {
        title: 'History is in the making',
        description: 'No recent activity. Ready to explore new opportunities?',
        actionText: 'Explore Features',
        actionHint: 'Check Guardian, Hunter, or HarvestPro'
      }
    }
  };

  return contentMap[context]?.[variant] || contentMap[context]?.['first-time'] || {
    title: 'Nothing here yet',
    description: 'But that\'s about to change!',
    actionText: 'Get Started',
    actionHint: 'Take your first step'
  };
};

/**
 * Encouraging Empty State Component
 */
export const EncouragingEmptyState: React.FC<EncouragingEmptyStateProps> = ({
  context,
  variant = 'first-time',
  title,
  description,
  actionText,
  actionHint,
  onAction,
  onSecondaryAction,
  secondaryActionText,
  className,
  showAnimation = true
}) => {
  const defaultContent = getDefaultContent(context, variant);
  const IconComponent = contextIcons[context];
  const iconColor = contextColors[context];

  const finalTitle = title || defaultContent.title;
  const finalDescription = description || defaultContent.description;
  const finalActionText = actionText || defaultContent.actionText;
  const finalActionHint = actionHint || defaultContent.actionHint;

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  const iconVariants = {
    hidden: { scale: 0, rotate: -180 },
    visible: { 
      scale: 1, 
      rotate: 0,
      transition: {
        type: "spring",
        stiffness: 200,
        damping: 15
      }
    }
  };

  return (
    <motion.div
      variants={showAnimation ? containerVariants : undefined}
      initial={showAnimation ? "hidden" : undefined}
      animate={showAnimation ? "visible" : undefined}
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6 max-w-md mx-auto",
        className
      )}
    >
      {/* Icon with animation */}
      <motion.div
        variants={showAnimation ? iconVariants : undefined}
        className={cn(
          "mb-6 p-4 rounded-full bg-gray-50 dark:bg-gray-800",
          iconColor
        )}
      >
        <IconComponent className="w-8 h-8" />
      </motion.div>

      {/* Title */}
      <motion.h3
        variants={showAnimation ? itemVariants : undefined}
        className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3"
      >
        {finalTitle}
      </motion.h3>

      {/* Description */}
      <motion.p
        variants={showAnimation ? itemVariants : undefined}
        className="text-gray-600 dark:text-gray-400 mb-6 leading-relaxed"
      >
        {finalDescription}
      </motion.p>

      {/* Primary Action */}
      {finalActionText && (
        <motion.div
          variants={showAnimation ? itemVariants : undefined}
          className="space-y-3 w-full"
        >
          <Button
            onClick={onAction}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {finalActionText}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>

          {/* Action Hint */}
          {finalActionHint && (
            <motion.p
              variants={showAnimation ? itemVariants : undefined}
              className="text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center"
            >
              <Sparkles className="w-3 h-3 mr-1" />
              {finalActionHint}
            </motion.p>
          )}
        </motion.div>
      )}

      {/* Secondary Action */}
      {secondaryActionText && onSecondaryAction && (
        <motion.div
          variants={showAnimation ? itemVariants : undefined}
          className="mt-4"
        >
          <Button
            variant="ghost"
            onClick={onSecondaryAction}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            {secondaryActionText}
          </Button>
        </motion.div>
      )}

      {/* Contextual Tips */}
      <motion.div
        variants={showAnimation ? itemVariants : undefined}
        className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
          </div>
          <div className="text-left">
            <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">
              {getContextualTip(context, variant).title}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              {getContextualTip(context, variant).description}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

/**
 * Get contextual tips based on empty state context
 */
const getContextualTip = (
  context: EncouragingEmptyStateProps['context'],
  variant: EncouragingEmptyStateProps['variant']
) => {
  const tips = {
    opportunities: {
      'first-time': {
        title: 'Pro Tip',
        description: 'Connecting multiple wallets gives you more comprehensive opportunities and better portfolio insights.'
      },
      'no-matches': {
        title: 'Try This',
        description: 'Adjust your risk tolerance or minimum yield requirements to see more opportunities.'
      },
      'all-caught-up': {
        title: 'Stay Updated',
        description: 'New opportunities appear as market conditions change. Enable notifications to stay informed.'
      }
    },
    risks: {
      'first-time': {
        title: 'Security First',
        description: 'Regular security scans help protect your assets. We recommend scanning weekly.'
      },
      'no-data': {
        title: 'Stay Protected',
        description: 'Your proactive approach to security is paying off. Keep up the good work!'
      }
    },
    quests: {
      'first-time': {
        title: 'Learning Path',
        description: 'Start with basic quests to build your DeFi knowledge, then progress to advanced challenges.'
      },
      'all-caught-up': {
        title: 'Expert Level',
        description: 'You\'ve mastered the available quests! New challenges are added regularly.'
      }
    },
    portfolio: {
      'first-time': {
        title: 'Getting Started',
        description: 'Your portfolio will automatically update as you interact with DeFi protocols.'
      },
      'no-data': {
        title: 'Build Gradually',
        description: 'Start small and diversify across different protocols to build a robust DeFi portfolio.'
      }
    },
    alerts: {
      'first-time': {
        title: 'Smart Monitoring',
        description: 'Set up price alerts and risk notifications to stay on top of your investments.'
      },
      'no-data': {
        title: 'Peace of Mind',
        description: 'No alerts means your portfolio is stable. You can adjust alert sensitivity in settings.'
      }
    },
    history: {
      'first-time': {
        title: 'Track Progress',
        description: 'Your activity history helps you understand your DeFi journey and make better decisions.'
      },
      'no-data': {
        title: 'Ready to Start',
        description: 'Every expert was once a beginner. Take your first step into the DeFi world!'
      }
    }
  };

  return tips[context]?.[variant || 'first-time'] || tips[context]?.['first-time'] || {
    title: 'Keep Going',
    description: 'Every journey starts with a single step.'
  };
};

export default EncouragingEmptyState;