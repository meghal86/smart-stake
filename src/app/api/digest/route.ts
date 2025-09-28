import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { z } from 'zod'

const querySchema = z.object({
  limit: z.string().optional().transform(val => val ? parseInt(val) : 3)
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { limit } = querySchema.parse(Object.fromEntries(searchParams))

    const { data: digest, error } = await supabase
      .from('whale_digest')
      .select('*')
      .order('event_time', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ digest })
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 }
    )
  }
}
