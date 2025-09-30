import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Mock health data - in production this would check actual service health
    const healthData = {
      status: 'ok',
      providers: {
        whaleAlerts: {
          status: 'ok',
          latency: Math.floor(Math.random() * 100) + 50, // 50-150ms
          errorRate: Math.random() * 2 // 0-2%
        },
        marketSummary: {
          status: 'ok',
          latency: Math.floor(Math.random() * 150) + 100, // 100-250ms
          errorRate: Math.random() * 1 // 0-1%
        },
        assetSentiment: {
          status: 'ok',
          latency: Math.floor(Math.random() * 80) + 30, // 30-110ms
          errorRate: Math.random() * 0.5 // 0-0.5%
        }
      },
      lastChecked: new Date().toISOString()
    };

    return NextResponse.json(healthData, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'down',
        providers: {
          whaleAlerts: { status: 'down', latency: 0, errorRate: 100 },
          marketSummary: { status: 'down', latency: 0, errorRate: 100 },
          assetSentiment: { status: 'down', latency: 0, errorRate: 100 }
        },
        lastChecked: new Date().toISOString(),
        error: 'Health check failed'
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
