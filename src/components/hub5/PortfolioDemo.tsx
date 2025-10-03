'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wallet, TrendingUp, ArrowUp } from 'lucide-react'
import { trackEvent } from '@/lib/telemetry'
import { useGate } from '@/hooks/useGate'

export function PortfolioDemo() {
  const { canAccess, showUpgrade } = useGate()

  const handleUpgrade = () => {
    trackEvent('upgrade_click', { source: 'portfolio_demo' })
    showUpgrade('portfolio_tracking')
  }

  return (
    <Card className="rounded-2xl shadow-md bg-slate-900/70 border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-4">
          <Wallet className="w-5 h-5 text-emerald-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-1">Portfolio Demo</h3>
            <p className="text-xs text-slate-400">Simulated wallet impact</p>
          </div>
        </div>

        {/* Demo Holdings */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between p-2 rounded bg-slate-800/30">
            <div className="text-sm text-slate-300">1 ETH</div>
            <div className="text-sm text-white">$2,240</div>
          </div>
          <div className="flex items-center justify-between p-2 rounded bg-slate-800/30">
            <div className="text-sm text-slate-300">2 BTC</div>
            <div className="text-sm text-white">$86,400</div>
          </div>
        </div>

        {/* Impact Alert */}
        <div className="p-3 rounded-lg bg-emerald-900/20 border border-emerald-700/30 mb-4">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-400 mt-0.5" />
            <div>
              <p className="text-sm text-emerald-300 font-medium">Whale Impact Alert</p>
              <p className="text-xs text-emerald-400/80">
                Whale moved $10M ETH → Your demo wallet risk +5%
              </p>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleUpgrade}
          className="w-full bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-600 hover:to-emerald-500 text-white"
        >
          <ArrowUp className="w-4 h-4 mr-2" />
          Upgrade to Pro to connect real wallet
        </Button>
      </CardContent>
    </Card>
  )
}