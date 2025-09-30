import { NextResponse } from 'next/server'

export async function GET() {
  // Mock data for demo purposes when Supabase is not configured
  const mockData = {
    next: {
      token: 'APT',
      unlock_time: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
      amount_usd: 25000000
    },
    plan: 'LITE'
  }

  return NextResponse.json(mockData)
}
