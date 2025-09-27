import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  PieChart, 
  LineChart,
  Target,
  Zap,
  Shield,
  DollarSign,
  Users,
  Clock
} from 'lucide-react';

interface WhaleAnalyticsChartsProps {
  whaleData: any;
  selectedTimeframe: string;
  onTimeframeChange: (timeframe: string) => void;
}

export function WhaleAnalyticsCharts({ whaleData, selectedTimeframe, onTimeframeChange }: WhaleAnalyticsChartsProps) {
  const timeframes = [
    { label: '1H', value: '1h' },
    { label: '24H', value: '24h' },
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' }
  ];

  // Mock data for visualization - in real implementation, this would come from API
  const riskDistribution = [
    { label: 'Low Risk', value: 45, color: 'bg-green-500' },
    { label: 'Medium Risk', value: 35, color: 'bg-yellow-500' },
    { label: 'High Risk', value: 20, color: 'bg-red-500' }
  ];

  const activityTrend = [
    { time: '00:00', value: 12 },
    { time: '04:00', value: 8 },
    { time: '08:00', value: 25 },
    { time: '12:00', value: 18 },
    { time: '16:00', value: 32 },
    { time: '20:00', value: 28 }
  ];

  const whaleTypes = [
    { type: 'Mega Whales', count: 5, percentage: 12.5, color: 'bg-purple-500' },
    { type: 'Large Whales', count: 15, percentage: 37.5, color: 'bg-blue-500' },
    { type: 'Medium Whales', count: 12, percentage: 30, color: 'bg-green-500' },
    { type: 'Small Whales', count: 8, percentage: 20, color: 'bg-yellow-500' }
  ];

  return (
    <div className="space-y-6">
      {/* Timeframe Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Whale Analytics Dashboard</h3>
        <div className="flex gap-2">
          {timeframes.map((timeframe) => (
            <button
              key={timeframe.value}
              onClick={() => onTimeframeChange(timeframe.value)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                selectedTimeframe === timeframe.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {timeframe.label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-red-600" />
              Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskDistribution.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-sm text-muted-foreground">{item.value}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full ${item.color}`}
                      style={{ width: `${item.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Activity Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last 24 hours</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  <span className="text-green-600 font-medium">+15%</span>
                </div>
              </div>
              <div className="h-32 flex items-end gap-2">
                {activityTrend.map((point, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t"
                      style={{ height: `${(point.value / 32) * 100}%` }}
                    />
                    <span className="text-xs text-muted-foreground mt-1">{point.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Whale Types Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Whale Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {whaleTypes.map((type, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${type.color}`} />
                    <span className="text-sm font-medium">{type.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{type.count} whales</span>
                    <Badge variant="outline" className="text-xs">
                      {type.percentage}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Market Impact Heatmap */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-600" />
              Market Impact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-2">
                {['High', 'Medium', 'Low'].map((level, index) => (
                  <div key={level} className="text-center">
                    <div className={`w-full h-8 rounded ${
                      level === 'High' ? 'bg-red-500' :
                      level === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <span className="text-xs text-muted-foreground mt-1">{level}</span>
                  </div>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                Current market impact level based on whale activity and volume
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <Zap className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700">Active Whales</p>
                <p className="text-2xl font-bold text-blue-600">
                  {whaleData?.stats?.activeWhales || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-700">Total Volume</p>
                <p className="text-2xl font-bold text-green-600">
                  ${((whaleData?.stats?.totalValue || 0) / 1e9).toFixed(1)}B
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-700">Avg Response Time</p>
                <p className="text-2xl font-bold text-amber-600">2.3s</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
