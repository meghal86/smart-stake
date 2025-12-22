import React from 'react';
import { ActionableEmptyState, type EmptyStateAction, type ScanChecklist } from './ActionableEmptyState';
import { Wallet, Calculator, BookOpen } from 'lucide-react';

interface HarvestProEmptyStateProps {
  hasWalletConnected?: boolean;
  hasPositions?: boolean;
  onConnectWallet?: () => void;
  onLearnMore?: () => void;
  onRefresh?: () => void;
  onViewTaxGuide?: () => void;
  isRefreshing?: boolean;
  totalPositionsScanned?: number;
  className?: string;
}

export function HarvestProEmptyState({
  hasWalletConnected = false,
  hasPositions = false,
  onConnectWallet,
  onLearnMore,
  onRefresh,
  onViewTaxGuide,
  isRefreshing = false,
  totalPositionsScanned = 0,
  className
}: HarvestProEmptyStateProps) {
  const getTitle = () => {
    if (!hasWalletConnected) {
      return 'Connect Wallet for Tax Loss Harvesting';
    }
    if (!hasPositions) {
      return 'No Harvest Opportunities Available';
    }
    return 'No Tax Loss Harvesting Opportunities';
  };

  const getDescription = () => {
    if (!hasWalletConnected) {
      return 'Connect your wallet to analyze your portfolio for tax loss harvesting opportunities and optimize your tax strategy.';
    }
    if (!hasPositions) {
      return 'Your portfolio doesn\'t have any positions with unrealized losses suitable for tax loss harvesting at this time.';
    }
    return 'All your positions are currently profitable or don\'t meet the criteria for tax loss harvesting. Check back later as market conditions change.';
  };

  const actions: EmptyStateAction[] = [];

  if (!hasWalletConnected && onConnectWallet) {
    actions.push({
      label: 'Connect Wallet',
      onClick: onConnectWallet,
      variant: 'default',
      icon: Wallet
    });
  }

  if (onViewTaxGuide) {
    actions.push({
      label: 'Learn about tax loss harvesting',
      onClick: onViewTaxGuide,
      variant: 'outline',
      icon: BookOpen,
      external: true
    });
  }

  if (onLearnMore) {
    actions.push({
      label: 'How HarvestPro works',
      onClick: onLearnMore,
      variant: 'outline',
      icon: Calculator,
      external: true
    });
  }

  const getScanChecklist = (): ScanChecklist[] => {
    if (!hasWalletConnected) {
      return [
        { 
          item: 'Wallet connection ready', 
          checked: false,
          description: 'MetaMask, WalletConnect, etc.'
        },
        { 
          item: 'Portfolio analysis prepared', 
          checked: true,
          description: 'Tax loss harvesting engine ready'
        },
        { 
          item: 'DeFi position detection ready', 
          checked: true,
          description: 'Uniswap, Aave, Compound, etc.'
        },
        { 
          item: 'Tax calculation engine ready', 
          checked: true,
          description: 'FIFO, LIFO, specific ID methods'
        },
        { 
          item: 'Compliance checks ready', 
          checked: true,
          description: 'Wash sale rules, holding periods'
        }
      ];
    }

    const checklist = [
      { 
        item: 'Portfolio positions analyzed', 
        checked: true,
        description: `${totalPositionsScanned} positions scanned`
      },
      { 
        item: 'Unrealized losses calculated', 
        checked: true,
        description: 'FIFO cost basis method applied'
      },
      { 
        item: 'Tax implications assessed', 
        checked: true,
        description: 'Short-term vs long-term gains'
      },
      { 
        item: 'Wash sale rules checked', 
        checked: true,
        description: '30-day rule compliance'
      },
      { 
        item: 'Gas costs factored', 
        checked: true,
        description: 'Transaction fees vs tax savings'
      },
      { 
        item: 'Market conditions evaluated', 
        checked: true,
        description: 'Liquidity and slippage analysis'
      }
    ];

    if (hasPositions) {
      checklist.push({
        item: 'Harvest opportunities filtered',
        checked: true,
        description: 'Minimum threshold and profitability checks'
      });
    }

    return checklist;
  };

  return (
    <ActionableEmptyState
      type={hasWalletConnected ? 'no-opportunities' : 'no-data-available'}
      title={getTitle()}
      description={getDescription()}
      actions={actions}
      scanChecklist={getScanChecklist()}
      showRefresh={hasWalletConnected && !!onRefresh}
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
      className={className}
    />
  );
}