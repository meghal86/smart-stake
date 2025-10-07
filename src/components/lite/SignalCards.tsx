'use client'

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { trackEvent } from '@/lib/telemetry'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'

export default function SignalCards() {
  const [signals, setSignals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const formatRelativeTime = (timestamp: number) => {
    const now = Date.now()
    const diff = now - timestamp
    const mins = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    if (hours < 24) return `${hours}h ago`
    return new Date(timestamp).toLocaleDateString()
  }

  useEffect(() => {
    async function loadSignals() {
      try {
        const { supabase } = await import('@/integrations/supabase/client')
        const { data, error } = await supabase.functions.invoke('whale-alerts')
        
        if (error || !data?.transactions) {
          console.error('❌ Signals failed:', error)
          setLoading(false)
          return
        }
        
        const liveSignals = data.transactions.slice(0, 3).map((tx: any, idx: number) => ({
          id: `${tx.hash || idx}`,
          asset: tx.symbol,
          event: tx.to?.owner_type === 'exchange' ? 'Large Exchange Inflow' : 'Large Whale Accumulation',
          delta: `+${(tx.amount_usd / 1000000).toFixed(1)}M`,
          impact: tx.amount_usd > 10000000 ? 'High' : tx.amount_usd > 5000000 ? 'Medium' : 'Low',
          description: `${tx.amount?.toFixed(2)} ${tx.symbol} moved to ${tx.to?.owner_type === 'exchange' ? 'exchange' : 'whale wallet'}`,
          timeframe: formatRelativeTime(tx.timestamp * 1000),
          reasons: tx.to?.owner_type === 'exchange' ? ['Exchange inflow', 'Whale activity'] : ['Whale accumulation', 'Large volume'],
          confidence: tx.amount_usd > 10000000 ? 'high' : 'medium'
        }))
        
        setSignals(liveSignals)
        console.log('✅ Loaded', liveSignals.length, 'live signals')
        setLoading(false)
      } catch (err) {
        console.error('❌ Failed to load signals:', err)
        setLoading(false)
      }
    }
    loadSignals()
  }, [])
  const handleViewAll = () => {
    trackEvent('cta_click', { label: 'view_all_signals', plan: 'lite' })
  }

  const handleSignalClick = (signal: typeof signals[0]) => {
    trackEvent('cta_click', { 
      label: 'signal_click', 
      signal: signal.event, 
      asset: signal.asset,
      impact: signal.impact,
      plan: 'lite' 
    })
  }

  return (
    <section aria-label="Top Market Signals">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Top Signals</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          asChild
          onClick={handleViewAll}
          className="text-cyan-500 hover:text-cyan-600"
          aria-label="View all market signals"
        >
          <Link to="/signals">View All</Link>
        </Button>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : signals.length === 0 ? (
        <div className="text-center py-12 px-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
          <p className="text-slate-600 dark:text-slate-400 mb-3">No new whale moves</p>
          <Button size="sm" variant="outline">Create an alert</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" role="list">
          {signals.map((signal, idx) => (
            <SignalCard 
              key={signal.id} 
              signal={signal} 
              onClick={() => handleSignalClick(signal)}
              delay={idx * 100}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function SignalCard({ 
  signal, 
  onClick,
  delay = 0
}: { 
  signal: any
  onClick: () => void
  delay?: number
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
      case 'Medium': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
      case 'Low': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-emerald-300'
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
    }
  }

  return (
    <Card 
      className={`aw-card aw-shadow cursor-pointer transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      } ${
        isHovered 
          ? 'bg-white/95 dark:bg-slate-900/90 shadow-[0_0_12px_rgba(56,189,248,0.25)] dark:shadow-[0_0_12px_rgba(56,189,248,0.15)] scale-[1.02]' 
          : 'bg-white/60 dark:bg-slate-900/60'
      }`}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      tabIndex={0}
      aria-label={`Signal: ${signal.event} for ${signal.asset}. ${signal.description}. Impact: ${signal.impact}. ${signal.timeframe}`}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg text-slate-900 dark:text-slate-100">{signal.asset}</span>
            <Badge className={getImpactColor(signal.impact)}>
              {signal.impact}
            </Badge>
            {signal.confidence === 'high' && isHovered && (
              <Badge className="bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300 text-xs">
                ⚡ Actionable
              </Badge>
            )}
          </div>
          <div className="text-sm font-semibold text-green-600 dark:text-green-400">
            {signal.delta}
          </div>
        </div>
        
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
          {signal.event}
        </h3>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
          {signal.description}
        </p>
        
        {signal.reasons && signal.reasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {signal.reasons.map((reason: string, idx: number) => (
              <Badge key={idx} variant="outline" className="text-xs">
                {reason}
              </Badge>
            ))}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500">
            <span>⏱</span>
            <span>{signal.timeframe}</span>
          </div>
          
          {isHovered && (
            <div className="flex gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 px-2 text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
                onClick={(e) => { e.stopPropagation(); trackEvent('signal_explain_clicked', { id: signal.id }) }}
              >
                Explain
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-7 px-2 text-xs text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
                onClick={(e) => { e.stopPropagation(); trackEvent('signal_alert_clicked', { id: signal.id }) }}
              >
                Alert
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}