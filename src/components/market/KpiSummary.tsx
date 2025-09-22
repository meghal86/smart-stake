import { TrendingUp, Fish, AlertTriangle, Target, Bell, DollarSign, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useCompactView } from '@/contexts/CompactViewContext';

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
  const { track } = useAnalytics();
  const { isCompact } = useCompactView();
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

  // Generate sparkline data for 24h trend
  const generateSparklineData = (baseValue: number, delta: number) => {
    const points = [];
    let current = baseValue * 0.9;
    for (let i = 0; i < 24; i++) {
      current += (Math.random() - 0.5) * (baseValue * 0.1) + (delta / 24);
      points.push(Math.max(0, current));
    }
    return points;
  };

  const Sparkline = ({ data, color = '#3b82f6' }: { data: number[]; color?: string }) => {
    if (data.length === 0) return null;
    
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    return (
      <svg width={isCompact ? "40" : "60"} height={isCompact ? "16" : "24"} className="inline-block">
        <polyline
          points={data.map((value, index) => 
            `${(index / (data.length - 1)) * (isCompact ? 40 : 60)},${(isCompact ? 16 : 24) - ((value - min) / range) * (isCompact ? 16 : 24)}`
          ).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth={isCompact ? "1" : "1.5"}
          opacity="0.8"
        />
      </svg>
    );
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

  const kpiCards = [
    {
      id: 'volume',
      title: '24h Volume',
      value: formatVolume(volume24h),
      delta: volumeDelta,
      icon: <DollarSign className={`${isCompact ? 'h-4 w-4' : 'h-5 w-5'}`} />,
      color: 'text-green-600',
      borderColor: 'border-l-green-500',
      sparklineData: generateSparklineData(volume24h, volumeDelta * 1000000),
      sparklineColor: '#10b981'
    },
    {
      id: 'whales',
      title: 'Active Whales',
      value: activeWhales.toLocaleString(),
      delta: whalesDelta,
      icon: <Fish className={`${isCompact ? 'h-4 w-4' : 'h-5 w-5'}`} />,
      color: 'text-blue-600',
      borderColor: 'border-l-blue-500',
      sparklineData: generateSparklineData(activeWhales, whalesDelta),
      sparklineColor: '#3b82f6'
    },
    {
      id: 'risk',
      title: 'Risk Alerts',
      value: riskAlerts.toString(),
      delta: riskAlertsDelta,
      icon: <AlertTriangle className={`${isCompact ? 'h-4 w-4' : 'h-5 w-5'}`} />,
      color: 'text-orange-600',
      borderColor: 'border-l-orange-500',
      sparklineData: generateSparklineData(riskAlerts, riskAlertsDelta),
      sparklineColor: '#f59e0b'
    },
    {
      id: 'score',
      title: 'Avg Risk Score',
      value: `${avgRiskScore.toFixed(1)}/100`,
      delta: riskScoreDelta,
      icon: <Activity className={`${isCompact ? 'h-4 w-4' : 'h-5 w-5'}`} />,
      color: getRiskColor(avgRiskScore),
      borderColor: avgRiskScore > 70 ? 'border-l-red-500' : avgRiskScore > 40 ? 'border-l-yellow-500' : 'border-l-green-500',
      sparklineData: generateSparklineData(avgRiskScore, riskScoreDelta),
      sparklineColor: avgRiskScore > 70 ? '#dc2626' : avgRiskScore > 40 ? '#d97706' : '#059669'
    }
  ];

  const handleCardClick = (cardId: string) => {
    track('kpi_card_clicked', { cardId, currentTab: 'market' });
    onCardClick?.(cardId);
  };

  const handleAlertClick = (cardId: string, title: string, value: string) => {
    track('kpi_alert_clicked', { cardId, title });
    onCreateAlert?.({
      type: cardId,
      metric: title,
      threshold: value
    });
  };

  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 ${isCompact ? 'gap-2' : 'gap-4'} mb-6`}>
      {kpiCards.map((card) => (
        <Tooltip key={card.id}>
          <TooltipTrigger asChild>
            <Card 
              className={`${isCompact ? 'p-3' : 'p-4'} cursor-pointer hover:bg-muted/50 hover:shadow-md transition-all duration-200 group border-l-4 ${card.borderColor} kpi-card`}
              onClick={() => handleCardClick(card.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className={`flex items-center ${isCompact ? 'gap-1' : 'gap-2'}`}>
                  <div className={`${card.color}`}>
                    {card.icon}
                  </div>
                  <span className={`${isCompact ? 'text-xs' : 'text-sm'} text-muted-foreground`}>{card.title}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className={`${isCompact ? 'h-5 w-5' : 'h-6 w-6'} p-0 opacity-0 group-hover:opacity-100 transition-opacity`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAlertClick(card.id, card.title, card.value);
                  }}
                >
                  <Bell className={`${isCompact ? 'h-3 w-3' : 'h-4 w-4'}`} />
                </Button>
              </div>
              
              <div className={`${isCompact ? 'text-lg' : 'text-2xl'} font-bold kpi-value ${card.color}`}>
                {loading ? '...' : card.value}
              </div>
              
              <div className="flex items-center justify-between mt-2">
                <div className="flex flex-col">
                  <div className={`${isCompact ? 'text-xs' : 'text-sm'} ${formatDelta(card.delta).color}`}>
                    {formatDelta(card.delta).text}
                  </div>
                  {/* POLISH: Microcopy for baseline clarity */}
                  <div className={`${isCompact ? 'text-xs' : 'text-xs'} text-muted-foreground opacity-70`}>
                    {card.id === 'volume' ? 'vs 24h avg' : 
                     card.id === 'whales' ? 'vs yesterday' :
                     card.id === 'risk' ? 'vs yesterday' : 'vs yesterday'}
                  </div>
                </div>
                <Sparkline data={card.sparklineData} color={card.sparklineColor} />
              </div>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <div className="font-medium">{card.title}</div>
              <div>Click to drill down and explore details</div>
              <div className="text-xs text-muted-foreground mt-1">
                24h change: {formatDelta(card.delta).text}
              </div>
              <div className="text-xs text-muted-foreground">
                Click bell icon to set up alerts
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}