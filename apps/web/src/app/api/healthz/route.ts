import { NextResponse } from 'next/server';

interface HealthStatus {
  mode: 'live' | 'cached' | 'simulated';
  providers: {
    etherscan: 'ok' | 'degraded' | 'down';
    coingecko: 'ok' | 'degraded' | 'down';
  };
  lastUpdateISO: string;
  version: string;
}

async function checkProvider(url: string, timeout = 3000): Promise<'ok' | 'degraded' | 'down'> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, { 
      signal: controller.signal,
      headers: { 'User-Agent': 'AlphaWhale/1.0' }
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) return 'ok';
    if (response.status >= 500) return 'down';
    return 'degraded';
  } catch (error) {
    return 'down';
  }
}

async function getDataQualityMetrics() {
  try {
    // Mock data quality checks - replace with actual Supabase queries
    return {
      latestEventAgeSec: 45,
      invariants: {
        negUSD: 0,
        missingTx: 0,
        missingWallet: 0
      },
      realRatio1h: 0.85
    };
  } catch (error) {
    return {
      latestEventAgeSec: 999,
      invariants: { negUSD: 0, missingTx: 0, missingWallet: 0 },
      realRatio1h: 0
    };
  }
}

export async function GET() {
  try {
    // Simplified health check for demo
    const health: HealthStatus = {
      mode: 'simulated',
      providers: {
        etherscan: 'down',
        coingecko: 'down'
      },
      lastUpdateISO: new Date().toISOString(),
      version: '1.0.0'
    };

    return NextResponse.json(health, { 
      status: 206,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Health check failed', timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}