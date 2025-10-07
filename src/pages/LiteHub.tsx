import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSubscription } from '@/hooks/useSubscription'
import { trackEvent } from '@/lib/telemetry'
import LiteGlobalHeader from '@/components/navigation/LiteGlobalHeader'
import QuickActionsBar from '@/components/lite/QuickActionsBar'
import DigestCard from '@/components/lite/DigestCard'
import PortfolioDemo from '@/components/lite/PortfolioDemo'
import UpgradeTeaser from '@/components/lite/UpgradeTeaser'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TrendingUp, Shield, Activity } from 'lucide-react'
import FOMOLeaderboard from '@/components/hub5/FOMOLeaderboard'
import SignalsPreview from '@/components/hub5/SignalsPreview.lite'

export default function LiteHub() {
  const { user } = useAuth()
  const { userPlan } = useSubscription()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    trackEvent('home_view', { page: 'lite', plan: userPlan?.plan || 'lite' })
    setIsLoading(false)
  }, [userPlan])

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
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-label="Key Performance Indicators">
          <KPICard title="Whale Pressure" value="73" change="+5.2%" icon={<TrendingUp className="h-5 w-5" />} color="text-cyan-500" />
          <KPICard title="Market Sentiment" value="Bullish" change="↗ Strong" icon={<Activity className="h-5 w-5" />} color="text-green-500" />
          <KPICard title="Risk Index" value="Low" change="Stable" icon={<Shield className="h-5 w-5" />} color="text-blue-500" />
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

function KPICard({ title, value, change, icon, color }: {
  title: string; value: string; change: string; icon: React.ReactNode; color: string
}) {
  return (
    <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-md border-slate-200/50 dark:border-slate-700/50" role="region" aria-label={`${title} metric`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-slate-600 dark:text-slate-400">{title}</p>
            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100" aria-label={`${title} value: ${value}`}>{value}</p>
            <p className={`text-xs ${color}`} aria-label={`Change: ${change}`}>{change}</p>
          </div>
          <div className={`${color} opacity-80`} aria-hidden="true">{icon}</div>
        </div>
      </CardContent>
    </Card>
  )
}

