'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Zap, Eye, Brain, Target, X } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'

export default function EnhancedUpgradeBanner() {
  const [showPreview, setShowPreview] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const { track } = useAnalytics()

  if (dismissed) return null

  const handleUpgrade = () => {
    track('upgrade_click', { source: 'enhanced_banner', action: 'upgrade_to_pro' })
  }

  const handlePreview = () => {
    setShowPreview(!showPreview)
    track('card_click', { action: 'toggle_pro_preview' })
  }

  const handleDismiss = () => {
    setDismissed(true)
    track('card_click', { action: 'dismiss_upgrade_banner' })
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Zap className="w-8 h-8 text-yellow-300 animate-pulse" />
              <div>
                <h3 className="text-xl font-bold mb-1">Unlock Pro Intelligence</h3>
                <p className="text-blue-100 text-sm">
                  Get deeper whale analytics, AI Copilot, and real-time alerts
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handlePreview}
                className="text-white hover:bg-white/20"
              >
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </Button>
              <Button 
                onClick={handleUpgrade}
                className="btn-white"
              >
                Upgrade to Pro
              </Button>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleDismiss}
                className="text-white hover:bg-white/20 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {showPreview && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Blurred Pro Feature Previews */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-10" />
            <div className="absolute inset-0 backdrop-blur-sm z-20" />
            <div className="absolute bottom-4 left-4 z-30 text-white">
              <Brain className="w-5 h-5 mb-1" />
              <div className="text-sm font-semibold">AI Copilot</div>
              <div className="text-xs opacity-80">Personal trading assistant</div>
            </div>
            <CardContent className="p-4 h-32 bg-gradient-to-br from-purple-500 to-pink-500">
              <div className="space-y-2">
                <div className="h-3 bg-white/30 rounded w-3/4" />
                <div className="h-3 bg-white/20 rounded w-1/2" />
                <div className="h-3 bg-white/25 rounded w-2/3" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-10" />
            <div className="absolute inset-0 backdrop-blur-sm z-20" />
            <div className="absolute bottom-4 left-4 z-30 text-white">
              <Target className="w-5 h-5 mb-1" />
              <div className="text-sm font-semibold">Smart Alerts</div>
              <div className="text-xs opacity-80">Custom whale notifications</div>
            </div>
            <CardContent className="p-4 h-32 bg-gradient-to-br from-green-500 to-blue-500">
              <div className="space-y-2">
                <div className="h-3 bg-white/30 rounded w-2/3" />
                <div className="h-3 bg-white/20 rounded w-3/4" />
                <div className="h-3 bg-white/25 rounded w-1/2" />
              </div>
            </CardContent>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 z-10" />
            <div className="absolute inset-0 backdrop-blur-sm z-20" />
            <div className="absolute bottom-4 left-4 z-30 text-white">
              <Eye className="w-5 h-5 mb-1" />
              <div className="text-sm font-semibold">Deep Analytics</div>
              <div className="text-xs opacity-80">Advanced whale tracking</div>
            </div>
            <CardContent className="p-4 h-32 bg-gradient-to-br from-orange-500 to-red-500">
              <div className="space-y-2">
                <div className="h-3 bg-white/30 rounded w-1/2" />
                <div className="h-3 bg-white/20 rounded w-2/3" />
                <div className="h-3 bg-white/25 rounded w-3/4" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}