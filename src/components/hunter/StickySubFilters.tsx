/**
 * StickySubFilters Component
 * 
 * Sticky quick filters that appear below tabs and become fixed on scroll.
 * Provides quick access to common filters: Chain, Trust, Reward, Time Left
 * 
 * Requirements: 7.2
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ChevronDown } from 'lucide-react';
import { FilterState, Chain, TrustLevel } from '@/types/hunter';

export interface StickySubFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
  isDarkTheme?: boolean;
}

// Quick filter configurations
const CHAIN_OPTIONS: { value: Chain | 'all'; label: string }[] = [
  { value: 'all', label: 'All Chains' },
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'base', label: 'Base' },
  { value: 'arbitrum', label: 'Arbitrum' },
  { value: 'optimism', label: 'Optimism' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'solana', label: 'Solana' },
  { value: 'avalanche', label: 'Avalanche' },
];

const TRUST_OPTIONS: { value: number; label: string; color: string }[] = [
  { value: 0, label: 'All Trust Levels', color: 'gray' },
  { value: 80, label: 'Green (≥80)', color: 'green' },
  { value: 60, label: 'Amber (≥60)', color: 'amber' },
];

const REWARD_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Any Reward' },
  { value: 100, label: '$100+' },
  { value: 500, label: '$500+' },
  { value: 1000, label: '$1,000+' },
  { value: 5000, label: '$5,000+' },
];

const TIME_LEFT_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Any Time' },
  { value: 24, label: '<24 hours' },
  { value: 48, label: '<48 hours' },
  { value: 168, label: '<1 week' },
];

export function StickySubFilters({
  filters,
  onFilterChange,
  isDarkTheme = true,
}: StickySubFiltersProps) {
  const [isSticky, setIsSticky] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [offsetTop, setOffsetTop] = useState(0);

  // Track scroll position for sticky behavior
  useEffect(() => {
    if (containerRef.current) {
      setOffsetTop(containerRef.current.offsetTop);
    }

    const handleScroll = () => {
      if (containerRef.current) {
        const scrollPosition = window.scrollY;
        const threshold = offsetTop - 80; // Account for header height
        setIsSticky(scrollPosition > threshold);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Check initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [offsetTop]);

  // Handle chain filter change
  const handleChainChange = (value: string) => {
    if (value === 'all') {
      onFilterChange({ chains: [] });
    } else {
      const chain = value as Chain;
      const currentChains = filters.chains || [];
      const hasChain = currentChains.includes(chain);
      
      if (hasChain) {
        onFilterChange({ chains: currentChains.filter(c => c !== chain) });
      } else {
        onFilterChange({ chains: [...currentChains, chain] });
      }
    }
  };

  // Handle trust filter change
  const handleTrustChange = (value: string) => {
    const trustMin = parseInt(value, 10);
    onFilterChange({ trustMin });
  };

  // Handle reward filter change
  const handleRewardChange = (value: string) => {
    const rewardMin = parseInt(value, 10);
    onFilterChange({ rewardMin });
  };

  // Handle time left filter change
  const handleTimeLeftChange = (value: string) => {
    const hours = parseInt(value, 10);
    if (hours === 0) {
      // Clear urgency filters
      onFilterChange({ urgency: [] });
    } else if (hours === 24) {
      onFilterChange({ urgency: ['new'] });
    } else if (hours === 48) {
      onFilterChange({ urgency: ['ending_soon'] });
    } else {
      // For 1 week, show ending soon items
      onFilterChange({ urgency: ['ending_soon'] });
    }
  };

  // Clear all quick filters
  const handleClearAll = () => {
    onFilterChange({
      chains: [],
      trustMin: 80,
      rewardMin: 0,
      urgency: [],
    });
  };

  // Count active filters
  const activeFilterCount = 
    (filters.chains?.length || 0) +
    (filters.trustMin !== 80 ? 1 : 0) +
    (filters.rewardMin > 0 ? 1 : 0) +
    (filters.urgency?.length || 0);

  const containerClasses = `
    transition-all duration-300 z-30
    ${isSticky ? 'fixed top-20 left-0 right-0 shadow-lg' : 'relative'}
    ${isDarkTheme 
      ? 'bg-[#0A0E1A]/95 backdrop-blur-xl border-white/10' 
      : 'bg-white/95 backdrop-blur-xl border-gray-200'
    }
  `;

  return (
    <div ref={containerRef}>
      <motion.div
        className={containerClasses}
        initial={false}
        animate={{
          y: isSticky ? 0 : 0,
          borderBottomWidth: isSticky ? 1 : 0,
        }}
        transition={{ duration: 0.2 }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 overflow-x-auto scrollbar-none">
            {/* Chain Filter */}
            <div className="flex-shrink-0">
              <Select
                value={filters.chains?.length === 0 ? 'all' : filters.chains?.[0] || 'all'}
                onValueChange={handleChainChange}
              >
                <SelectTrigger
                  className={`h-9 min-w-[140px] text-sm ${
                    isDarkTheme
                      ? 'bg-white/5 border-white/10 text-gray-300'
                      : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                  aria-label="Filter by chain"
                >
                  <SelectValue placeholder="All Chains" />
                </SelectTrigger>
                <SelectContent>
                  {CHAIN_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Trust Filter */}
            <div className="flex-shrink-0">
              <Select
                value={filters.trustMin?.toString() || '80'}
                onValueChange={handleTrustChange}
              >
                <SelectTrigger
                  className={`h-9 min-w-[160px] text-sm ${
                    isDarkTheme
                      ? 'bg-white/5 border-white/10 text-gray-300'
                      : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                  aria-label="Filter by trust level"
                >
                  <SelectValue placeholder="All Trust Levels" />
                </SelectTrigger>
                <SelectContent>
                  {TRUST_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      <span className="flex items-center gap-2">
                        {option.value > 0 && (
                          <span
                            className={`w-2 h-2 rounded-full ${
                              option.color === 'green'
                                ? 'bg-green-500'
                                : option.color === 'amber'
                                ? 'bg-amber-500'
                                : 'bg-gray-500'
                            }`}
                            aria-hidden="true"
                          />
                        )}
                        {option.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Reward Filter */}
            <div className="flex-shrink-0">
              <Select
                value={filters.rewardMin?.toString() || '0'}
                onValueChange={handleRewardChange}
              >
                <SelectTrigger
                  className={`h-9 min-w-[140px] text-sm ${
                    isDarkTheme
                      ? 'bg-white/5 border-white/10 text-gray-300'
                      : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                  aria-label="Filter by minimum reward"
                >
                  <SelectValue placeholder="Any Reward" />
                </SelectTrigger>
                <SelectContent>
                  {REWARD_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Time Left Filter */}
            <div className="flex-shrink-0">
              <Select
                value={
                  filters.urgency?.includes('new')
                    ? '24'
                    : filters.urgency?.includes('ending_soon')
                    ? '48'
                    : '0'
                }
                onValueChange={handleTimeLeftChange}
              >
                <SelectTrigger
                  className={`h-9 min-w-[140px] text-sm ${
                    isDarkTheme
                      ? 'bg-white/5 border-white/10 text-gray-300'
                      : 'bg-gray-50 border-gray-200 text-gray-700'
                  }`}
                  aria-label="Filter by time remaining"
                >
                  <SelectValue placeholder="Any Time" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_LEFT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value.toString()}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Active Filter Count Badge */}
            <AnimatePresence>
              {activeFilterCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex-shrink-0"
                >
                  <Badge
                    variant="secondary"
                    className={`h-9 px-3 text-sm ${
                      isDarkTheme
                        ? 'bg-[#00F5A0]/10 text-[#00F5A0] border-[#00F5A0]/20'
                        : 'bg-[#00F5A0]/10 text-[#00A070] border-[#00F5A0]/30'
                    }`}
                  >
                    {activeFilterCount} active
                  </Badge>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Clear All Button */}
            <AnimatePresence>
              {activeFilterCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex-shrink-0 ml-auto"
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className={`h-9 text-sm ${
                      isDarkTheme
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    aria-label="Clear all quick filters"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Spacer to prevent content jump when sticky */}
      {isSticky && <div className="h-[60px]" aria-hidden="true" />}
    </div>
  );
}
