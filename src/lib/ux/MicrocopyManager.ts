/**
 * Human Microcopy & Delight Moments Manager
 * 
 * Provides celebration states, humanized error messages, contextual welcome messages,
 * and encouraging copy throughout the application.
 * 
 * Requirements: R16.MICROCOPY.CELEBRATIONS, R16.MICROCOPY.HUMANIZED_ERRORS, R16.MICROCOPY.ENCOURAGING
 */

import { toast } from '@/hooks/use-toast';

export interface CelebrationConfig {
  type: 'success' | 'milestone' | 'welcome' | 'achievement';
  title: string;
  description?: string;
  emoji?: string;
  duration?: number;
  sound?: boolean;
}

export interface WelcomeMessageConfig {
  isReturningUser: boolean;
  lastVisit?: Date;
  userActions?: string[];
  personalizedMessage?: string;
}

export interface EmptyStateConfig {
  context: 'opportunities' | 'risks' | 'quests' | 'portfolio' | 'alerts' | 'history';
  isFirstTime: boolean;
  hasFilters: boolean;
  suggestedActions?: string[];
}

/**
 * Microcopy Manager for Human-Friendly UX
 * 
 * Centralizes all user-facing copy to ensure consistent, encouraging,
 * and delightful messaging throughout the application.
 */
export class MicrocopyManager {
  private celebrationQueue: CelebrationConfig[] = [];
  private isProcessingCelebrations = false;

  /**
   * Show celebration for key user actions
   */
  celebrate(config: CelebrationConfig): void {
    const celebration: CelebrationConfig = {
      duration: 4000,
      sound: false,
      ...config
    };

    // Add to queue to prevent overwhelming the user
    this.celebrationQueue.push(celebration);
    this.processCelebrationQueue();
  }

  /**
   * Show contextual welcome message for returning users
   */
  showWelcomeMessage(config: WelcomeMessageConfig): void {
    const message = this.generateWelcomeMessage(config);
    
    toast({
      title: message.title,
      description: message.description,
      variant: 'success',
      duration: 5000
    });
  }

  /**
   * Get encouraging empty state copy
   */
  getEmptyStateMessage(config: EmptyStateConfig): {
    title: string;
    description: string;
    actionText?: string;
    actionHint?: string;
  } {
    return this.generateEmptyStateMessage(config);
  }

  /**
   * Get humanized error message with encouraging tone
   */
  humanizeError(error: Error | string, context?: string): string {
    const errorMessage = typeof error === 'string' ? error : error.message;
    return this.generateHumanizedError(errorMessage, context);
  }

  /**
   * Show milestone achievement celebration
   */
  celebrateMilestone(milestone: string, details?: string): void {
    this.celebrate({
      type: 'milestone',
      title: this.getMilestoneTitle(milestone),
      description: details || this.getMilestoneDescription(milestone),
      emoji: this.getMilestoneEmoji(milestone),
      duration: 6000
    });
  }

  /**
   * Show success action celebration
   */
  celebrateSuccess(action: string, details?: string): void {
    this.celebrate({
      type: 'success',
      title: this.getSuccessTitle(action),
      description: details || this.getSuccessDescription(action),
      emoji: this.getSuccessEmoji(action),
      duration: 3000
    });
  }

  /**
   * Show achievement unlock celebration
   */
  celebrateAchievement(achievement: string, details?: string): void {
    this.celebrate({
      type: 'achievement',
      title: `🎉 ${achievement}`,
      description: details || 'Great job! Keep up the excellent work.',
      duration: 5000
    });
  }

  // Private methods

  private async processCelebrationQueue(): Promise<void> {
    if (this.isProcessingCelebrations || this.celebrationQueue.length === 0) {
      return;
    }

    this.isProcessingCelebrations = true;

    while (this.celebrationQueue.length > 0) {
      const celebration = this.celebrationQueue.shift()!;
      
      toast({
        title: `${celebration.emoji || '🎉'} ${celebration.title}`,
        description: celebration.description,
        variant: 'success',
        duration: celebration.duration
      });

      // Wait between celebrations to avoid overwhelming
      if (this.celebrationQueue.length > 0) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }
    }

    this.isProcessingCelebrations = false;
  }

  private generateWelcomeMessage(config: WelcomeMessageConfig): {
    title: string;
    description: string;
  } {
    if (config.personalizedMessage) {
      return {
        title: '👋 Welcome back!',
        description: config.personalizedMessage
      };
    }

    if (!config.isReturningUser) {
      return {
        title: '🚀 Welcome to AlphaWhale!',
        description: 'Ready to discover amazing DeFi opportunities? Let\'s get started!'
      };
    }

    const daysSinceLastVisit = config.lastVisit 
      ? Math.floor((Date.now() - config.lastVisit.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    if (daysSinceLastVisit === 0) {
      return {
        title: '👋 Welcome back!',
        description: 'Ready to continue where you left off?'
      };
    } else if (daysSinceLastVisit === 1) {
      return {
        title: '👋 Good to see you again!',
        description: 'Let\'s check what new opportunities await you today.'
      };
    } else if (daysSinceLastVisit <= 7) {
      return {
        title: '🎯 Welcome back, explorer!',
        description: `It's been ${daysSinceLastVisit} days. Ready to discover what's new?`
      };
    } else {
      return {
        title: '🌟 Long time no see!',
        description: 'Welcome back! The DeFi landscape has been busy while you were away.'
      };
    }
  }

  private generateEmptyStateMessage(config: EmptyStateConfig): {
    title: string;
    description: string;
    actionText?: string;
    actionHint?: string;
  } {
    const messages = {
      opportunities: {
        firstTime: {
          title: 'Ready to find your first opportunity?',
          description: 'Connect your wallet and we\'ll scan for personalized DeFi opportunities just for you.',
          actionText: 'Connect Wallet',
          actionHint: 'This unlocks live, personalized results'
        },
        withFilters: {
          title: 'No matches for those filters',
          description: 'Try adjusting your criteria or clearing filters to see more opportunities.',
          actionText: 'Clear Filters',
          actionHint: 'Broaden your search to find more options'
        },
        default: {
          title: 'All caught up!',
          description: 'No new opportunities right now, but we\'re constantly scanning. Check back soon!',
          actionText: 'Refresh',
          actionHint: 'New opportunities appear regularly'
        }
      },
      risks: {
        firstTime: {
          title: 'No active risks detected',
          description: 'Great news! Your connected wallets look secure. We\'ll keep monitoring for you.',
          actionText: 'Learn More',
          actionHint: 'Discover how Guardian protects you'
        },
        default: {
          title: '✅ All clear!',
          description: 'No security risks found. Your wallets are looking good!',
          actionText: 'Run New Scan',
          actionHint: 'Stay protected with regular scans'
        }
      },
      quests: {
        firstTime: {
          title: 'Your DeFi adventure awaits!',
          description: 'Complete quests to earn rewards and learn about exciting protocols.',
          actionText: 'Explore Quests',
          actionHint: 'Start with beginner-friendly options'
        },
        default: {
          title: 'Quest master in the making!',
          description: 'You\'ve completed all available quests. New adventures coming soon!',
          actionText: 'View Completed',
          actionHint: 'See your achievements and rewards'
        }
      },
      portfolio: {
        firstTime: {
          title: 'Ready to track your DeFi journey?',
          description: 'Connect your wallet to see your portfolio performance and insights.',
          actionText: 'Connect Wallet',
          actionHint: 'Get personalized portfolio analytics'
        },
        default: {
          title: 'Portfolio is empty',
          description: 'Start your DeFi journey by exploring opportunities or connecting more wallets.',
          actionText: 'Find Opportunities',
          actionHint: 'Discover yield farming and staking options'
        }
      },
      alerts: {
        firstTime: {
          title: 'Stay in the loop!',
          description: 'Set up alerts to never miss important portfolio changes or new opportunities.',
          actionText: 'Create Alert',
          actionHint: 'Get notified about price changes and risks'
        },
        default: {
          title: 'All quiet on the DeFi front',
          description: 'No new alerts. Your portfolio is stable and secure.',
          actionText: 'Manage Alerts',
          actionHint: 'Adjust your notification preferences'
        }
      },
      history: {
        firstTime: {
          title: 'Your journey starts here',
          description: 'As you use AlphaWhale, your activity history will appear here.',
          actionText: 'Get Started',
          actionHint: 'Connect wallet or explore features'
        },
        default: {
          title: 'History is in the making',
          description: 'No recent activity. Ready to explore new opportunities?',
          actionText: 'Explore Features',
          actionHint: 'Check Guardian, Hunter, or HarvestPro'
        }
      }
    };

    const contextMessages = messages[config.context];
    
    if (config.isFirstTime && contextMessages.firstTime) {
      return contextMessages.firstTime;
    }
    
    if (config.hasFilters && contextMessages.withFilters) {
      return contextMessages.withFilters;
    }
    
    return contextMessages.default;
  }

  private generateHumanizedError(errorMessage: string, context?: string): string {
    const lowerMessage = errorMessage.toLowerCase();

    // Network and connectivity errors
    if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('connection')) {
      return 'Oops! Having trouble reaching our servers. Please check your connection and try again. 🌐';
    }

    // Rate limiting
    if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many requests')) {
      return 'Whoa, slow down there! ⚡ Please wait a moment before trying again.';
    }

    // Timeout errors
    if (lowerMessage.includes('timeout')) {
      return 'This is taking longer than usual. ⏰ Please hang tight and try again in a moment.';
    }

    // Wallet errors
    if (lowerMessage.includes('wallet') || lowerMessage.includes('metamask')) {
      if (lowerMessage.includes('rejected') || lowerMessage.includes('denied')) {
        return 'No worries! 👍 Please try again when you\'re ready to continue.';
      }
      if (lowerMessage.includes('not found') || lowerMessage.includes('not installed')) {
        return 'Looks like you need a Web3 wallet! 🦊 Please install MetaMask or another wallet to get started.';
      }
      return 'Wallet connection hiccup! 🔗 Please try connecting again or refresh the page.';
    }

    // Authentication errors
    if (lowerMessage.includes('unauthorized') || lowerMessage.includes('auth')) {
      return 'Your session expired. 🔐 Please reconnect your wallet to continue your journey.';
    }

    // Server errors
    if (lowerMessage.includes('500') || lowerMessage.includes('server')) {
      return 'Our servers are having a moment. ☕ Please try again in a few minutes.';
    }

    // Validation errors
    if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
      return context 
        ? `Please double-check your ${context} and try again. 📝`
        : 'Something doesn\'t look quite right. Please check your input and try again. 📝';
    }

    // Generic fallback with encouraging tone
    return 'Something unexpected happened, but don\'t worry! 🚀 Please try again or refresh the page.';
  }

  private getMilestoneTitle(milestone: string): string {
    const titles: Record<string, string> = {
      'first_wallet_connected': 'Wallet Connected!',
      'first_scan_completed': 'First Scan Complete!',
      'first_opportunity_found': 'Opportunity Discovered!',
      'first_quest_joined': 'Quest Joined!',
      'portfolio_milestone': 'Portfolio Milestone!',
      'security_achievement': 'Security Achievement!',
      'learning_milestone': 'Learning Milestone!'
    };
    
    return titles[milestone] || 'Milestone Achieved!';
  }

  private getMilestoneDescription(milestone: string): string {
    const descriptions: Record<string, string> = {
      'first_wallet_connected': 'Welcome to the DeFi universe! Your journey begins now.',
      'first_scan_completed': 'Great job! You\'ve taken your first step toward DeFi security.',
      'first_opportunity_found': 'Exciting! We found personalized opportunities just for you.',
      'first_quest_joined': 'Adventure awaits! Complete quests to earn rewards and learn.',
      'portfolio_milestone': 'Your DeFi portfolio is growing! Keep up the great work.',
      'security_achievement': 'You\'re becoming a security pro! Your wallet is well-protected.',
      'learning_milestone': 'Knowledge is power! You\'re mastering DeFi concepts.'
    };
    
    return descriptions[milestone] || 'You\'re making great progress!';
  }

  private getMilestoneEmoji(milestone: string): string {
    const emojis: Record<string, string> = {
      'first_wallet_connected': '🔗',
      'first_scan_completed': '🛡️',
      'first_opportunity_found': '💎',
      'first_quest_joined': '🎯',
      'portfolio_milestone': '📈',
      'security_achievement': '🔒',
      'learning_milestone': '🎓'
    };
    
    return emojis[milestone] || '🎉';
  }

  private getSuccessTitle(action: string): string {
    const titles: Record<string, string> = {
      'wallet_connected': 'Wallet Connected',
      'quest_joined': 'Quest Joined',
      'scan_completed': 'Scan Complete',
      'opportunity_saved': 'Opportunity Saved',
      'alert_created': 'Alert Created',
      'settings_saved': 'Settings Saved',
      'portfolio_updated': 'Portfolio Updated'
    };
    
    return titles[action] || 'Success';
  }

  private getSuccessDescription(action: string): string {
    const descriptions: Record<string, string> = {
      'wallet_connected': 'Ready to explore personalized DeFi opportunities!',
      'quest_joined': 'Time to earn rewards and learn something new!',
      'scan_completed': 'Your wallet security has been analyzed.',
      'opportunity_saved': 'We\'ll keep track of this opportunity for you.',
      'alert_created': 'You\'ll be notified when conditions are met.',
      'settings_saved': 'Your preferences have been updated.',
      'portfolio_updated': 'Your portfolio data is now up to date.'
    };
    
    return descriptions[action] || 'Action completed successfully!';
  }

  private getSuccessEmoji(action: string): string {
    const emojis: Record<string, string> = {
      'wallet_connected': '✓',
      'quest_joined': '🎯',
      'scan_completed': '🛡️',
      'opportunity_saved': '💾',
      'alert_created': '🔔',
      'settings_saved': '⚙️',
      'portfolio_updated': '📊'
    };
    
    return emojis[action] || '✓';
  }
}

// Global microcopy manager instance
export const microcopyManager = new MicrocopyManager();

// Helper functions for common scenarios

/**
 * Show celebration for wallet connection
 */
export const celebrateWalletConnection = (isFirstTime: boolean = false): void => {
  if (isFirstTime) {
    microcopyManager.celebrateMilestone('first_wallet_connected');
  } else {
    microcopyManager.celebrateSuccess('wallet_connected');
  }
};

/**
 * Show celebration for quest joining
 */
export const celebrateQuestJoined = (questName?: string): void => {
  microcopyManager.celebrateSuccess('quest_joined', 
    questName ? `"${questName}" quest started!` : undefined
  );
};

/**
 * Show celebration for scan completion
 */
export const celebrateScanComplete = (risksFound: number): void => {
  if (risksFound === 0) {
    microcopyManager.celebrateSuccess('scan_completed', 'No risks detected - you\'re all set!');
  } else {
    microcopyManager.celebrateSuccess('scan_completed', `Found ${risksFound} item${risksFound > 1 ? 's' : ''} to review.`);
  }
};

/**
 * Show welcome message for returning users
 */
export const showWelcomeMessage = (config: WelcomeMessageConfig): void => {
  microcopyManager.showWelcomeMessage(config);
};

/**
 * Get encouraging empty state message
 */
export const getEmptyStateMessage = (config: EmptyStateConfig) => {
  return microcopyManager.getEmptyStateMessage(config);
};

/**
 * Get humanized error message
 */
export const humanizeError = (error: Error | string, context?: string): string => {
  return microcopyManager.humanizeError(error, context);
};

/**
 * Celebrate achievement unlock
 */
export const celebrateAchievement = (achievement: string, details?: string): void => {
  microcopyManager.celebrateAchievement(achievement, details);
};

/**
 * Celebrate milestone reached
 */
export const celebrateMilestone = (milestone: string, details?: string): void => {
  microcopyManager.celebrateMilestone(milestone, details);
};