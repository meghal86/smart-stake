import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GraphLiteVisualizer } from '../GraphLiteVisualizer';
import { WalletScope, FreshnessConfidence } from '@/types/portfolio';

describe('GraphLiteVisualizer', () => {
  const mockWalletScope: WalletScope = {
    mode: 'active_wallet',
    address: '0x742d35Cc6634C0532925a3b8D4C0532925a3b8D4'
  };

  const mockFreshness: FreshnessConfidence = {
    freshnessSec: 30,
    confidence: 0.85,
    confidenceThreshold: 0.70,
    degraded: false
  };

  const mockFlowData = {
    nodes: [
      { id: 'wallet', label: 'Your Wallet', type: 'wallet' as const, riskLevel: 'low' as const, x: 400, y: 250 },
      { id: 'uniswap', label: 'Uniswap V3', type: 'protocol' as const, riskLevel: 'low' as const, x: 250, y: 150 },
      { id: 'compound', label: 'Compound', type: 'protocol' as const, riskLevel: 'low' as const, x: 550, y: 150 },
      { id: 'unknown', label: 'Unknown Contract', type: 'contract' as const, riskLevel: 'high' as const, x: 400, y: 400 }
    ],
    edges: [
      { from: 'wallet', to: 'uniswap', type: 'approval' as const, amount: 'unlimited', risk: 'medium' as const },
      { from: 'wallet', to: 'compound', type: 'approval' as const, amount: '5.0 ETH', risk: 'low' as const },
      { from: 'wallet', to: 'unknown', type: 'interaction' as const, amount: '0.1 ETH', risk: 'high' as const }
    ]
  };

  describe('v0 (static) version', () => {
    test('renders static flow summary', () => {
      render(
        <GraphLiteVisualizer
          flowData={mockFlowData}
          freshness={mockFreshness}
          walletScope={mockWalletScope}
          version="v0"
        />
      );

      expect(screen.getByText(/Transaction Flow \(Graph-Lite v0\)/i)).toBeInTheDocument();
      expect(screen.getByText('Static Preview')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument(); // 4 nodes
      expect(screen.getByText('3')).toBeInTheDocument(); // 3 edges
    });

    test('displays nodes list', () => {
      render(
        <GraphLiteVisualizer
          flowData={mockFlowData}
          freshness={mockFreshness}
          walletScope={mockWalletScope}
          version="v0"
        />
      );

      expect(screen.getByText('Your Wallet')).toBeInTheDocument();
      expect(screen.getByText('Uniswap V3')).toBeInTheDocument();
      expect(screen.getByText('Compound')).toBeInTheDocument();
      expect(screen.getByText('Unknown Contract')).toBeInTheDocument();
    });

    test('displays interactions list', () => {
      render(
        <GraphLiteVisualizer
          flowData={mockFlowData}
          freshness={mockFreshness}
          walletScope={mockWalletScope}
          version="v0"
        />
      );

      expect(screen.getByText(/Your Wallet → Uniswap V3/i)).toBeInTheDocument();
      expect(screen.getByText(/Your Wallet → Compound/i)).toBeInTheDocument();
      expect(screen.getByText(/Your Wallet → Unknown Contract/i)).toBeInTheDocument();
    });

    test('shows V1.1 notice', () => {
      render(
        <GraphLiteVisualizer
          flowData={mockFlowData}
          freshness={mockFreshness}
          walletScope={mockWalletScope}
          version="v0"
        />
      );

      expect(screen.getByText(/Coming in V1.1:/i)).toBeInTheDocument();
    });
  });

  describe('v1 (interactive) version', () => {
    test('renders interactive graph controls', () => {
      render(
        <GraphLiteVisualizer
          flowData={mockFlowData}
          freshness={mockFreshness}
          walletScope={mockWalletScope}
          version="v1"
        />
      );

      expect(screen.getByText(/Transaction Flow \(Graph-Lite v1\)/i)).toBeInTheDocument();
      expect(screen.getByText('Interactive')).toBeInTheDocument();
      expect(screen.getByText('Zoom In')).toBeInTheDocument();
      expect(screen.getByText('Zoom Out')).toBeInTheDocument();
      expect(screen.getByText('Reset')).toBeInTheDocument();
    });

    test('renders filter controls', () => {
      render(
        <GraphLiteVisualizer
          flowData={mockFlowData}
          freshness={mockFreshness}
          walletScope={mockWalletScope}
          version="v1"
        />
      );

      const riskFilter = screen.getByDisplayValue('All Risk Levels');
      const typeFilter = screen.getByDisplayValue('All Types');

      expect(riskFilter).toBeInTheDocument();
      expect(typeFilter).toBeInTheDocument();
    });

    test('zoom controls work', () => {
      render(
        <GraphLiteVisualizer
          flowData={mockFlowData}
          freshness={mockFreshness}
          walletScope={mockWalletScope}
          version="v1"
        />
      );

      const zoomInButton = screen.getByText('Zoom In');
      const zoomOutButton = screen.getByText('Zoom Out');
      const resetButton = screen.getByText('Reset');

      // These should not throw errors
      fireEvent.click(zoomInButton);
      fireEvent.click(zoomOutButton);
      fireEvent.click(resetButton);
    });

    test('risk filter works', () => {
      render(
        <GraphLiteVisualizer
          flowData={mockFlowData}
          freshness={mockFreshness}
          walletScope={mockWalletScope}
          version="v1"
        />
      );

      const riskFilter = screen.getByDisplayValue('All Risk Levels');
      
      // Filter to high risk only
      fireEvent.change(riskFilter, { target: { value: 'high' } });
      
      // Should show 1 visible node (the high risk one)
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    test('type filter works', () => {
      render(
        <GraphLiteVisualizer
          flowData={mockFlowData}
          freshness={mockFreshness}
          walletScope={mockWalletScope}
          version="v1"
        />
      );

      const typeFilter = screen.getByDisplayValue('All Types');
      
      // Filter to wallets only
      fireEvent.change(typeFilter, { target: { value: 'wallet' } });
      
      // Should show 1 visible node (the wallet)
      expect(screen.getByText('1')).toBeInTheDocument();
    });

    test('displays legend', () => {
      render(
        <GraphLiteVisualizer
          flowData={mockFlowData}
          freshness={mockFreshness}
          walletScope={mockWalletScope}
          version="v1"
        />
      );

      // Check for legend items (use getAllByText since some appear in filters too)
      const walletLabels = screen.getAllByText('Wallet');
      expect(walletLabels.length).toBeGreaterThan(0);
      
      const lowRiskLabels = screen.getAllByText('Low Risk');
      expect(lowRiskLabels.length).toBeGreaterThan(0);
      
      const mediumRiskLabels = screen.getAllByText('Medium Risk');
      expect(mediumRiskLabels.length).toBeGreaterThan(0);
      
      const highRiskLabels = screen.getAllByText('High Risk');
      expect(highRiskLabels.length).toBeGreaterThan(0);
      
      expect(screen.getByText('Approval')).toBeInTheDocument();
      expect(screen.getByText('Transfer')).toBeInTheDocument();
    });

    test('displays stats summary', () => {
      render(
        <GraphLiteVisualizer
          flowData={mockFlowData}
          freshness={mockFreshness}
          walletScope={mockWalletScope}
          version="v1"
        />
      );

      expect(screen.getByText('Visible Nodes')).toBeInTheDocument();
      expect(screen.getByText('Visible Edges')).toBeInTheDocument();
    });

    test('shows instructions overlay', () => {
      render(
        <GraphLiteVisualizer
          flowData={mockFlowData}
          freshness={mockFreshness}
          walletScope={mockWalletScope}
          version="v1"
        />
      );

      expect(screen.getByText('Controls:')).toBeInTheDocument();
      expect(screen.getByText(/Click and drag to pan/i)).toBeInTheDocument();
      expect(screen.getByText(/Use zoom buttons/i)).toBeInTheDocument();
      expect(screen.getByText(/Click nodes to view details/i)).toBeInTheDocument();
    });
  });

  describe('confidence indicator', () => {
    test('shows high confidence in green', () => {
      render(
        <GraphLiteVisualizer
          flowData={mockFlowData}
          freshness={mockFreshness}
          walletScope={mockWalletScope}
          version="v0"
        />
      );

      expect(screen.getByText('85%')).toBeInTheDocument();
    });

    test('shows degraded warning when confidence is low', () => {
      const degradedFreshness: FreshnessConfidence = {
        freshnessSec: 120,
        confidence: 0.55,
        confidenceThreshold: 0.70,
        degraded: true,
        degradedReasons: ['Stale data']
      };

      render(
        <GraphLiteVisualizer
          flowData={mockFlowData}
          freshness={degradedFreshness}
          walletScope={mockWalletScope}
          version="v0"
        />
      );

      expect(screen.getByText(/Flow analysis may be incomplete/i)).toBeInTheDocument();
    });
  });

  describe('wallet scope display', () => {
    test('shows single wallet scope', () => {
      render(
        <GraphLiteVisualizer
          flowData={mockFlowData}
          freshness={mockFreshness}
          walletScope={mockWalletScope}
          version="v0"
        />
      );

      expect(screen.getByText(/Scope: Single Wallet/i)).toBeInTheDocument();
    });

    test('shows all wallets scope', () => {
      const allWalletsScope: WalletScope = { mode: 'all_wallets' };

      render(
        <GraphLiteVisualizer
          flowData={mockFlowData}
          freshness={mockFreshness}
          walletScope={allWalletsScope}
          version="v0"
        />
      );

      expect(screen.getByText(/Scope: All Wallets/i)).toBeInTheDocument();
    });
  });
});
