'use client'

import { useState, useEffect, useRef } from 'react'
import { trackEvent } from '@/lib/telemetry'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Wallet, TrendingUp, TrendingDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { motion } from 'framer-motion'
import { getMotionClass } from '@/components/ui/motion'

interface PortfolioCompactProps {
  connected?: boolean
  totalValue?: string
  pnl24h?: string
  holdings?: Array<{
    symbol: string
    qty: string
    value: string
    delta: string
    isPositive: boolean | null
  }>
}

export default function PortfolioCompact({ 
  connected = false,
  totalValue = '$47,832.50',
  pnl24h = '+2.4%',
  holdings = [
    { symbol: 'BTC', qty: '1.2847', value: '$38,450.20', delta: '+1.8%', isPositive: true },
    { symbol: 'ETH', qty: '3.45', value: '$7,892.30', delta: '+3.2%', isPositive: true },
    { symbol: 'USDC', qty: '1,490.00', value: '$1,490.00', delta: '0.0%', isPositive: null }
  ]
}: PortfolioCompactProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [showShimmer, setShowShimmer] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const expanded = localStorage.getItem('aw:portfolio:expanded') === 'true'
    setIsExpanded(expanded)
  }, [])

  // Scroll-triggered fade-in
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.1 }
    )

    if (cardRef.current) {
      observer.observe(cardRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    // Shimmer every 30s when idle
    const interval = setInterval(() => {
      setShowShimmer(true)
      setTimeout(() => setShowShimmer(false), 2500)
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const handleToggle = () => {
    const newState = !isExpanded
    setIsExpanded(newState)
    localStorage.setItem('aw:portfolio:expanded', newState.toString())
    trackEvent('portfolio_toggle', { state: newState ? 'expanded' : 'collapsed' })
  }

  const handleCTAClick = () => {
    trackEvent('cta_click', { 
      label: connected ? 'upgrade_to_pro' : 'connect_wallet_unlock_pro', 
      plan: 'lite' 
    })
  }

  return (
    <Card 
      ref={cardRef}
      className={`aw-card aw-shadow transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
    >
      <CardContent className="p-4">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          {/* Collapsed Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                <Wallet className="h-4 w-4 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-slate-900 dark:text-slate-100">Portfolio</h3>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-900 dark:text-slate-100 font-semibold">{totalValue}</span>
                  <span className="text-green-500 flex items-center gap-1 text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <TrendingUp className="h-3 w-3" />
                    {pnl24h}
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
                aria-expanded={isExpanded}
                aria-controls="portfolio-panel"
                aria-label={isExpanded ? 'Collapse portfolio' : 'Expand portfolio'}
              >
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
          </div>

          {/* Primary CTA */}
          <div className="mt-4">
            <Button 
              onClick={handleCTAClick}
              className={`w-full aw-btn-primary ${showShimmer ? getMotionClass('shimmer') : ''}`}
              onMouseEnter={() => setShowShimmer(false)}
              onFocus={() => setShowShimmer(false)}
            >
              {connected ? 'Upgrade to Pro' : 'Connect Wallet → Unlock Pro'}
            </Button>
          </div>

          {/* Expanded Content */}
          <CollapsibleContent asChild>
            <motion.div 
              id="portfolio-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-4 mt-4"
            >
              {/* Holdings List */}
              <div className="space-y-3">
                <div className="h-px bg-slate-200 dark:bg-slate-700" />
                {holdings.map((holding) => (
                  <HoldingRow key={holding.symbol} {...holding} />
                ))}
              </div>

              {/* Benefits */}
              <div className="pt-3 border-t border-slate-200/50 dark:border-slate-700/50">
                <div className="grid grid-cols-1 gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-cyan-500 rounded-full" />
                    <span>Real-time tracking</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-cyan-500 rounded-full" />
                    <span>Whale alerts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-cyan-500 rounded-full" />
                    <span>Risk analysis</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

function HoldingRow({ 
  symbol, 
  qty, 
  value, 
  delta, 
  isPositive 
}: {
  symbol: string
  qty: string
  value: string
  delta: string
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
          <p className="text-xs text-slate-500 dark:text-slate-400">{qty} {symbol}</p>
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
          {delta}
        </p>
      </div>
    </div>
  )
}