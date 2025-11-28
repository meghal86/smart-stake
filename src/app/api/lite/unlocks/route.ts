import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: unlocks, error } = await supabase
      .from('token_unlocks')
      .select('*')
      .gte('unlock_time', new Date().toISOString())
      .order('unlock_time', { ascending: true })
      .limit(10);

    if (error) throw new Error(`Database query failed: ${error.message}`);
    if (!unlocks) throw new Error('No unlock data received');

    const { data: { session } } = await supabase.auth.getSession();
    const plan = session ? 'PRO' : 'LITE';

    const items = unlocks.map(unlock => ({
      token: unlock.token,
      unlock_time: unlock.unlock_time,
      amount_usd: unlock.amount_usd,
      chain: unlock.chain,
      project_name: unlock.project_name
    }));

    return NextResponse.json({
      items: plan === 'LITE' ? items.slice(0, 3) : items,
      plan,
      next: items[0] || null,
      timestamp: new Date().toISOString(),
      source: 'supabase-live'
    });

  } catch (error: unknown) {
    console.error('❌ /api/lite/unlocks FAILED:', error.message);
    return NextResponse.json(
      { 
        error: error.message,
        timestamp: new Date().toISOString(),
        endpoint: '/api/lite/unlocks'
      },
      { status: 503 }
    );
  }
}
