'use client'

import { Button } from '@/components/ui/button'
import { Bell, Eye, Settings, ArrowUp } from 'lucide-react'
import { trackEvent } from '@/lib/telemetry'
import { useGate } from '@/hooks/useGate'

export function QuickActionsRow() {
  const { canAccess, showUpgrade } = useGate()

  const handleCreateAlert = () => {
    trackEvent('create_alert')
    if (!canAccess('alerts_advanced')) {
      showUpgrade('alerts_advanced')
      return
    }
    // Navigate to create alert
  }

  const handleFollowWhale = () => {
    trackEvent('follow_asset')
    if (!canAccess('watchlist')) {
      showUpgrade('watchlist')
      return
    }
    // Navigate to follow whale
  }

  const handleManageAlerts = () => {
    trackEvent('card_click', { id: 'manage_alerts' })
    if (!canAccess('alerts_advanced')) {
      showUpgrade('alerts_advanced')
      return
    }
    // Navigate to manage alerts
  }

  const handleUpgrade = () => {
    trackEvent('upgrade_click')
    // Navigate to plans
  }

  return (
    <div className="bg-white dark:bg-slate-900/60 backdrop-blur rounded-2xl shadow-sm border border-slate-200/40 dark:border-slate-800 p-6">
      <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Quick Actions
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleCreateAlert}
          className="flex items-center gap-2 h-auto py-3 px-4 hover:scale-[1.01] transition-transform border-cyan-200 text-cyan-700 hover:bg-cyan-50 dark:hover:bg-cyan-900/20"
        >
          <Bell className="w-4 h-4" />
          <span className="text-sm font-medium">Create Alert</span>
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleFollowWhale}
          className="flex items-center gap-2 h-auto py-3 px-4 hover:scale-[1.01] transition-transform border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
        >
          <Eye className="w-4 h-4" />
          <span className="text-sm font-medium">Follow Whale</span>
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleManageAlerts}
          className="flex items-center gap-2 h-auto py-3 px-4 hover:scale-[1.01] transition-transform border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">Manage Alerts</span>
          {!canAccess('alerts_advanced') && (
            <div className="w-1 h-1 bg-amber-500 rounded-full" />
          )}
        </Button>

        <Button 
          size="sm" 
          onClick={handleUpgrade}
          className="flex items-center gap-2 h-auto py-3 px-4 hover:scale-[1.01] transition-transform bg-gradient-to-r from-cyan-500 to-emerald-400 hover:from-cyan-600 hover:to-emerald-500 text-white"
        >
          <ArrowUp className="w-4 h-4" />
          <span className="text-sm font-medium">Upgrade</span>
        </Button>
      </div>
    </div>
  )
}