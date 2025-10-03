'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, Clock } from 'lucide-react'
import { trackEvent } from '@/lib/telemetry'
import { useGate } from '@/hooks/useGate'

interface DigestData {
  headline: string
  narrative: string
  lastUpdated: string
}

export function AIDigest() {
  const [digest, setDigest] = useState<DigestData | null>(null)
  const [loading, setLoading] = useState(true)
  const { canAccess, showUpgrade } = useGate()

  useEffect(() => {
    fetchDigest()
  }, [])

  const fetchDigest = async () => {
    try {
      const response = await fetch('/api/digest')
      const data = await response.json()
      setDigest(data)
    } catch (error) {
      // Fallback to mock data
      setDigest({
        headline: "Whale Activity Surge",
        narrative: "Large holders accumulated $2.3B in BTC and ETH over 24h, suggesting institutional confidence ahead of key market events.",
        lastUpdated: new Date().toISOString()
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSeeMore = () => {
    trackEvent('card_click', { card: 'ai_digest', action: 'see_more' })
    if (!canAccess('api_access')) {
      showUpgrade('api_access')
      return
    }
    // Navigate to copilot
  }

  if (loading) {
    return (
      <Card className="rounded-2xl shadow-md bg-slate-900/70 border-slate-700">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-slate-700 rounded w-3/4"></div>
            <div className="h-3 bg-slate-700 rounded w-full"></div>
            <div className="h-3 bg-slate-700 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl shadow-md bg-slate-900/70 border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-3">
          <Brain className="w-5 h-5 text-cyan-400 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">{digest?.headline}</h3>
            <p className="text-sm text-slate-300 leading-relaxed mb-3">
              {digest?.narrative}
            </p>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Clock className="w-3 h-3" />
            <span>Updated {new Date(digest?.lastUpdated || '').toLocaleTimeString()}</span>
          </div>
          
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleSeeMore}
            className="text-cyan-400 border-cyan-400/30 hover:bg-cyan-400/10"
          >
            See More → Copilot {!canAccess('api_access') && '(Pro)'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}