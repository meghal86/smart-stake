// Portfolio i18n strings for future localization
export const portfolioStrings = {
  en: {
    // Header
    title: 'Portfolio',
    subtitle: 'Overview',
    demo: 'Demo',
    live: 'Live',
    search: 'Search portfolio...',
    
    // Hero Cards
    portfolioValue: 'Portfolio Value',
    riskScore: 'Risk Score',
    trustIndex: 'Trust Index',
    lastSync: 'Last sync',
    change24h: '24H change',
    
    // Risk Snapshot
    riskSnapshot: 'Risk Snapshot',
    liquidity: 'Liquidity',
    concentration: 'Concentration',
    correlation: 'Correlation',
    health: 'health',
    
    // Guardian
    guardianSnapshot: 'Guardian Intelligence Snapshot',
    trustScore: 'Trust Score',
    lastScan: 'Last scan',
    totalFlags: 'Total flags',
    noFlags: 'No active security flags detected',
    viewGuardian: 'View Guardian',
    occurrences: 'occurrences',
    
    // Tabs
    overview: 'Overview',
    riskAnalysis: 'Risk Analysis',
    stressTest: 'Stress Test',
    results: 'Results',
    addresses: 'Addresses',
    
    // Tooltips
    portfolioValueTooltip: 'Total USD value of all your crypto holdings across connected wallets',
    riskScoreTooltip: 'Risk assessment from 0-10 based on portfolio concentration, volatility, and market exposure',
    trustIndexTooltip: 'Confidence score based on Guardian security analysis and data quality',
    liquidityTooltip: 'How easily your assets can be converted to cash without affecting market price',
    concentrationTooltip: 'Measure of how diversified your portfolio is across different assets',
    correlationTooltip: 'How closely your assets move together in price movements',
    
    // Multi-wallet
    aggregatedPortfolio: 'Aggregated Portfolio',
    value: 'Value',
    risk: 'Risk',
    trust: 'Trust',
    
    // Time ranges
    '24h': '24H',
    '7d': '7D',
    '30d': '30D',
    
    // User modes
    novice: 'Novice',
    pro: 'Pro',
    sim: 'Sim',
    
    // Severities
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    
    // Common
    loading: 'Loading...',
    error: 'Error',
    retry: 'Retry',
    updated: 'Updated',
    ago: 'ago'
  }
};

// Helper function to get localized string
export function t(key: string, locale: string = 'en'): string {
  const keys = key.split('.');
  let value: unknown = portfolioStrings[locale as keyof typeof portfolioStrings];
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  return value || key;
}

// Hook for using translations
export function usePortfolioTranslation(locale: string = 'en') {
  return {
    t: (key: string) => t(key, locale),
    strings: portfolioStrings[locale as keyof typeof portfolioStrings]
  };
}