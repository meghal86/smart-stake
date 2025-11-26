/**
 * useHarvestFilters Hook
 * Integrates filter store with URL persistence and provides filtered opportunities
 */

import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useHarvestFilterStore } from '@/stores/useHarvestFilterStore';
import { applyFilters, hasActiveFilters, getActiveFilterCount } from '@/lib/harvestpro/filter-application';
import type { HarvestOpportunity } from '@/types/harvestpro';

export function useHarvestFilters(opportunities: HarvestOpportunity[]) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filterStore = useHarvestFilterStore();

  // Load filters from localStorage on mount
  useEffect(() => {
    filterStore.loadFromLocalStorage();
  }, []);

  // Load filters from URL on mount and when URL changes
  useEffect(() => {
    if (searchParams.toString()) {
      filterStore.loadFromURL(searchParams);
    }
  }, [searchParams]);

  // Sync filters to URL when they change
  useEffect(() => {
    const params = filterStore.toURLSearchParams();
    const currentParams = searchParams.toString();
    const newParams = params.toString();

    if (currentParams !== newParams) {
      setSearchParams(params, { replace: true });
    }
  }, [
    filterStore.search,
    filterStore.types,
    filterStore.wallets,
    filterStore.riskLevels,
    filterStore.minBenefit,
    filterStore.holdingPeriod,
    filterStore.gasEfficiency,
    filterStore.liquidity,
    filterStore.sort,
  ]);

  // Apply filters to opportunities
  const filteredOpportunities = useMemo(() => {
    return applyFilters(opportunities, {
      search: filterStore.search,
      types: filterStore.types,
      wallets: filterStore.wallets,
      riskLevels: filterStore.riskLevels,
      minBenefit: filterStore.minBenefit,
      holdingPeriod: filterStore.holdingPeriod,
      gasEfficiency: filterStore.gasEfficiency,
      liquidity: filterStore.liquidity,
      sort: filterStore.sort,
    });
  }, [
    opportunities,
    filterStore.search,
    filterStore.types,
    filterStore.wallets,
    filterStore.riskLevels,
    filterStore.minBenefit,
    filterStore.holdingPeriod,
    filterStore.gasEfficiency,
    filterStore.liquidity,
    filterStore.sort,
  ]);

  // Check if filters are active
  const isFiltered = useMemo(() => {
    return hasActiveFilters({
      search: filterStore.search,
      types: filterStore.types,
      wallets: filterStore.wallets,
      riskLevels: filterStore.riskLevels,
      minBenefit: filterStore.minBenefit,
      holdingPeriod: filterStore.holdingPeriod,
      gasEfficiency: filterStore.gasEfficiency,
      liquidity: filterStore.liquidity,
      sort: filterStore.sort,
    });
  }, [
    filterStore.search,
    filterStore.types,
    filterStore.wallets,
    filterStore.riskLevels,
    filterStore.minBenefit,
    filterStore.holdingPeriod,
    filterStore.gasEfficiency,
    filterStore.liquidity,
    filterStore.sort,
  ]);

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    return getActiveFilterCount({
      search: filterStore.search,
      types: filterStore.types,
      wallets: filterStore.wallets,
      riskLevels: filterStore.riskLevels,
      minBenefit: filterStore.minBenefit,
      holdingPeriod: filterStore.holdingPeriod,
      gasEfficiency: filterStore.gasEfficiency,
      liquidity: filterStore.liquidity,
      sort: filterStore.sort,
    });
  }, [
    filterStore.search,
    filterStore.types,
    filterStore.wallets,
    filterStore.riskLevels,
    filterStore.minBenefit,
    filterStore.holdingPeriod,
    filterStore.gasEfficiency,
    filterStore.liquidity,
    filterStore.sort,
  ]);

  return {
    // Filtered data
    filteredOpportunities,
    isFiltered,
    activeFilterCount,

    // Filter state
    filters: {
      search: filterStore.search,
      types: filterStore.types,
      wallets: filterStore.wallets,
      riskLevels: filterStore.riskLevels,
      minBenefit: filterStore.minBenefit,
      holdingPeriod: filterStore.holdingPeriod,
      gasEfficiency: filterStore.gasEfficiency,
      liquidity: filterStore.liquidity,
      sort: filterStore.sort,
    },

    // Filter actions
    setSearch: filterStore.setSearch,
    setTypes: filterStore.setTypes,
    setWallets: filterStore.setWallets,
    setRiskLevels: filterStore.setRiskLevels,
    setMinBenefit: filterStore.setMinBenefit,
    setHoldingPeriod: filterStore.setHoldingPeriod,
    setGasEfficiency: filterStore.setGasEfficiency,
    setLiquidity: filterStore.setLiquidity,
    setSort: filterStore.setSort,
    setFilters: filterStore.setFilters,
    resetFilters: filterStore.resetFilters,
    clearFilters: filterStore.clearFilters,
    toggleRiskLevel: filterStore.toggleRiskLevel,
    toggleWallet: filterStore.toggleWallet,
    toggleType: filterStore.toggleType,
  };
}
