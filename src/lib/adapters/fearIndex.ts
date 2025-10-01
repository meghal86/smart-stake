import { withCache, withCircuitBreaker } from '../net';

export interface FearIndexData {
  score: number;
  label: string;
  provenance: 'Real' | 'Simulated';
  last_updated_iso?: string;
  methodologyUrl?: string;
}

const circuitBreaker = withCircuitBreaker();

export async function getFearIndex(): Promise<FearIndexData> {
  return withCache('fear-index', 60000)(async () => {
    return circuitBreaker(async () => {
      const dataMode = process.env.NEXT_PUBLIC_DATA_MODE;
      
      if (dataMode === 'mock') {
        return getMockFearIndexData();
      }
      
      try {
        const response = await fetch('/functions/v1/fear-index');
        
        if (!response.ok) {
          throw new Error('Fear Index API failed');
        }
        
        const data = await response.json();
        return {
          score: data.score || 62,
          label: data.label || 'Accumulation',
          provenance: data.provenance || 'Simulated',
          last_updated_iso: data.last_updated_iso,
          methodologyUrl: data.methodologyUrl
        };
      } catch (error) {
        console.warn('Falling back to mock data:', error);
        return getMockFearIndexData();
      }
    });
  });
}

function getMockFearIndexData(): FearIndexData {
  return {
    score: 62,
    label: 'Accumulation bias',
    provenance: 'Simulated' as const
  };
}