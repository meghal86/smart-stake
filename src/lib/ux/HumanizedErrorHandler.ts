/**
 * Humanized Error Handler
 * 
 * Extends the existing ErrorHandlingSystem with more human-friendly,
 * encouraging error messages and recovery suggestions.
 * 
 * Requirements: R16.MICROCOPY.HUMANIZED_ERRORS, R16.MICROCOPY.ENCOURAGING, R15.ERROR.CLEAR_MESSAGES
 */

import { toast } from '@/hooks/use-toast';
import { ErrorHandlingSystem, ErrorContext, ErrorSeverity } from './ErrorHandlingSystem';

export interface HumanizedErrorConfig {
  showEncouragement: boolean;
  includeEmojis: boolean;
  suggestActions: boolean;
  personalizeMessages: boolean;
  context?: string;
}

/**
 * Humanized Error Messages with Encouraging Tone
 */
export const HUMANIZED_ERROR_MESSAGES = {
  // Network & Connectivity Errors
  NETWORK_OFFLINE: {
    title: 'You appear to be offline 📡',
    message: 'No worries! We\'re showing your cached data while you reconnect.',
    encouragement: 'Your data is safe and will sync once you\'re back online.',
    action: 'Check your connection and we\'ll get you back on track.'
  },
  NETWORK_SLOW: {
    title: 'Connection seems a bit slow 🐌',
    message: 'Hang tight! We\'re working hard to load your data.',
    encouragement: 'Good things come to those who wait.',
    action: 'Try refreshing if this takes too long.'
  },
  NETWORK_TIMEOUT: {
    title: 'This is taking longer than usual ⏰',
    message: 'Our servers might be busy, but we haven\'t given up on you!',
    encouragement: 'Sometimes the best opportunities are worth waiting for.',
    action: 'Please try again in a moment.'
  },
  NETWORK_UNREACHABLE: {
    title: 'Can\'t reach our servers right now 🌐',
    message: 'It\'s not you, it\'s us! Our servers are having a moment.',
    encouragement: 'We\'ll be back up and running soon.',
    action: 'Check your connection or try again in a few minutes.'
  },

  // Rate Limiting Errors
  RATE_LIMITED: {
    title: 'Whoa, slow down there! ⚡',
    message: 'You\'re moving fast! That\'s the DeFi spirit.',
    encouragement: 'Take a quick breather and we\'ll be ready for you.',
    action: 'Please wait a moment before trying again.'
  },
  TOO_MANY_REQUESTS: {
    title: 'Easy there, speed demon! 🏎️',
    message: 'Your enthusiasm is admirable, but our servers need a breather.',
    encouragement: 'Quality over quantity - let\'s take it one step at a time.',
    action: 'Wait a few seconds and try again.'
  },

  // Wallet Errors
  WALLET_CONNECTION_FAILED: {
    title: 'Wallet connection hiccup! 🔗',
    message: 'Sometimes wallets need a little coaxing to connect.',
    encouragement: 'Don\'t worry, this happens to everyone.',
    action: 'Try connecting again or refresh the page.'
  },
  WALLET_NOT_INSTALLED: {
    title: 'You\'ll need a Web3 wallet! 🦊',
    message: 'Think of it as your passport to the DeFi world.',
    encouragement: 'Once you have one, amazing opportunities await!',
    action: 'Install MetaMask or another wallet to get started.'
  },
  WALLET_WRONG_NETWORK: {
    title: 'Wrong network detected 🌐',
    message: 'You\'re on a different blockchain network.',
    encouragement: 'Easy fix! Just switch to Ethereum Mainnet.',
    action: 'Please switch networks in your wallet.'
  },
  WALLET_SIGNATURE_REJECTED: {
    title: 'No worries! 👍',
    message: 'You chose not to sign that transaction.',
    encouragement: 'Your security-first approach is smart!',
    action: 'Try again when you\'re ready to continue.'
  },
  WALLET_USER_CANCELLED: {
    title: 'Connection cancelled 🚫',
    message: 'You decided not to connect right now.',
    encouragement: 'No pressure! You can connect anytime.',
    action: 'Try again when you\'re ready to explore.'
  },

  // Authentication Errors
  AUTH_EXPIRED: {
    title: 'Your session expired 🔐',
    message: 'Time flies when you\'re exploring DeFi!',
    encouragement: 'A fresh start keeps your account secure.',
    action: 'Please reconnect your wallet to continue.'
  },
  AUTH_UNAUTHORIZED: {
    title: 'Authentication needed 🔑',
    message: 'We need to verify it\'s really you.',
    encouragement: 'Security first - that\'s the DeFi way!',
    action: 'Please sign in to access this feature.'
  },

  // Server Errors
  SERVER_ERROR: {
    title: 'Our servers are having a moment ☕',
    message: 'Even the best systems need a coffee break sometimes.',
    encouragement: 'We\'re working to fix this right away.',
    action: 'Please try again in a few minutes.'
  },
  SERVER_OVERLOADED: {
    title: 'High traffic detected! 🚦',
    message: 'Looks like everyone wants to use AlphaWhale today!',
    encouragement: 'Your patience helps us serve everyone better.',
    action: 'Please wait a moment and try again.'
  },

  // Data Errors
  DATA_FETCH_FAILED: {
    title: 'Couldn\'t load your data this time 📊',
    message: 'Sometimes data gets shy and hides from us.',
    encouragement: 'Don\'t worry, it\'ll come back!',
    action: 'Try refreshing to coax it out of hiding.'
  },
  DATA_PARSE_ERROR: {
    title: 'Data format looks unusual 🤔',
    message: 'The data we received doesn\'t look quite right.',
    encouragement: 'We\'re picky about data quality for your safety.',
    action: 'Please refresh and try again.'
  },
  DATA_STALE: {
    title: 'Your data is a bit outdated 📅',
    message: 'Time to freshen things up!',
    encouragement: 'Fresh data means better decisions.',
    action: 'We\'re refreshing it for you now.'
  },

  // Form & Validation Errors
  VALIDATION_FAILED: {
    title: 'Something doesn\'t look quite right 📝',
    message: 'We\'re pretty picky about getting things perfect.',
    encouragement: 'Double-checking prevents mistakes later!',
    action: 'Please review your input and try again.'
  },
  REQUIRED_FIELD: {
    title: 'We need a bit more info 📋',
    message: 'Some fields are required to keep things working smoothly.',
    encouragement: 'You\'re almost there!',
    action: 'Please fill out the required fields.'
  },
  INVALID_FORMAT: {
    title: 'Format needs a small adjustment 🔧',
    message: 'The format isn\'t quite what we expected.',
    encouragement: 'Getting the format right helps prevent errors.',
    action: 'Please check the format and try again.'
  },

  // Generic Fallbacks
  UNKNOWN_ERROR: {
    title: 'Something unexpected happened 🚀',
    message: 'Even rocket ships have unexpected turbulence sometimes.',
    encouragement: 'Don\'t worry, we\'ll get through this together!',
    action: 'Please try again or refresh the page.'
  },
  TEMPORARY_ISSUE: {
    title: 'Temporary hiccup detected 🛠️',
    message: 'We\'re experiencing a small technical issue.',
    encouragement: 'These things happen, but we fix them fast!',
    action: 'Please try again in a moment.'
  }
} as const;

/**
 * Enhanced Humanized Error Handler
 */
export class HumanizedErrorHandler extends ErrorHandlingSystem {
  private config: HumanizedErrorConfig;

  constructor(config: Partial<HumanizedErrorConfig> = {}) {
    super();
    this.config = {
      showEncouragement: true,
      includeEmojis: true,
      suggestActions: true,
      personalizeMessages: true,
      ...config
    };
  }

  /**
   * Handle error with humanized messaging
   */
  async handleHumanizedError(
    error: Error | string,
    context?: string,
    showToast: boolean = true
  ): Promise<string> {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const humanizedMessage = this.getHumanizedMessage(errorMessage, context);

    if (showToast) {
      this.showHumanizedErrorToast(humanizedMessage);
    }

    // Also handle with the base error system
    if (error instanceof Error) {
      await super.handleApiError(error, { component: context || 'unknown' });
    }

    return humanizedMessage.message;
  }

  /**
   * Get humanized error message
   */
  private getHumanizedMessage(errorMessage: string, context?: string) {
    const lowerMessage = errorMessage.toLowerCase();
    
    // Match error patterns to humanized messages
    let messageKey: keyof typeof HUMANIZED_ERROR_MESSAGES = 'UNKNOWN_ERROR';

    if (lowerMessage.includes('network') || lowerMessage.includes('fetch')) {
      if (lowerMessage.includes('offline')) {
        messageKey = 'NETWORK_OFFLINE';
      } else if (lowerMessage.includes('timeout')) {
        messageKey = 'NETWORK_TIMEOUT';
      } else if (lowerMessage.includes('slow')) {
        messageKey = 'NETWORK_SLOW';
      } else {
        messageKey = 'NETWORK_UNREACHABLE';
      }
    } else if (lowerMessage.includes('rate limit') || lowerMessage.includes('too many')) {
      messageKey = lowerMessage.includes('rate limit') ? 'RATE_LIMITED' : 'TOO_MANY_REQUESTS';
    } else if (lowerMessage.includes('wallet')) {
      if (lowerMessage.includes('not found') || lowerMessage.includes('not installed')) {
        messageKey = 'WALLET_NOT_INSTALLED';
      } else if (lowerMessage.includes('rejected') || lowerMessage.includes('denied')) {
        messageKey = 'WALLET_SIGNATURE_REJECTED';
      } else if (lowerMessage.includes('cancelled') || lowerMessage.includes('canceled')) {
        messageKey = 'WALLET_USER_CANCELLED';
      } else if (lowerMessage.includes('network') || lowerMessage.includes('chain')) {
        messageKey = 'WALLET_WRONG_NETWORK';
      } else {
        messageKey = 'WALLET_CONNECTION_FAILED';
      }
    } else if (lowerMessage.includes('unauthorized') || lowerMessage.includes('auth')) {
      if (lowerMessage.includes('expired')) {
        messageKey = 'AUTH_EXPIRED';
      } else {
        messageKey = 'AUTH_UNAUTHORIZED';
      }
    } else if (lowerMessage.includes('server') || lowerMessage.includes('500')) {
      if (lowerMessage.includes('overload') || lowerMessage.includes('busy')) {
        messageKey = 'SERVER_OVERLOADED';
      } else {
        messageKey = 'SERVER_ERROR';
      }
    } else if (lowerMessage.includes('data')) {
      if (lowerMessage.includes('parse') || lowerMessage.includes('format')) {
        messageKey = 'DATA_PARSE_ERROR';
      } else if (lowerMessage.includes('stale') || lowerMessage.includes('old')) {
        messageKey = 'DATA_STALE';
      } else {
        messageKey = 'DATA_FETCH_FAILED';
      }
    } else if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
      if (lowerMessage.includes('required')) {
        messageKey = 'REQUIRED_FIELD';
      } else if (lowerMessage.includes('format')) {
        messageKey = 'INVALID_FORMAT';
      } else {
        messageKey = 'VALIDATION_FAILED';
      }
    }

    const baseMessage = HUMANIZED_ERROR_MESSAGES[messageKey];
    
    return {
      title: this.config.includeEmojis ? baseMessage.title : baseMessage.title.replace(/[^\w\s]/g, '').trim(),
      message: baseMessage.message,
      encouragement: this.config.showEncouragement ? baseMessage.encouragement : undefined,
      action: this.config.suggestActions ? baseMessage.action : undefined,
      context: context
    };
  }

  /**
   * Show humanized error toast
   */
  private showHumanizedErrorToast(humanizedMessage: {
    title: string;
    message: string;
    encouragement?: string;
    action?: string;
    context?: string;
  }) {
    const description = [
      humanizedMessage.message,
      humanizedMessage.encouragement,
      humanizedMessage.action
    ].filter(Boolean).join(' ');

    toast({
      title: humanizedMessage.title,
      description,
      variant: 'destructive',
      duration: 6000,
      className: "border-red-200 bg-red-50 text-red-900"
    });
  }

  /**
   * Show encouraging retry message
   */
  showRetryEncouragement(attemptNumber: number, maxAttempts: number) {
    const encouragements = [
      'Don\'t give up! 💪 Sometimes the best things take a few tries.',
      'Persistence pays off! 🎯 You\'re getting closer.',
      'Third time\'s the charm! ✨ We believe in you.',
      'Almost there! 🚀 One more try should do it.',
      'You\'ve got this! 🌟 Success is just around the corner.'
    ];

    const encouragement = encouragements[Math.min(attemptNumber - 1, encouragements.length - 1)];
    
    toast({
      title: `Attempt ${attemptNumber} of ${maxAttempts}`,
      description: encouragement,
      variant: 'default',
      duration: 3000
    });
  }

  /**
   * Show success after error recovery
   */
  showRecoverySuccess(context?: string) {
    const successMessages = [
      'Back in business! 🎉 Everything is working smoothly now.',
      'Success! 🌟 We knew you could get through that.',
      'All fixed! ✅ Thanks for your patience.',
      'We\'re back! 🚀 Ready to continue your DeFi journey.',
      'Problem solved! 💫 You\'re all set to keep exploring.'
    ];

    const message = successMessages[Math.floor(Math.random() * successMessages.length)];
    
    toast({
      title: 'Connection Restored!',
      description: message,
      variant: 'success',
      duration: 4000
    });
  }
}

// Global humanized error handler instance
export const humanizedErrorHandler = new HumanizedErrorHandler();

// Helper functions for common error scenarios

/**
 * Handle API error with humanized messaging
 */
export const handleHumanizedApiError = async (
  error: Error,
  context?: string
): Promise<string> => {
  return humanizedErrorHandler.handleHumanizedError(error, context, true);
};

/**
 * Handle form error with humanized messaging
 */
export const handleHumanizedFormError = async (
  error: Error,
  fieldName?: string
): Promise<string> => {
  const context = fieldName ? `${fieldName} field` : 'form';
  return humanizedErrorHandler.handleHumanizedError(error, context, true);
};

/**
 * Handle wallet error with humanized messaging
 */
export const handleHumanizedWalletError = async (
  error: Error
): Promise<string> => {
  return humanizedErrorHandler.handleHumanizedError(error, 'wallet', true);
};

/**
 * Show encouraging message for retry attempts
 */
export const showRetryEncouragement = (attemptNumber: number, maxAttempts: number = 3): void => {
  humanizedErrorHandler.showRetryEncouragement(attemptNumber, maxAttempts);
};

/**
 * Show success message after error recovery
 */
export const showRecoverySuccess = (context?: string): void => {
  humanizedErrorHandler.showRecoverySuccess(context);
};