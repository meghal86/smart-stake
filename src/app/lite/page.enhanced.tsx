'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'
import { trackEvent } from '@/lib/telemetry'
import LiteGlobalHeader from '@/components/navigation/LiteGlobalHeader'
import QuickActionsBar from '@/components/lite/QuickActionsBar'
import DigestCard from '@/components/lite/DigestCard'
import PortfolioDemo from '@/components/lite/PortfolioDemo'
import UpgradeTeaser from '@/components/lite/UpgradeTeaser'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import FOMOLeaderboard from '@/components/hub5/FOMOLeaderboard'
import { EnhancedSummaryKpis } from '@/components/hub5/EnhancedSummaryKpis'

export default function LitePage() {
  const { user } = useAuth()
  const { userPlan } = useSubscription()
  const [isLoading, setIsLoading] = useState(true)
  const [kpiData, setKpiData] = useState<any>(null)

  useEffect(() => {
    trackEvent('home_view', { page: 'lite', plan: userPlan?.plan || 'lite' })
    setIsLoading(false)
  }, [userPlan])

  useEffect(() => {
    async function loadKPIs() {
      console.log('🔄 Loading market KPIs...')
      try {
        const { supabase } = await import('@/integrations/supabase/client')
        const { data, error } = await supabase.functions.invoke('market-kpis')
        
        if (error) {
          console.error('❌ KPI error:', error)
          return
        }
        
        if (data) {
          setKpiData(data)
          console.log('✅ Loaded market KPIs:', data)
        }
      } catch (err) {
        console.error('❌ Failed to load KPIs:', err)
      }
    }
    loadKPIs()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
        <LiteGlobalHeader />
        <div className="animate-pulse space-y-4 p-4">
          <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
          <div className="h-40 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pb-20">
      <LiteGlobalHeader />
      <main className="mx-auto max-w-7xl px-4 space-y-4" role="main">
        {/* ENHANCED KPI CARDS - Novice-Friendly */}
        <section aria-label="Key Performance Indicators">
          <EnhancedSummaryKpis
            whalePressure={kpiData?.whalePressure || 100}
            sentiment={kpiData?.marketSentiment || 50}
            riskIndex={kpiData?.riskIndex || 50}
            whaleInflow={kpiData?.whaleInflow || 125}
            whaleOutflow={kpiData?.whaleOutflow || 87}
            btcDominance={kpiData?.btcDominance || 52}
            activeWhales={kpiData?.activeWhales || 76}
            lastUpdated="2min ago"
          />
        </section>

        <DigestCard />
        <SignalsPreview />
        <FOMOLeaderboard 
          isLoggedIn={!!user} 
          userStreak={4} 
          userRank={user ? 127 : undefined}
        />
        <PortfolioDemo />
        <UpgradeTeaser />
      </main>
      <QuickActionsBar />
    </div>
  )
}

function SignalsPreview() {
  return (
    <section aria-label="Market Signals">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Top Signals</h2>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => trackEvent('cta_click', { label: 'view_all_signals', plan: 'lite' })} 
          className="text-cyan-500"
          aria-label="View all market signals"
        >
          View All
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="list" aria-label="Top market signals">
        <SignalCard title="BTC Whale Accumulation" description="Large wallets adding 2.3K BTC" confidence="High" timeframe="2h ago" />
        <SignalCard title="ETH Staking Surge" description="Institutional staking +15%" confidence="Medium" timeframe="4h ago" />
      </div>
    </section>
  )
}

function SignalCard({ title, description, confidence, timeframe }: {
  title: string; description: string; confidence: string; timeframe: string
}) {
  return (
    <Card 
      className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-slate-200/50 dark:border-slate-700/50 cursor-pointer hover:bg-white/80 dark:hover:bg-slate-900/80 transition-all" 
      onClick={() => trackEvent('cta_click', { label: 'signal_click', signal: title, plan: 'lite' })}
      role="button"
      tabIndex={0}
      aria-label={`Signal: ${title}. ${description}. Confidence: ${confidence}. ${timeframe}`}
      onKeyDown={(e) => e.key === 'Enter' && trackEvent('cta_click', { label: 'signal_click', signal: title, plan: 'lite' })}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-slate-900 dark:text-slate-100">{title}</h3>
          <span className={`text-xs px-2 py-1 rounded-full ${confidence === 'High' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`} aria-label={`Confidence level: ${confidence}`}>{confidence}</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{description}</p>
        <p className="text-xs text-slate-500" aria-label={`Time: ${timeframe}`}>{timeframe}</p>
      </CardContent>
    </Card>
  )
}
