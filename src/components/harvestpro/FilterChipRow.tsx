/**
 * FilterChipRow Component
 * Horizontally scrollable filter chips matching Hunter style
 */

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

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
  selectedFilter: FilterChipType;
  onFilterChange: (filter: FilterChipType) => void;
  walletFilters?: string[];
  onWalletFilterChange?: (wallet: string) => void;
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
  selectedFilter,
  onFilterChange,
  walletFilters = [],
  onWalletFilterChange,
  className,
}: FilterChipRowProps) {
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
          onClick={() => onFilterChange(filter)}
          className={cn(
            'flex-shrink-0 px-4 h-8 rounded-2xl border text-sm font-medium',
            'transition-all duration-200 snap-start',
            selectedFilter === filter
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
              onClick={() => onWalletFilterChange?.(wallet)}
              className={cn(
                'flex-shrink-0 px-4 h-8 rounded-2xl border text-sm font-medium',
                'transition-all duration-200 snap-start',
                'bg-transparent border-[rgba(255,255,255,0.1)] text-gray-300',
                'hover:bg-[rgba(255,255,255,0.05)] hover:border-[rgba(255,255,255,0.2)]'
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
