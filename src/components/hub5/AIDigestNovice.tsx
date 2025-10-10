'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, Clock, Sparkles } from 'lucide-react'
import { trackEvent } from '@/lib/telemetry'

type QueryType = 'explain' | 'changed' | 'next' | null

const responses = {
  explain: "Market shows bullish whale activity with $2.3B in net inflows over 24h. Large holders are accumulating BTC and ETH while reducing stablecoin positions, suggesting confidence in near-term price action. This typically precedes upward moves.",
  changed: "Key changes since yesterday: BTC whale addresses increased 12%, ETH staking ratio hit new highs at 23%, and DeFi TVL grew by $1.8B with concentrated activity in lending protocols. Institutional buying accelerated.",
  next: "Recommended actions: Monitor BTC $45K resistance level for breakout confirmation, watch for ETH staking unlock events next week, and consider DeFi yield opportunities in AAVE and Compound as rates normalize."
}

export function AIDigestNovice() {
  const [activeQuery, setActiveQuery] = useState<QueryType>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleQuery = async (type: QueryType) => {
    if (type === activeQuery) return
    
    setIsLoading(true)
    setActiveQuery(type)
    trackEvent('card_click', { id: 'ai_digest', query_type: type as string })

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
    }, 800)
  }

  return (
    <Card className="rounded-2xl shadow-sm hover:shadow-md transition-shadow border border-slate-200/40 dark:border-slate-800">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-cyan-500/10 to-emerald-400/10 rounded-xl">
            <Brain className="w-5 h-5 text-cyan-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">AI Digest</h3>
            <p className="text-xs text-slate-500">Ask me anything about the market</p>
          </div>
        </div>

        {/* Query Buttons */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            size="sm"
            variant={activeQuery === 'explain' ? 'default' : 'outline'}
            onClick={() => handleQuery('explain')}
            className="text-xs"
          >
            <Sparkles className="w-3 h-3 mr-1" />
            What's happening now?
          </Button>
          <Button
            size="sm"
            variant={activeQuery === 'changed' ? 'default' : 'outline'}
            onClick={() => handleQuery('changed')}
            className="text-xs"
          >
            What's different vs yesterday?
          </Button>
          <Button
            size="sm"
            variant={activeQuery === 'next' ? 'default' : 'outline'}
            onClick={() => handleQuery('next')}
            className="text-xs"
          >
            What should I do next?
          </Button>
        </div>

        {/* Response */}
        <div className="min-h-[80px] mb-4">
          {isLoading ? (
            <div className="space-y-2">
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/2" />
            </div>
          ) : activeQuery ? (
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {responses[activeQuery]}
            </p>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-500 leading-relaxed">
              Click a button above to get AI insights about current market conditions and whale behavior patterns.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-200/40 dark:border-slate-700">
          <div className="flex items-center gap-4">
            <span>Confidence ~70–80%</span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Updates every 1–5 min</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}