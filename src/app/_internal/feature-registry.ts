export type FeatureKey =
  | 'whaleSpotlight' | 'fearIndex' | 'digest' | 'watchlist'
  | 'referrals' | 'shareCards' | 'exports' | 'alerts'
  | 'portfolioLite' | 'proGating';

export interface FeatureDefinition {
  status: 'existing' | 'adapter' | 'missing';
  path: string;
  components?: string[];
  hooks?: string[];
  apis?: string[];
  needsAdapter: boolean;
}

export const features: Record<FeatureKey, FeatureDefinition> = {
  whaleSpotlight: {
    status: 'existing',
    path: 'src/components/hub/IndexDialCard.tsx',
    components: ['src/components/WhaleCard.tsx', 'src/components/hub/IndexDialCard.tsx'],
    hooks: ['src/hooks/useWhaleAnalytics.ts', 'src/hooks/useMarketIntelligence.ts'],
    apis: ['apps/web/src/app/api/share/spotlight/[id]/route.tsx'],
    needsAdapter: true
  },
  fearIndex: {
    status: 'existing', 
    path: 'src/components/hub/IndexDialCard.tsx',
    components: ['src/components/hub/IndexDialCard.tsx'],
    hooks: ['src/hooks/useExplainability.ts'],
    needsAdapter: true
  },
  digest: {
    status: 'existing',
    path: 'src/components/hub/DigestCard.tsx',
    components: ['src/components/hub/DigestCard.tsx'],
    apis: ['src/app/api/digest/route.ts'],
    needsAdapter: true
  },
  watchlist: {
    status: 'existing',
    path: 'src/hooks/useWatchlist.ts',
    components: ['src/components/watchlist/WatchlistManager.tsx'],
    hooks: ['src/hooks/useWatchlist.ts', 'src/hooks/useWatchlistAlerts.ts'],
    needsAdapter: false
  },
  alerts: {
    status: 'existing',
    path: 'src/components/alerts/SimpleAlertCard.tsx',
    components: ['src/components/alerts/SimpleAlertCard.tsx', 'src/components/AlertTeaserCard.tsx'],
    hooks: ['src/hooks/useCustomAlerts.ts', 'src/hooks/useRealTimeAlerts.ts'],
    needsAdapter: true
  },
  portfolioLite: {
    status: 'existing',
    path: 'src/components/ui/WalletConnectModal.tsx',
    components: ['src/components/ui/WalletConnectModal.tsx'],
    needsAdapter: false
  },
  exports: {
    status: 'existing',
    path: 'src/hooks/useCSVExport.ts',
    hooks: ['src/hooks/useCSVExport.ts'],
    needsAdapter: true
  },
  proGating: {
    status: 'existing',
    path: 'src/components/ui/UpgradeModal.tsx',
    components: ['src/components/ui/UpgradeModal.tsx'],
    hooks: ['src/hooks/useSubscription.ts'],
    needsAdapter: false
  },
  shareCards: {
    status: 'missing',
    path: '',
    needsAdapter: false
  },
  referrals: {
    status: 'missing', 
    path: '',
    needsAdapter: false
  }
};

export function getFeature(key: FeatureKey): FeatureDefinition {
  return features[key];
}

export function getExistingFeatures(): FeatureKey[] {
  return Object.keys(features).filter(key => 
    features[key as FeatureKey].status === 'existing'
  ) as FeatureKey[];
}

export function getMissingFeatures(): FeatureKey[] {
  return Object.keys(features).filter(key => 
    features[key as FeatureKey].status === 'missing'
  ) as FeatureKey[];
}

export function getFeaturesNeedingAdapters(): FeatureKey[] {
  return Object.keys(features).filter(key => 
    features[key as FeatureKey].needsAdapter
  ) as FeatureKey[];
}