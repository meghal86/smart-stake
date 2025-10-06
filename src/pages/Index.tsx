import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'
import { trackEvent } from '@/lib/telemetry'
import LiteGlobalHeader from '@/components/navigation/LiteGlobalHeader'
import QuickActionsBar from '@/components/lite/QuickActionsBar'
import DigestCard from '@/components/lite/DigestCard'
import PortfolioDemo from '@/components/lite/PortfolioDemo'
import UpgradeTeaser from '@/components/lite/UpgradeTeaser'
import ProgressStreak from '@/components/lite/ProgressStreak'
import SignalCards from '@/components/lite/SignalCards'
import PortfolioCompact from '@/components/hub5/PortfolioCompact'
import KPITooltip from '@/components/ui/KPITooltip'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, Shield, Activity } from 'lucide-react'
import '../styles/theme.css'

const Index = () => {
  const { user } = useAuth()
  const { userPlan } = useSubscription()
  const [isLoading, setIsLoading] = useState(true)
  const [streakAdvanced, setStreakAdvanced] = useState(false)
  const [alertCreated, setAlertCreated] = useState(false)
  const [digestShared, setDigestShared] = useState(false)
  const [kpiData, setKpiData] = useState<any>(null)
  
  // Simulate streak advancement (would come from real data)
  useEffect(() => {
    const checkStreak = () => {
      const lastCheck = localStorage.getItem('aw:last_streak_check')
      const today = new Date().toDateString()
      if (lastCheck !== today) {
        setStreakAdvanced(true)
        localStorage.setItem('aw:last_streak_check', today)
        trackEvent('streak_advanced', { day: 4 })
        setTimeout(() => setStreakAdvanced(false), 2000)
      }
    }
    
    if (user) checkStreak()
  }, [user])

  useEffect(() => {
    trackEvent('home_view', { page: 'lite_home', plan: userPlan?.plan || 'lite' })
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
      {/* 1. Global Header */}
      <LiteGlobalHeader />
      
      <main className="mx-auto max-w-7xl px-4 space-y-4" role="main">
        {/* 2. Above the Fold KPIs */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-label="Key Performance Indicators">
          <KPICard 
            title="Whale Pressure" 
            value={kpiData ? kpiData.whalePressure.toString() : '...'} 
            change={kpiData ? `${kpiData.pressureDelta > 0 ? '+' : ''}${kpiData.pressureDelta.toFixed(1)}%` : '...'} 
            icon={<TrendingUp className="h-5 w-5" />} 
            color="text-cyan-500" 
          />
          <KPICard 
            title="Market Sentiment" 
            value={kpiData ? (kpiData.marketSentiment > 60 ? 'Bullish' : kpiData.marketSentiment > 40 ? 'Neutral' : 'Bearish') : '...'} 
            change={kpiData ? `${kpiData.marketSentiment}% confidence` : '...'} 
            icon={<Activity className="h-5 w-5" />} 
            color="text-green-500" 
          />
          <KPICard 
            title="Risk Index" 
            value={kpiData ? (kpiData.riskIndex > 70 ? 'High' : kpiData.riskIndex > 40 ? 'Medium' : 'Low') : '...'} 
            change={kpiData ? `${kpiData.riskIndex}/100` : '...'} 
            icon={<Shield className="h-5 w-5" />} 
            color="text-blue-500" 
          />
        </section>

        {/* 3. AI Digest */}
        <DigestCard 
          mode="novice" 
          demoMode={!user}
          onDigestShared={(shared) => {
            if (shared) {
              setDigestShared(true)
              setTimeout(() => setDigestShared(false), 2000)
            }
          }}
        />

        {/* 4. Top Signals */}
        <SignalCards />

        {/* 5. Progress Streak */}
        <ProgressStreak 
          userStreak={user ? 4 : 0} 
          userRank={user ? 127 : null}
          userRankPercentile={user ? 14 : undefined}
          onStreakAdvanced={streakAdvanced}
        />

        {/* 6. Portfolio + Unlock Compact */}
        <PortfolioCompact connected={!!user} />
      </main>

      {/* 8. Sticky Bottom Quick Actions */}
      <QuickActionsBar 
        onStreakAdvanced={streakAdvanced}
        onAlertCreated={alertCreated}
        onDigestShared={digestShared}
      />
    </div>
  )
}

function KPICard({ title, value, change, icon, color }: {
  title: string; value: string; change: string; icon: React.ReactNode; color: string
}) {
  const getTooltipText = (title: string) => {
    switch (title) {
      case 'Whale Pressure': return 'Whale buy/sell balance. >50% = accumulation.'
      case 'Market Sentiment': return 'Aggregate momentum from key on-chain flows.'
      case 'Risk Index': return 'Volatility + outflow risk. Lower is safer.'
      default: return ''
    }
  }

  const getTooltipSource = (title: string) => {
    switch (title) {
      case 'Whale Pressure': return 'kpi_whale_pressure' as const
      case 'Market Sentiment': return 'kpi_market_sentiment' as const
      case 'Risk Index': return 'kpi_risk_index' as const
      default: return 'kpi_whale_pressure' as const
    }
  }

  return (
    <Card className="aw-card aw-shadow" role="region" aria-label={`${title} metric`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <KPITooltip source={getTooltipSource(title)} tooltip={getTooltipText(title)}>
              <p className="text-sm text-slate-600 dark:text-slate-400">{title}</p>
            </KPITooltip>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100" aria-label={`${title} value: ${value}`}>{value}</p>
            <p className={`text-xs ${color}`} aria-label={`Change: ${change}`}>{change}</p>
          </div>
          <div className={`${color} opacity-80`} aria-hidden="true">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

export default Index
