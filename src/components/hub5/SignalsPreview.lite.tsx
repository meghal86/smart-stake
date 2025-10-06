'use client'

import { Link } from 'react-router-dom'
import { useAnalytics } from '@/hooks/useAnalytics'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, Activity, AlertTriangle } from 'lucide-react'

const mockSignals = [
  {
    id: '1',
    title: 'Large BTC Outflow',
    impact: 'High',
    reasons: ['Exchange outflow', 'Whale activity'],
    delta: '+12.3%',
    time: '2m ago'
  },
  {
    id: '2', 
    title: 'ETH Accumulation',
    impact: 'Medium',
    reasons: ['DeFi inflow', 'Staking increase'],
    delta: '+5.7%',
    time: '15m ago'
  },
  {
    id: '3',
    title: 'USDC Concentration',
    impact: 'Low',
    reasons: ['Liquidity shift', 'Risk hedge'],
    delta: '-2.1%',
    time: '1h ago'
  }
]

export default function SignalsPreview() {
  const { track } = useAnalytics()

  const handleCardClick = (id: string) => {
    track('card_click', { card: 'signal', id })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Top Signals</h2>
        <Button variant="outline" size="sm" asChild>
          <Link to="/signals">View all</Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {mockSignals.map((signal) => (
          <Card 
            key={signal.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => handleCardClick(signal.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-600" />
                  <h3 className="font-medium text-sm">{signal.title}</h3>
                </div>
                <Badge variant={signal.impact === 'High' ? 'destructive' : signal.impact === 'Medium' ? 'default' : 'secondary'}>
                  {signal.impact}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-green-600">{signal.delta}</span>
                  <span className="text-xs text-muted-foreground">{signal.time}</span>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {signal.reasons.map((reason, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {reason}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}