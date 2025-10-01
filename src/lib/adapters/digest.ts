import { withCache, withCircuitBreaker } from '../net';

export interface DigestItem {
  id: string;
  text: string;
  direction: 'buy' | 'sell';
}

export interface DigestData {
  items: DigestItem[];
  provenance: 'Real' | 'Simulated';
}

const circuitBreaker = withCircuitBreaker();

export async function getDigest(): Promise<DigestData> {
  return withCache('digest', 300000)(async () => {
    return circuitBreaker(async () => {
      // Try to fetch from existing API first
      try {
        const response = await fetch('/api/digest');
        if (response.ok) {
          const data = await response.json();
          if (data.digest && data.digest.length > 0) {
            return {
              items: data.digest.map((item: any, index: number) => ({
                id: `d${index + 1}`,
                text: item.description || item.text,
                direction: item.direction || (item.value_usd > 0 ? 'buy' : 'sell')
              })),
              provenance: 'Real' as const
            };
          }
        }
      } catch (error) {
        console.warn('Failed to fetch real digest, using simulated data');
      }

      // Fallback to simulated data
      return {
        items: [
          { id: 'd1', text: 'Whales bought $200M BTC', direction: 'buy' as const },
          { id: 'd2', text: 'ETH CEX inflows up 15%', direction: 'sell' as const },
          { id: 'd3', text: 'USDT mints spiked to $500M', direction: 'buy' as const }
        ],
        provenance: 'Simulated' as const
      };
    });
  });
}