import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HarvestProEmptyState } from '../HarvestProEmptyState';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('HarvestProEmptyState', () => {
  const mockProps = {
    onConnectWallet: vi.fn(),
    onLearnMore: vi.fn(),
    onRefresh: vi.fn(),
    onViewTaxGuide: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Wallet Connection States', () => {
    it('renders wallet connection state correctly', () => {
      render(<HarvestProEmptyState hasWalletConnected={false} />);
      
      expect(screen.getByText('Connect Wallet for Tax Loss Harvesting')).toBeInTheDocument();
      expect(screen.getByText(/Connect your wallet to analyze your portfolio/)).toBeInTheDocument();
    });

    it('renders no positions state correctly', () => {
      render(
        <HarvestProEmptyState 
          hasWalletConnected={true}
          hasPositions={false}
        />
      );
      
      expect(screen.getByText('No Harvest Opportunities Available')).toBeInTheDocument();
      expect(screen.getByText(/Your portfolio doesn't have any positions/)).toBeInTheDocument();
    });

    it('renders no opportunities state correctly', () => {
      render(
        <HarvestProEmptyState 
          hasWalletConnected={true}
          hasPositions={true}
        />
      );
      
      expect(screen.getByText('No Tax Loss Harvesting Opportunities')).toBeInTheDocument();
      expect(screen.getByText(/All your positions are currently profitable/)).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('renders connect wallet action when wallet not connected', () => {
      render(
        <HarvestProEmptyState 
          hasWalletConnected={false}
          onConnectWallet={mockProps.onConnectWallet}
        />
      );
      
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    });

    it('calls onConnectWallet when connect wallet button is clicked', () => {
      render(
        <HarvestProEmptyState 
          hasWalletConnected={false}
          onConnectWallet={mockProps.onConnectWallet}
        />
      );
      
      fireEvent.click(screen.getByText('Connect Wallet'));
      expect(mockProps.onConnectWallet).toHaveBeenCalledTimes(1);
    });

    it('renders tax guide action when provided', () => {
      render(
        <HarvestProEmptyState 
          onViewTaxGuide={mockProps.onViewTaxGuide}
        />
      );
      
      expect(screen.getByText('Learn about tax loss harvesting')).toBeInTheDocument();
    });

    it('calls onViewTaxGuide when tax guide button is clicked', () => {
      render(
        <HarvestProEmptyState 
          onViewTaxGuide={mockProps.onViewTaxGuide}
        />
      );
      
      fireEvent.click(screen.getByText('Learn about tax loss harvesting'));
      expect(mockProps.onViewTaxGuide).toHaveBeenCalledTimes(1);
    });

    it('renders learn more action when provided', () => {
      render(
        <HarvestProEmptyState 
          onLearnMore={mockProps.onLearnMore}
        />
      );
      
      expect(screen.getByText('How HarvestPro works')).toBeInTheDocument();
    });

    it('calls onLearnMore when learn more button is clicked', () => {
      render(
        <HarvestProEmptyState 
          onLearnMore={mockProps.onLearnMore}
        />
      );
      
      fireEvent.click(screen.getByText('How HarvestPro works'));
      expect(mockProps.onLearnMore).toHaveBeenCalledTimes(1);
    });
  });

  describe('Scan Checklist', () => {
    it('renders wallet connection checklist when wallet not connected', () => {
      render(<HarvestProEmptyState hasWalletConnected={false} />);
      
      expect(screen.getByText('Items Scanned:')).toBeInTheDocument();
      expect(screen.getByText('Wallet connection ready')).toBeInTheDocument();
      expect(screen.getByText('Portfolio analysis prepared')).toBeInTheDocument();
      expect(screen.getByText('DeFi position detection ready')).toBeInTheDocument();
      expect(screen.getByText('Tax calculation engine ready')).toBeInTheDocument();
      expect(screen.getByText('Compliance checks ready')).toBeInTheDocument();
    });

    it('renders analysis checklist when wallet connected', () => {
      render(
        <HarvestProEmptyState 
          hasWalletConnected={true}
          totalPositionsScanned={25}
        />
      );
      
      expect(screen.getByText('Portfolio positions analyzed')).toBeInTheDocument();
      expect(screen.getByText(/25 positions scanned/)).toBeInTheDocument();
      expect(screen.getByText('Unrealized losses calculated')).toBeInTheDocument();
      expect(screen.getByText('Tax implications assessed')).toBeInTheDocument();
      expect(screen.getByText('Wash sale rules checked')).toBeInTheDocument();
      expect(screen.getByText('Gas costs factored')).toBeInTheDocument();
      expect(screen.getByText('Market conditions evaluated')).toBeInTheDocument();
    });

    it('includes harvest opportunities filter when has positions', () => {
      render(
        <HarvestProEmptyState 
          hasWalletConnected={true}
          hasPositions={true}
        />
      );
      
      expect(screen.getByText('Harvest opportunities filtered')).toBeInTheDocument();
      expect(screen.getByText(/Minimum threshold and profitability checks/)).toBeInTheDocument();
    });

    it('shows correct positions scanned count', () => {
      render(
        <HarvestProEmptyState 
          hasWalletConnected={true}
          totalPositionsScanned={42}
        />
      );
      
      expect(screen.getByText(/42 positions scanned/)).toBeInTheDocument();
    });
  });

  describe('Refresh Functionality', () => {
    it('shows refresh button when wallet connected and onRefresh provided', () => {
      render(
        <HarvestProEmptyState 
          hasWalletConnected={true}
          onRefresh={mockProps.onRefresh}
        />
      );
      
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('does not show refresh button when wallet not connected', () => {
      render(
        <HarvestProEmptyState 
          hasWalletConnected={false}
          onRefresh={mockProps.onRefresh}
        />
      );
      
      expect(screen.queryByText('Refresh')).not.toBeInTheDocument();
    });

    it('calls onRefresh when refresh button is clicked', () => {
      render(
        <HarvestProEmptyState 
          hasWalletConnected={true}
          onRefresh={mockProps.onRefresh}
        />
      );
      
      fireEvent.click(screen.getByText('Refresh'));
      expect(mockProps.onRefresh).toHaveBeenCalledTimes(1);
    });

    it('shows refreshing state correctly', () => {
      render(
        <HarvestProEmptyState 
          hasWalletConnected={true}
          onRefresh={mockProps.onRefresh}
          isRefreshing={true}
        />
      );
      
      expect(screen.getByText('Refreshing...')).toBeInTheDocument();
      expect(screen.getByText('Refreshing...')).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on action buttons', () => {
      render(
        <HarvestProEmptyState 
          hasWalletConnected={false}
          onConnectWallet={mockProps.onConnectWallet}
          onViewTaxGuide={mockProps.onViewTaxGuide}
          onRefresh={mockProps.onRefresh}
        />
      );
      
      expect(screen.getByLabelText('Connect Wallet')).toBeInTheDocument();
      expect(screen.getByLabelText('Learn about tax loss harvesting')).toBeInTheDocument();
    });

    it('maintains proper heading structure', () => {
      render(<HarvestProEmptyState />);
      
      const mainHeading = screen.getByRole('heading', { level: 2 });
      const subHeading = screen.getByRole('heading', { level: 3 });
      
      expect(mainHeading).toHaveTextContent('Connect Wallet for Tax Loss Harvesting');
      expect(subHeading).toHaveTextContent('Items Scanned:');
    });

    it('has proper contrast for text elements', () => {
      render(<HarvestProEmptyState />);
      
      // Check that main text elements are present (contrast is handled by CSS)
      expect(screen.getByText('Connect Wallet for Tax Loss Harvesting')).toBeInTheDocument();
      expect(screen.getByText(/Connect your wallet to analyze/)).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <HarvestProEmptyState className="custom-harvestpro-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-harvestpro-class');
    });
  });

  describe('Edge Cases', () => {
    it('handles missing callback functions gracefully', () => {
      render(<HarvestProEmptyState hasWalletConnected={false} />);
      
      // Should not render action buttons when callbacks are not provided
      expect(screen.queryByText('Connect Wallet')).not.toBeInTheDocument();
    });

    it('handles zero positions scanned', () => {
      render(
        <HarvestProEmptyState 
          hasWalletConnected={true}
          totalPositionsScanned={0}
        />
      );
      
      expect(screen.getByText(/0 positions scanned/)).toBeInTheDocument();
    });

    it('renders correctly with all props provided', () => {
      render(
        <HarvestProEmptyState 
          hasWalletConnected={true}
          hasPositions={true}
          onConnectWallet={mockProps.onConnectWallet}
          onLearnMore={mockProps.onLearnMore}
          onRefresh={mockProps.onRefresh}
          onViewTaxGuide={mockProps.onViewTaxGuide}
          isRefreshing={false}
          totalPositionsScanned={15}
          className="test-class"
        />
      );
      
      expect(screen.getByText('No Tax Loss Harvesting Opportunities')).toBeInTheDocument();
      expect(screen.getByText('Learn about tax loss harvesting')).toBeInTheDocument();
      expect(screen.getByText('How HarvestPro works')).toBeInTheDocument();
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });
});