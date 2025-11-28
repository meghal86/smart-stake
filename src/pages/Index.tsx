import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
import { EnhancedSummaryKpis } from '@/components/hub5/EnhancedSummaryKpis'
import RiskToday from '@/components/kpi/RiskToday'
import { DiscoveryTour } from '@/components/discovery/DiscoveryTour'
import { FeatureBanner } from '@/components/discovery/FeatureBanner'
import { SpotlightCarousel } from '@/components/discovery/SpotlightCarousel'
import { BadgeNewPro } from '@/components/discovery/BadgeNewPro'
import '../styles/theme.css'

const Index = () => {
  const [searchParams] = useSearchParams()
  const tab = searchParams.get('tab')
  const { user } = useAuth()
  const { userPlan } = useSubscription()
  const [isLoading, setIsLoading] = useState(true)
  const [streakAdvanced, setStreakAdvanced] = useState(false)
  const [alertCreated, setAlertCreated] = useState(false)
  const [digestShared, setDigestShared] = useState(false)
  const [kpiData, setKpiData] = useState<unknown>(null)
  
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
      {/* Discovery Tour */}
      <DiscoveryTour />
      
      {/* 1. Global Header */}
      <div data-tour="header">
        <LiteGlobalHeader />
      </div>
      
      <main className="mx-auto max-w-7xl px-4 space-y-4" role="main">
        {/* Feature Banner */}
        <FeatureBanner />
        
        {/* 2. Risk Today */}
        <div data-tour="market-banner">
        <section aria-label="Risk Today" className="relative">
          <RiskToday
            riskIndex={kpiData?.riskIndex || 57}
            volatilityPct={35}
            activeWhales={kpiData?.activeWhales || 76}
            source="live"
            lastUpdated={kpiData?.updatedAt || new Date().toISOString()}
            onOpenAlert={() => console.log('Alert modal')}
            plan={userPlan?.plan || 'Lite'}
            trackEvent={trackEvent}
          />
          <div className="absolute top-2 right-2">
            <BadgeNewPro type="updated" feature="risk-today" tooltip="Enhanced with AI predictions" />
          </div>
        </section>

        {/* 3. Above the Fold KPIs */}
        <section aria-label="Key Performance Indicators">
          <EnhancedSummaryKpis
            whalePressure={kpiData?.whalePressure || 100}
            sentiment={kpiData?.marketSentiment || 50}
            whaleInflow={kpiData?.whaleInflow}
            whaleOutflow={kpiData?.whaleOutflow}
            btcDominance={kpiData?.btcDominance}
            lastUpdated="2min ago"
          />
        </section>

        {/* 4. AI Digest */}
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

        {/* 5. Top Signals */}
        <div className="relative" data-tour="whale-cards">
          <SignalCards />
          <div className="absolute top-2 right-2">
            <BadgeNewPro type="new" feature="ai-signals" tooltip="AI-powered whale signals" />
          </div>
        </div>
        </div>

        {/* 6. Progress Streak */}
        <ProgressStreak 
          userStreak={user ? 4 : 0} 
          userRank={user ? 127 : null}
          userRankPercentile={user ? 14 : undefined}
          onStreakAdvanced={streakAdvanced}
        />

        {/* 7. Portfolio + Unlock Compact */}
        <PortfolioCompact connected={!!user} />
        
        {/* Spotlight Carousel */}
        <div data-tour="alert-cta">
          <SpotlightCarousel />
        </div>
      </main>

      {/* 9. Sticky Bottom Quick Actions */}
      <QuickActionsBar 
        onStreakAdvanced={streakAdvanced}
        onAlertCreated={alertCreated}
        onDigestShared={digestShared}
      />
    </div>
  )
}

export default Index
