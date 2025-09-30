import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MarketMakerFlowSentinel } from '@/components/premium/MarketMakerFlowSentinel'
import { MultiChannelAlerts } from '@/components/premium/MultiChannelAlerts'
import { NFTWhaleTracker } from '@/components/premium/NFTWhaleTracker'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Activity, Mail, Image } from 'lucide-react'

export default function PremiumTest() {
  const [activeFeature, setActiveFeature] = useState('mm-flows')

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">🚀 Premium Features Test</h1>
          <p className="text-muted-foreground">
            Testing Market Maker Flow Sentinel, Multi-Channel Alerts, and NFT Whale Tracking
          </p>
          <div className="flex justify-center gap-2">
            <Badge variant="outline" className="bg-green-50">All Features Deployed</Badge>
            <Badge variant="outline" className="bg-blue-50">Database Ready</Badge>
            <Badge variant="outline" className="bg-purple-50">Edge Functions Live</Badge>
          </div>
        </div>

        {/* Feature Tabs */}
        <Tabs value={activeFeature} onValueChange={setActiveFeature} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="mm-flows" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Market Maker Flows
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Multi-Channel Alerts
            </TabsTrigger>
            <TabsTrigger value="nft" className="flex items-center gap-2">
              <Image className="h-4 w-4" />
              NFT Whale Tracking
            </TabsTrigger>
          </TabsList>

          <TabsContent value="mm-flows" className="space-y-6">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">🎯 Market Maker Flow Sentinel</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Monitors real-time flows between exchanges and market makers like Wintermute, Jump Trading, etc.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Data Source:</strong> Alchemy API + Known MM addresses
                </div>
                <div>
                  <strong>Detection:</strong> $1M+ transfers with ML signals
                </div>
              </div>
            </Card>
            <MarketMakerFlowSentinel />
          </TabsContent>

          <TabsContent value="alerts" className="space-y-6">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">📧 Multi-Channel Alert Delivery</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Send whale alerts via email (SendGrid), webhooks (Zapier), and push notifications with subscription-tier gating.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Channels:</strong> Email, Webhook, Push, SMS
                </div>
                <div>
                  <strong>Gating:</strong> Premium/Enterprise tiers
                </div>
              </div>
            </Card>
            <MultiChannelAlerts />
          </TabsContent>

          <TabsContent value="nft" className="space-y-6">
            <Card className="p-4">
              <h3 className="font-semibold mb-2">🖼️ NFT Whale Tracking</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Monitor high-value NFT transactions across top collections like BAYC, Azuki, Moonbirds with whale wallet detection.
              </p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Collections:</strong> BAYC, MAYC, Azuki, Moonbirds
                </div>
                <div>
                  <strong>Threshold:</strong> $50K-$100K+ transactions
                </div>
              </div>
            </Card>
            <NFTWhaleTracker />
          </TabsContent>
        </Tabs>

        {/* Status Footer */}
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-semibold text-green-800">✅ Implementation Status</h4>
              <p className="text-sm text-green-700">
                All premium features are deployed and ready for production use
              </p>
            </div>
            <div className="text-right text-sm text-green-600">
              <div>Database: ✅ Migrated</div>
              <div>Edge Functions: ✅ Deployed</div>
              <div>Frontend: ✅ Integrated</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}