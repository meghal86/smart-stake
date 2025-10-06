'use client'

import { Button } from '@/components/ui/button'
import { Bell, Eye, ArrowUp } from 'lucide-react'
import { trackEvent } from '@/lib/telemetry'
import { useGate } from '@/hooks/useGate'

export function QuickActions() {
  const { canAccess, showUpgrade } = useGate()

  const handleSetAlert = () => {
    trackEvent('card_click', { action: 'quick_action', type: 'set_alert' })
    if (!canAccess('alerts_advanced')) {
      showUpgrade('alerts_advanced')
      return
    }
    // Navigate to alerts
  }

  const handleFollowWhale = () => {
    trackEvent('card_click', { action: 'quick_action', type: 'follow_whale' })
    if (!canAccess('watchlist')) {
      showUpgrade('watchlist')
      return
    }
    // Navigate to follow whale
  }

  const handleUpgrade = () => {
    trackEvent('upgrade_click', { source: 'quick_actions' })
    // Navigate to plans
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Button 
        onClick={handleSetAlert}
        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600"
        size="lg"
      >
        <Bell className="w-4 h-4 mr-2" />
        Set Alert
      </Button>
      
      <Button 
        onClick={handleFollowWhale}
        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white border border-slate-600"
        size="lg"
      >
        <Eye className="w-4 h-4 mr-2" />
        Follow Whale
      </Button>
      
      <Button 
        onClick={handleUpgrade}
        className="flex-1 bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-600 hover:to-emerald-500 text-white"
        size="lg"
      >
        <ArrowUp className="w-4 h-4 mr-2" />
        Upgrade to Pro
      </Button>
    </div>
  )
}