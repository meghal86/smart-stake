import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
  try {
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError) throw new Error(`Auth failed: ${authError.message}`);
    if (!session) {
      return NextResponse.json({
        streak_count: 0,
        last_seen_date: null,
        authenticated: false,
        timestamp: new Date().toISOString()
      });
    }

    const { data: profile, error: dbError } = await supabase
      .from('user_profiles')
      .select('streak_count, last_seen_date')
      .eq('id', session.user.id)
      .single();

    if (dbError) throw new Error(`Database query failed: ${dbError.message}`);
    if (!profile) throw new Error('User profile not found');

    return NextResponse.json({
      streak_count: profile.streak_count || 0,
      last_seen_date: profile.last_seen_date,
      authenticated: true,
      timestamp: new Date().toISOString(),
      source: 'supabase-live'
    });

  } catch (error: any) {
    console.error('❌ /api/lite/streak FAILED:', error.message);
    return NextResponse.json(
      { 
        error: error.message,
        timestamp: new Date().toISOString(),
        endpoint: '/api/lite/streak'
      },
      { status: 503 }
    );
  }
}
