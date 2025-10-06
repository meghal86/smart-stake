'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Eye, Bell, ExternalLink, TrendingUp } from 'lucide-react'
import { trackEvent } from '@/lib/telemetry'
import { useGate } from '@/hooks/useGate'

interface WhaleSpotlightProps {
  highlight: {
    title: string
    summary: string
    ctas: {
      follow: string
      alert: string
      etherscan: string
    }
  }
}

export function WhaleSpotlightCard({ highlight }: WhaleSpotlightProps) {
  const { canAccess, showUpgrade } = useGate()

  const handleFollow = () => {
    trackEvent('follow_asset')
    if (!canAccess('watchlist')) {
      showUpgrade('watchlist')
      return
    }
    // Handle follow action
  }

  const handleAlert = () => {
    trackEvent('create_alert')
    if (!canAccess('alerts_advanced')) {
      showUpgrade('alerts_advanced')
      return
    }
    // Handle alert creation
  }

  const handleEtherscan = () => {
    trackEvent('card_click', { id: 'etherscan_link' })
    window.open(highlight.ctas.etherscan, '_blank')
  }

  return (
    <Card className="rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-200/40 dark:border-slate-800 bg-gradient-to-r from-cyan-50/50 to-emerald-50/50 dark:from-cyan-900/10 dark:to-emerald-900/10">
      <CardContent className="p-6">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-gradient-to-r from-cyan-500/10 to-emerald-400/10 rounded-xl">
            <TrendingUp className="w-5 h-5 text-cyan-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                {highlight.title}
              </h3>
              <Badge variant="secondary" className="bg-cyan-100 text-cyan-800 text-xs">
                Spotlight
              </Badge>
            </div>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {highlight.summary}
            </p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Button 
            size="sm" 
            onClick={handleFollow}
            className="bg-cyan-600 hover:bg-cyan-700 text-white"
          >
            <Eye className="w-4 h-4 mr-1" />
            Follow Whale
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleAlert}
            className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
          >
            <Bell className="w-4 h-4 mr-1" />
            Alert Me
            {!canAccess('alerts_advanced') && (
              <div className="w-1 h-1 bg-amber-500 rounded-full ml-1" />
            )}
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleEtherscan}
            className="text-slate-600 hover:text-slate-900"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            Etherscan
          </Button>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-500 pt-3 border-t border-slate-200/40 dark:border-slate-700">
          Based on large-wallet buys in last 24h
        </p>
      </CardContent>
    </Card>
  )
}