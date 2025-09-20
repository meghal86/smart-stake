import { useState } from 'react';

interface SimulationParams {
  whaleCount: number;
  transactionSize: number;
  timeframe: string;
  chain: string;
  token: string;
}

interface SimulationResult {
  id: string;
  params: SimulationParams;
  priceImpact: number;
  confidence: number;
  timestamp: string;
}

export function useScenarioBuilder() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SimulationResult[]>([]);

  const run = async (params: SimulationParams): Promise<SimulationResult> => {
    setLoading(true);
    
    // Mock simulation - in production this would call the edge function
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const baseImpact = (params.whaleCount * params.transactionSize) / 10000;
    const chainMultiplier = params.chain === 'ethereum' ? 1 : 0.7;
    const timeMultiplier = params.timeframe === '1h' ? 2.5 : 1;
    
    const result: SimulationResult = {
      id: Date.now().toString(),
      params,
      priceImpact: baseImpact * chainMultiplier * timeMultiplier,
      confidence: Math.random() * 0.3 + 0.7, // 70-100%
      timestamp: new Date().toISOString()
    };
    
    setResults(prev => [result, ...prev]);
    setLoading(false);
    
    return result;
  };

  return { run, loading, results };
}