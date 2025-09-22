import { TrendingUp, Fish, AlertTriangle, Target, Bell } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface KpiSummaryProps {
  volume24h: number;
  activeWhales: number;
  riskAlerts: number;
  avgRiskScore: number;
  loading?: boolean;
  volumeDelta?: number;
  whalesDelta?: number;
  riskAlertsDelta?: number;
  riskScoreDelta?: number;
  onCreateAlert?: (context: any) => void;
  onCardClick?: (type: string) => void;
}

export function KpiSummary({ 
  volume24h, 
  activeWhales, 
  riskAlerts, 
  avgRiskScore, 
  loading, 
  volumeDelta = 0,
  whalesDelta = 0,
  riskAlertsDelta = 0,
  riskScoreDelta = 0,
  onCreateAlert, 
  onCardClick 
}: KpiSummaryProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-8 w-24" />
          </Card>
        ))}
      </div>
    );
  }

  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `$${(vol / 1e3).toFixed(2)}K`;
    return `$${vol.toFixed(0)}`;
  };

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-500';
    if (score >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };
  
  const formatDelta = (delta: number) => {
    const sign = delta >= 0 ? '+' : '';
    const color = delta >= 0 ? 'text-green-500' : 'text-red-500';
    return { text: `${sign}${delta.toFixed(1)}%`, color };
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="p-4 cursor-pointer hover:bg-muted/50 hover:shadow-md transition-all duration-200 group border-l-4 border-l-blue-500" onClick={() => {
        console.log('Volume card clicked');
        onCardClick?.('volume');
      }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-500" />
            <span className="text-sm text-muted-foreground">24h Volume</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onCreateAlert?.({ type: 'volume', threshold: volume24h, metric: '24h_volume' });
            }}
          >
            <Bell className="h-3 w-3" />
          </Button>
        </div>
        <div className="text-2xl font-bold">{formatVolume(volume24h)}</div>
        <div className={`text-xs ${formatDelta(volumeDelta).color}`}>{formatDelta(volumeDelta).text} vs 24h avg</div>
      </Card>

      <Card className="p-4 cursor-pointer hover:bg-muted/50 hover:shadow-md transition-all duration-200 group border-l-4 border-l-purple-500" onClick={() => {
        console.log('Whales card clicked');
        onCardClick?.('whales');
      }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Fish className="h-4 w-4 text-purple-500" />
            <span className="text-sm text-muted-foreground">Active Whales</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onCreateAlert?.({ type: 'whale_activity', threshold: activeWhales, metric: 'active_whales' });
            }}
          >
            <Bell className="h-3 w-3" />
          </Button>
        </div>
        <div className="text-2xl font-bold">{activeWhales.toLocaleString()}</div>
        <div className={`text-xs ${formatDelta(whalesDelta).color}`}>{formatDelta(whalesDelta).text} vs yesterday</div>
      </Card>

      <Card className="p-4 cursor-pointer hover:bg-muted/50 hover:shadow-md transition-all duration-200 group border-l-4 border-l-orange-500" onClick={() => {
        console.log('Risk card clicked');
        onCardClick?.('risk');
      }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-sm text-muted-foreground">Risk Alerts</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onCreateAlert?.({ type: 'risk_alert', threshold: 10000000, metric: 'high_risk_transactions' });
            }}
          >
            <Bell className="h-3 w-3" />
          </Button>
        </div>
        <div className="text-2xl font-bold">{riskAlerts}</div>
        <div className={`text-xs ${formatDelta(riskAlertsDelta).color}`}>{formatDelta(riskAlertsDelta).text} vs yesterday</div>
      </Card>

      <Card className="p-4 cursor-pointer hover:bg-muted/50 hover:shadow-md transition-all duration-200 group border-l-4 border-l-teal-500" onClick={() => {
        console.log('Score card clicked');
        onCardClick?.('score');
      }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-teal-500" />
            <span className="text-sm text-muted-foreground">Avg Risk Score</span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              onCreateAlert?.({ type: 'risk_score', threshold: avgRiskScore + 10, metric: 'avg_risk_score' });
            }}
          >
            <Bell className="h-3 w-3" />
          </Button>
        </div>
        <div className={`text-2xl font-bold ${getRiskColor(avgRiskScore)}`}>
          {avgRiskScore.toFixed(1)}/100
        </div>
        <div className={`text-xs ${formatDelta(riskScoreDelta).color}`}>{formatDelta(riskScoreDelta).text} vs yesterday</div>
      </Card>
    </div>
  );
}