/**
 * Gated Button Integration Tests
 * 
 * Tests for the GatedButton component integration with Action Gating system
 * Validates requirements R8.GATING.DISABLED_TOOLTIPS, R8.GATING.WALLET_REQUIRED, R8.GATING.LOADING_STATES
 * 
 * @see .kiro/specs/ux-gap-requirements/requirements.md - Requirement 8
 * @see .kiro/specs/ux-gap-requirements/design.md - Action Gating & Prerequisites System
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { TooltipProvider } from '@/components/ui/tooltip';
import { 
  GatedButton, 
  WalletGatedButton, 
  ApprovalGatedButton, 
  BalanceGatedButton 
} from '../GatedButton';

// Mock the ActionGatingManager
vi.mock('@/lib/ux/ActionGatingManager', () => ({
  useActionGating: vi.fn(),
  ActionGatingManager: vi.fn(),
  actionGatingManager: {
    updateWalletState: vi.fn(),
    evaluateAction: vi.fn(),
  },
}));

// Mock wallet context
vi.mock('@/contexts/WalletContext', () => ({
  useWallet: () => ({
    activeWallet: null,
    connectedWallets: [],
    isLoading: false,
  }),
}));

const { useActionGating } = await import('@/lib/ux/ActionGatingManager');

const renderWithTooltip = (component: React.ReactElement) => {
  return render(
    <TooltipProvider>
      {component}
    </TooltipProvider>
  );
};

describe('GatedButton', () => {
  const mockUseActionGating = useActionGating as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Wallet Connection Gating', () => {
    test('should be disabled when wallet is not connected', () => {
      mockUseActionGating.mockReturnValue({
        enabled: false,
        loading: false,
        disabledReason: 'Connect your wallet to continue',
        prerequisites: [
          {
            id: 'wallet-connection',
            type: 'wallet',
            required: true,
            met: false,
            message: 'Connect your wallet to continue',
          }
        ],
        updateLoading: vi.fn(),
        updateProgress: vi.fn(),
      });

      renderWithTooltip(
        <WalletGatedButton>
          Execute Action
        </WalletGatedButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
      expect(button).toHaveClass('opacity-50');
    });

    test('should be enabled when wallet is connected', () => {
      mockUseActionGating.mockReturnValue({
        enabled: true,
        loading: false,
        disabledReason: undefined,
        prerequisites: [
          {
            id: 'wallet-connection',
            type: 'wallet',
            required: true,
            met: true,
            message: 'Wallet connected',
          }
        ],
        updateLoading: vi.fn(),
        updateProgress: vi.fn(),
      });

      renderWithTooltip(
        <WalletGatedButton>
          Execute Action
        </WalletGatedButton>
      );

      const button = screen.getByRole('button');
      expect(button).not.toBeDisabled();
      expect(button).not.toHaveClass('opacity-50');
    });

    test('should show tooltip with disabled reason when disabled', async () => {
      mockUseActionGating.mockReturnValue({
        enabled: false,
        loading: false,
        disabledReason: 'Connect your wallet to continue',
        prerequisites: [
          {
            id: 'wallet-connection',
            type: 'wallet',
            required: true,
            met: false,
            message: 'Connect your wallet to continue',
          }
        ],
        updateLoading: vi.fn(),
        updateProgress: vi.fn(),
      });

      renderWithTooltip(
        <WalletGatedButton>
          Execute Action
        </WalletGatedButton>
      );

      const button = screen.getByRole('button');
      
      // Check that button has tooltip attributes
      expect(button).toHaveAttribute('aria-describedby', 'gated-button-tooltip');
      expect(button).toBeDisabled();
    });
  });

  describe('Loading States', () => {
    test('should show loading state with spinner and text', () => {
      mockUseActionGating.mockReturnValue({
        enabled: true,
        loading: true,
        loadingText: 'Executing...',
        disabledReason: undefined,
        prerequisites: [],
        updateLoading: vi.fn(),
        updateProgress: vi.fn(),
      });

      renderWithTooltip(
        <GatedButton gatingConfig={{ requireWallet: true }}>
          Execute Action
        </GatedButton>
      );

      expect(screen.getByText('Executing...')).toBeInTheDocument();
      // Check for loading spinner (Loader2 icon)
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });

    test('should show progress indicator for multi-step operations', () => {
      mockUseActionGating.mockReturnValue({
        enabled: true,
        loading: true,
        disabledReason: undefined,
        prerequisites: [],
        progress: {
          current: 2,
          total: 3,
          stepName: 'Approving tokens',
        },
        updateLoading: vi.fn(),
        updateProgress: vi.fn(),
      });

      renderWithTooltip(
        <GatedButton 
          gatingConfig={{ requireWallet: true }}
          showProgress={true}
        >
          Execute Action
        </GatedButton>
      );

      expect(screen.getByText('Step 2 of 3: Approving tokens')).toBeInTheDocument();
    });

    test('should handle external loading prop', () => {
      mockUseActionGating.mockReturnValue({
        enabled: true,
        loading: false,
        disabledReason: undefined,
        prerequisites: [],
        updateLoading: vi.fn(),
        updateProgress: vi.fn(),
      });

      renderWithTooltip(
        <GatedButton 
          gatingConfig={{ requireWallet: true }}
          loading={true}
          loadingText="Executing..."
        >
          Execute Action
        </GatedButton>
      );

      expect(screen.getByText('Executing...')).toBeInTheDocument();
    });
  });

  describe('Click Handling', () => {
    test('should not call onClick when disabled', () => {
      const mockOnClick = vi.fn();
      
      mockUseActionGating.mockReturnValue({
        enabled: false,
        loading: false,
        disabledReason: 'Connect your wallet to continue',
        prerequisites: [],
        updateLoading: vi.fn(),
        updateProgress: vi.fn(),
      });

      renderWithTooltip(
        <GatedButton 
          gatingConfig={{ requireWallet: true }}
          onClick={mockOnClick}
        >
          Execute Action
        </GatedButton>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnClick).not.toHaveBeenCalled();
    });

    test('should call onClick when enabled', () => {
      const mockOnClick = vi.fn();
      
      mockUseActionGating.mockReturnValue({
        enabled: true,
        loading: false,
        disabledReason: undefined,
        prerequisites: [],
        updateLoading: vi.fn(),
        updateProgress: vi.fn(),
      });

      renderWithTooltip(
        <GatedButton 
          gatingConfig={{ requireWallet: true }}
          onClick={mockOnClick}
        >
          Execute Action
        </GatedButton>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    test('should handle async onClick with loading state', async () => {
      const mockOnClick = vi.fn().mockResolvedValue(undefined);
      const mockUpdateLoading = vi.fn();
      
      mockUseActionGating.mockReturnValue({
        enabled: true,
        loading: false,
        disabledReason: undefined,
        prerequisites: [],
        updateLoading: mockUpdateLoading,
        updateProgress: vi.fn(),
      });

      renderWithTooltip(
        <GatedButton 
          gatingConfig={{ requireWallet: true }}
          onClick={mockOnClick}
        >
          Execute Action
        </GatedButton>
      );

      const button = screen.getByRole('button');
      fireEvent.click(button);

      // Should set loading to true
      await waitFor(() => {
        expect(mockUpdateLoading).toHaveBeenCalledWith(true, 'Executing...');
      });

      // Should call the onClick handler
      expect(mockOnClick).toHaveBeenCalledTimes(1);

      // Should set loading to false after completion
      await waitFor(() => {
        expect(mockUpdateLoading).toHaveBeenCalledWith(false);
      });
    });
  });

  describe('Force Disabled Override', () => {
    test('should be disabled when forceDisabled is true', () => {
      mockUseActionGating.mockReturnValue({
        enabled: true,
        loading: false,
        disabledReason: undefined,
        prerequisites: [],
        updateLoading: vi.fn(),
        updateProgress: vi.fn(),
      });

      renderWithTooltip(
        <GatedButton 
          gatingConfig={{ requireWallet: true }}
          forceDisabled={true}
          forceDisabledReason="Maintenance mode"
        >
          Execute Action
        </GatedButton>
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    test('should show force disabled reason in tooltip', async () => {
      mockUseActionGating.mockReturnValue({
        enabled: true,
        loading: false,
        disabledReason: undefined,
        prerequisites: [],
        updateLoading: vi.fn(),
        updateProgress: vi.fn(),
      });

      renderWithTooltip(
        <GatedButton 
          gatingConfig={{ requireWallet: true }}
          forceDisabled={true}
          forceDisabledReason="Maintenance mode"
        >
          Execute Action
        </GatedButton>
      );

      const button = screen.getByRole('button');
      
      // Check that button has tooltip attributes and is disabled
      expect(button).toHaveAttribute('aria-describedby', 'gated-button-tooltip');
      expect(button).toBeDisabled();
    });
  });

  describe('Convenience Components', () => {
    test('WalletGatedButton should configure wallet requirement', () => {
      mockUseActionGating.mockReturnValue({
        enabled: false,
        loading: false,
        disabledReason: 'Connect your wallet to continue',
        prerequisites: [],
        updateLoading: vi.fn(),
        updateProgress: vi.fn(),
      });

      renderWithTooltip(
        <WalletGatedButton>
          Wallet Action
        </WalletGatedButton>
      );

      expect(mockUseActionGating).toHaveBeenCalledWith({ requireWallet: true });
    });

    test('ApprovalGatedButton should configure approval requirements', () => {
      const tokenAddresses = ['0xTokenA', '0xTokenB'];
      
      mockUseActionGating.mockReturnValue({
        enabled: false,
        loading: false,
        disabledReason: 'Approve token spend to continue',
        prerequisites: [],
        updateLoading: vi.fn(),
        updateProgress: vi.fn(),
      });

      renderWithTooltip(
        <ApprovalGatedButton tokenAddresses={tokenAddresses}>
          Approval Action
        </ApprovalGatedButton>
      );

      expect(mockUseActionGating).toHaveBeenCalledWith({ 
        requireWallet: true,
        requireApprovals: tokenAddresses
      });
    });

    test('BalanceGatedButton should configure balance requirements', () => {
      mockUseActionGating.mockReturnValue({
        enabled: false,
        loading: false,
        disabledReason: 'Insufficient balance',
        prerequisites: [],
        updateLoading: vi.fn(),
        updateProgress: vi.fn(),
      });

      renderWithTooltip(
        <BalanceGatedButton token="ETH" minimumAmount="0.1">
          Balance Action
        </BalanceGatedButton>
      );

      expect(mockUseActionGating).toHaveBeenCalledWith({ 
        requireWallet: true,
        minimumBalance: { token: 'ETH', amount: '0.1' }
      });
    });
  });

  describe('Accessibility', () => {
    test('should have proper ARIA attributes when disabled', () => {
      mockUseActionGating.mockReturnValue({
        enabled: false,
        loading: false,
        disabledReason: 'Connect your wallet to continue',
        prerequisites: [],
        updateLoading: vi.fn(),
        updateProgress: vi.fn(),
      });

      renderWithTooltip(
        <WalletGatedButton>
          Execute Action
        </WalletGatedButton>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
      expect(button).toHaveAttribute('aria-disabled', 'true');
    });

    test('should be keyboard accessible', () => {
      const mockOnClick = vi.fn();
      
      mockUseActionGating.mockReturnValue({
        enabled: true,
        loading: false,
        disabledReason: undefined,
        prerequisites: [],
        updateLoading: vi.fn(),
        updateProgress: vi.fn(),
      });

      renderWithTooltip(
        <GatedButton 
          gatingConfig={{ requireWallet: true }}
          onClick={mockOnClick}
        >
          Execute Action
        </GatedButton>
      );

      const button = screen.getByRole('button');
      
      // Should be focusable
      button.focus();
      expect(button).toHaveFocus();
      
      // Should respond to Enter key
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Visual States', () => {
    test('should show prerequisite icons', () => {
      mockUseActionGating.mockReturnValue({
        enabled: false,
        loading: false,
        disabledReason: 'Connect your wallet to continue',
        prerequisites: [],
        updateLoading: vi.fn(),
        updateProgress: vi.fn(),
      });

      renderWithTooltip(
        <WalletGatedButton>
          Execute Action
        </WalletGatedButton>
      );

      // Should show alert icon when disabled
      expect(document.querySelector('.text-destructive')).toBeInTheDocument();
    });

    test('should show success icon when enabled', () => {
      mockUseActionGating.mockReturnValue({
        enabled: true,
        loading: false,
        disabledReason: undefined,
        prerequisites: [],
        updateLoading: vi.fn(),
        updateProgress: vi.fn(),
      });

      renderWithTooltip(
        <WalletGatedButton>
          Execute Action
        </WalletGatedButton>
      );

      // Should show check icon when enabled
      expect(document.querySelector('.text-green-500')).toBeInTheDocument();
    });
  });
});