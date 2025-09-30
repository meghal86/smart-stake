interface FeatureFlag {
  key: string;
  enabled: boolean;
  config?: Record<string, any>;
}

const DEFAULT_FLAGS: Record<string, boolean> = {
  'kpi_microcopy': true,
  'correlation_heatmap': true,
  'what_if_rebalance': true,
  'scheduled_exports': false,
  'team_sharing': false,
  'custom_kpi_cards': false,
  'market_mood_weights': false,
  'mobile_widgets': true,
  'audit_logging': false
};

export function useFeatureFlags() {
  const flags = DEFAULT_FLAGS;

  const isEnabled = (flagKey: string): boolean => {
    return flags?.[flagKey] ?? false;
  };

  return {
    flags,
    isEnabled,
    isLoading: false
  };
}