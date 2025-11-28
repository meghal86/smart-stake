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

  const run = async (customParams?: Partial<StressParams & { ethereum?: number; bitcoin?: number; altcoins?: number }>) => {
    setIsRunning(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const activeParams = customParams || params;
    
    // Calculate weighted average impact (assuming equal portfolio distribution)
    const avgImpact = (
      (activeParams.ethereum || 0) + 
      (activeParams.bitcoin || 0) + 
      (activeParams.altcoins || 0)
    ) / 3;
    
    const baseValue = 125000;
    const projectedValue = baseValue * (1 + avgImpact / 100);
    const projectedChange = projectedValue - baseValue;
    
    // Worst case is the most severe single impact
    const worstImpact = Math.min(
      activeParams.ethereum || 0,
      activeParams.bitcoin || 0, 
      activeParams.altcoins || 0
    );
    const worstCaseValue = baseValue * (1 + worstImpact / 100);
    const worstCaseChange = worstCaseValue - baseValue;
    
    const recoveryMonths = Math.abs(avgImpact) / 3;
    
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
      recoveryPath: Array.from({ length: 24 }, (_, i) => ({
        month: i + 1,
        value: Math.round(worstCaseValue + (i * (baseValue - worstCaseValue) / 24))
      })),
      recommendations: [
        'Diversify into uncorrelated asset classes',
        'Maintain 20% cash reserves for opportunities', 
        'Consider hedging strategies for major positions',
        'Implement gradual position sizing adjustments'
      ]
    };
    
    setResult(testResult);
    setIsRunning(false);
    return testResult;
  };

  return { params, setParams, run, result, isRunning };
}