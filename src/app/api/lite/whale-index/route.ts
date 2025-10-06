import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data, error } = await supabase.functions.invoke('market-summary-enhanced', {
      headers: { 'Content-Type': 'application/json' }
    });

    if (error) throw new Error(`Market summary API failed: ${error.message}`);
    if (!data) throw new Error('No market data received');

    const score = data.riskIndex || data.whaleActivityScore;
    if (typeof score !== 'number') {
      throw new Error('Invalid whale index score received');
    }

    const label = score >= 80 ? 'Hot' : 
                  score >= 60 ? 'Elevated' : 
                  score >= 40 ? 'Moderate' : 'Calm';

    return NextResponse.json({
      date: new Date().toISOString(),
      score: Math.round(score),
      label,
      whale_count: data.activeWhales || 0,
      timestamp: new Date().toISOString(),
      source: 'market-summary-live'
    });

  } catch (error: any) {
    console.error('❌ /api/lite/whale-index FAILED:', error.message);
    return NextResponse.json(
      { 
        error: error.message,
        timestamp: new Date().toISOString(),
        endpoint: '/api/lite/whale-index'
      },
      { status: 503 }
    );
  }
}
