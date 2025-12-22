import React from 'react';
import { ActionableEmptyState, type EmptyStateAction, type ScanChecklist } from './ActionableEmptyState';
import { Wallet, Plus, RefreshCw, ExternalLink } from 'lucide-react';

interface PortfolioEmptyStateProps {
  hasWalletConnected?: boolean;
  onConnectWallet?: () => void;
  onAddAddress?: () => void;
  onRefresh?: () => void;
  onLearnMore?: () => void;
  isRefreshing?: boolean;
  className?: string;
}

export function PortfolioEmptyState({
  hasWalletConnected = false,
  onConnectWallet,
  onAddAddress,
  onRefresh,
  onLearnMore,
  isRefreshing = false,
  className
}: PortfolioEmptyStateProps) {
  const getTitle = () => {
    if (!hasWalletConnected) {
      return 'Connect Your Wallet';
    }
    return 'No Portfolio Data Available';
  };

  const getDescription = () => {
    if (!hasWalletConnected) {
      return 'Connect your wallet to start monitoring your portfolio performance and track your DeFi positions.';
    }
    return 'Your connected wallet doesn\'t have any trackable assets or the data is still loading. Try refreshing or add additional addresses to monitor.';
  };

  const actions: EmptyStateAction[] = [];

  if (!hasWalletConnected && onConnectWallet) {
    actions.push({
      label: 'Connect Wallet',
      onClick: onConnectWallet,
      variant: 'default',
      icon: Wallet
    });
  } else {
    if (onAddAddress) {
      actions.push({
        label: 'Add Address',
        onClick: onAddAddress,
        variant: 'default',
        icon: Plus
      });
    }
  }

  if (onLearnMore) {
    actions.push({
      label: 'Learn about portfolio tracking',
      onClick: onLearnMore,
      variant: 'outline',
      icon: ExternalLink,
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
          item: 'Portfolio tracking prepared', 
          checked: true,
          description: 'Multi-chain support ready'
        },
        { 
          item: 'DeFi position detection ready', 
          checked: true,
          description: 'Uniswap, Aave, Compound, etc.'
        },
        { 
          item: 'Token balance tracking ready', 
          checked: true,
          description: 'ERC-20, native tokens'
        },
        { 
          item: 'NFT collection monitoring ready', 
          checked: true,
          description: 'Floor prices, rarity scores'
        }
      ];
    }

    return [
      { 
        item: 'Wallet addresses scanned', 
        checked: true,
        description: 'Connected wallet analyzed'
      },
      { 
        item: 'Token balances checked', 
        checked: true,
        description: 'ERC-20 and native tokens'
      },
      { 
        item: 'DeFi positions analyzed', 
        checked: true,
        description: 'Lending, staking, LP positions'
      },
      { 
        item: 'NFT collections reviewed', 
        checked: true,
        description: 'Floor prices and metadata'
      },
      { 
        item: 'Cross-chain assets monitored', 
        checked: true,
        description: 'Ethereum, Polygon, BSC, Arbitrum'
      },
      { 
        item: 'Historical performance calculated', 
        checked: true,
        description: 'P&L, ROI, time-weighted returns'
      }
    ];
  };

  return (
    <ActionableEmptyState
      type={hasWalletConnected ? 'no-data-available' : 'no-data-available'}
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