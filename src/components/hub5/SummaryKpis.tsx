'use client'

import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { trackEvent } from '@/lib/telemetry'

interface SummaryKpisProps {
  whalePressure: number
  sentiment: number
  riskIndex: number
}

export function SummaryKpis({ whalePressure, sentiment, riskIndex }: SummaryKpisProps) {
  const handleCardClick = (kpi: string) => {
    trackEvent('card_click', { card: 'kpi', kpi })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Whale Pressure */}
      <Card 
        className="rounded-2xl shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-slate-900/70 dark:bg-slate-900/70 border-slate-700"
        onClick={() => handleCardClick('whale_pressure')}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-meta mb-1">Whale Pressure</h3>
              <div className="text-kpi">{whalePressure.toFixed(1)}</div>
            </div>
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-meta">Ratio of large tx inflows/outflows</p>
        </CardContent>
      </Card>

      {/* Market Sentiment */}
      <Card 
        className="rounded-2xl shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-slate-900/70 dark:bg-slate-900/70 border-slate-700"
        onClick={() => handleCardClick('sentiment')}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-meta mb-1">Market Sentiment</h3>
              <div className="text-kpi">{sentiment}%</div>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-meta">Bullish vs bearish whale activity</p>
        </CardContent>
      </Card>

      {/* Risk Index */}
      <Card 
        className="rounded-2xl shadow-md hover:shadow-lg transition-shadow cursor-pointer bg-slate-900/70 dark:bg-slate-900/70 border-slate-700"
        onClick={() => handleCardClick('risk_index')}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-meta mb-1">Risk Index</h3>
              <div className="text-kpi">{riskIndex}/100</div>
            </div>
            <TrendingDown className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-meta">Market volatility & whale concentration</p>
        </CardContent>
      </Card>
    </div>
  )
}