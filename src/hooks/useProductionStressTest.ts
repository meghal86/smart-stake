import { useCallback } from 'react';

interface SimulationScenario {
  ethChange: number;
  btcChange: number;
  altcoinChange: number;
  correlationBreak: boolean;
  stablecoinDepeg: boolean;
}

interface SimulationResult {
  totalValue: number;
  change: number;
  changePercent: number;
  riskScore: number;
  worstToken: string;
  bestToken: string;
}

interface ProductionPortfolioData {
  totalValue: number;
  holdings: Array<{
    token: string;
    qty: number;
    value: number;
    source: 'real' | 'simulated';
  }>;
  riskScore: number;
}

export function useProductionStressTest(portfolioData: ProductionPortfolioData | null) {
  
  const simulateScenario = useCallback(async (scenario: SimulationScenario): Promise<SimulationResult> => {
    if (!portfolioData) {
      throw new Error('No portfolio data available for simulation');
    }

    console.log('🧪 Running stress test with scenario:', scenario);
    console.log('📊 Portfolio data:', portfolioData);

    // Calculate impact for each token based on its type
    let newTotalValue = 0;
    let worstPerformingToken = '';
    let bestPerformingToken = '';
    let worstPerformance = 0;
    let bestPerformance = 0;

    const tokenImpacts: Record<string, number> = {};

    for (const holding of portfolioData.holdings) {
      let tokenImpact = 0;
      
      // Map tokens to their impact categories
      switch (holding.token.toUpperCase()) {
        case 'ETH':
        case 'ETHEREUM':
          tokenImpact = scenario.ethChange / 100;
          break;
        case 'BTC':
        case 'BITCOIN':
          tokenImpact = scenario.btcChange / 100;
          break;
        case 'SOL':
        case 'SOLANA':
        case 'CHAINLINK':
        case 'POLYGON':
        case 'USD-COIN':
          tokenImpact = scenario.altcoinChange / 100;
          break;
        default:
          tokenImpact = scenario.altcoinChange / 100; // Default to altcoin impact
      }

      // Apply correlation break (increases volatility)
      if (scenario.correlationBreak) {
        const volatilityMultiplier = 1 + (Math.random() - 0.5) * 0.4; // ±20% additional volatility
        tokenImpact *= volatilityMultiplier;
      }

      // Apply stablecoin depeg impact
      if (scenario.stablecoinDepeg) {
        if (holding.token.toUpperCase().includes('USD') || holding.token.toUpperCase().includes('STABLE')) {
          tokenImpact -= 0.05; // Additional 5% hit for stablecoins
        } else {
          tokenImpact -= 0.02; // 2% additional hit for other tokens due to market panic
        }
      }

      tokenImpacts[holding.token] = tokenImpact;
      
      // Calculate new value for this holding
      const newHoldingValue = holding.value * (1 + tokenImpact);
      newTotalValue += newHoldingValue;

      // Track best and worst performers
      const performancePercent = tokenImpact * 100;
      if (performancePercent < worstPerformance) {
        worstPerformance = performancePercent;
        worstPerformingToken = holding.token;
      }
      if (performancePercent > bestPerformance) {
        bestPerformance = performancePercent;
        bestPerformingToken = holding.token;
      }
    }

    const totalChange = newTotalValue - portfolioData.totalValue;
    const changePercent = (totalChange / portfolioData.totalValue) * 100;

    // Calculate new risk score based on the scenario impact
    let newRiskScore = portfolioData.riskScore;
    
    // Increase risk for negative scenarios
    if (changePercent < -20) {
      newRiskScore = Math.max(1, newRiskScore - 2);
    } else if (changePercent < -10) {
      newRiskScore = Math.max(1, newRiskScore - 1);
    } else if (changePercent > 20) {
      // High gains also increase risk (bubble territory)
      newRiskScore = Math.max(1, newRiskScore - 0.5);
    }

    // Correlation break increases risk
    if (scenario.correlationBreak) {
      newRiskScore = Math.max(1, newRiskScore - 1);
    }

    // Stablecoin depeg significantly increases risk
    if (scenario.stablecoinDepeg) {
      newRiskScore = Math.max(1, newRiskScore - 1.5);
    }

    const result: SimulationResult = {
      totalValue: newTotalValue,
      change: totalChange,
      changePercent,
      riskScore: newRiskScore,
      worstToken: worstPerformingToken || 'N/A',
      bestToken: bestPerformingToken || 'N/A'
    };

    console.log('📈 Simulation result:', result);
    console.log('🎯 Token impacts:', tokenImpacts);

    return result;
  }, [portfolioData]);

  return { simulateScenario };
}