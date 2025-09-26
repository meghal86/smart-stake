import { useState } from 'react';
import { TrendingUp, Fish, AlertTriangle, Activity, Bell, Filter } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer';
import { useEnhancedMarketData } from '@/hooks/useEnhancedMarketData';
import { cn } from '@/lib/utils';

interface MobileMarketIntelligenceProps {
  className?: string;
}

export function MobileMarketIntelligence({ className }: MobileMarketIntelligenceProps) {
  const { data: enhancedMarketData, isLoading } = useEnhancedMarketData();
  const [alertsOpen, setAlertsOpen] = useState(false);

  // Mock data for mobile view
  const marketHealth = {
    marketMoodIndex: enhancedMarketData?.marketMood?.mood || 65,
    volume24h: enhancedMarketData?.volume24h || 1500000000,
    volumeDelta: enhancedMarketData?.volumeDelta || 12.5,
    activeWhales: enhancedMarketData?.activeWhales || 892,
    whalesDelta: enhancedMarketData?.whalesDelta || 8.2,
    riskIndex: enhancedMarketData?.avgRiskScore || 45,
    criticalAlerts: 3
  };

  const mockAlerts = [
    {
      id: '1',
      severity: 'High' as const,
      title: 'Large ETH Movement',
      description: '25M USDT transferred to Binance',
      timestamp: new Date(),
      chain: 'ETH'
    },
    {
      id: '2',
      severity: 'Medium' as const,
      title: 'Whale Accumulation',
      description: 'Multiple whales buying BTC',
      timestamp: new Date(),
      chain: 'BTC'
    },
    {
      id: '3',
      severity: 'Info' as const,
      title: 'DeFi Activity',
      description: 'Increased Uniswap volume',
      timestamp: new Date(),
      chain: 'ETH'
    }
  ];

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-red-500 text-white';
      case 'Medium': return 'bg-orange-500 text-white';
      case 'Info': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-3 animate-pulse">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-6 bg-gray-200 rounded mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Market Health Cards - Stacked for Mobile */}
      <div className="grid grid-cols-2 gap-3">
        {/* Market Mood */}
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <TrendingUp className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Market Mood</p>
              <p className="text-lg font-bold">{marketHealth.marketMoodIndex}</p>
            </div>
          </div>
          <p className="text-xs text-green-600">Bullish</p>
        </Card>

        {/* 24h Volume */}
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-emerald-500/10 rounded-lg">
              <Activity className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">24h Volume</p>
              <p className="text-lg font-bold">${(marketHealth.volume24h / 1000000000).toFixed(1)}B</p>
            </div>
          </div>
          <p className={`text-xs ${marketHealth.volumeDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {marketHealth.volumeDelta > 0 ? '+' : ''}{marketHealth.volumeDelta.toFixed(1)}%
          </p>
        </Card>

        {/* Active Whales */}
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-sky-500/10 rounded-lg">
              <Fish className="h-4 w-4 text-sky-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Active Whales</p>
              <p className="text-lg font-bold">{marketHealth.activeWhales.toLocaleString()}</p>
            </div>
          </div>
          <p className={`text-xs ${marketHealth.whalesDelta > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {marketHealth.whalesDelta > 0 ? '+' : ''}{marketHealth.whalesDelta.toFixed(1)}%
          </p>
        </Card>

        {/* Risk Index with Alerts */}
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-amber-500/10 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Risk Index</p>
              <p className="text-lg font-bold">{marketHealth.riskIndex}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Medium Risk</p>
            {marketHealth.criticalAlerts > 0 && (
              <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                {marketHealth.criticalAlerts}
              </Badge>
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2">
        <Drawer open={alertsOpen} onOpenChange={setAlertsOpen}>
          <DrawerTrigger asChild>
            <Button variant="outline" size="sm" className="flex-1">
              <Bell className="h-4 w-4 mr-2" />
              Alerts ({mockAlerts.length})
            </Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Real-time Alerts</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4">
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {mockAlerts.map((alert) => (
                    <Card key={alert.id} className="p-3">
                      <div className="flex items-start gap-3">
                        <Badge className={cn("text-xs", getSeverityColor(alert.severity))}>
                          {alert.severity}
                        </Badge>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{alert.title}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {alert.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">
                              {alert.chain}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {alert.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </DrawerContent>
        </Drawer>

        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* AI Digest - Mobile Optimized */}
      <Card className="p-3 bg-primary/5">
        <h3 className="font-medium text-sm mb-2">AI Market Digest</h3>
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">
            💡 Our analysis shows significant whale movement patterns suggesting potential market volatility ahead.
          </p>
          <p className="text-xs text-muted-foreground">
            • {mockAlerts.filter(a => a.severity === 'High').length} high-priority whale clusters active
          </p>
          <p className="text-xs text-muted-foreground">
            • $45M moved to exchanges (potential sell pressure)
          </p>
          <p className="text-xs text-muted-foreground">
            • Dormant wallets awakening after 6+ months
          </p>
        </div>
      </Card>

      {/* Top Whale Clusters - Simplified for Mobile */}
      <Card className="p-3">
        <h3 className="font-medium text-sm mb-3">Top Whale Activity</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">CEX Inflow</p>
              <p className="text-xs text-muted-foreground">23 whales • $450M</p>
            </div>
            <Badge className="bg-red-50 text-red-600 text-xs">High Risk</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">DeFi Activity</p>
              <p className="text-xs text-muted-foreground">156 whales • $1.2B</p>
            </div>
            <Badge className="bg-green-50 text-green-600 text-xs">Low Risk</Badge>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Accumulation</p>
              <p className="text-xs text-muted-foreground">67 whales • $890M</p>
            </div>
            <Badge className="bg-orange-50 text-orange-600 text-xs">Medium Risk</Badge>
          </div>
        </div>
      </Card>

      {/* Push Notification Settings */}
      <Card className="p-3 border-dashed">
        <div className="text-center">
          <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <h3 className="font-medium text-sm mb-1">Stay Updated</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Get push notifications for critical whale movements
          </p>
          <Button size="sm" className="w-full">
            Enable Notifications
          </Button>
        </div>
      </Card>
    </div>
  );
}