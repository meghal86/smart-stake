/**
 * AlphaWhale Home Page Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the Home page,
 * including metrics, component props, and API responses.
 */

import { LucideIcon } from 'lucide-react';

/**
 * Home Metrics Interface
 * 
 * Represents all metrics displayed on the home page, including
 * Guardian, Hunter, and HarvestPro feature metrics, plus platform statistics.
 */
export interface HomeMetrics {
  // Guardian metrics
  guardianScore: number;              // 0-100, user's current Guardian score
  
  // Hunter metrics
  hunterOpportunities: number;        // Count of available opportunities
  hunterAvgApy: number;               // Average APY across opportunities
  hunterConfidence: number;           // 0-100, confidence score
  
  // HarvestPro metrics
  harvestEstimateUsd: number;         // Estimated tax benefit in USD
  harvestEligibleTokens: number;      // Count of eligible tokens
  harvestGasEfficiency: string;       // "High" | "Medium" | "Low"
  
  // Trust metrics (platform-wide)
  totalWalletsProtected: number;      // Platform-wide count
  totalYieldOptimizedUsd: number;     // Platform-wide total
  averageGuardianScore: number;       // Platform-wide average
  
  // Metadata
  lastUpdated: string;                // ISO 8601 timestamp
  isDemo: boolean;                    // Flag indicating demo mode
  demoMode: boolean;                  // Alias for isDemo (for clarity)
}

/**
 * API Response Format for Home Metrics
 */
export interface HomeMetricsResponse {
  data: HomeMetrics;
  ts: string;  // ISO 8601 UTC timestamp
}

/**
 * API Error Response Format
 */
export interface HomeMetricsError {
  error: {
    code: string;
    message: string;
    retry_after_sec?: number;
  };
}

/**
 * Hero Section Component Props
 */
export interface HeroSectionProps {
  onCtaClick: () => void;
}

/**
 * Feature Card Component Props
 */
export interface FeatureCardProps {
  feature: 'guardian' | 'hunter' | 'harvestpro';
  icon: LucideIcon;
  title: string;
  tagline: string;
  previewLabel: string;
  previewValue: string | number;
  previewDescription: string;
  primaryRoute: string;
  demoRoute?: string;
  isLoading?: boolean;
  isDemo?: boolean;
  error?: string;
}

/**
 * Trust Builders Component Props
 */
export interface TrustBuildersProps {
  metrics: {
    totalWalletsProtected: number;
    totalYieldOptimizedUsd: number;
    averageGuardianScore: number;
  };
  isLoading?: boolean;
  error?: string;
}

/**
 * Onboarding Section Component Props
 */
export interface OnboardingSectionProps {
  onStartOnboarding: () => void;
  onSkip: () => void;
}

/**
 * Footer Navigation Component Props
 */
export interface FooterNavProps {
  currentRoute: string;
}

/**
 * Error Boundary Props
 */
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Error Boundary State
 */
export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Use Home Metrics Hook Options
 */
export interface UseHomeMetricsOptions {
  enabled?: boolean;
}

/**
 * Use Home Metrics Hook Return Type
 */
export interface UseHomeMetricsReturn {
  metrics: HomeMetrics | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  isDemo: boolean;
}
