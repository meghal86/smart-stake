import React from 'react';
import { ActionableEmptyState, type EmptyStateAction, type ScanChecklist } from './ActionableEmptyState';
import { Filter, TrendingUp, RefreshCw, Settings } from 'lucide-react';

interface HunterEmptyStateProps {
  activeFilter?: string;
  searchQuery?: string;
  onClearFilters?: () => void;
  onAdjustFilters?: () => void;
  onViewAll?: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  totalProtocolsScanned?: number;
  className?: string;
}

export function HunterEmptyState({
  activeFilter,
  searchQuery,
  onClearFilters,
  onAdjustFilters,
  onViewAll,
  onRefresh,
  isRefreshing = false,
  totalProtocolsScanned = 847,
  className
}: HunterEmptyStateProps) {
  const getEmptyStateType = () => {
    if (searchQuery) return 'no-search-results';
    if (activeFilter && activeFilter !== 'all') return 'filters-no-match';
    return 'no-opportunities';
  };

  const getTitle = () => {
    if (searchQuery) return `No results for "${searchQuery}"`;
    if (activeFilter && activeFilter !== 'all') {
      return `No ${activeFilter} opportunities available`;
    }
    return 'No opportunities available right now';
  };

  const getDescription = () => {
    if (searchQuery) {
      return 'Try adjusting your search terms or removing filters to find more opportunities.';
    }
    if (activeFilter && activeFilter !== 'all') {
      return `No ${activeFilter.toLowerCase()} opportunities match your criteria. Try adjusting your filters or check back later.`;
    }
    return 'AI Copilot is continuously scanning for new opportunities across all protocols. Check back soon for updates.';
  };

  const actions: EmptyStateAction[] = [];

  if (searchQuery || (activeFilter && activeFilter !== 'all')) {
    if (onClearFilters) {
      actions.push({
        label: searchQuery ? 'Clear search' : 'Clear filters',
        onClick: onClearFilters,
        variant: 'default',
        icon: RefreshCw
      });
    }
  }

  if (onAdjustFilters) {
    actions.push({
      label: 'Adjust filters',
      onClick: onAdjustFilters,
      variant: 'outline',
      icon: Filter
    });
  }

  if (onViewAll) {
    actions.push({
      label: 'View all opportunities',
      onClick: onViewAll,
      variant: 'outline',
      icon: TrendingUp
    });
  }

  const getScanChecklist = (): ScanChecklist[] => {
    const baseChecklist = [
      { 
        item: 'DeFi protocols scanned', 
        checked: true,
        description: `${totalProtocolsScanned.toLocaleString()} protocols`
      },
      { 
        item: 'Yield farming opportunities checked', 
        checked: true,
        description: 'Uniswap, SushiSwap, Curve, etc.'
      },
      { 
        item: 'Staking rewards analyzed', 
        checked: true,
        description: 'ETH 2.0, liquid staking, etc.'
      },
      { 
        item: 'Liquidity mining programs reviewed', 
        checked: true,
        description: 'Active reward programs'
      },
      { 
        item: 'New token launches monitored', 
        checked: true,
        description: 'IDOs, airdrops, presales'
      }
    ];

    if (activeFilter && activeFilter !== 'all') {
      // Add filter-specific checklist items
      switch (activeFilter.toLowerCase()) {
        case 'staking':
          baseChecklist.push({
            item: 'Staking protocols filtered',
            checked: true,
            description: 'Ethereum, Cardano, Solana, etc.'
          });
          break;
        case 'airdrops':
          baseChecklist.push({
            item: 'Airdrop eligibility checked',
            checked: true,
            description: 'Based on wallet activity'
          });
          break;
        case 'nft':
          baseChecklist.push({
            item: 'NFT opportunities scanned',
            checked: true,
            description: 'Mints, drops, whitelist spots'
          });
          break;
        case 'quests':
          baseChecklist.push({
            item: 'Protocol quests reviewed',
            checked: true,
            description: 'Galxe, Layer3, QuestN, etc.'
          });
          break;
      }
    }

    return baseChecklist;
  };

  return (
    <ActionableEmptyState
      type={getEmptyStateType()}
      title={getTitle()}
      description={getDescription()}
      actions={actions}
      scanChecklist={getScanChecklist()}
      showRefresh={!!onRefresh}
      onRefresh={onRefresh}
      isRefreshing={isRefreshing}
      className={className}
    />
  );
}