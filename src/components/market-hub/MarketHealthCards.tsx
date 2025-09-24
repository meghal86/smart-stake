import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Activity, Fish, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface MarketHealthCardsProps {
  data?: {
    marketMoodIndex: number;
    volume24h: number;
    volumeDelta: number;
    activeWhales: number;
    whalesDelta: number;
    riskIndex: number;
    topAlerts: Array<{
      id: string;
      severity: 'High' | 'Medium' | 'Info';
      title: string;
    }>;
    refreshedAt: string;
  };
  loading: boolean;
  onAlertClick: (alert: any) => void;
}

export function MarketHealthCards({ data, loading, onAlertClick }: MarketHealthCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-3 sm:p-4">
            <Skeleton className="h-12 sm:h-16 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'bg-red-500 text-white';
      case 'Medium': return 'bg-orange-500 text-white';
      default: return 'bg-blue-500 text-white';
    }
  };

  const formatDelta = (delta: number) => {
    const sign = delta > 0 ? '+' : '';
    const color = delta > 0 ? 'text-green-600' : 'text-red-600';
    return <span className={color}>{sign}{delta.toFixed(1)}%</span>;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* Market Mood Index */}
      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-primary/10 rounded-lg">
            <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground">Market Mood</p>
            <p className="text-lg sm:text-2xl font-bold">{data?.marketMoodIndex || 0}</p>
            <p className="text-xs text-green-600">Bullish</p>
          </div>
        </div>
      </Card>

      {/* 24h Volume */}
      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-emerald-500/10 rounded-lg">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground">24h Volume</p>
            <p className="text-lg sm:text-2xl font-bold">
              ${((data?.volume24h || 0) / 1000000000).toFixed(1)}B
            </p>
            {data?.volumeDelta && formatDelta(data.volumeDelta)}
          </div>
        </div>
      </Card>

      {/* Active Whales */}
      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="p-1.5 sm:p-2 bg-sky-500/10 rounded-lg">
            <Fish className="h-4 w-4 sm:h-5 sm:w-5 text-sky-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground">Active Whales</p>
            <p className="text-lg sm:text-2xl font-bold">{(data?.activeWhales || 0).toLocaleString()}</p>
            {data?.whalesDelta && formatDelta(data.whalesDelta)}
          </div>
        </div>
      </Card>

      {/* Market Risk + Top 3 Critical Alerts */}
      <Card className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <div className="p-1.5 sm:p-2 bg-amber-500/10 rounded-lg">
            <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground">Risk Index</p>
            <p className="text-lg sm:text-2xl font-bold">{data?.riskIndex || 0}</p>
          </div>
        </div>
        <div className="space-y-1">
          {data?.topAlerts?.slice(0, 3).map((alert) => (
            <div 
              key={alert.id}
              className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 p-1 rounded"
              onClick={() => onAlertClick(alert)}
            >
              <Badge className={getSeverityColor(alert.severity)} size="sm">
                {alert.severity}
              </Badge>
              <span className="truncate">{alert.title}</span>
            </div>
          ))}
          {(data?.topAlerts?.length || 0) > 3 && (
            <div className="text-xs text-primary cursor-pointer">
              +{(data?.topAlerts?.length || 0) - 3} more alerts
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}