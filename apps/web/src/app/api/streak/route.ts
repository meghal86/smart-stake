import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('streak_count, last_seen_date')
      .eq('user_id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ streak: profile })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch streak' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date().toISOString().split('T')[0]

    // Get current profile
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('streak_count, last_seen_date')
      .eq('user_id', user.id)
      .single()

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Check if user already visited today
    if (profile.last_seen_date === today) {
      return NextResponse.json({ streak: profile })
    }

    // Calculate new streak
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    let newStreakCount = profile.streak_count
    if (profile.last_seen_date === yesterdayStr) {
      // Consecutive day - increment streak
      newStreakCount += 1
    } else if (profile.last_seen_date !== today) {
      // Not consecutive - reset streak
      newStreakCount = 1
    }

    // Update profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        streak_count: newStreakCount,
        last_seen_date: today
      })
      .eq('user_id', user.id)
      .select('streak_count, last_seen_date')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ streak: updatedProfile })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update streak' },
      { status: 500 }
    )
  }
}
