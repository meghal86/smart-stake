import { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, TrendingDown, Users, Activity, DollarSign, AlertTriangle } from 'lucide-react';

interface AnalyticsData {
  riskDistribution: Array<{ risk: string; count: number; color: string }>;
  transactionVolume: Array<{ date: string; volume: number; transactions: number }>;
  topWallets: Array<{ address: string; label: string; value: number; risk: number }>;
  alertTrends: Array<{ type: string; count: number; severity: string }>;
}

export function AdvancedAnalytics() {
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '90d'>('7d');

  // Mock analytics data - replace with real data
  const analyticsData: AnalyticsData = useMemo(() => ({
    riskDistribution: [
      { risk: 'Low (1-3)', count: 45, color: '#10B981' },
      { risk: 'Medium (4-6)', count: 32, color: '#F59E0B' },
      { risk: 'High (7-10)', count: 18, color: '#EF4444' }
    ],
    transactionVolume: [
      { date: '2024-01-01', volume: 2500000, transactions: 156 },
      { date: '2024-01-02', volume: 3200000, transactions: 203 },
      { date: '2024-01-03', volume: 1800000, transactions: 134 },
      { date: '2024-01-04', volume: 4100000, transactions: 287 },
      { date: '2024-01-05', volume: 2900000, transactions: 198 },
      { date: '2024-01-06', volume: 3600000, transactions: 245 },
      { date: '2024-01-07', volume: 2200000, transactions: 167 }
    ],
    topWallets: [
      { address: '0x742d35...925a3', label: 'Whale #1', value: 15600000, risk: 3 },
      { address: '0x1a2b3c...def456', label: 'Exchange Hot', value: 12300000, risk: 2 },
      { address: '0x987fed...321abc', label: 'DeFi Whale', value: 8900000, risk: 5 },
      { address: '0x456789...fedcba', label: 'Unknown', value: 7200000, risk: 8 }
    ],
    alertTrends: [
      { type: 'Large Transaction', count: 23, severity: 'medium' },
      { type: 'Risk Threshold', count: 15, severity: 'high' },
      { type: 'Sanctions Match', count: 2, severity: 'critical' },
      { type: 'DeFi Health', count: 8, severity: 'medium' }
    ]
  }), []);

  const totalValue = analyticsData.topWallets.reduce((sum, wallet) => sum + wallet.value, 0);
  const totalTransactions = analyticsData.transactionVolume.reduce((sum, day) => sum + day.transactions, 0);
  const avgRisk = analyticsData.topWallets.reduce((sum, wallet) => sum + wallet.risk, 0) / analyticsData.topWallets.length;

  const getRiskColor = (risk: number) => {
    if (risk <= 3) return 'text-green-600';
    if (risk <= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <div>
              <div className="text-sm text-muted-foreground">Total Value</div>
              <div className="text-xl font-bold">${(totalValue / 1000000).toFixed(1)}M</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-600" />
            <div>
              <div className="text-sm text-muted-foreground">Transactions</div>
              <div className="text-xl font-bold">{totalTransactions.toLocaleString()}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-purple-600" />
            <div>
              <div className="text-sm text-muted-foreground">Wallets Tracked</div>
              <div className="text-xl font-bold">{analyticsData.topWallets.length}</div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <div>
              <div className="text-sm text-muted-foreground">Avg Risk Score</div>
              <div className={`text-xl font-bold ${getRiskColor(avgRisk)}`}>
                {avgRisk.toFixed(1)}/10
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
            <TabsTrigger value="volume">Volume Trends</TabsTrigger>
            <TabsTrigger value="alerts">Alert Patterns</TabsTrigger>
          </TabsList>

          <div className="flex gap-2">
            {(['24h', '7d', '30d', '90d'] as const).map((period) => (
              <Button
                key={period}
                size="sm"
                variant={timeframe === period ? 'default' : 'outline'}
                onClick={() => setTimeframe(period)}
              >
                {period}
              </Button>
            ))}
          </div>
        </div>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Distribution */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Risk Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analyticsData.riskDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="count"
                    >
                      {analyticsData.riskDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {analyticsData.riskDistribution.map((entry) => (
                  <div key={entry.risk} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-sm">{entry.risk}: {entry.count}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Top Wallets */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Wallets by Value</h3>
              <div className="space-y-3">
                {analyticsData.topWallets.map((wallet, index) => (
                  <div key={wallet.address} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-sm font-medium">#{index + 1}</div>
                      <div>
                        <div className="font-medium">{wallet.label}</div>
                        <div className="text-xs text-muted-foreground font-mono">
                          {wallet.address}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">${(wallet.value / 1000000).toFixed(1)}M</div>
                      <Badge variant="outline" className={getRiskColor(wallet.risk)}>
                        Risk: {wallet.risk}/10
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="volume" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Transaction Volume Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.transactionVolume}>
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(value) => new Date(value).toLocaleDateString()}
                  />
                  <YAxis 
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Volume']}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Bar dataKey="volume" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Alert Patterns</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analyticsData.alertTrends.map((alert) => (
                <div key={alert.type} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{alert.type}</h4>
                    <Badge 
                      variant={alert.severity === 'critical' ? 'destructive' : 'outline'}
                      className={
                        alert.severity === 'high' ? 'text-orange-600 border-orange-600' :
                        alert.severity === 'medium' ? 'text-yellow-600 border-yellow-600' : ''
                      }
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold">{alert.count}</div>
                  <div className="text-sm text-muted-foreground">alerts triggered</div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}