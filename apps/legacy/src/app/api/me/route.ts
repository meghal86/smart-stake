import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase/server'

export async function GET() {
  const supabase = supabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ plan: 'LITE', user: null })

  const { data, error } = await supabase
    .from('user_profiles')
    .select('plan, streak_count, last_seen_date')
    .eq('user_id', user.id)
    .single()

  if (error) return NextResponse.json({ plan: 'LITE', user })

  return NextResponse.json({ plan: data?.plan ?? 'LITE', user, profile: data })
}
