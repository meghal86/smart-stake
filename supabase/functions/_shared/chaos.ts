// Chaos engineering utilities for local testing only
// DO NOT DEPLOY TO PRODUCTION

export function shouldFailChaos(envVar: string): boolean {
  if (Deno.env.get('NODE_ENV') === 'production') return false;
  
  const failPercent = parseInt(Deno.env.get(envVar) || '0');
  if (failPercent <= 0) return false;
  
  return Math.random() * 100 < failPercent;
}

export function getChaosLatency(envVar: string): number {
  if (Deno.env.get('NODE_ENV') === 'production') return 0;
  
  const latencyMs = parseInt(Deno.env.get(envVar) || '0');
  return Math.max(0, latencyMs);
}

export async function chaosDelay(envVar: string): Promise<void> {
  const delay = getChaosLatency(envVar);
  if (delay > 0) {
    console.log(`🔥 Chaos: Adding ${delay}ms delay`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
}

export function chaosWrapFetch(originalFetch: typeof fetch, failEnv: string, latencyEnv: string) {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    // Add chaos latency
    await chaosDelay(latencyEnv);
    
    // Maybe fail the request
    if (shouldFailChaos(failEnv)) {
      console.log('🔥 Chaos: Simulating provider failure');
      throw new Error('Chaos engineering: simulated provider failure');
    }
    
    return originalFetch(input, init);
  };
}