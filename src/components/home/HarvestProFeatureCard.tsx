/**
 * Harvest Feature Card Component
 * 
 * Displays the Harvest feature card with live tax benefit estimate metric.
 * Uses the Leaf icon and routes to /harvestpro.
 * 
 * Requirements: 2.5
 */

import React from 'react';
import { Leaf } from 'lucide-react';
import { FeatureCard } from './FeatureCard';
import { useHomeMetrics } from '@/hooks/useHomeMetrics';

/**
 * Format USD value for display
 * 
 * @param {number | undefined} value - USD value to format
 * @returns {string} Formatted string (e.g., "$12,400" or "$12.4K")
 */
const formatUsd = (value: number | undefined): string => {
  // Handle undefined, null, or NaN
  if (value === undefined || value === null || isNaN(value)) {
    return '$0';
  }
  
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(1)}M`;
  }
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${Math.round(value).toLocaleString()}`;
};

/**
 * Harvest Feature Card
 * 
 * Displays Harvest tax loss harvesting feature with live tax benefit estimate.
 * Shows demo badge when in demo mode.
 * 
 * @example
 * ```tsx
 * <HarvestProFeatureCard />
 * ```
 */
export const HarvestProFeatureCard = () => {
  const { metrics, isLoading, error, isDemo } = useHomeMetrics();

  // Format the harvest estimate for display
  const formattedEstimate = formatUsd(metrics?.harvestEstimateUsd);

  return (
    <div className="relative">
      <FeatureCard
        feature="harvestpro"
        icon={Leaf}
        title="Harvest"
        tagline="Optimize your taxes"
        previewLabel="Tax Benefit"
        previewValue={formattedEstimate}
        previewDescription="Estimated tax savings"
        primaryRoute="/harvestpro"
        demoRoute="/harvestpro?demo=true"
        isLoading={isLoading}
        isDemo={isDemo}
        error={error?.message ?? null}
      />
      
      {/* Tax Disclaimer */}
      <div className="mt-2 px-4">
        <p className="text-xs text-gray-600">
          * Estimates are not financial or tax advice. Consult a tax professional.
        </p>
      </div>
    </div>
  );
};
