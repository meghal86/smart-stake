'use client'

import { useState, useEffect } from 'react'
import { Lightbulb, X } from 'lucide-react'
import { useAnalytics } from '@/hooks/useAnalytics'

interface NoviceTipOverlayProps {
  isDemo?: boolean
  isNovice?: boolean
  targetElement?: string
  tipText?: string
  onDismiss?: () => void
}

export default function NoviceTipOverlay({ 
  isDemo = false, 
  isNovice = false, 
  targetElement = 'quick-actions',
  tipText = 'Try Quick Actions!',
  onDismiss 
}: NoviceTipOverlayProps) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const { track } = useAnalytics()

  useEffect(() => {
    if (isDemo && isNovice && !dismissed) {
      const timer = setTimeout(() => setVisible(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [isDemo, isNovice, dismissed])

  const handleDismiss = () => {
    setVisible(false)
    setDismissed(true)
    track('card_click', { action: 'dismiss_novice_tip', target: targetElement })
    onDismiss?.()
  }

  const handleInteraction = () => {
    setVisible(false)
    track('card_click', { action: 'interact_with_tip', target: targetElement })
  }

  if (!visible || !isDemo || !isNovice) return null

  return (
    <div className="absolute -top-2 -right-2 z-50 animate-bounce">
      <div className="relative">
        <div className="bg-yellow-300 text-black rounded px-2 py-1 text-xs font-medium shadow-lg flex items-center gap-1">
          <Lightbulb className="w-3 h-3" />
          <span>{tipText}</span>
          <button
            onClick={handleDismiss}
            className="ml-1 hover:bg-yellow-400 rounded p-0.5"
            aria-label="Dismiss tip"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-yellow-300" />
      </div>
    </div>
  )
}