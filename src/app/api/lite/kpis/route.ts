import { NextResponse } from 'next/server'
import { createClient } from '@/integrations/supabase/server'

export async function GET() {
  try {
    const supabase = createClient()

    // Call Supabase Edge Function that fetches both Whale Alert and CoinGecko data
    const { data, error } = await supabase.functions.invoke('market-kpis')
    
    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error('KPI fetch error:', error)
    
    return NextResponse.json({
      whalePressure: 73,
      pressureDelta: 5.2,
      marketSentiment: 65,
      sentimentDelta: 3.1,
      riskIndex: 45,
      riskDelta: -2.4,
      activeWhales: 1247,
      refreshedAt: new Date().toISOString(),
      fallback: true,
      source: 'fallback'
    })
  }
}
