/**
 * Hunter Feature Card Component
 * 
 * Displays the Hunter feature card with live opportunities count metric.
 * Uses the Zap icon and routes to /hunter.
 * 
 * Requirements: 2.4
 */

import React from 'react';
import { Zap } from 'lucide-react';
import { FeatureCard } from './FeatureCard';
import { useHomeMetrics } from '@/hooks/useHomeMetrics';

/**
 * Hunter Feature Card
 * 
 * Displays Hunter alpha opportunities feature with live opportunity count.
 * Shows demo badge when in demo mode.
 * 
 * @example
 * ```tsx
 * <HunterFeatureCard />
 * ```
 */
export const HunterFeatureCard = () => {
  const { metrics, isLoading, error, isDemo } = useHomeMetrics();

  return (
    <FeatureCard
      feature="hunter"
      icon={Zap}
      title="Hunter"
      tagline="Hunt alpha opportunities"
      previewLabel="Opportunities"
      previewValue={metrics?.hunterOpportunities ?? 0}
      previewDescription="Available yield opportunities"
      primaryRoute="/hunter"
      demoRoute="/hunter?demo=true"
      isLoading={isLoading}
      isDemo={isDemo}
      error={error?.message ?? null}
    />
  );
};
