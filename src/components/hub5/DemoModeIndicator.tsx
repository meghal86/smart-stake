'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wallet, X, Zap } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'

interface DemoModeIndicatorProps {
  isWalletConnected?: boolean
}

export default function DemoModeIndicator({ isWalletConnected = false }: DemoModeIndicatorProps) {
  const [dismissed, setDismissed] = useState(false)
  const { track } = useAnalytics()

  if (isWalletConnected || dismissed) return null

  const handleConnect = () => {
    track('upgrade_click', { source: 'demo_mode_indicator', action: 'connect_wallet' })
    // TODO: Implement wallet connection
  }

  const handleDismiss = () => {
    setDismissed(true)
    track('card_click', { action: 'dismiss_demo_mode' })
  }

  return (
    <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-600 animate-pulse" />
              <span className="font-semibold text-amber-800 dark:text-amber-200">
                Demo Mode
              </span>
            </div>
            <span className="text-sm text-amber-700 dark:text-amber-300">
              Connect wallet for real Copilot insights!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              onClick={handleConnect}
              className="bg-amber-600 hover:bg-amber-700 text-white"
              aria-label="Connect wallet to unlock real insights"
            >
              <Wallet className="w-4 h-4 mr-1" />
              Connect
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleDismiss}
              className="h-8 w-8 p-0 text-amber-600 hover:bg-amber-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}