/**
 * Demo Data Service
 * 
 * Provides realistic sample metrics for unauthenticated users.
 * All data is hardcoded and deterministic for consistency.
 * Returns instantly (< 200ms) with no API calls.
 */

import { HomeMetrics } from '@/types/home';

/**
 * Get demo metrics for unauthenticated users
 * 
 * Returns hardcoded sample values that demonstrate the platform's capabilities
 * without requiring authentication or API calls.
 * 
 * @returns {HomeMetrics} Demo metrics object
 */
export const getDemoMetrics = (): HomeMetrics => {
  return {
    // Guardian metrics - Sample security score
    guardianScore: 89,
    
    // Hunter metrics - Sample opportunities
    hunterOpportunities: 42,
    hunterAvgApy: 18.5,
    hunterConfidence: 92,
    
    // HarvestPro metrics - Sample tax benefits
    harvestEstimateUsd: 12400,
    harvestEligibleTokens: 7,
    harvestGasEfficiency: 'High',
    
    // Trust metrics - Platform-wide statistics
    totalWalletsProtected: 50000,
    totalYieldOptimizedUsd: 12.4,
    averageGuardianScore: 85,
    
    // Metadata
    lastUpdated: new Date().toISOString(),
    isDemo: true,
    demoMode: true,
  };
};

/**
 * Check if metrics are from demo mode
 * 
 * @param {HomeMetrics} metrics - Metrics object to check
 * @returns {boolean} True if metrics are demo data
 */
export const isDemoMetrics = (metrics: HomeMetrics): boolean => {
  return metrics.isDemo === true || metrics.demoMode === true;
};

/**
 * Get demo metrics with custom overrides
 * 
 * Useful for testing different scenarios while maintaining demo mode
 * 
 * @param {Partial<HomeMetrics>} overrides - Custom values to override
 * @returns {HomeMetrics} Demo metrics with overrides applied
 */
export const getDemoMetricsWithOverrides = (
  overrides: Partial<HomeMetrics>
): HomeMetrics => {
  return {
    ...getDemoMetrics(),
    ...overrides,
    isDemo: true,
    demoMode: true,
  };
};
