import { useState } from 'react';

export interface StressParams { 
  eth: number; 
  btc: number; 
  alts: number; 
  depeg: boolean; 
  corrBreak: boolean;
}

export interface StressResult { 
  worstCase: number; 
  expectedLoss: number; 
  recoveryMonths: number; 
  impacts: Array<{ bucket: string; pct: number }>;
}

export function useStress(): {
  params: StressParams;
  setParams: (p: Partial<StressParams>) => void;
  run: () => Promise<void>;
  result?: StressResult; 
  isRunning: boolean;
} {
  const [params, setParamsState] = useState<StressParams>({
    eth: -30,
    btc: -25,
    alts: -50,
    depeg: false,
    corrBreak: false
  });
  
  const [result, setResult] = useState<StressResult>();
  const [isRunning, setIsRunning] = useState(false);

  const setParams = (p: Partial<StressParams>) => {
    setParamsState(prev => ({ ...prev, ...p }));
  };

  const run = async (customParams?: Partial<StressParams & { ethereum?: number; bitcoin?: number; altcoins?: number; stablecoinDepeg?: number; liquidityCrisis?: number; regulatoryShock?: number }>) => {
    setIsRunning(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const activeParams = customParams || params;
    
    // Assume portfolio allocation: 30% ETH, 25% BTC, 35% Altcoins, 10% other
    const ethWeight = 0.30;
    const btcWeight = 0.25;
    const altWeight = 0.35;
    const otherWeight = 0.10;
    
    // Calculate weighted average impact based on actual portfolio allocation
    const avgImpact = (
      (activeParams.ethereum || 0) * ethWeight + 
      (activeParams.bitcoin || 0) * btcWeight + 
      (activeParams.altcoins || 0) * altWeight +
      ((activeParams.stablecoinDepeg || 0) + (activeParams.liquidityCrisis || 0) + (activeParams.regulatoryShock || 0)) / 3 * otherWeight
    );
    
    const baseValue = 125000;
    const projectedValue = baseValue * (1 + avgImpact / 100);
    const projectedChange = projectedValue - baseValue;
    
    // Worst case: compound all negative impacts with correlation
    const worstImpact = Math.min(
      activeParams.ethereum || 0,
      activeParams.bitcoin || 0, 
      activeParams.altcoins || 0,
      activeParams.stablecoinDepeg || 0,
      activeParams.liquidityCrisis || 0,
      activeParams.regulatoryShock || 0
    );
    
    // In worst case, apply the worst impact across weighted portfolio
    const worstCaseValue = baseValue * (1 + worstImpact / 100);
    const worstCaseChange = worstCaseValue - baseValue;
    
    // Recovery time based on severity: more severe = longer recovery
    // Assume 1 month per 5% loss for moderate losses, longer for severe
    const lossPct = Math.abs(avgImpact);
    let recoveryMonths: number;
    if (lossPct < 20) {
      recoveryMonths = lossPct / 5; // 4 months for 20% loss
    } else if (lossPct < 40) {
      recoveryMonths = 4 + (lossPct - 20) / 3; // 4-10 months for 20-40% loss
    } else {
      recoveryMonths = 10 + (lossPct - 40) / 2; // 10+ months for >40% loss
    }
    
    const testResult = {
      worstCase: Math.abs(worstCaseChange),
      expectedLoss: Math.abs(projectedChange),
      recoveryTime: Math.round(recoveryMonths),
      recoveryMonths: Math.round(recoveryMonths),
      impacts: [
        { bucket: 'Ethereum', pct: Math.abs(activeParams.ethereum || 0) },
        { bucket: 'Bitcoin', pct: Math.abs(activeParams.bitcoin || 0) },
        { bucket: 'Altcoins', pct: Math.abs(activeParams.altcoins || 0) }
      ],
      scenarioResults: [
        { name: 'Ethereum', impact: Math.abs(activeParams.ethereum || 0) },
        { name: 'Bitcoin', impact: Math.abs(activeParams.bitcoin || 0) },
        { name: 'Altcoins', impact: Math.abs(activeParams.altcoins || 0) }
      ],
      recoveryPath: Array.from({ length: Math.min(24, Math.ceil(recoveryMonths)) }, (_, i) => ({
        month: i + 1,
        value: Math.round(worstCaseValue + (i * (baseValue - worstCaseValue) / Math.ceil(recoveryMonths)))
      })),
      recommendations: generateRecommendations(lossPct, activeParams)
    };
    
    setResult(testResult);
    setIsRunning(false);
    return testResult;
  };

  return { params, setParams, run, result, isRunning };
}

function generateRecommendations(lossPct: number, params: Partial<StressParams & { ethereum?: number; bitcoin?: number; altcoins?: number; stablecoinDepeg?: number; liquidityCrisis?: number; regulatoryShock?: number }>): string[] {
  const recommendations: string[] = [];
  
  if (lossPct > 40) {
    recommendations.push('Critical: Immediate portfolio rebalancing required');
    recommendations.push('Consider 30-40% cash position for risk mitigation');
  } else if (lossPct > 20) {
    recommendations.push('Diversify into uncorrelated asset classes');
    recommendations.push('Maintain 20-30% cash reserves for opportunities');
  } else {
    recommendations.push('Portfolio shows good resilience');
    recommendations.push('Maintain 10-15% cash reserves');
  }
  
  if (params.stablecoinDepeg && params.stablecoinDepeg < -5) {
    recommendations.push('Reduce stablecoin exposure, diversify across multiple stables');
  }
  
  if (params.liquidityCrisis && params.liquidityCrisis < -30) {
    recommendations.push('Avoid illiquid positions, focus on high-volume assets');
  }
  
  if (params.altcoins && params.altcoins < -50) {
    recommendations.push('Reduce altcoin allocation, increase BTC/ETH exposure');
  }
  
  recommendations.push('Consider hedging strategies for major positions');
  recommendations.push('Implement gradual position sizing adjustments');
  
  return recommendations;
}