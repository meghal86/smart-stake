import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]

    const { data: whaleIndex, error } = await supabase
      .from('whale_index')
      .select('*')
      .eq('date', today)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ whaleIndex })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch whale index' },
      { status: 500 }
    )
  }
}
