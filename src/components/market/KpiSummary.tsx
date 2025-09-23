import { TrendingUp, Fish, AlertTriangle, Target, Bell, DollarSign, Activity } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useAnalytics } from '@/hooks/useAnalytics';

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

  if (loading) {
    return (
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: window.innerWidth < 640 ? 'repeat(2, 1fr)' : window.innerWidth < 1024 ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
        gap: window.innerWidth < 640 ? '4px' : '8px',
        marginBottom: window.innerWidth < 640 ? '12px' : '24px'
      }}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} style={{ padding: window.innerWidth < 640 ? '6px' : '12px' }}>
            <Skeleton className="h-3 w-12 mb-1" />
            <Skeleton className="h-4 w-16" />
          </Card>
        ))}
      </div>
    );
  }

  const formatVolume = (vol: number) => {
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(1)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(1)}M`;
    if (vol >= 1e3) return `$${(vol / 1e3).toFixed(1)}K`;
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

  const isMobile = window.innerWidth < 640;
  const isTablet = window.innerWidth >= 640 && window.innerWidth < 1024;

  const kpiCards = [
    {
      id: 'volume',
      title: isMobile ? 'Vol' : '24h Volume',
      value: formatVolume(volume24h),
      delta: volumeDelta,
      icon: <DollarSign style={{ width: isMobile ? '12px' : '16px', height: isMobile ? '12px' : '16px' }} />,
      color: 'text-green-600',
      borderColor: 'border-l-green-500'
    },
    {
      id: 'whales',
      title: isMobile ? 'Whales' : 'Active Whales',
      value: isMobile ? `${Math.round(activeWhales/1000)}k` : activeWhales.toLocaleString(),
      delta: whalesDelta,
      icon: <Fish style={{ width: isMobile ? '12px' : '16px', height: isMobile ? '12px' : '16px' }} />,
      color: 'text-blue-600',
      borderColor: 'border-l-blue-500'
    },
    {
      id: 'risk',
      title: isMobile ? 'Alerts' : 'Risk Alerts',
      value: riskAlerts.toString(),
      delta: riskAlertsDelta,
      icon: <AlertTriangle style={{ width: isMobile ? '12px' : '16px', height: isMobile ? '12px' : '16px' }} />,
      color: 'text-orange-600',
      borderColor: 'border-l-orange-500'
    },
    {
      id: 'score',
      title: isMobile ? 'Risk' : 'Risk Score',
      value: `${avgRiskScore.toFixed(0)}`,
      delta: riskScoreDelta,
      icon: <Activity style={{ width: isMobile ? '12px' : '16px', height: isMobile ? '12px' : '16px' }} />,
      color: getRiskColor(avgRiskScore),
      borderColor: avgRiskScore > 70 ? 'border-l-red-500' : avgRiskScore > 40 ? 'border-l-yellow-500' : 'border-l-green-500'
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
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : isTablet ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
      gap: isMobile ? '4px' : isTablet ? '8px' : '16px',
      marginBottom: isMobile ? '12px' : '24px'
    }}>
      {kpiCards.map((card) => (
        <Card 
          key={card.id}
          className={`cursor-pointer hover:bg-muted/50 hover:shadow-md transition-all duration-200 group ${card.borderColor}`}
          style={{ 
            padding: isMobile ? '6px' : isTablet ? '8px' : '16px',
            borderLeftWidth: isMobile ? '2px' : '4px'
          }}
          onClick={() => handleCardClick(card.id)}
        >
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            marginBottom: isMobile ? '2px' : '8px' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', minWidth: 0, flex: 1 }}>
              <div className={card.color} style={{ flexShrink: 0 }}>
                {card.icon}
              </div>
              <span 
                className="text-muted-foreground"
                style={{ 
                  fontSize: isMobile ? '10px' : '12px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {card.title}
              </span>
            </div>
            {!isMobile && (
              <Button
                size="sm"
                variant="ghost"
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAlertClick(card.id, card.title, card.value);
                }}
              >
                <Bell className="h-3 w-3" />
              </Button>
            )}
          </div>
          
          <div 
            className={`font-bold kpi-value ${card.color}`}
            style={{ 
              fontSize: isMobile ? '12px' : isTablet ? '16px' : '20px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginBottom: isMobile ? '2px' : '8px'
            }}
          >
            {loading ? '...' : card.value}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div 
                className={formatDelta(card.delta).color}
                style={{ 
                  fontSize: '10px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {formatDelta(card.delta).text}
              </div>
              {!isMobile && (
                <div 
                  className="text-muted-foreground opacity-70"
                  style={{ 
                    fontSize: '10px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  vs yesterday
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}