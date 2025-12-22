import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GuardianEmptyState } from '../GuardianEmptyState';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
}));

describe('GuardianEmptyState', () => {
  const mockProps = {
    walletAddress: '0x1234567890123456789012345678901234567890',
    scanDuration: 15,
    onLearnMore: vi.fn(),
    onAdjustSettings: vi.fn(),
    onRescan: vi.fn(),
    isRescanning: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with default props', () => {
      render(<GuardianEmptyState />);
      
      expect(screen.getByText('No Active Risks Detected')).toBeInTheDocument();
      expect(screen.getByText(/Your wallet appears secure/)).toBeInTheDocument();
    });

    it('displays wallet address in description when provided', () => {
      render(<GuardianEmptyState walletAddress={mockProps.walletAddress} />);
      
      expect(screen.getByText(/0x1234...7890/)).toBeInTheDocument();
    });

    it('displays scan duration when provided', () => {
      render(
        <GuardianEmptyState 
          walletAddress={mockProps.walletAddress}
          scanDuration={mockProps.scanDuration}
        />
      );
      
      expect(screen.getByText(/Scan completed in 15s/)).toBeInTheDocument();
    });
  });

  describe('Actions', () => {
    it('renders learn more action by default', () => {
      render(<GuardianEmptyState />);
      
      expect(screen.getByText('Learn how Guardian protects you')).toBeInTheDocument();
    });

    it('calls onLearnMore when learn more button is clicked', () => {
      render(<GuardianEmptyState onLearnMore={mockProps.onLearnMore} />);
      
      fireEvent.click(screen.getByText('Learn how Guardian protects you'));
      expect(mockProps.onLearnMore).toHaveBeenCalledTimes(1);
    });

    it('renders adjust settings action when provided', () => {
      render(<GuardianEmptyState onAdjustSettings={mockProps.onAdjustSettings} />);
      
      expect(screen.getByText('Adjust scan settings')).toBeInTheDocument();
    });

    it('calls onAdjustSettings when adjust settings button is clicked', () => {
      render(<GuardianEmptyState onAdjustSettings={mockProps.onAdjustSettings} />);
      
      fireEvent.click(screen.getByText('Adjust scan settings'));
      expect(mockProps.onAdjustSettings).toHaveBeenCalledTimes(1);
    });

    it('opens default learn more link when no onLearnMore provided', () => {
      const mockOpen = vi.fn();
      Object.defineProperty(window, 'open', { value: mockOpen });

      render(<GuardianEmptyState />);
      
      fireEvent.click(screen.getByText('Learn how Guardian protects you'));
      expect(mockOpen).toHaveBeenCalledWith('/guardian/methodology', '_blank');
    });
  });

  describe('Refresh Functionality', () => {
    it('shows refresh button when onRescan is provided', () => {
      render(<GuardianEmptyState onRescan={mockProps.onRescan} />);
      
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });

    it('calls onRescan when refresh button is clicked', () => {
      render(<GuardianEmptyState onRescan={mockProps.onRescan} />);
      
      fireEvent.click(screen.getByText('Refresh'));
      expect(mockProps.onRescan).toHaveBeenCalledTimes(1);
    });

    it('shows rescanning state correctly', () => {
      render(
        <GuardianEmptyState 
          onRescan={mockProps.onRescan}
          isRescanning={true}
        />
      );
      
      expect(screen.getByText('Refreshing...')).toBeInTheDocument();
      expect(screen.getByText('Refreshing...')).toBeDisabled();
    });
  });

  describe('Scan Checklist', () => {
    it('renders comprehensive scan checklist', () => {
      render(<GuardianEmptyState />);
      
      expect(screen.getByText('Items Scanned:')).toBeInTheDocument();
      expect(screen.getByText('Transaction patterns analyzed')).toBeInTheDocument();
      expect(screen.getByText('Smart contract interactions reviewed')).toBeInTheDocument();
      expect(screen.getByText('Known risk addresses checked')).toBeInTheDocument();
      expect(screen.getByText('Suspicious activity patterns scanned')).toBeInTheDocument();
      expect(screen.getByText('Token approval risks assessed')).toBeInTheDocument();
      expect(screen.getByText('Cross-chain activity monitored')).toBeInTheDocument();
    });

    it('shows detailed descriptions for checklist items', () => {
      render(<GuardianEmptyState />);
      
      expect(screen.getByText('(Last 1,000 transactions)')).toBeInTheDocument();
      expect(screen.getByText('(Against 50,000+ risk database)')).toBeInTheDocument();
      expect(screen.getByText('(MEV, sandwich attacks, etc.)')).toBeInTheDocument();
      expect(screen.getByText('(Unlimited approvals flagged)')).toBeInTheDocument();
      expect(screen.getByText('(Ethereum, Polygon, BSC, Arbitrum)')).toBeInTheDocument();
    });

    it('marks all checklist items as completed', () => {
      render(<GuardianEmptyState />);
      
      const completedIcons = screen.getAllByLabelText('Completed');
      expect(completedIcons).toHaveLength(6); // All 6 items should be completed
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels on action buttons', () => {
      render(
        <GuardianEmptyState 
          onAdjustSettings={mockProps.onAdjustSettings}
          onRescan={mockProps.onRescan}
        />
      );
      
      expect(screen.getByLabelText('Learn how Guardian protects you')).toBeInTheDocument();
      expect(screen.getByLabelText('Adjust scan settings')).toBeInTheDocument();
      expect(screen.getByLabelText('Refresh data')).toBeInTheDocument();
    });

    it('maintains proper heading structure', () => {
      render(<GuardianEmptyState />);
      
      const mainHeading = screen.getByRole('heading', { level: 2 });
      const subHeading = screen.getByRole('heading', { level: 3 });
      
      expect(mainHeading).toHaveTextContent('No Active Risks Detected');
      expect(subHeading).toHaveTextContent('Items Scanned:');
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <GuardianEmptyState className="custom-guardian-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-guardian-class');
    });
  });
});