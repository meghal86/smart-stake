'use client'

import { Link } from 'react-router-dom'
import { trackEvent } from '@/lib/telemetry'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react'

const signals = [
  {
    id: 1,
    asset: 'BTC',
    event: 'Whale Accumulation',
    delta: '+2.3K BTC',
    impact: 'High',
    description: 'Large wallets adding significant positions',
    timeframe: '2h ago'
  },
  {
    id: 2,
    asset: 'ETH',
    event: 'Staking Surge',
    delta: '+15%',
    impact: 'Medium',
    description: 'Institutional staking activity increased',
    timeframe: '4h ago'
  },
  {
    id: 3,
    asset: 'USDC',
    event: 'Outflows Detected',
    delta: '-$50M',
    impact: 'High',
    description: 'Major movement to DeFi protocols',
    timeframe: '6h ago'
  }
]

export default function SignalCards() {
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
      <div className="flex items-center justify-between mb-3">
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
      
      {/* Mobile: Horizontal scroll, Desktop: Grid */}
      <div className="md:hidden">
        <div className="flex overflow-x-auto snap-x gap-3 pb-2">
          {signals.map((signal) => (
            <SignalCard 
              key={signal.id} 
              signal={signal} 
              onClick={() => handleSignalClick(signal)}
              className="min-w-[90%] snap-center"
            />
          ))}
        </div>
      </div>
      
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4" role="list">
        {signals.map((signal) => (
          <SignalCard 
            key={signal.id} 
            signal={signal} 
            onClick={() => handleSignalClick(signal)}
          />
        ))}
      </div>
    </section>
  )
}

function SignalCard({ 
  signal, 
  onClick,
  className = ''
}: { 
  signal: typeof signals[0]
  onClick: () => void
  className?: string
}) {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'aw-badge-high'
      case 'Medium': return 'aw-badge-medium'
      case 'Low': return 'aw-badge-low'
      default: return 'aw-badge bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
    }
  }

  const getDeltaIcon = (delta: string) => {
    if (delta.startsWith('+')) return <TrendingUp className="h-3 w-3 text-green-500" />
    if (delta.startsWith('-')) return <TrendingDown className="h-3 w-3 text-red-500" />
    return <AlertCircle className="h-3 w-3 text-orange-500" />
  }

  return (
    <Card 
      className={`aw-card aw-shadow cursor-pointer hover:bg-white/90 dark:hover:bg-slate-900/80 transition-all ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Signal: ${signal.event} for ${signal.asset}. ${signal.description}. Impact: ${signal.impact}. ${signal.timeframe}`}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-slate-100">{signal.asset}</span>
            <span className={getImpactColor(signal.impact)}>
              {signal.impact}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {getDeltaIcon(signal.delta)}
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {signal.delta}
            </span>
          </div>
        </div>
        
        <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
          {signal.event}
        </h3>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
          {signal.description}
        </p>
        
        <p className="text-xs text-slate-500 dark:text-slate-500">
          {signal.timeframe}
        </p>
      </CardContent>
    </Card>
  )
}