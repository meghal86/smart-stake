'use client'

import { Link } from 'react-router-dom'
import { useAnalytics } from '@/hooks/useAnalytics'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Bell, Eye, Settings, ArrowUp } from 'lucide-react'
import NoviceTipOverlay from './NoviceTipOverlay'

interface QuickActionsLiteProps {
  isDemo?: boolean
  isNovice?: boolean
}

export default function QuickActionsLite({ isDemo = false, isNovice = false }: QuickActionsLiteProps) {
  const { track } = useAnalytics()

  const handleAction = (action: string, label: string) => {
    track('cta_click', { label, action })
  }

  return (
    <Card className="relative" id="quick-actions">
      <NoviceTipOverlay 
        isDemo={isDemo} 
        isNovice={isNovice} 
        targetElement="quick-actions"
        tipText="Try Quick Actions!"
      />
      <CardContent className="p-6">
        <h3 className="font-semibold mb-4">Quick Actions</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            asChild
            onClick={() => handleAction('create_alert', 'Create Alert')}
            aria-label="Create new alert"
          >
            <Link to="/alerts/new" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Create Alert
            </Link>
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            asChild
            onClick={() => handleAction('follow_asset', 'Follow Whale')}
            aria-label="Follow whale activity"
          >
            <Link to="/signals?follow=open" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Follow Whale
            </Link>
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            asChild
            onClick={() => handleAction('manage_alerts', 'Manage Alerts')}
            aria-label="Manage your alerts"
          >
            <Link to="/plans?from=lite_quick&feature=alerts_advanced" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Manage Alerts
            </Link>
          </Button>

          <Button 
            size="sm" 
            asChild
            onClick={() => handleAction('upgrade_click', 'Upgrade')}
            aria-label="Upgrade to Pro"
          >
            <Link to="/plans" className="flex items-center gap-2">
              <ArrowUp className="w-4 h-4" />
              Upgrade
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}