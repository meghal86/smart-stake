'use client'

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { trackEvent } from '@/lib/telemetry'
import { useSubscription } from '@/hooks/useSubscription'
import { usePulseOn } from '@/components/ui/usePulseOn'
import { Button } from '@/components/ui/button'
import { Bell, Eye, Settings, ArrowUp } from 'lucide-react'

interface QuickActionsBarProps {
  onStreakAdvanced?: boolean
  onAlertCreated?: boolean
  onDigestShared?: boolean
}

export default function QuickActionsBar({ onStreakAdvanced, onAlertCreated, onDigestShared }: QuickActionsBarProps = {}) {
  const { userPlan } = useSubscription()
  const [showTip, setShowTip] = useState(false)
  const { ref: upgradeRef, pulse } = usePulseOn<HTMLButtonElement>(['streak_advanced', 'alert_created', 'digest_shared'])
  
  useEffect(() => {
    const dismissed = localStorage.getItem('aw_tip_quick_actions_dismissed')
    if (!dismissed) {
      setShowTip(true)
    }
  }, [])
  
  const dismissCoach = () => {
    setShowTip(false)
    localStorage.setItem('aw_tip_quick_actions_dismissed', 'true')
    trackEvent('cta_click', { label: 'dismiss_coach_tip', plan_tier: userPlan?.plan || 'lite' })
  }

  const handleAction = (action: string, label: string) => {
    trackEvent('cta_click', { label, action, plan_tier: userPlan?.plan || 'lite' })
  }

  useEffect(() => {
    if (onStreakAdvanced) {
      pulse('streak_advanced')
      trackEvent('cta_micro_pulse', { source: 'upgrade', reason: 'streak_advanced' })
    }
  }, [onStreakAdvanced, pulse])

  useEffect(() => {
    if (onAlertCreated) {
      pulse('alert_created')
      trackEvent('cta_micro_pulse', { source: 'upgrade', reason: 'alert_created' })
    }
  }, [onAlertCreated, pulse])

  useEffect(() => {
    if (onDigestShared) {
      pulse('digest_shared')
      trackEvent('cta_micro_pulse', { source: 'upgrade', reason: 'digest_shared' })
    }
  }, [onDigestShared, pulse])

  return (
    <div className="aw-dock z-30 relative">
      {/* Quick Actions Coaching Tip */}
      {showTip && (
        <div className="absolute -top-3 right-3 bg-yellow-300 text-black rounded px-2 py-1 text-xs shadow z-50">
          Try Quick Actions!
          <button 
            aria-label="Dismiss" 
            onClick={dismissCoach} 
            className="ml-2 hover:text-black/70"
          >
            ✕
          </button>
        </div>
      )}
      
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-3">
          <Button
            variant="outline"
            size="sm"
            asChild
            onClick={() => handleAction('create_alert', 'Create Alert')}
            className="h-12 flex-col gap-1 text-xs aw-btn-secondary"
            aria-label="Create new alert"
          >
            <Link to="/alerts/new">
              <Bell className="h-4 w-4" />
              Create Alert
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            asChild
            onClick={() => handleAction('follow_whale', 'Follow Whale')}
            className="h-12 flex-col gap-1 text-xs aw-btn-secondary"
            aria-label="Follow whale activity"
          >
            <Link to="/signals?follow=open">
              <Eye className="h-4 w-4" />
              Follow Whale
            </Link>
          </Button>

          <Button
            variant="outline"
            size="sm"
            asChild
            onClick={() => handleAction('manage_alerts', 'Manage Alerts')}
            className="h-12 flex-col gap-1 text-xs aw-btn-secondary"
            aria-label="Manage your alerts"
          >
            <Link to="/alerts">
              <Settings className="h-4 w-4" />
              Manage Alerts
            </Link>
          </Button>

          <Button
            ref={upgradeRef}
            size="sm"
            asChild
            onClick={() => handleAction('upgrade_click', 'Upgrade')}
            className="btn-brand h-12 flex-col gap-1 text-xs text-cta"
            aria-label="Upgrade to Pro"
          >
            <Link to="/plans">
              <ArrowUp className="h-4 w-4" />
              <span className="text-white font-semibold">Upgrade</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}