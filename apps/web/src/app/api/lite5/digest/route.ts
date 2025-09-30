import { NextResponse } from 'next/server'

export async function GET() {
  // Mock data for demo purposes when Supabase is not configured
  const mockData = [
    {
      id: 1,
      event_time: new Date().toISOString(),
      asset: 'ETH',
      summary: '10k ETH moved to Binance',
      severity: 4
    },
    {
      id: 2,
      event_time: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
      asset: 'USDT',
      summary: '50M USDT minted on Tron',
      severity: 3
    },
    {
      id: 3,
      event_time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      asset: 'BTC',
      summary: '2,500 BTC withdrawn from Coinbase',
      severity: 5
    }
  ]

  return NextResponse.json({ 
    items: mockData, 
    plan: 'LITE', 
    full: false 
  })
}
