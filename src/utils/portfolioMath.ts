// Institutional-grade portfolio mathematics

export interface PortfolioHolding {
  token: string;
  value: number;
  weight: number;
  volatility?: number;
  volume24h?: number;
}

/**
 * Compute Herfindahl-Hirschman Index (HHI) for concentration risk
 * Returns 0-100 scale (0 = perfectly diversified, 100 = single asset)
 */
export function computeHHI(holdings: PortfolioHolding[]): number {
  if (holdings.length === 0) return 0;
  
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  if (totalValue === 0) return 0;
  
  let hhi = 0;
  for (const holding of holdings) {
    const share = holding.value / totalValue;
    hhi += share * share;
  }
  
  // Convert to 0-100 scale (multiply by 100)
  return Math.min(100, hhi * 100);
}

/**
 * Compute portfolio volatility exposure
 * Weighted average of individual token volatilities
 */
export function computeVolatilityExposure(holdings: PortfolioHolding[]): number {
  if (holdings.length === 0) return 0;
  
  const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
  if (totalValue === 0) return 0;
  
  let weightedVol = 0;
  for (const holding of holdings) {
    const weight = holding.value / totalValue;
    const vol = holding.volatility || getDefaultVolatility(holding.token);
    weightedVol += weight * vol;
  }
  
  return weightedVol;
}

/**
 * Compute liquidity score based on position size vs daily volume
 * Returns 0-10 scale (10 = highly liquid, 0 = illiquid)
 */
export function computeLiquidityScore(holdings: PortfolioHolding[]): number {
  if (holdings.length === 0) return 5;
  
  let totalScore = 0;
  let totalWeight = 0;
  
  for (const holding of holdings) {
    const volume24h = holding.volume24h || 0;
    const positionSize = holding.value;
    
    // Liquidity ratio: daily volume / position size
    const liquidityRatio = volume24h > 0 ? volume24h / positionSize : 0;
    
    // Score based on how easily position can be liquidated
    let score = 0;
    if (liquidityRatio > 1000) score = 10; // Extremely liquid
    else if (liquidityRatio > 100) score = 9;
    else if (liquidityRatio > 50) score = 8;
    else if (liquidityRatio > 20) score = 7;
    else if (liquidityRatio > 10) score = 6;
    else if (liquidityRatio > 5) score = 5;
    else if (liquidityRatio > 2) score = 4;
    else if (liquidityRatio > 1) score = 3;
    else if (liquidityRatio > 0.5) score = 2;
    else if (liquidityRatio > 0.1) score = 1;
    else score = 0;
    
    totalScore += score * holding.weight;
    totalWeight += holding.weight;
  }
  
  return totalWeight > 0 ? totalScore / totalWeight : 5;
}

/**
 * Compute 7-day change in concentration (mock for now)
 */
export function computeConcentrationTrend(currentHHI: number): number {
  // Mock 7-day trend - in production, compare with historical HHI
  return (Math.random() - 0.5) * 5; // ±2.5% change
}

/**
 * Default volatility estimates for major tokens (annualized %)
 */
function getDefaultVolatility(token: string): number {
  const volatilities: Record<string, number> = {
    'ETH': 65,
    'ETHEREUM': 65,
    'BTC': 55,
    'BITCOIN': 55,
    'SOL': 85,
    'SOLANA': 85,
    'CHAINLINK': 75,
    'LINK': 75,
    'POLYGON': 80,
    'MATIC': 80,
    'USD-COIN': 5,
    'USDC': 5,
    'USDT': 5
  };
  
  return volatilities[token.toUpperCase()] || 70; // Default high volatility for unknown tokens
}

/**
 * Rebase time series to 100 at start for benchmark comparison
 */
export function rebaseTimeSeries(data: Array<{ date: string; value: number }>): Array<{ date: string; value: number }> {
  if (data.length === 0) return data;
  
  const baseValue = data[0].value;
  if (baseValue === 0) return data;
  
  return data.map(point => ({
    date: point.date,
    value: (point.value / baseValue) * 100
  }));
}

/**
 * Calculate excess return vs benchmark
 */
export function calculateExcessReturn(portfolioReturn: number, benchmarkReturn: number): number {
  return portfolioReturn - benchmarkReturn;
}

/**
 * Risk-adjusted return (Sharpe-like ratio)
 */
export function calculateRiskAdjustedReturn(returns: number[], riskFreeRate: number = 0): number {
  if (returns.length === 0) return 0;
  
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance);
  
  return volatility > 0 ? (avgReturn - riskFreeRate) / volatility : 0;
}