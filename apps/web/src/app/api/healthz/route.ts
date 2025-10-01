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
    const [etherscanStatus, coingeckoStatus, dataQuality] = await Promise.all([
      checkProvider('https://api.etherscan.io/api?module=stats&action=ethsupply&apikey=YourApiKeyToken'),
      checkProvider('https://api.coingecko.com/api/v3/ping'),
      getDataQualityMetrics()
    ]);

    const hasDataIssues = 
      dataQuality.latestEventAgeSec > 600 ||
      dataQuality.invariants.negUSD > 0 ||
      dataQuality.invariants.missingTx > 0 ||
      dataQuality.realRatio1h < 0.4;

    const health: HealthStatus = {
      mode: etherscanStatus === 'ok' && coingeckoStatus === 'ok' && !hasDataIssues ? 'live' : 
            etherscanStatus === 'degraded' || coingeckoStatus === 'degraded' || hasDataIssues ? 'cached' : 'simulated',
      providers: {
        etherscan: etherscanStatus,
        coingecko: coingeckoStatus
      },
      lastUpdateISO: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      ...dataQuality
    };

    return NextResponse.json(health, { 
      status: health.mode === 'live' ? 200 : 206,
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