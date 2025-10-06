'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/telemetry'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { motion } from 'framer-motion'

export default function PortfolioDemo() {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
    trackEvent('cta_click', { 
      label: isExpanded ? 'portfolio_collapse' : 'portfolio_expand', 
      plan: 'lite' 
    })
  }

  const handleConnectWallet = () => {
    trackEvent('cta_click', { label: 'connect_wallet', plan: 'lite' })
  }

  return (
    <section>
      <Card className="aw-card aw-shadow">
        <CardContent className="p-4">
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            {/* Collapsed Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">Portfolio Demo</h3>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-slate-900 dark:text-slate-100 font-semibold">$47,832.50</span>
                    <span className="text-green-500 flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      +2.4%
                    </span>
                  </div>
                </div>
              </div>

              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleToggle}
                  className="text-cyan-500 hover:text-cyan-600"
                >
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>

            {/* Expanded Content */}
            <CollapsibleContent asChild>
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="space-y-4 mt-4"
              >
              <div className="space-y-3">
                <HoldingRow 
                  symbol="BTC" 
                  name="Bitcoin" 
                  amount="1.2847" 
                  value="$38,450.20" 
                  change="+1.8%" 
                  isPositive={true}
                />
                <HoldingRow 
                  symbol="ETH" 
                  name="Ethereum" 
                  amount="3.45" 
                  value="$7,892.30" 
                  change="+3.2%" 
                  isPositive={true}
                />
                <HoldingRow 
                  symbol="USDC" 
                  name="USD Coin" 
                  amount="1,490.00" 
                  value="$1,490.00" 
                  change="0.0%" 
                  isPositive={null}
                />
              </div>

              <div className="pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                <Button 
                  onClick={handleConnectWallet}
                  className="w-full aw-btn-primary"
                >
                  Connect Wallet → Unlock Pro
                </Button>
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center mt-2">
                  Real-time tracking • Whale alerts • Risk analysis
                </p>
              </div>
              </motion.div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </section>
  )
}

function HoldingRow({ 
  symbol, 
  name, 
  amount, 
  value, 
  change, 
  isPositive 
}: {
  symbol: string
  name: string
  amount: string
  value: string
  change: string
  isPositive: boolean | null
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
          <span className="text-xs font-bold text-slate-600 dark:text-slate-400">{symbol}</span>
        </div>
        <div>
          <p className="font-medium text-slate-900 dark:text-slate-100">{symbol}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{amount} {symbol}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-medium text-slate-900 dark:text-slate-100">{value}</p>
        <p className={`text-xs flex items-center gap-1 justify-end ${
          isPositive === true ? 'text-green-500' : 
          isPositive === false ? 'text-red-500' : 
          'text-slate-500'
        }`}>
          {isPositive === true && <TrendingUp className="h-3 w-3" />}
          {isPositive === false && <TrendingDown className="h-3 w-3" />}
          {change}
        </p>
      </div>
    </div>
  )
}