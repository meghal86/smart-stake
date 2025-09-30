import { NextResponse } from 'next/server'

export async function GET() {
  // Mock data for demo purposes when Supabase is not configured
  const mockData = {
    date: new Date().toISOString().split('T')[0],
    score: 67,
    label: 'Elevated'
  }

  return NextResponse.json(mockData)
}
