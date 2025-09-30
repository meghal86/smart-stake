import { NextResponse } from 'next/server'

export async function GET() {
  // Mock data for demo purposes when Supabase is not configured
  return NextResponse.json({ streak_count: 3 })
}

export async function POST() {
  // Mock data for demo purposes when Supabase is not configured
  return NextResponse.json({ streak_count: 4 })
}
