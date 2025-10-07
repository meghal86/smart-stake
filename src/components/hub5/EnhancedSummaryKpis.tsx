'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Activity, TrendingUp, TrendingDown, AlertTriangle, RefreshCw, AlertCircle } from 'lucide-react'
import { trackEvent } from '@/lib/telemetry'
import { fmt, showDelta } from '@/lib/format'
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
  pressureDelta?: number
  sentimentDelta?: number
  riskDelta?: number
  source?: 'live' | 'cache'
  onRefresh?: () => Promise<void>
  error?: string
}

export function EnhancedSummaryKpis({ 
  whalePressure, 
  sentiment, 
  riskIndex,
  whaleInflow = 125,
  whaleOutflow = 87,
  btcDominance = 52,
  activeWhales = 76,
  lastUpdated,
  pressureDelta = 0,
  sentimentDelta = 0,
  riskDelta = 0,
  source = 'live',
  onRefresh,
  error
}: EnhancedSummaryKpisProps) {
  const [refreshing, setRefreshing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' && containerRef.current?.contains(document.activeElement)) {
        e.preventDefault()
        handleRefresh()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (showDelta(pressureDelta)) trackEvent('kpis_trend_rendered', { delta_sign: pressureDelta > 0 ? 'positive' : 'negative', metric: 'pressure' })
    if (showDelta(sentimentDelta)) trackEvent('kpis_trend_rendered', { delta_sign: sentimentDelta > 0 ? 'positive' : 'negative', metric: 'sentiment' })
    if (showDelta(riskDelta)) trackEvent('kpis_trend_rendered', { delta_sign: riskDelta > 0 ? 'positive' : 'negative', metric: 'risk' })
    
    if (!showDelta(pressureDelta)) trackEvent('kpi_delta_noise_filtered', { metric: 'pressure', delta: pressureDelta })
    if (!showDelta(sentimentDelta)) trackEvent('kpi_delta_noise_filtered', { metric: 'sentiment', delta: sentimentDelta })
    if (!showDelta(riskDelta)) trackEvent('kpi_delta_noise_filtered', { metric: 'risk', delta: riskDelta })
    
    trackEvent('kpis_source_type', { source })
    if (source === 'cache') trackEvent('kpi_cache_hit', {})
  }, [pressureDelta, sentimentDelta, riskDelta, source])

  const handleRefresh = async () => {
    if (!onRefresh || refreshing) return
    setRefreshing(true)
    const start = Date.now()
    try {
      await onRefresh()
      trackEvent('kpi_manual_refresh', { latency_ms: Date.now() - start })
    } finally {
      setRefreshing(false)
    }
  }
  
  const getWhalePressureStatus = () => {
    if (whalePressure > 110) return { 
      label: 'Accumulating', 
      color: 'green' as const, 
      text: 'More Buying',
      action: '🔔 Alert me on dips'
    }
    if (whalePressure < 90) return { 
      label: 'Selling', 
      color: 'red' as const, 
      text: 'More Selling',
      action: '🔔 Alert me on spikes'
    }
    return { 
      label: 'Balanced', 
      color: 'yellow' as const, 
      text: 'Balanced',
      action: '🔔 Alert on change'
    }
  }

  const getSentimentStatus = () => {
    if (sentiment > 70) return { 
      emoji: '😊', 
      label: 'Confident', 
      color: 'green' as const,
      action: '📚 Learn strategy'
    }
    if (sentiment > 40) return { 
      emoji: '😐', 
      label: 'Cautious', 
      color: 'yellow' as const,
      action: '🔔 Set alert'
    }
    return { 
      emoji: '😟', 
      label: 'Worried', 
      color: 'red' as const,
      action: '📚 Risk guide'
    }
  }

  const getRiskStatus = () => {
    if (riskIndex > 60) return { 
      label: 'High', 
      color: 'red' as const,
      action: '🔔 Alert on spikes'
    }
    if (riskIndex > 40) return { 
      label: 'Medium', 
      color: 'yellow' as const,
      action: '📚 Learn more'
    }
    return { 
      label: 'Low', 
      color: 'green' as const,
      action: '🔔 Alert on change'
    }
  }

  const whalePressureStatus = getWhalePressureStatus()
  const sentimentStatus = getSentimentStatus()
  const riskStatus = getRiskStatus()

  const badgeColors = {
    green: 'bg-emerald-500 text-white border-emerald-600',
    red: 'bg-red-500 text-white border-red-600',
    yellow: 'bg-amber-500 text-slate-900 border-amber-600'
  }

  const cardBorders = {
    green: 'border-[#3BFFAE1F] shadow-sm hover:shadow-md dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_8px_24px_rgba(0,0,0,0.45)] dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_8px_24px_rgba(0,0,0,0.45),0_0_12px_rgba(59,255,174,0.25)]',
    red: 'border-[#FF7B7B1F] shadow-sm hover:shadow-md dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_8px_24px_rgba(0,0,0,0.45)] dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_8px_24px_rgba(0,0,0,0.45),0_0_12px_rgba(255,123,123,0.25)]',
    yellow: 'border-[#FFD84D1F] shadow-sm hover:shadow-md dark:shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_8px_24px_rgba(0,0,0,0.45)] dark:hover:shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_8px_24px_rgba(0,0,0,0.45),0_0_12px_rgba(255,216,77,0.25)]'
  }

  const TrendArrow = ({ delta, metric }: { delta: number; metric: string }) => {
    if (!showDelta(delta)) return null
    const isPositive = delta > 0
    const Icon = isPositive ? TrendingUp : TrendingDown
    const color = isPositive ? 'text-emerald-500' : 'text-red-500'
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Icon className={cn('w-3 h-3 inline-block ml-1 transition-opacity duration-100', color)} aria-hidden="false" role="img" />
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Compared to last 24h • Δ {delta > 0 ? '+' : ''}{delta.toFixed(1)}%</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <div ref={containerRef}>
      {error && (
        <div className="mb-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-4 h-4" />
            <span>Using cached data (60s). {error}</span>
          </div>
          {onRefresh && (
            <Button size="sm" variant="ghost" className="h-6 px-2" onClick={handleRefresh}>
              Retry
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Card 
            className={cn('rounded-xl transition-all duration-300 ease-in-out bg-white/80 dark:bg-[#141E36] border-slate-200 hover:border-slate-300 dark:hover:bg-[#141E36]/95 dark:hover:shadow-[0_0_8px_rgba(56,113,243,0.3)] backdrop-blur-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-500', cardBorders[whalePressureStatus.color])}
            aria-label={`Whale Pressure: ${whalePressure}, ${whalePressureStatus.label}, ${source === 'live' ? 'Live Data' : 'Cached Data'}`}
            onMouseEnter={() => trackEvent('kpis_hover_detail', { metric: 'whale_pressure' })}
            tabIndex={0}
          >
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              <Activity className="w-4 h-4 text-cyan-500" />
              <div>
                <div className="text-xs tracking-wide text-slate-500 dark:text-slate-400">Big Money</div>
                <div className="flex items-baseline gap-1">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{whalePressureStatus.text}</div>
                  <span className="text-base font-semibold text-slate-700 dark:text-slate-300">
                    +{whalePressure.toFixed(0)}
                    <TrendArrow delta={pressureDelta} metric="pressure" />
                  </span>
                </div>
              </div>
            </div>
            <Badge className={cn('text-xs px-2.5 py-1 font-bold shadow-sm', badgeColors[whalePressureStatus.color])}>
              {whalePressureStatus.label}
            </Badge>
          </div>
          <Button 
            type="button"
            size="sm" 
            variant="ghost" 
            className="w-full text-xs h-7 justify-start px-2"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              trackEvent('kpi_action', { kpi: 'whale_pressure', action: 'alert' })
            }}
          >
            {whalePressureStatus.action}
          </Button>
        </CardContent>
          </Card>
        </PopoverTrigger>
        <PopoverContent className="w-64 bg-white dark:bg-[#0C1221] border-cyan-500/20">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Whale Pressure Details</h4>
            <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
              <div className="flex justify-between"><span>Inflows:</span><span className="font-medium">${fmt(whaleInflow)}M</span></div>
              <div className="flex justify-between"><span>Outflows:</span><span className="font-medium">${fmt(whaleOutflow)}M</span></div>
              {showDelta(pressureDelta) && (
                <div className="flex justify-between"><span>24h Change:</span><span className={cn('font-medium', pressureDelta > 0 ? 'text-emerald-500' : 'text-red-500')}>{pressureDelta > 0 ? '+' : ''}{pressureDelta.toFixed(1)}%</span></div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Card 
            className={cn('rounded-xl transition-all duration-300 ease-in-out bg-white/80 dark:bg-[#141E36] border-slate-200 hover:border-slate-300 dark:hover:bg-[#141E36]/95 dark:hover:shadow-[0_0_8px_rgba(56,113,243,0.3)] backdrop-blur-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-500', cardBorders[sentimentStatus.color])}
            aria-label={`Market Sentiment: ${sentiment}%, ${sentimentStatus.label}, ${source === 'live' ? 'Live Data' : 'Cached Data'}`}
            onMouseEnter={() => trackEvent('kpis_hover_detail', { metric: 'sentiment' })}
            tabIndex={0}
          >
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xl">{sentimentStatus.emoji}</span>
              <div>
                <div className="text-xs tracking-wide text-slate-500 dark:text-slate-400">Market Mood</div>
                <div className="flex items-baseline gap-1">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{sentimentStatus.label}</div>
                  <span className="text-base font-semibold text-slate-700 dark:text-slate-300">
                    {sentiment}%
                    <TrendArrow delta={sentimentDelta} metric="sentiment" />
                  </span>
                </div>
              </div>
            </div>
            <Badge className={cn('text-xs px-2.5 py-1 font-bold shadow-sm', badgeColors[sentimentStatus.color])}>
              {sentimentStatus.label}
            </Badge>
          </div>
          <Button 
            type="button"
            size="sm" 
            variant="ghost" 
            className="w-full text-xs h-7 justify-start px-2"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              trackEvent('kpi_action', { kpi: 'sentiment', action: 'learn' })
            }}
          >
            {sentimentStatus.action}
          </Button>
        </CardContent>
          </Card>
        </PopoverTrigger>
        <PopoverContent className="w-64 bg-white dark:bg-[#0C1221] border-cyan-500/20">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Market Sentiment Details</h4>
            <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
              <div className="flex justify-between"><span>BTC Dominance:</span><span className="font-medium">{btcDominance}%</span></div>
              {showDelta(sentimentDelta) && (
                <div className="flex justify-between"><span>24h Change:</span><span className={cn('font-medium', sentimentDelta > 0 ? 'text-emerald-500' : 'text-red-500')}>{sentimentDelta > 0 ? '+' : ''}{sentimentDelta.toFixed(1)}%</span></div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Card 
            className={cn('rounded-xl transition-all duration-300 ease-in-out bg-white/80 dark:bg-[#141E36] border-slate-200 hover:border-slate-300 dark:hover:bg-[#141E36]/95 dark:hover:shadow-[0_0_8px_rgba(56,113,243,0.3)] backdrop-blur-sm cursor-pointer focus-visible:ring-2 focus-visible:ring-cyan-500', cardBorders[riskStatus.color])}
            aria-label={`Risk Index: ${riskIndex}, ${riskStatus.label}, ${source === 'live' ? 'Live Data' : 'Cached Data'}`}
            onMouseEnter={() => trackEvent('kpis_hover_detail', { metric: 'risk' })}
            tabIndex={0}
          >
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 flex-1">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <div>
                <div className="text-xs tracking-wide text-slate-500 dark:text-slate-400">Risk Level</div>
                <div className="flex items-baseline gap-1">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">{riskStatus.label}</div>
                  <span className="text-base font-semibold text-slate-700 dark:text-slate-300">
                    {riskIndex}/100
                    <TrendArrow delta={riskDelta} metric="risk" />
                  </span>
                </div>
              </div>
            </div>
            <Badge className={cn('text-xs px-2.5 py-1 font-bold shadow-sm', badgeColors[riskStatus.color])}>
              {riskStatus.label}
            </Badge>
          </div>
          <Button 
            type="button"
            size="sm" 
            variant="ghost" 
            className="w-full text-xs h-7 justify-start px-2"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              trackEvent('kpi_action', { kpi: 'risk', action: 'alert' })
            }}
          >
            {riskStatus.action}
          </Button>
        </CardContent>
          </Card>
        </PopoverTrigger>
        <PopoverContent className="w-64 bg-white dark:bg-[#0C1221] border-cyan-500/20">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-slate-900 dark:text-white">Risk Index Details</h4>
            <div className="text-xs space-y-1 text-slate-600 dark:text-slate-400">
              <div className="flex justify-between"><span>Active Whales:</span><span className="font-medium">{activeWhales}</span></div>
              <div className="flex justify-between"><span>Volatility:</span><span className="font-medium">35%</span></div>
              {showDelta(riskDelta) && (
                <div className="flex justify-between"><span>24h Change:</span><span className={cn('font-medium', riskDelta > 0 ? 'text-red-500' : 'text-emerald-500')}>{riskDelta > 0 ? '+' : ''}{riskDelta.toFixed(1)}%</span></div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      </div>

      {(lastUpdated || onRefresh) && (
        <div className="flex items-center justify-between mt-2 text-xs text-slate-400" aria-live="polite">
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span>
                Last updated • {new Date(lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
            <Badge 
              variant="outline" 
              className={cn(
                'text-xs px-2 py-0.5 border',
                source === 'live' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
              )}
            >
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>{source === 'live' ? 'Live ✓' : 'Cached'}</span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Data source: Supabase Edge Function / Whale Alert + CoinGecko</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Badge>
          </div>
          {onRefresh && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-xs"
                    onClick={handleRefresh}
                    disabled={refreshing}
                    aria-label="Refresh KPI data (Press R)"
                  >
                    <RefreshCw className={cn('w-3 h-3', refreshing && 'animate-spin')} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Press R to refresh</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )}
    </div>
  )
}
