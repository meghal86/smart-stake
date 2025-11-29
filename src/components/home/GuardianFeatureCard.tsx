/**
 * Guardian Feature Card Component
 * 
 * Displays the Guardian feature card with live Guardian Score metric.
 * Uses the Shield icon and routes to /guardian.
 * 
 * Requirements: 2.3
 */

import React from 'react';
import { Shield } from 'lucide-react';
import { FeatureCard } from './FeatureCard';
import { useHomeMetrics } from '@/hooks/useHomeMetrics';

/**
 * Guardian Feature Card
 * 
 * Displays Guardian security feature with live Guardian Score.
 * Shows demo badge when in demo mode.
 * 
 * @example
 * ```tsx
 * <GuardianFeatureCard />
 * ```
 */
export const GuardianFeatureCard = () => {
  const { metrics, isLoading, error, isDemo } = useHomeMetrics();

  return (
    <FeatureCard
      feature="guardian"
      icon={Shield}
      title="Guardian"
      tagline="Secure your wallet"
      previewLabel="Guardian Score"
      previewValue={metrics?.guardianScore ?? 0}
      previewDescription="Your security rating"
      primaryRoute="/guardian"
      demoRoute="/guardian?demo=true"
      isLoading={isLoading}
      isDemo={isDemo}
      error={error?.message ?? null}
    />
  );
};
