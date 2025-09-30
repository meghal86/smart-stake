import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, TrendingDown, Activity, ExternalLink } from 'lucide-react'
import { supabase } from '@/integrations/supabase/client'

interface MarketMakerFlow {
  id: string
  timestamp: string
  source_exchange: string
  source_address: string
  destination_mm: string
  destination_address: string
  token: string
  amount: number
  amount_usd: number
  flow_type: 'inbound' | 'outbound' | 'rebalance'
  confidence_score: number
  market_impact_prediction: number
  signal_strength: 'weak' | 'moderate' | 'strong'
}

interface MMFlowSignal {
  id: string
  flow_id: string
  signal_type: 'accumulation' | 'distribution' | 'arbitrage' | 'liquidation'
  confidence: number
  predicted_price_impact: number
  timeframe: string
  reasoning: string[]
}

export const MarketMakerFlowSentinel = () => {
  const [flows, setFlows] = useState<MarketMakerFlow[]>([])
  const [signals, setSignals] = useState<MMFlowSignal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMarketMakerFlows()
    const interval = setInterval(fetchMarketMakerFlows, 60000)
    return () => clearInterval(interval)
  }, [])

  const fetchMarketMakerFlows = async () => {
    try {
      const { data: flowsData } = await supabase
        .from('market_maker_flows')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(20)

      const { data: signalsData } = await supabase
        .from('mm_flow_signals')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20)

      setFlows(flowsData || [])
      setSignals(signalsData || [])
    } catch (error) {
      console.error('Error fetching MM flows:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerSentinel = async () => {
    try {
      setLoading(true)
      await supabase.functions.invoke('market-maker-sentinel')
      await fetchMarketMakerFlows()
    } catch (error) {
      console.error('Error triggering sentinel:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSignalIcon = (signalType: string) => {
    switch (signalType) {
      case 'accumulation': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'distribution': return <TrendingDown className="h-4 w-4 text-red-500" />
      default: return <Activity className="h-4 w-4 text-blue-500" />
    }
  }

  const getSignalColor = (strength: string) => {
    switch (strength) {
      case 'strong': return 'destructive'
      case 'moderate': return 'default'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Market Maker Flow Sentinel</h2>
          <p className="text-muted-foreground">Real-time CEX to Market Maker flow monitoring</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50">Live Monitoring</Badge>
          <Button onClick={triggerSentinel} disabled={loading} size="sm">
            {loading ? 'Scanning...' : 'Scan Now'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-2xl font-bold">{flows.length}</div>
          <div className="text-sm text-muted-foreground">Flows Detected</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">{signals.length}</div>
          <div className="text-sm text-muted-foreground">ML Signals</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">
            ${flows.reduce((sum, f) => sum + f.amount_usd, 0).toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">Total Volume</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">
            {flows.filter(f => f.signal_strength === 'strong').length}
          </div>
          <div className="text-sm text-muted-foreground">Strong Signals</div>
        </Card>
      </div>

      <div className="grid gap-4">
        {flows.map(flow => {
          const signal = signals.find(s => s.flow_id === flow.id)
          
          return (
            <Card key={flow.id} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={getSignalColor(flow.signal_strength)}>
                    {flow.signal_strength.toUpperCase()}
                  </Badge>
                  <span className="font-medium">
                    {flow.source_exchange} → {flow.destination_mm}
                  </span>
                  {signal && getSignalIcon(signal.signal_type)}
                </div>
                <div className="text-right">
                  <div className="font-bold">${flow.amount_usd.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">{flow.token}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Predicted Impact:</span>
                  <div className="font-medium">{flow.market_impact_prediction.toFixed(2)}%</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Confidence:</span>
                  <div className="font-medium">{(flow.confidence_score * 100).toFixed(0)}%</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Flow Type:</span>
                  <div className="font-medium capitalize">{flow.flow_type}</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Time:</span>
                  <div className="font-medium">
                    {new Date(flow.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {signal && (
                <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {getSignalIcon(signal.signal_type)}
                    <span className="font-medium capitalize">{signal.signal_type} Signal</span>
                    <Badge variant="outline">{signal.timeframe}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {signal.reasoning.join(' • ')}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {flows.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No Market Maker Flows Detected</h3>
          <p className="text-muted-foreground mb-4">
            The sentinel is monitoring for large transfers between exchanges and market makers.
          </p>
          <Button onClick={triggerSentinel}>Start Monitoring</Button>
        </Card>
      )}
    </div>
  )
}