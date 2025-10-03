'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet, TrendingUp, ExternalLink, Plus } from 'lucide-react'
import { trackEvent } from '@/lib/telemetry'
import { useGate } from '@/hooks/useGate'

const mockHoldings = [
  { symbol: 'BTC', amount: '0.234', value: '$10,450', change: '+5.2%', positive: true },
  { symbol: 'ETH', amount: '1.89', value: '$4,230', change: '+2.1%', positive: true },
  { symbol: 'USDC', amount: '2,150', value: '$2,150', change: '0.0%', positive: null }
]

export function PortfolioDemoCard() {
  const { canAccess, showUpgrade } = useGate()

  const handleOpen = () => {
    trackEvent('card_click', { id: 'cta_open' })
    if (!canAccess('portfolio_tracking')) {
      showUpgrade('portfolio_tracking')
      return
    }
    // Navigate to portfolio
  }

  const handleConnect = () => {
    trackEvent('card_click', { id: 'cta_connect' })
    // Handle wallet connection
  }

  return (
    <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-200/40 dark:border-slate-800">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-emerald-500/10 to-cyan-400/10 rounded-xl">
            <Wallet className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">Portfolio Demo</h3>
            <p className="text-xs text-slate-500">Simulated demo portfolio (practice mode)</p>
          </div>
        </div>

        {/* Total Value */}
        <div className="text-center p-4 bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 rounded-xl mb-4">
          <div className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            $16,830
          </div>
          <div className="flex items-center justify-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-emerald-600 font-medium text-sm">+$213 today</span>
          </div>
        </div>

        {/* Holdings */}
        <div className="space-y-3 mb-4">
          <h4 className="text-sm font-medium text-slate-600 dark:text-slate-400">Top Holdings</h4>
          {mockHoldings.map((holding) => (
            <div key={holding.symbol} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="font-mono text-xs">
                  {holding.symbol}
                </Badge>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {holding.amount}
                </span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {holding.value}
                </div>
                <div className={`text-xs ${
                  holding.positive === true 
                    ? 'text-emerald-600' 
                    : holding.positive === false 
                    ? 'text-red-600' 
                    : 'text-slate-500'
                }`}>
                  {holding.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex gap-2">
          <Button 
            size="sm" 
            onClick={handleOpen}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Open
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleConnect}
            className="flex-1 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
          >
            <Plus className="w-4 h-4 mr-1" />
            Connect wallet
          </Button>
        </div>

        {/* Footer note */}
        <p className="text-xs text-slate-500 text-center mt-3 pt-3 border-t border-slate-200/40 dark:border-slate-700">
          Demo only. Connect a wallet to see your real portfolio.
        </p>
      </CardContent>
    </Card>
  )
}