import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const querySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val) : 1)
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { limit } = querySchema.parse(Object.fromEntries(searchParams))

    const { data: unlocks, error } = await supabase
      .from('token_unlocks')
      .select('*')
      .gte('unlock_time', new Date().toISOString())
      .order('unlock_time', { ascending: true })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ unlocks })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 }
    )
  }
}
