/**
 * Welcome Message Component
 * 
 * Provides contextual welcome messages for returning users
 * with personalized greetings based on user behavior and time.
 * 
 * Requirements: R16.MICROCOPY.ENCOURAGING, R16.MICROCOPY.CELEBRATIONS
 */

import React from 'react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  Sun, 
  Moon, 
  Sunrise, 
  Sunset,
  Star,
  Sparkles,
  Heart,
  Zap,
  Target
} from 'lucide-react';

export interface WelcomeMessageConfig {
  isReturningUser: boolean;
  lastVisit?: Date;
  userActions?: string[];
  personalizedMessage?: string;
  userName?: string;
  streak?: number;
  achievements?: string[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface WelcomeMessageProps extends WelcomeMessageConfig {
  showToast?: boolean;
  showInline?: boolean;
  onDismiss?: () => void;
  className?: string;
}

/**
 * Get time-based greeting
 */
const getTimeBasedGreeting = (timeOfDay?: string) => {
  const hour = new Date().getHours();
  const actualTimeOfDay = timeOfDay || (
    hour < 6 ? 'night' :
    hour < 12 ? 'morning' :
    hour < 18 ? 'afternoon' : 'evening'
  );

  const greetings = {
    morning: {
      emoji: '🌅',
      icon: Sunrise,
      greeting: 'Good morning',
      message: 'Ready to start your DeFi day? Let\'s see what opportunities await.'
    },
    afternoon: {
      emoji: '☀️',
      icon: Sun,
      greeting: 'Good afternoon',
      message: 'Perfect time to check your portfolio and explore new opportunities.'
    },
    evening: {
      emoji: '🌙',
      icon: Moon,
      greeting: 'Good evening',
      message: 'Winding down? Take a moment to review your DeFi progress.'
    },
    night: {
      emoji: '✨',
      icon: Star,
      greeting: 'Working late',
      message: 'The DeFi markets never sleep. What brings you here tonight?'
    }
  };

  return greetings[actualTimeOfDay as keyof typeof greetings] || greetings.morning;
};

/**
 * Generate personalized welcome message
 */
const generateWelcomeMessage = (config: WelcomeMessageConfig) => {
  // Custom message takes priority
  if (config.personalizedMessage) {
    return {
      title: '👋 Welcome back!',
      description: config.personalizedMessage,
      variant: 'personal' as const
    };
  }

  // New user welcome
  if (!config.isReturningUser) {
    return {
      title: '🚀 Welcome to AlphaWhale!',
      description: 'Ready to discover amazing DeFi opportunities? Let\'s get started!',
      variant: 'new-user' as const
    };
  }

  // Calculate days since last visit
  const daysSinceLastVisit = config.lastVisit 
    ? Math.floor((Date.now() - config.lastVisit.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  // Streak-based welcome
  if (config.streak && config.streak >= 3) {
    return {
      title: '🔥 Welcome back, consistent explorer!',
      description: `${config.streak} days in a row! Your dedication to DeFi is impressive.`,
      variant: 'streak' as const
    };
  }

  // Achievement-based welcome
  if (config.achievements && config.achievements.length > 0) {
    const latestAchievement = config.achievements[config.achievements.length - 1];
    return {
      title: '🏆 Welcome back, achiever!',
      description: `Congrats on "${latestAchievement}"! Ready to unlock your next milestone?`,
      variant: 'achievement' as const
    };
  }

  // Time-based welcome messages
  if (daysSinceLastVisit === 0) {
    const timeGreeting = getTimeBasedGreeting(config.timeOfDay);
    return {
      title: `${timeGreeting.emoji} ${timeGreeting.greeting}!`,
      description: timeGreeting.message,
      variant: 'same-day' as const
    };
  } else if (daysSinceLastVisit === 1) {
    return {
      title: '👋 Good to see you again!',
      description: 'Let\'s check what new opportunities await you today.',
      variant: 'yesterday' as const
    };
  } else if (daysSinceLastVisit <= 7) {
    return {
      title: '🎯 Welcome back, explorer!',
      description: `It's been ${daysSinceLastVisit} days. Ready to discover what's new in DeFi?`,
      variant: 'this-week' as const
    };
  } else if (daysSinceLastVisit <= 30) {
    return {
      title: '🌟 Long time no see!',
      description: `Welcome back after ${daysSinceLastVisit} days! The DeFi landscape has been busy.`,
      variant: 'this-month' as const
    };
  } else {
    return {
      title: '🎉 Welcome back, pioneer!',
      description: 'It\'s been a while! So much has changed in DeFi. Ready to catch up?',
      variant: 'long-time' as const
    };
  }
};

/**
 * Show welcome message as toast
 */
export const showWelcomeToast = (config: WelcomeMessageConfig) => {
  const message = generateWelcomeMessage(config);
  
  return toast({
    title: message.title,
    description: message.description,
    variant: 'success',
    duration: 5000,
    className: "border-blue-200 bg-blue-50 text-blue-900"
  });
};

/**
 * Inline Welcome Message Component
 */
export const WelcomeMessage: React.FC<WelcomeMessageProps> = ({
  showToast = false,
  showInline = true,
  onDismiss,
  className,
  ...config
}) => {
  const [isVisible, setIsVisible] = React.useState(showInline);
  const message = generateWelcomeMessage(config);

  // Show toast if requested
  React.useEffect(() => {
    if (showToast) {
      showWelcomeToast(config);
    }
  }, [showToast]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible || !showInline) {
    return null;
  }

  const getVariantStyles = (variant: string) => {
    const styles = {
      'new-user': 'bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200',
      'streak': 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200',
      'achievement': 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200',
      'same-day': 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200',
      'yesterday': 'bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200',
      'this-week': 'bg-gradient-to-r from-cyan-50 to-teal-50 border-cyan-200',
      'this-month': 'bg-gradient-to-r from-teal-50 to-green-50 border-teal-200',
      'long-time': 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200',
      'personal': 'bg-gradient-to-r from-pink-50 to-rose-50 border-pink-200'
    };
    
    return styles[variant as keyof typeof styles] || styles['same-day'];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 25,
        duration: 0.4 
      }}
      className={cn(
        "relative p-4 rounded-lg border shadow-sm mb-6",
        getVariantStyles(message.variant),
        className
      )}
    >
      {/* Background decoration */}
      <div className="absolute top-2 right-2 opacity-20">
        <Sparkles className="w-6 h-6" />
      </div>

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <motion.h3
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg font-semibold text-gray-900 mb-2"
          >
            {message.title}
          </motion.h3>
          
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-700 text-sm leading-relaxed"
          >
            {message.description}
          </motion.p>

          {/* Additional context for returning users */}
          {config.isReturningUser && config.userActions && config.userActions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-3 flex items-center space-x-4 text-xs text-gray-600"
            >
              <div className="flex items-center space-x-1">
                <Target className="w-3 h-3" />
                <span>Last action: {config.userActions[config.userActions.length - 1]}</span>
              </div>
              
              {config.streak && config.streak > 1 && (
                <div className="flex items-center space-x-1">
                  <Zap className="w-3 h-3" />
                  <span>{config.streak} day streak</span>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Dismiss button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          onClick={handleDismiss}
          className="ml-4 p-1 rounded-full hover:bg-white/50 transition-colors"
          aria-label="Dismiss welcome message"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>
      </div>

      {/* Animated accent line */}
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
        className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
      />
    </motion.div>
  );
};

/**
 * Hook for managing welcome messages
 */
export const useWelcomeMessage = () => {
  const [hasShownWelcome, setHasShownWelcome] = React.useState(false);

  const showWelcome = React.useCallback((config: WelcomeMessageConfig) => {
    if (!hasShownWelcome) {
      showWelcomeToast(config);
      setHasShownWelcome(true);
    }
  }, [hasShownWelcome]);

  const resetWelcome = React.useCallback(() => {
    setHasShownWelcome(false);
  }, []);

  return {
    showWelcome,
    resetWelcome,
    hasShownWelcome
  };
};

export default WelcomeMessage;