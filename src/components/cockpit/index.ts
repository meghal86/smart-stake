/**
 * Cockpit Components - Barrel Export
 * 
 * Exports all cockpit components for clean imports.
 */

export { TodayCard } from './TodayCard';
export { ActionPreview } from './ActionPreview';
export { PeekDrawer, createDefaultSections } from './PeekDrawer';
export { InsightsSheet } from './InsightsSheet';
export { PulseSheet } from './PulseSheet';

// Re-export types for convenience
export type {
  TodayCard as TodayCardType,
  Action,
  ActionLane,
  CTAKind,
  ProviderStatus,
} from '@/lib/cockpit/types';