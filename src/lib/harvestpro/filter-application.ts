/**
 * Filter Application Logic
 * Applies filter criteria to harvest opportunities
 */

import type { HarvestOpportunity, FilterState } from '@/types/harvestpro';

/**
 * Apply all active filters to a list of harvest opportunities
 * @param opportunities - List of harvest opportunities to filter
 * @param filters - Active filter state
 * @returns Filtered and sorted list of opportunities
 */
export function applyFilters(
  opportunities: HarvestOpportunity[],
  filters: FilterState
): HarvestOpportunity[] {
  let filtered = [...opportunities];

  // Apply search filter
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (opp) =>
        opp.token.toLowerCase().includes(searchLower) ||
        opp.metadata.walletName?.toLowerCase().includes(searchLower) ||
        opp.metadata.venue?.toLowerCase().includes(searchLower)
    );
  }

  // Apply type filters
  if (filters.types.length > 0) {
    filtered = filtered.filter((opp) => {
      // Determine opportunity type based on metadata
      if (filters.types.includes('cex-position') && opp.metadata.venue?.includes('CEX')) {
        return true;
      }
      if (filters.types.includes('harvest') && opp.recommendationBadge === 'recommended') {
        return true;
      }
      if (filters.types.includes('loss-lot') && opp.unrealizedLoss > 0) {
        return true;
      }
      return false;
    });
  }

  // Apply wallet filters
  if (filters.wallets.length > 0) {
    filtered = filtered.filter((opp) =>
      filters.wallets.some((wallet) => opp.metadata.walletName?.includes(wallet))
    );
  }

  // Apply risk level filters
  if (filters.riskLevels.length > 0) {
    filtered = filtered.filter((opp) => filters.riskLevels.includes(opp.riskLevel));
  }

  // Apply minimum benefit filter
  if (filters.minBenefit > 0) {
    filtered = filtered.filter((opp) => opp.netTaxBenefit >= filters.minBenefit);
  }

  // Apply holding period filter
  if (filters.holdingPeriod !== 'all') {
    filtered = filtered.filter((opp) => {
      // Calculate holding period from lot data (would need to fetch lot data in real implementation)
      // For now, we'll use a heuristic based on the opportunity metadata
      const isLongTerm = filters.holdingPeriod === 'long-term';
      const isShortTerm = filters.holdingPeriod === 'short-term';
      
      // This is a placeholder - in real implementation, we'd need to fetch lot data
      // or include holding period in the opportunity object
      return true; // TODO: Implement proper holding period filtering
    });
  }

  // Apply gas efficiency filter
  if (filters.gasEfficiency !== 'all') {
    filtered = filtered.filter((opp) => {
      const gasEfficiency = calculateGasEfficiency(opp);
      return gasEfficiency === filters.gasEfficiency;
    });
  }

  // Apply liquidity filter
  if (filters.liquidity !== 'all') {
    filtered = filtered.filter((opp) => {
      const liquidity = determineLiquidity(opp);
      return liquidity === filters.liquidity;
    });
  }

  // Apply sorting
  filtered = applySorting(filtered, filters.sort);

  return filtered;
}

/**
 * Calculate gas efficiency grade for an opportunity
 */
function calculateGasEfficiency(opportunity: HarvestOpportunity): 'A' | 'B' | 'C' {
  const gasRatio = opportunity.gasEstimate / opportunity.unrealizedLoss;

  if (gasRatio < 0.02) return 'A'; // Less than 2% gas cost
  if (gasRatio < 0.05) return 'B'; // Less than 5% gas cost
  return 'C'; // 5% or more gas cost
}

/**
 * Determine liquidity level for an opportunity
 */
function determineLiquidity(opportunity: HarvestOpportunity): 'high' | 'medium' | 'low' {
  // Use slippage estimate as a proxy for liquidity
  const slippageRatio = opportunity.slippageEstimate / opportunity.unrealizedLoss;

  if (slippageRatio < 0.01) return 'high'; // Less than 1% slippage
  if (slippageRatio < 0.03) return 'medium'; // Less than 3% slippage
  return 'low'; // 3% or more slippage
}

/**
 * Apply sorting to opportunities
 */
function applySorting(
  opportunities: HarvestOpportunity[],
  sort: FilterState['sort']
): HarvestOpportunity[] {
  const sorted = [...opportunities];

  switch (sort) {
    case 'net-benefit-desc':
      return sorted.sort((a, b) => b.netTaxBenefit - a.netTaxBenefit);

    case 'loss-amount-desc':
      return sorted.sort((a, b) => b.unrealizedLoss - a.unrealizedLoss);

    case 'guardian-score-desc':
      return sorted.sort((a, b) => b.guardianScore - a.guardianScore);

    case 'gas-efficiency-asc':
      return sorted.sort((a, b) => {
        const aRatio = a.gasEstimate / a.unrealizedLoss;
        const bRatio = b.gasEstimate / b.unrealizedLoss;
        return aRatio - bRatio;
      });

    case 'newest':
      return sorted.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    default:
      return sorted;
  }
}

/**
 * Check if any filters are active (non-default)
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.search !== '' ||
    filters.types.length > 0 ||
    filters.wallets.length > 0 ||
    filters.riskLevels.length > 0 ||
    filters.minBenefit > 0 ||
    filters.holdingPeriod !== 'all' ||
    filters.gasEfficiency !== 'all' ||
    filters.liquidity !== 'all' ||
    filters.sort !== 'net-benefit-desc'
  );
}

/**
 * Get a count of active filters
 */
export function getActiveFilterCount(filters: FilterState): number {
  let count = 0;

  if (filters.search) count++;
  if (filters.types.length > 0) count++;
  if (filters.wallets.length > 0) count++;
  if (filters.riskLevels.length > 0) count++;
  if (filters.minBenefit > 0) count++;
  if (filters.holdingPeriod !== 'all') count++;
  if (filters.gasEfficiency !== 'all') count++;
  if (filters.liquidity !== 'all') count++;

  return count;
}
