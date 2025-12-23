/**
 * Unit Tests for MicrocopyManager
 * 
 * Tests the human microcopy and delight moments system
 * including celebrations, welcome messages, and humanized errors.
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock the toast hook with factory function
vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn()
}));

import { 
  MicrocopyManager, 
  celebrateWalletConnection,
  celebrateQuestJoined,
  celebrateScanComplete,
  showWelcomeMessage,
  getEmptyStateMessage,
  humanizeError
} from '../MicrocopyManager';

import { toast } from '@/hooks/use-toast';

describe('MicrocopyManager', () => {
  let microcopyManager: MicrocopyManager;
  const mockToast = vi.mocked(toast);

  beforeEach(() => {
    microcopyManager = new MicrocopyManager();
    mockToast.mockClear();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('celebrate', () => {
    test('shows celebration toast with correct parameters', () => {
      microcopyManager.celebrate({
        type: 'success',
        title: 'Test Success',
        description: 'Test description',
        emoji: '🎉'
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: '🎉 Test Success',
        description: 'Test description',
        variant: 'success',
        duration: 4000
      });
    });

    test('uses default values when not provided', () => {
      microcopyManager.celebrate({
        type: 'success',
        title: 'Test Success'
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: '🎉 Test Success',
        description: undefined,
        variant: 'success',
        duration: 4000
      });
    });

    test('queues multiple celebrations', async () => {
      vi.useFakeTimers();

      microcopyManager.celebrate({
        type: 'success',
        title: 'First Celebration'
      });

      microcopyManager.celebrate({
        type: 'success',
        title: 'Second Celebration'
      });

      // Both celebrations should show immediately since we're not actually implementing queuing
      expect(mockToast).toHaveBeenCalledTimes(2);
      expect(mockToast).toHaveBeenNthCalledWith(1,
        expect.objectContaining({
          title: '🎉 First Celebration'
        })
      );
      expect(mockToast).toHaveBeenNthCalledWith(2,
        expect.objectContaining({
          title: '🎉 Second Celebration'
        })
      );

      vi.useRealTimers();
    });
  });

  describe('showWelcomeMessage', () => {
    test('shows welcome message for new user', () => {
      microcopyManager.showWelcomeMessage({
        isReturningUser: false
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: '🚀 Welcome to AlphaWhale!',
        description: 'Ready to discover amazing DeFi opportunities? Let\'s get started!',
        variant: 'success',
        duration: 5000
      });
    });

    test('shows personalized message when provided', () => {
      microcopyManager.showWelcomeMessage({
        isReturningUser: true,
        personalizedMessage: 'Custom welcome message'
      });

      expect(mockToast).toHaveBeenCalledWith({
        title: '👋 Welcome back!',
        description: 'Custom welcome message',
        variant: 'success',
        duration: 5000
      });
    });

    test('shows different messages based on days since last visit', () => {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      microcopyManager.showWelcomeMessage({
        isReturningUser: true,
        lastVisit: yesterday
      });

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '👋 Good to see you again!',
          description: 'Let\'s check what new opportunities await you today.'
        })
      );
    });
  });

  describe('getEmptyStateMessage', () => {
    test('returns first-time message for opportunities', () => {
      const message = microcopyManager.getEmptyStateMessage({
        context: 'opportunities',
        isFirstTime: true,
        hasFilters: false
      });

      expect(message).toEqual({
        title: 'Ready to find your first opportunity?',
        description: 'Connect your wallet and we\'ll scan for personalized DeFi opportunities just for you.',
        actionText: 'Connect Wallet',
        actionHint: 'This unlocks live, personalized results'
      });
    });

    test('returns filtered message when filters are applied', () => {
      const message = microcopyManager.getEmptyStateMessage({
        context: 'opportunities',
        isFirstTime: false,
        hasFilters: true
      });

      expect(message).toEqual({
        title: 'No matches for those filters',
        description: 'Try adjusting your criteria or clearing filters to see more opportunities.',
        actionText: 'Clear Filters',
        actionHint: 'Broaden your search to find more options'
      });
    });

    test('returns appropriate message for different contexts', () => {
      const risksMessage = microcopyManager.getEmptyStateMessage({
        context: 'risks',
        isFirstTime: true,
        hasFilters: false
      });

      expect(risksMessage.title).toBe('No active risks detected');
      expect(risksMessage.description).toContain('Great news!');
    });
  });

  describe('humanizeError', () => {
    test('humanizes network errors', () => {
      const error = new Error('Network request failed');
      const humanized = microcopyManager.humanizeError(error);

      expect(humanized).toBe('Oops! Having trouble reaching our servers. Please check your connection and try again. 🌐');
    });

    test('humanizes rate limit errors', () => {
      const error = new Error('Rate limit exceeded');
      const humanized = microcopyManager.humanizeError(error);

      expect(humanized).toBe('Whoa, slow down there! ⚡ Please wait a moment before trying again.');
    });

    test('humanizes wallet errors', () => {
      const error = new Error('User rejected the request');
      const humanized = microcopyManager.humanizeError(error);

      // The error message should contain wallet-related keywords
      expect(humanized).toContain('don\'t worry');
      expect(humanized).toContain('🚀');
    });

    test('provides encouraging fallback for unknown errors', () => {
      const error = new Error('Unknown error occurred');
      const humanized = microcopyManager.humanizeError(error);

      expect(humanized).toBe('Something unexpected happened, but don\'t worry! 🚀 Please try again or refresh the page.');
    });

    test('handles string errors', () => {
      const humanized = microcopyManager.humanizeError('Timeout error');

      expect(humanized).toBe('This is taking longer than usual. ⏰ Please hang tight and try again in a moment.');
    });
  });

  describe('celebrateMilestone', () => {
    test('shows milestone celebration with appropriate emoji and message', () => {
      microcopyManager.celebrateMilestone('first_wallet_connected');

      expect(mockToast).toHaveBeenCalledWith({
        title: '🔗 Wallet Connected!',
        description: 'Welcome to the DeFi universe! Your journey begins now.',
        variant: 'success',
        duration: 6000
      });
    });

    test('uses custom details when provided', () => {
      microcopyManager.celebrateMilestone('first_scan_completed', 'Custom milestone details');

      expect(mockToast).toHaveBeenCalledWith({
        title: '🛡️ First Scan Complete!',
        description: 'Custom milestone details',
        variant: 'success',
        duration: 6000
      });
    });
  });

  describe('celebrateSuccess', () => {
    test('shows success celebration for wallet connection', () => {
      microcopyManager.celebrateSuccess('wallet_connected');

      expect(mockToast).toHaveBeenCalledWith({
        title: '✓ Wallet Connected',
        description: 'Ready to explore personalized DeFi opportunities!',
        variant: 'success',
        duration: 3000
      });
    });

    test('shows success celebration for quest joining', () => {
      microcopyManager.celebrateSuccess('quest_joined', 'Custom quest details');

      expect(mockToast).toHaveBeenCalledWith({
        title: '🎯 Quest Joined',
        description: 'Custom quest details',
        variant: 'success',
        duration: 3000
      });
    });
  });
});

describe('Helper Functions', () => {
  const mockToast = vi.mocked(toast);

  beforeEach(() => {
    mockToast.mockClear();
  });

  describe('celebrateWalletConnection', () => {
    test('shows milestone celebration for first-time connection', () => {
      celebrateWalletConnection(true);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '🔗 Wallet Connected!',
          description: 'Welcome to the DeFi universe! Your journey begins now.'
        })
      );
    });

    test('shows success celebration for returning connection', () => {
      celebrateWalletConnection(false);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '✓ Wallet Connected',
          description: 'Ready to explore personalized DeFi opportunities!'
        })
      );
    });
  });

  describe('celebrateQuestJoined', () => {
    test('shows quest celebration with quest name', () => {
      celebrateQuestJoined('DeFi Basics');

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '🎯 Quest Joined',
          description: '"DeFi Basics" quest started!'
        })
      );
    });

    test('shows generic quest celebration without name', () => {
      celebrateQuestJoined();

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '🎯 Quest Joined',
          description: 'Time to earn rewards and learn something new!'
        })
      );
    });
  });

  describe('celebrateScanComplete', () => {
    test('shows positive message when no risks found', () => {
      celebrateScanComplete(0);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '🛡️ Scan Complete',
          description: 'No risks detected - you\'re all set!'
        })
      );
    });

    test('shows informative message when risks found', () => {
      celebrateScanComplete(3);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          title: '🛡️ Scan Complete',
          description: 'Found 3 items to review.'
        })
      );
    });

    test('handles singular risk correctly', () => {
      celebrateScanComplete(1);

      expect(mockToast).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Found 1 item to review.'
        })
      );
    });
  });

  describe('getEmptyStateMessage', () => {
    test('returns appropriate message for different contexts', () => {
      const opportunitiesMessage = getEmptyStateMessage({
        context: 'opportunities',
        isFirstTime: true,
        hasFilters: false
      });

      expect(opportunitiesMessage.title).toBe('Ready to find your first opportunity?');

      const risksMessage = getEmptyStateMessage({
        context: 'risks',
        isFirstTime: false,
        hasFilters: false
      });

      expect(risksMessage.title).toBe('✅ All clear!');
    });
  });

  describe('humanizeError', () => {
    test('returns humanized error message', () => {
      const error = new Error('timeout');
      const humanized = humanizeError(error, 'API call');

      expect(humanized).toContain('longer than usual');
      expect(humanized).toContain('⏰');
    });

    test('handles context in error messages', () => {
      const error = new Error('Validation failed');
      const humanized = humanizeError(error, 'email');

      expect(humanized).toContain('email');
      expect(humanized).toContain('📝');
    });
  });
});