import { withCache, withCircuitBreaker } from '../net';

const circuitBreaker = withCircuitBreaker();

export async function fetchPrices(coins: string[] = ['ethereum', 'bitcoin']) {
  return withCache(`prices-${coins.join(',')}`, 60000)(async () => {
    return circuitBreaker(async () => {
      try {
        const response = await fetch(
          `/functions/v1/prices?ids=${coins.join(',')}`,
          { headers: { 'Cache-Control': 'max-age=60' } }
        );
        
        if (!response.ok) {
          throw new Error('Prices API failed');
        }
        
        return await response.json();
      } catch (error) {
        console.warn('Price fetch failed:', error);
        return {};
      }
    });
  });
}