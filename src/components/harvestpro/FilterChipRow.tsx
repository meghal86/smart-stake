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

  const getFilterDescription = (filter: FilterChipType): string => {
    switch (filter) {
      case 'All':
        return 'Show all harvest opportunities';
      case 'High Benefit':
        return 'Show opportunities with net benefit over $1,000';
      case 'Short-Term Loss':
        return 'Show short-term capital losses only';
      case 'Long-Term Loss':
        return 'Show long-term capital losses only';
      case 'CEX Holdings':
        return 'Show centralized exchange positions';
      case 'Gas Efficient':
        return 'Show opportunities with grade A gas efficiency';
      case 'Illiquid':
        return 'Show opportunities with low liquidity';
      case 'Safe':
        return 'Show low risk opportunities only';
      case 'High Risk':
        return 'Show high risk opportunities only';
      case 'Favorites':
        return 'Show saved favorite opportunities';
      default:
        return `Filter by ${filter}`;
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
      role="group"
      aria-label="Filter harvest opportunities"
    >
      {defaultFilters.map((filter) => (
        <motion.button
          key={filter}
          onClick={() => handleFilterChange(filter)}
          className={cn(
            'flex-shrink-0 px-4 h-8 rounded-2xl border text-sm font-medium',
            'transition-all duration-200 snap-start',
            'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900',
            isFilterActive(filter)
              ? 'bg-[#ed8f2d] border-[#ed8f2d] text-white shadow-[0_0_20px_rgba(237,143,45,0.3)]'
              : 'bg-transparent border-[rgba(255,255,255,0.1)] text-gray-300 hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.2)]'
          )}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          aria-pressed={isFilterActive(filter)}
          aria-label={`${filter} filter: ${getFilterDescription(filter)}`}
          title={getFilterDescription(filter)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleFilterChange(filter);
            }
          }}
        >
          {filter}
        </motion.button>
      ))}

      {/* Wallet-specific filters */}
      {walletFilters.length > 0 && (
        <>
          <div 
            className="w-px h-8 bg-[rgba(255,255,255,0.1)] flex-shrink-0" 
            role="separator"
            aria-hidden="true"
          />
          {walletFilters.map((wallet) => (
            <motion.button
              key={wallet}
              onClick={() => toggleWallet(wallet)}
              className={cn(
                'flex-shrink-0 px-4 h-8 rounded-2xl border text-sm font-medium',
                'transition-all duration-200 snap-start',
                'focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900',
                wallets.includes(wallet)
                  ? 'bg-[#ed8f2d] border-[#ed8f2d] text-white shadow-[0_0_20px_rgba(237,143,45,0.3)]'
                  : 'bg-transparent border-[rgba(255,255,255,0.1)] text-gray-300 hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.2)]'
              )}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              aria-pressed={wallets.includes(wallet)}
              aria-label={`Filter by wallet ${wallet}: ${wallets.includes(wallet) ? 'active' : 'inactive'}`}
              title={`Filter opportunities from wallet ${wallet}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleWallet(wallet);
                }
              }}
            >
              {wallet.slice(0, 6)}...{wallet.slice(-4)}
            </motion.button>
          ))}
        </>
      )}
    </motion.div>
  );
}
