'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Activity, TrendingUp, AlertTriangle, Bell, BookOpen } from 'lucide-react'
import { trackEvent } from '@/lib/telemetry'
import { cn } from '@/lib/utils'

interface EnhancedSummaryKpisProps {
  whalePressure: number
  sentiment: number
  riskIndex: number
  whaleInflow?: number
  whaleOutflow?: number
  btcDominance?: number
  activeWhales?: number
  lastUpdated?: string
}

export function EnhancedSummaryKpis({ 
  whalePressure, 
  sentiment, 
  riskIndex,
  whaleInflow = 125,
  whaleOutflow = 87,
  btcDominance = 52,
  activeWhales = 76,
  lastUpdated = '2min ago'
}: EnhancedSummaryKpisProps) {
  
  const getWhalePressureStatus = () => {
    if (whalePressure > 110) return { 
      label: 'Accumulating', 
      color: 'green' as const, 
      text: 'More Buying',
      soWhat: 'Prices may rise soon',
      action: '🔔 Alert me on dips'
    }
    if (whalePressure < 90) return { 
      label: 'Selling', 
      color: 'red' as const, 
      text: 'More Selling',
      soWhat: 'Prices may drop soon',
      action: '🔔 Alert me on spikes'
    }
    return { 
      label: 'Balanced', 
      color: 'yellow' as const, 
      text: 'Balanced',
      soWhat: 'Wait for clearer signal',
      action: '🔔 Alert on change'
    }
  }

  const getSentimentStatus = () => {
    if (sentiment > 70) return { 
      emoji: '😊', 
      label: 'Confident', 
      color: 'green' as const,
      soWhat: 'Good time to hold',
      action: '📚 Learn strategy'
    }
    if (sentiment > 40) return { 
      emoji: '😐', 
      label: 'Cautious', 
      color: 'yellow' as const,
      soWhat: 'Monitor closely',
      action: '🔔 Set alert'
    }
    return { 
      emoji: '😟', 
      label: 'Worried', 
      color: 'red' as const,
      soWhat: 'Consider risk management',
      action: '📚 Risk guide'
    }
  }

  const getRiskStatus = () => {
    if (riskIndex > 60) return { 
      label: 'High', 
      color: 'red' as const,
      soWhat: 'Expect volatility',
      action: '🔔 Alert on spikes'
    }
    if (riskIndex > 40) return { 
      label: 'Medium', 
      color: 'yellow' as const,
      soWhat: 'Stay cautious',
      action: '📚 Learn more'
    }
    return { 
      label: 'Low', 
      color: 'green' as const,
      soWhat: 'Stable conditions',
      action: '🔔 Alert on change'
    }
  }

  const whalePressureStatus = getWhalePressureStatus()
  const sentimentStatus = getSentimentStatus()
  const riskStatus = getRiskStatus()

  const badgeColors = {
    green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    yellow: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      {/* Big Money Moves - Compressed */}
      <Card className="rounded-xl hover:shadow-md transition-all bg-slate-900/70 border-slate-700 hover:border-slate-600">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              <Activity className="w-4 h-4 text-cyan-400" />
              <div>
                <div className="text-xs text-slate-400">Big Money</div>
                <div className="flex items-baseline gap-1">
                  <div className="text-sm font-semibold text-white">{whalePressureStatus.text}</div>
                  <span className="text-base font-semibold text-slate-300">+{whalePressure.toFixed(0)}</span>
                </div>
              </div>
            </div>
            <Badge className={cn('text-xs px-2 py-0.5', badgeColors[whalePressureStatus.color])}>
              {whalePressureStatus.label}
            </Badge>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="w-full text-xs h-7 justify-start px-2"
            onClick={() => trackEvent('kpi_action', { kpi: 'whale_pressure', action: 'alert' })}
          >
            {whalePressureStatus.action}
          </Button>
        </CardContent>
      </Card>

      {/* Market Mood - Compressed */}
      <Card className="rounded-xl hover:shadow-md transition-all bg-slate-900/70 border-slate-700 hover:border-slate-600">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xl">{sentimentStatus.emoji}</span>
              <div>
                <div className="text-xs text-slate-400">Market Mood</div>
                <div className="flex items-baseline gap-1">
                  <div className="text-sm font-semibold text-white">{sentimentStatus.label}</div>
                  <span className="text-base font-semibold text-slate-300">{sentiment}%</span>
                </div>
              </div>
            </div>
            <Badge className={cn('text-xs px-2 py-0.5', badgeColors[sentimentStatus.color])}>
              {sentimentStatus.label}
            </Badge>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="w-full text-xs h-7 justify-start px-2"
            onClick={() => trackEvent('kpi_action', { kpi: 'sentiment', action: 'learn' })}
          >
            {sentimentStatus.action}
          </Button>
        </CardContent>
      </Card>

      {/* Market Risk - Compressed */}
      <Card className="rounded-xl hover:shadow-md transition-all bg-slate-900/70 border-slate-700 hover:border-slate-600">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs text-slate-400">Risk Level</div>
                <div className="flex items-baseline gap-1">
                  <div className="text-sm font-semibold text-white">{riskStatus.label}</div>
                  <span className="text-base font-semibold text-slate-300">{riskIndex}/100</span>
                </div>
              </div>
            </div>
            <Badge className={cn('text-xs px-2 py-0.5', badgeColors[riskStatus.color])}>
              {riskStatus.label}
            </Badge>
          </div>
          <Button 
            size="sm" 
            variant="ghost" 
            className="w-full text-xs h-7 justify-start px-2"
            onClick={() => trackEvent('kpi_action', { kpi: 'risk', action: 'alert' })}
          >
            {riskStatus.action}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
