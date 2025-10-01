import { withCache, withCircuitBreaker } from '../net';

export interface FearIndexData {
  score: number;
  label: string;
  provenance: 'Real' | 'Simulated';
}

const circuitBreaker = withCircuitBreaker();

export async function getFearIndex(): Promise<FearIndexData> {
  return withCache('fear-index', 300000)(async () => {
    return circuitBreaker(async () => {
      // Try to fetch from existing API first
      try {
        const response = await fetch('/api/whale-index');
        if (response.ok) {
          const data = await response.json();
          return {
            score: data.fearIndex?.score || 62,
            label: data.fearIndex?.label || 'Accumulation bias',
            provenance: 'Real' as const
          };
        }
      } catch (error) {
        console.warn('Failed to fetch real fear index, using simulated data');
      }

      // Fallback to simulated data
      return {
        score: 62,
        label: 'Accumulation bias',
        provenance: 'Simulated' as const
      };
    });
  });
}