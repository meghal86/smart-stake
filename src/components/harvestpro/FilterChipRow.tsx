/**
 * FilterChipRow Component
 * Horizontally scrollable filter chips matching Hunter style
 * Integrated with Zustand filter store
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useHarvestFilterStore } from '@/stores/useHarvestFilterStore';

export type FilterChipType =
  | 'All'
  | 'High Benefit'
  | 'Short-Term Loss'
  | 'Long-Term Loss'
  | 'CEX Holdings'
  | 'Gas Efficient'
  | 'Illiquid'
  | 'Safe'
  | 'High Risk'
  | 'Favorites';

interface FilterChipRowProps {
  walletFilters?: string[];
  className?: string;
}

const defaultFilters: FilterChipType[] = [
  'All',
  'High Benefit',
  'Short-Term Loss',
  'Long-Term Loss',
  'CEX Holdings',
  'Gas Efficient',
  'Illiquid',
  'Safe',
  'High Risk',
  'Favorites',
];

export function FilterChipRow({
  walletFilters = [],
  className,
}: FilterChipRowProps) {
  const {
    minBenefit,
    holdingPeriod,
    gasEfficiency,
    liquidity,
    riskLevels,
    types,
    wallets,
    setMinBenefit,
    setHoldingPeriod,
    setGasEfficiency,
    setLiquidity,
    toggleRiskLevel,
    toggleType,
    toggleWallet,
    resetFilters,
  } = useHarvestFilterStore();

  const handleFilterChange = (filter: FilterChipType) => {
    switch (filter) {
      case 'All':
        resetFilters();
        break;
      case 'High Benefit':
        setMinBenefit(minBenefit === 1000 ? 0 : 1000);
        break;
      case 'Short-Term Loss':
        setHoldingPeriod(holdingPeriod === 'short-term' ? 'all' : 'short-term');
        break;
      case 'Long-Term Loss':
        setHoldingPeriod(holdingPeriod === 'long-term' ? 'all' : 'long-term');
        break;
      case 'CEX Holdings':
        toggleType('cex-position');
        break;
      case 'Gas Efficient':
        setGasEfficiency(gasEfficiency === 'A' ? 'all' : 'A');
        break;
      case 'Illiquid':
        setLiquidity(liquidity === 'low' ? 'all' : 'low');
        break;
      case 'Safe':
        toggleRiskLevel('LOW');
        break;
      case 'High Risk':
        toggleRiskLevel('HIGH');
        break;
      case 'Favorites':
        // TODO: Implement favorites functionality
        break;
    }
  };

  const isFilterActive = (filter: FilterChipType): boolean => {
    switch (filter) {
      case 'All':
        return (
          minBenefit === 0 &&
          holdingPeriod === 'all' &&
          gasEfficiency === 'all' &&
          liquidity === 'all' &&
          riskLevels.length === 0 &&
          types.length === 0 &&
          wallets.length === 0
        );
      case 'High Benefit':
        return minBenefit >= 1000;
      case 'Short-Term Loss':
        return holdingPeriod === 'short-term';
      case 'Long-Term Loss':
        return holdingPeriod === 'long-term';
      case 'CEX Holdings':
        return types.includes('cex-position');
      case 'Gas Efficient':
        return gasEfficiency === 'A';
      case 'Illiquid':
        return liquidity === 'low';
      case 'Safe':
        return riskLevels.includes('LOW');
      case 'High Risk':
        return riskLevels.includes('HIGH');
      case 'Favorites':
        return false; // TODO: Implement favorites
      default:
        return false;
    }
  };

  return (
    <motion.div
      className={cn(
        'flex gap-2 overflow-x-auto scrollbar-hide pb-2',
        'scroll-smooth snap-x snap-mandatory',
        className
      )}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      {defaultFilters.map((filter) => (
        <motion.button
          key={filter}
          onClick={() => handleFilterChange(filter)}
          className={cn(
            'flex-shrink-0 px-4 h-8 rounded-2xl border text-sm font-medium',
            'transition-all duration-200 snap-start',
            isFilterActive(filter)
              ? 'bg-[#ed8f2d] border-[#ed8f2d] text-white shadow-[0_0_20px_rgba(237,143,45,0.3)]'
              : 'bg-transparent border-[rgba(255,255,255,0.1)] text-gray-300 hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.2)]'
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {filter}
        </motion.button>
      ))}

      {/* Wallet-specific filters */}
      {walletFilters.length > 0 && (
        <>
          <div className="w-px h-8 bg-[rgba(255,255,255,0.1)] flex-shrink-0" />
          {walletFilters.map((wallet) => (
            <motion.button
              key={wallet}
              onClick={() => toggleWallet(wallet)}
              className={cn(
                'flex-shrink-0 px-4 h-8 rounded-2xl border text-sm font-medium',
                'transition-all duration-200 snap-start',
                wallets.includes(wallet)
                  ? 'bg-[#ed8f2d] border-[#ed8f2d] text-white shadow-[0_0_20px_rgba(237,143,45,0.3)]'
                  : 'bg-transparent border-[rgba(255,255,255,0.1)] text-gray-300 hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.2)]'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {wallet.slice(0, 6)}...{wallet.slice(-4)}
            </motion.button>
          ))}
        </>
      )}
    </motion.div>
  );
}
