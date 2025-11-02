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
};\n\n// Helper function to get localized string\nexport function t(key: string, locale: string = 'en'): string {\n  const keys = key.split('.');\n  let value: any = portfolioStrings[locale as keyof typeof portfolioStrings];\n  \n  for (const k of keys) {\n    value = value?.[k];\n  }\n  \n  return value || key;\n}\n\n// Hook for using translations\nexport function usePortfolioTranslation(locale: string = 'en') {\n  return {\n    t: (key: string) => t(key, locale),\n    strings: portfolioStrings[locale as keyof typeof portfolioStrings]\n  };\n}