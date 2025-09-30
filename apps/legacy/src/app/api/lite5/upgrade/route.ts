import { NextResponse } from 'next/server'

export async function POST() {
  // Mock upgrade for demo purposes when Supabase is not configured
  // In a real app, this would integrate with Stripe or another payment processor
  return NextResponse.json({ success: true, message: 'Upgrade successful!' })
}
