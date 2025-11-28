import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    if (!process.env.WHALE_ALERT_API_KEY) {
      throw new Error('WHALE_ALERT_API_KEY not configured');
    }

    const { data, error } = await supabase.functions.invoke('whale-alerts', {
      headers: { 'Content-Type': 'application/json' }
    });

    if (error) throw new Error(`Whale Alert API failed: ${error.message}`);
    if (!data?.transactions) throw new Error('No transaction data received');

    const { data: { session } } = await supabase.auth.getSession();
    const plan = session ? 'PRO' : 'LITE';

    const items = data.transactions.slice(0, plan === 'LITE' ? 5 : 50).map((tx: unknown) => ({
      id: tx.id || `${tx.hash}-${tx.timestamp}`,
      event_time: new Date(tx.timestamp * 1000).toISOString(),
      asset: tx.symbol,
      summary: `${tx.amount.toFixed(2)} ${tx.symbol} → ${tx.to?.owner_type || 'Unknown'}`,
      severity: tx.amount_usd > 10000000 ? 5 : tx.amount_usd > 5000000 ? 4 : 3,
      amount_usd: tx.amount_usd
    }));

    if (items.length === 0) {
      throw new Error('No whale transactions in last 24h');
    }

    return NextResponse.json({
      items,
      plan,
      timestamp: new Date().toISOString(),
      source: 'whale-alert-live'
    });

  } catch (error: unknown) {
    console.error('❌ /api/lite/digest FAILED:', error.message);
    return NextResponse.json(
      { 
        error: error.message,
        timestamp: new Date().toISOString(),
        endpoint: '/api/lite/digest'
      },
      { status: 503 }
    );
  }
}
