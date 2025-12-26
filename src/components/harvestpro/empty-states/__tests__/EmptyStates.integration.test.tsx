/**
 * Enhanced Empty States Integration Tests
 * Tests for Enhanced Requirement 11: Actionable Empty States
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import {
  NoWalletsConnected,
  NoOpportunitiesDetected,
  AllOpportunitiesHarvested,
  APIFailureFallback,
  NoFilterResults,
} from '../index';

describe('Enhanced Empty States - Requirement 11', () => {
  describe('NoWalletsConnected', () => {
    test('displays helpful guidance with checklist of items to be scanned', () => {
      render(<NoWalletsConnected />);
      
      // Check for main guidance
      expect(screen.getByText('No Wallets Connected')).toBeInTheDocument();
      expect(screen.getByText(/Connect your wallet to start discovering/)).toBeInTheDocument();
      
      // Check for checklist section
      expect(screen.getByText('What we\'ll scan when you connect:')).toBeInTheDocument();
      expect(screen.getByText('Transaction History')).toBeInTheDocument();
      expect(screen.getByText('Current Holdings')).toBeInTheDocument();
      expect(screen.getByText('Unrealized Losses')).toBeInTheDocument();
      expect(screen.getByText('Gas & Fees')).toBeInTheDocument();
      
      // Check for detailed descriptions
      expect(screen.getByText(/All buy\/sell transactions for FIFO cost basis/)).toBeInTheDocument();
      expect(screen.getByText(/Token balances and current market prices/)).toBeInTheDocument();
    });

    test('provides relevant call-to-action button', () => {
      const mockConnect = vi.fn();
      render(<NoWalletsConnected onConnectWallet={mockConnect} />);
      
      const connectButton = screen.getByRole('button', { name: /Connect Wallet/ });
      expect(connectButton).toBeInTheDocument();
      
      fireEvent.click(connectButton);
      expect(mockConnect).toHaveBeenCalledOnce();
    });
  });

  describe('NoOpportunitiesDetected', () => {
    test('shows checklist of what was scanned when no results found', () => {
      render(<NoOpportunitiesDetected />);
      
      // Check for main message
      expect(screen.getByText('No Opportunities Detected')).toBeInTheDocument();
      expect(screen.getByText(/Great news! Your portfolio doesn't have any eligible/)).toBeInTheDocument();
      
      // Check for checklist of what was checked
      expect(screen.getByText('✓ What we checked for you:')).toBeInTheDocument();
      expect(screen.getByText('All Token Holdings')).toBeInTheDocument();
      expect(screen.getByText('Loss Thresholds')).toBeInTheDocument();
      expect(screen.getByText('Gas Efficiency')).toBeInTheDocument();
      expect(screen.getByText('Liquidity Check')).toBeInTheDocument();
      
      // Check for specific scan details
      expect(screen.getByText(/Scanned \d+ tokens across your wallets/)).toBeInTheDocument();
      expect(screen.getByText(/Checked for losses >\$20 with net tax benefit/)).toBeInTheDocument();
    });

    test('provides next steps and actionable guidance', () => {
      render(<NoOpportunitiesDetected />);
      
      // Check for next steps section
      expect(screen.getByText('What to do next:')).toBeInTheDocument();
      expect(screen.getByText(/Set up notifications for new opportunities/)).toBeInTheDocument();
      
      // Use getAllByText to handle duplicate text and check for button specifically
      const volatilityElements = screen.getAllByText(/Check back during market volatility/);
      expect(volatilityElements).toHaveLength(2); // One in info card, one in button
      
      // Check that at least one is a button
      const volatilityButton = screen.getByRole('button', { name: /📊 Check back during market volatility/ });
      expect(volatilityButton).toBeInTheDocument();
    });
  });

  describe('AllOpportunitiesHarvested', () => {
    test('provides clear next steps after completion', () => {
      const mockDownload = vi.fn();
      const mockViewProof = vi.fn();
      
      render(
        <AllOpportunitiesHarvested 
          onDownloadCSV={mockDownload}
          onViewProof={mockViewProof}
        />
      );
      
      // Check for completion message
      expect(screen.getByText(/All Opportunities Harvested!/)).toBeInTheDocument();
      
      // Check for next steps guidance
      expect(screen.getByText('What\'s next:')).toBeInTheDocument();
      expect(screen.getByText('Review Your Export')).toBeInTheDocument();
      expect(screen.getByText('Set Notifications')).toBeInTheDocument();
      expect(screen.getByText('Share with CPA')).toBeInTheDocument();
      
      // Check for actionable buttons
      const downloadButton = screen.getByRole('button', { name: /Download Form 8949 CSV/ });
      const proofButton = screen.getByRole('button', { name: /View Proof-of-Harvest/ });
      
      expect(downloadButton).toBeInTheDocument();
      expect(proofButton).toBeInTheDocument();
      
      fireEvent.click(downloadButton);
      fireEvent.click(proofButton);
      
      expect(mockDownload).toHaveBeenCalledOnce();
      expect(mockViewProof).toHaveBeenCalledOnce();
    });
  });

  describe('APIFailureFallback', () => {
    test('shows checklist of what was attempted when API fails', () => {
      const mockRetry = vi.fn();
      
      render(
        <APIFailureFallback 
          onRetry={mockRetry}
          errorMessage="Failed to load opportunities"
        />
      );
      
      // Check for error message
      expect(screen.getByText('Connection Error')).toBeInTheDocument();
      expect(screen.getByText(/Failed to load opportunities/)).toBeInTheDocument();
      
      // Check for what was attempted
      expect(screen.getByText('What we tried to check:')).toBeInTheDocument();
      expect(screen.getByText('Wallet Holdings')).toBeInTheDocument();
      expect(screen.getByText('Price Data')).toBeInTheDocument();
      expect(screen.getByText('Gas Estimates')).toBeInTheDocument();
      expect(screen.getByText('Opportunity Analysis')).toBeInTheDocument();
      
      // Check for troubleshooting guidance
      expect(screen.getByText('Troubleshooting Tips:')).toBeInTheDocument();
      expect(screen.getByText('Check Connection')).toBeInTheDocument();
      expect(screen.getByText('Refresh Page')).toBeInTheDocument();
      expect(screen.getByText('Service Status')).toBeInTheDocument();
    });

    test('provides retry action button', () => {
      const mockRetry = vi.fn();
      
      render(<APIFailureFallback onRetry={mockRetry} />);
      
      const retryButton = screen.getByRole('button', { name: /Retry/ });
      expect(retryButton).toBeInTheDocument();
      
      fireEvent.click(retryButton);
      expect(mockRetry).toHaveBeenCalledOnce();
    });
  });

  describe('NoFilterResults', () => {
    test('shows active filters and provides clear actions', () => {
      const mockClearFilters = vi.fn();
      const mockAdjustFilters = vi.fn();
      const activeFilters = ['High Benefit', 'Low Risk', 'Short-Term'];
      
      render(
        <NoFilterResults
          activeFilters={activeFilters}
          onClearFilters={mockClearFilters}
          onAdjustFilters={mockAdjustFilters}
          totalOpportunities={15}
        />
      );
      
      // Check for main message
      expect(screen.getByText('No Results for Current Filters')).toBeInTheDocument();
      expect(screen.getByText(/Found 15 total opportunities/)).toBeInTheDocument();
      
      // Check for active filters display
      expect(screen.getByText('Active filters:')).toBeInTheDocument();
      activeFilters.forEach(filter => {
        expect(screen.getByText(filter)).toBeInTheDocument();
      });
      
      // Check for action buttons
      const clearButton = screen.getByRole('button', { name: /Clear All Filters/ });
      const adjustButton = screen.getByRole('button', { name: /Adjust Filters/ });
      
      expect(clearButton).toBeInTheDocument();
      expect(adjustButton).toBeInTheDocument();
      
      fireEvent.click(clearButton);
      fireEvent.click(adjustButton);
      
      expect(mockClearFilters).toHaveBeenCalledOnce();
      expect(mockAdjustFilters).toHaveBeenCalledOnce();
    });

    test('provides helpful suggestions for filter adjustments', () => {
      render(
        <NoFilterResults
          activeFilters={['High Risk']}
          totalOpportunities={5}
        />
      );
      
      // Check for suggestions section
      expect(screen.getByText('Try these suggestions:')).toBeInTheDocument();
      expect(screen.getByText('Lower Risk Filter')).toBeInTheDocument();
      expect(screen.getByText('Reduce Min Benefit')).toBeInTheDocument();
      expect(screen.getByText('Include All Terms')).toBeInTheDocument();
      
      // Check for specific guidance
      expect(screen.getByText(/Include medium and high-risk opportunities/)).toBeInTheDocument();
      expect(screen.getByText(/Lower the minimum net benefit threshold/)).toBeInTheDocument();
    });
  });

  describe('Enhanced Requirement 11 Compliance', () => {
    test('all empty states include helpful guidance messages', () => {
      const { rerender } = render(<NoWalletsConnected />);
      expect(screen.getByText(/Connect your wallet to start discovering/)).toBeInTheDocument();
      
      rerender(<NoOpportunitiesDetected />);
      expect(screen.getByText(/Great news! Your portfolio doesn't have any eligible/)).toBeInTheDocument();
      
      rerender(<AllOpportunitiesHarvested />);
      expect(screen.getByText(/Congratulations! You've successfully harvested/)).toBeInTheDocument();
      
      rerender(<APIFailureFallback />);
      expect(screen.getByText(/Please check your connection and try again/)).toBeInTheDocument();
    });

    test('all empty states provide relevant call-to-action buttons', () => {
      const mockActions = {
        onConnectWallet: vi.fn(),
        onDownloadCSV: vi.fn(),
        onViewProof: vi.fn(),
        onRetry: vi.fn(),
        onClearFilters: vi.fn(),
      };

      // NoWalletsConnected has Connect Wallet button
      const { rerender } = render(<NoWalletsConnected onConnectWallet={mockActions.onConnectWallet} />);
      expect(screen.getByRole('button', { name: /Connect Wallet/ })).toBeInTheDocument();

      // AllOpportunitiesHarvested has Download and View Proof buttons
      rerender(
        <AllOpportunitiesHarvested 
          onDownloadCSV={mockActions.onDownloadCSV}
          onViewProof={mockActions.onViewProof}
        />
      );
      expect(screen.getByRole('button', { name: /Download Form 8949 CSV/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /View Proof-of-Harvest/ })).toBeInTheDocument();

      // APIFailureFallback has Retry button
      rerender(<APIFailureFallback onRetry={mockActions.onRetry} />);
      expect(screen.getByRole('button', { name: /Retry/ })).toBeInTheDocument();

      // NoFilterResults has Clear Filters button
      rerender(
        <NoFilterResults 
          activeFilters={['Test']}
          onClearFilters={mockActions.onClearFilters}
        />
      );
      expect(screen.getByRole('button', { name: /Clear All Filters/ })).toBeInTheDocument();
    });

    test('empty states include checklists of items scanned when no results found', () => {
      // NoWalletsConnected shows what will be scanned
      const { rerender } = render(<NoWalletsConnected />);
      expect(screen.getByText('What we\'ll scan when you connect:')).toBeInTheDocument();
      expect(screen.getByText('Transaction History')).toBeInTheDocument();

      // NoOpportunitiesDetected shows what was checked
      rerender(<NoOpportunitiesDetected />);
      expect(screen.getByText('✓ What we checked for you:')).toBeInTheDocument();
      expect(screen.getByText('All Token Holdings')).toBeInTheDocument();

      // APIFailureFallback shows what was attempted
      rerender(<APIFailureFallback />);
      expect(screen.getByText('What we tried to check:')).toBeInTheDocument();
      expect(screen.getByText('Wallet Holdings')).toBeInTheDocument();
    });
  });
});