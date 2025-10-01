import { withCache, withCircuitBreaker } from '../net';

export interface WhaleSpotlightData {
  id: string;
  whaleId: string;
  asset: string;
  amount: number;
  narrative: string;
  risk: 'low' | 'med' | 'high';
  provenance: 'Real' | 'Simulated';
}

const circuitBreaker = withCircuitBreaker();

export async function getWhaleSpotlight(): Promise<WhaleSpotlightData> {
  return withCache('whale-spotlight', 300000)(async () => {
    return circuitBreaker(async () => {
      // Try to fetch from existing API first
      try {
        const response = await fetch('/api/whale-index');
        if (response.ok) {
          const data = await response.json();
          return {
            id: 'sp1',
            whaleId: data.topWhale?.address || '0xabcd...1234',
            asset: data.topWhale?.asset || 'ETH',
            amount: data.topWhale?.amount || 12500000,
            narrative: data.topWhale?.narrative || 'Large movement detected. Upgrade for full analysis.',
            risk: data.topWhale?.risk || 'med',
            provenance: 'Real' as const
          };
        }
      } catch (error) {
        console.warn('Failed to fetch real whale spotlight, using simulated data');
      }

      // Fallback to simulated data
      return {
        id: 'sp1',
        whaleId: '0xabcd...1234',
        asset: 'ETH',
        amount: 12500000,
        narrative: 'Large ETH movement detected. Upgrade for full analysis.',
        risk: 'med' as const,
        provenance: 'Simulated' as const
      };
    });
  });
}