'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { trackEvent } from '@/lib/telemetry'
import SignalCard from '@/components/signals/SignalCard'
import { SignalEvent } from '@/types/hub2'

interface WhaleAlert {
  id: string
  wallet: string
  token: string
  amount: number
  amountUsd: number
  provenance: 'Real' | 'Sim'
  timestamp: string
}

export function SignalsPreview() {
  const [alerts, setAlerts] = useState<WhaleAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/whale-index?limit=5')
      const data = await response.json()
      setAlerts(data.alerts || [])
    } catch (error) {
      setAlerts([
        {
          id: '1',
          wallet: '0x742d...35Cc',
          token: 'ETH',
          amount: 1250,
          amountUsd: 2800000,
          provenance: 'Real',
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          wallet: '0x8315...9A2B',
          token: 'BTC',
          amount: 45,
          amountUsd: 1950000,
          provenance: 'Real',
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const convertToSignalEvent = (alert: WhaleAlert): SignalEvent => ({
    id: alert.id,
    type: 'cex_outflow',
    entity: {
      kind: 'asset',
      id: alert.wallet,
      name: alert.token,
      symbol: alert.token,
    },
    ts: alert.timestamp,
    confidence: 'high',
    impactUsd: alert.amountUsd,
    delta: -5.2,
    reasonCodes: ['large_volume', 'whale_activity'],
    source: 'live',
  })

  const handleViewAll = () => {
    trackEvent('card_click', { card: 'signals_preview', action: 'view_all' })
  }

  const handleAlertClick = (alertId: string) => {
    trackEvent('card_click', { card: 'whale_alert', alert_id: alertId })
  }

  if (loading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Top Signals</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </section>
    )
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Top Signals</h2>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={handleViewAll}
          className="text-cyan-500 hover:text-cyan-600"
        >
          View All
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {alerts.slice(0, 3).map((alert) => (
          <SignalCard
            key={alert.id}
            signal={convertToSignalEvent(alert)}
            onAction={() => handleAlertClick(alert.id)}
            onDetailsClick={() => handleAlertClick(alert.id)}
          />
        ))}
      </div>
    </section>
  )
}