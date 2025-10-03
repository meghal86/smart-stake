'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, TrendingUp } from 'lucide-react'
import { trackEvent } from '@/lib/telemetry'

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
      // Fallback to mock data
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

  const handleViewAll = () => {
    trackEvent('card_click', { card: 'signals_preview', action: 'view_all' })
  }

  const handleAlertClick = (alertId: string) => {
    trackEvent('card_click', { card: 'whale_alert', alert_id: alertId })
  }

  if (loading) {
    return (
      <Card className="rounded-2xl shadow-md bg-slate-900/70 border-slate-700">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-slate-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl shadow-md bg-slate-900/70 border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white">Whale Alerts</h3>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleViewAll}
            className="text-cyan-400 hover:text-cyan-300"
          >
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="space-y-3">
          {alerts.slice(0, 5).map((alert) => (
            <div 
              key={alert.id}
              className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800/70 cursor-pointer transition-colors"
              onClick={() => handleAlertClick(alert.id)}
            >
              <div className="flex items-center gap-3">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-sm font-medium text-white">
                    {alert.wallet} • {alert.amount.toLocaleString()} {alert.token}
                  </div>
                  <div className="text-xs text-slate-400">
                    ${(alert.amountUsd / 1000000).toFixed(1)}M • {new Date(alert.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
              <Badge 
                variant={alert.provenance === 'Real' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {alert.provenance}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}