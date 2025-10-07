import { useEffect, useState } from 'react'
import { trackEvent } from '@/lib/telemetry'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Activity, Brain, Wallet } from 'lucide-react'



export default function Hub5Page() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    trackEvent('home_view', { page: 'lite5_hub' })
    setTimeout(() => setIsLoading(false), 500)
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/40 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo + Wordmark */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🐋</span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-lg">ALPHAWHALE</span>
                <span className="text-xs text-slate-500 hidden sm:block">Learn → Act → Profit</span>
              </div>
            </div>

            {/* Center: Motto */}
            <div className="hidden md:block">
              <span className="text-sm text-slate-600">Learn → Act → Profit</span>
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-3">
              {/* Mode Toggle */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <Button type="button" variant="default" size="sm" className="text-xs px-2 py-1">Novice</Button>
                <Button type="button" variant="ghost" size="sm" className="text-xs px-2 py-1">Pro</Button>
                <Button type="button" variant="ghost" size="sm" className="text-xs px-2 py-1">Auto</Button>
              </div>

              {/* Theme Toggle */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <Button type="button" variant="default" size="sm" className="w-8 h-8 p-0">
                  <Activity className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="w-8 h-8 p-0">
                  <Brain className="w-4 h-4" />
                </Button>
                <Button type="button" variant="ghost" size="sm" className="w-8 h-8 p-0">
                  <TrendingUp className="w-4 h-4" />
                </Button>
              </div>

              {/* Pro/Upgrade Button */}
              <Button type="button" size="sm" className="bg-cyan-500 hover:bg-cyan-600 text-white">
                <Badge variant="secondary" className="mr-1 bg-amber-100 text-amber-800">Upgrade</Badge>
              </Button>

              {/* Profile */}
              <Button type="button" variant="ghost" size="sm" className="w-8 h-8 p-0 rounded-full bg-cyan-100">
                <span className="text-cyan-700 text-xs font-bold">U</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="space-y-8">
        {/* Hero */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">AlphaWhale — Lite</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">Every whale move, explained.</p>
        </div>

        {/* Market Dials */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-600 mb-1">Market Sentiment</h3>
                  <div className="text-3xl font-bold text-slate-900">72%</div>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-3">Buyers are stronger than sellers right now</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-600">+5.2%</span>
                <span className="text-xs text-slate-500">vs yesterday</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-600 mb-1">Whale Pressure</h3>
                  <div className="text-3xl font-bold text-slate-900">8.4</div>
                </div>
                <div className="p-3 rounded-xl bg-cyan-50">
                  <Activity className="w-6 h-6 text-cyan-600" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-3">Net inflow to big wallets over 24h</p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-medium text-slate-600 mb-1">Market Risk</h3>
                  <div className="text-3xl font-bold text-slate-900">34/100</div>
                </div>
                <div className="p-3 rounded-xl bg-amber-50">
                  <Activity className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <p className="text-xs text-slate-500 mb-3">Higher value = riskier conditions for longs</p>
            </CardContent>
          </Card>
        </div>

        {/* AI Digest */}
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-cyan-500/10 to-emerald-400/10 rounded-xl">
                <Brain className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">AI Digest</h3>
                <p className="text-xs text-slate-500">Ask me anything about the market</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              <Button type="button" size="sm" variant="outline" className="text-xs">
                What's happening now?
              </Button>
              <Button type="button" size="sm" variant="outline" className="text-xs">
                What's different vs yesterday?
              </Button>
              <Button type="button" size="sm" variant="outline" className="text-xs">
                What should I do next?
              </Button>
            </div>
            <p className="text-sm text-slate-500">Click a button above to get AI insights about current market conditions.</p>
          </CardContent>
        </Card>

        {/* Portfolio Demo */}
        <Card className="rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gradient-to-r from-emerald-500/10 to-cyan-400/10 rounded-xl">
                <Wallet className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">Portfolio Demo</h3>
                <p className="text-xs text-slate-500">Simulated demo portfolio (practice mode)</p>
              </div>
            </div>
            <div className="text-center p-4 bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-xl mb-4">
              <div className="text-3xl font-bold text-slate-900 mb-1">$16,830</div>
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-600 font-medium text-sm">+$213 today</span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white">
                Open
              </Button>
              <Button type="button" size="sm" variant="outline" className="flex-1">
                Connect wallet
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </main>

      {/* Footer */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-sm border-t md:hidden">
        <div className="flex items-center justify-around px-2 py-2">
          <Button type="button" variant="ghost" size="sm" className="flex flex-col items-center gap-1 px-3 py-2 h-auto min-h-[44px] text-cyan-600">
            <Activity className="w-5 h-5" />
            <span className="text-xs font-medium">Home</span>
          </Button>
          <Button type="button" variant="ghost" size="sm" className="flex flex-col items-center gap-1 px-3 py-2 h-auto min-h-[44px] text-slate-600">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs font-medium">Explore</span>
          </Button>
          <Button type="button" variant="ghost" size="sm" className="flex flex-col items-center gap-1 px-3 py-2 h-auto min-h-[44px] text-slate-600">
            <Wallet className="w-5 h-5" />
            <span className="text-xs font-medium">Alerts</span>
            <div className="w-1 h-1 bg-amber-500 rounded-full" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="flex flex-col items-center gap-1 px-3 py-2 h-auto min-h-[44px] text-slate-600">
            <TrendingUp className="w-5 h-5" />
            <span className="text-xs font-medium">Watch</span>
            <div className="w-1 h-1 bg-amber-500 rounded-full" />
          </Button>
          <Button type="button" variant="ghost" size="sm" className="flex flex-col items-center gap-1 px-3 py-2 h-auto min-h-[44px] text-slate-600">
            <Brain className="w-5 h-5" />
            <span className="text-xs font-medium">AI</span>
            <div className="w-1 h-1 bg-amber-500 rounded-full" />
          </Button>
        </div>
      </nav>

      <div className="h-20 md:h-0" />
    </div>
  )
}