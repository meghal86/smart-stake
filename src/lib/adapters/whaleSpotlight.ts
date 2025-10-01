import { withCache, withCircuitBreaker } from '../net';

export interface WhaleSpotlightData {
  id: string;
  whaleId: string;
  asset: string;
  amount: number;
  narrative: string;
  risk: 'low' | 'med' | 'high';
  provenance: 'Real' | 'Simulated';
  tx_hash?: string;
  last_updated_iso?: string;
}

const circuitBreaker = withCircuitBreaker();

export async function getWhaleSpotlight(): Promise<WhaleSpotlightData> {
  return withCache('whale-spotlight', 60000)(async () => {
    return circuitBreaker(async () => {
      const dataMode = process.env.NEXT_PUBLIC_DATA_MODE;
      
      if (dataMode === 'mock') {
        return getMockSpotlightData();
      }
      
      try {
        const response = await fetch('/functions/v1/whale-spotlight', {
          headers: { 'Cache-Control': 'max-age=60' }
        });
        
        if (!response.ok) {
          throw new Error('Spotlight API failed');
        }
        
        const data = await response.json();
        return {
          id: 'sp1',
          whaleId: data.most_active_wallet || '0xabcd...1234',
          asset: 'ETH',
          amount: data.largest_move_usd || 0,
          narrative: `$${(data.largest_move_usd || 0).toLocaleString()} whale movement detected`,
          risk: data.largest_move_usd > 2000000 ? 'high' : 'med',
          provenance: data.provenance || 'Simulated',
          tx_hash: data.tx_hash,
          last_updated_iso: data.last_updated_iso
        };
      } catch (error) {
        console.warn('Falling back to mock data:', error);
        return getMockSpotlightData();
      }
    });
  });
}

function getMockSpotlightData(): WhaleSpotlightData {
  return {
    id: 'sp1',
    whaleId: '0xabcd...1234',
    asset: 'ETH',
    amount: 12500000,
    narrative: 'Large ETH movement detected. Upgrade for full analysis.',
    risk: 'med' as const,
    provenance: 'Simulated' as const
  };
}