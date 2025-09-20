// Redis caching for scenario simulations

export function keyFor(inputs: any): string {
  // Create deterministic hash of inputs
  const normalized = JSON.stringify(inputs, Object.keys(inputs).sort());
  return `scn:${btoa(normalized).slice(0, 16)}`;
}

export async function cacheGetSet<T>(
  inputs: any,
  ttlSec: number,
  compute: () => Promise<T>
): Promise<{ data: T; cache: 'hit' | 'miss' }> {
  
  // For now, use simple in-memory cache (replace with Redis in production)
  const cache = globalThis.scenarioCache || (globalThis.scenarioCache = new Map());
  const key = keyFor(inputs);
  
  // Check cache
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) {
    return { data: cached.data, cache: 'hit' };
  }
  
  // Compute and cache
  const data = await compute();
  cache.set(key, {
    data,
    expires: Date.now() + (ttlSec * 1000)
  });
  
  // Simple cleanup (keep last 100 entries)
  if (cache.size > 100) {
    const entries = Array.from(cache.entries());
    entries.sort((a, b) => a[1].expires - b[1].expires);
    entries.slice(0, 50).forEach(([k]) => cache.delete(k));
  }
  
  return { data, cache: 'miss' };
}

// Hot preset precomputation keys
export const HOT_PRESETS = [
  { asset: 'ETH', timeframe: '6h', direction: 'accumulation', marketCondition: 'bull' },
  { asset: 'ETH', timeframe: '6h', direction: 'distribution', marketCondition: 'bear' },
  { asset: 'BTC', timeframe: '24h', direction: 'accumulation', marketCondition: 'neutral' }
];

export function isHotPreset(inputs: any): boolean {
  return HOT_PRESETS.some(preset => 
    preset.asset === inputs.asset &&
    preset.timeframe === inputs.timeframe &&
    preset.direction === inputs.direction &&
    preset.marketCondition === inputs.marketCondition
  );
}