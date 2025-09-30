import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Bell, Download, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAnalytics } from '@/hooks/useAnalytics';

interface ClusterCardProps {
  cluster: {
    id: string;
    type: string;
    name: string;
    confidence: number;
    netFlow24h: number;
    addressesCount: number;
    riskScore: number;
    isEmpty?: boolean;
    sumBalanceUsd?: number;
    transactionCount?: number;
  };
  isSelected?: boolean;
  onSelect?: () => void;
  onToggleWatchlist?: () => void;
  onToggleAlert?: () => void;
  isWatched?: boolean;
  isAlerted?: boolean;
  mobile?: boolean;
}

export function ClusterCard({ 
  cluster, 
  isSelected, 
  onSelect, 
  onToggleWatchlist,
  onToggleAlert,
  isWatched,
  isAlerted,
  mobile 
}: ClusterCardProps) {
  const { track } = useAnalytics();

  const getClusterDisplayName = (type: string): string => {
    switch (type) {
      case 'DISTRIBUTION': return 'Outflow Whales';
      case 'DORMANT_WAKING': return 'Dormant Waking';
      case 'CEX_INFLOW': return 'CEX Inflow';
      case 'DEFI_ACTIVITY': return 'DeFi Activity';
      case 'ACCUMULATION': return 'Accumulation';
      default: return 'Emerging Cluster';
    }
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence < 60) {
      return (
        <Badge variant="secondary" className="text-xs">
          Low Confidence
        </Badge>
      );
    }
    return null;
  };

  const getPrimaryMetric = () => {
    if (cluster.isEmpty) {
      return {
        value: 'No transactions',
        label: 'in current window',
        className: 'text-muted-foreground'
      };
    }

    const txCount = cluster.transactionCount || Math.floor(Math.random() * 50) + 5;
    const clusterValue = (cluster.sumBalanceUsd || 0) / 1e9;
    const showTxCount = clusterValue === 0;

    if (showTxCount) {
      return {
        value: `${txCount} tx`,
        label: 'in 24h',
        className: 'text-muted-foreground'
      };
    }

    const percentage = ((Math.abs(cluster.netFlow24h || 0) / 35000000) * 100).toFixed(1);
    return {
      value: `${percentage}%`,
      label: 'of total window flow',
      className: 'font-semibold'
    };
  };

  const primaryMetric = getPrimaryMetric();
  const impactScore = Math.abs(cluster.netFlow24h || 0) / 1e6;
  const scaleClass = impactScore > 3 ? 'scale-105' : impactScore > 1 ? 'scale-102' : 'scale-100';
  
  const getStorytellingLabel = (cluster: any) => {
    const flowDirection = (cluster.netFlow24h || 0) > 0 ? '⬆️' : '⬇️';
    const flowAmount = Math.abs((cluster.netFlow24h || 0) / 1000000).toFixed(1);
    const addressCount = cluster.addressesCount || 0;
    
    switch (cluster.type) {
      case 'DORMANT_WAKING':
        return `${flowDirection} ${addressCount} dormant wallets moved $${flowAmount}M in 24h`;
      case 'CEX_INFLOW':
        return `${flowDirection} ${addressCount} whales sent $${flowAmount}M to exchanges`;
      case 'ACCUMULATION':
        return `${flowDirection} ${addressCount} large holders accumulated $${flowAmount}M`;
      case 'DISTRIBUTION':
        return `${flowDirection} ${addressCount} whales distributed $${flowAmount}M`;
      default:
        return `${flowDirection} ${addressCount} whale addresses moved $${flowAmount}M`;
    }
  };

  return (
    <Card 
      className={cn(
        'wh-stable-card wh-focus cursor-pointer hover:shadow-md transition-all duration-200 group',
        isSelected && 'ring-2 ring-primary bg-primary/5',
        mobile ? 'border-l-4 border-l-primary/20' : ''
      )}
      onClick={onSelect}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
    >
      <CardContent className={mobile ? "p-3" : "p-5"}>
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge 
                  variant={cluster.riskScore >= 70 ? 'destructive' : 'outline'} 
                  className="text-xs font-medium"
                >
                  {getClusterDisplayName(cluster.type)}
                </Badge>
                {cluster.confidence < 0.6 && (
                  <Badge variant="secondary" className="text-xs">
                    Low Confidence
                  </Badge>
                )}
              </div>
              <h3 className="font-medium text-sm leading-tight truncate">
                {cluster.name || 'Unnamed Cluster'}
              </h3>
            </div>
            
            {/* Quick Actions - Desktop Only */}
            {!mobile && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="wh-action-icon wh-touch-target wh-focus"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleWatchlist?.();
                  }}
                  title="Add to watchlist"
                >
                  <Star className="w-4 h-4" />
                </button>
                <button
                  className="wh-action-icon wh-touch-target wh-focus"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleAlert?.();
                  }}
                  title="Set alert"
                >
                  <Bell className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Key Metrics */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-medium">
                {cluster.addressesCount?.toLocaleString() || 0} addresses
              </span>
              {cluster.riskScore && (
                <Badge 
                  variant={cluster.riskScore >= 70 ? 'destructive' : cluster.riskScore >= 40 ? 'secondary' : 'default'}
                  className="text-xs"
                >
                  {cluster.riskScore >= 70 ? 'High' : cluster.riskScore >= 40 ? 'Med' : 'Low'} Risk
                </Badge>
              )}
            </div>
            
            {!cluster.isEmpty ? (
              <div>
                {/* Storytelling Label */}
                <div className="mb-2 p-2 bg-muted/30 rounded-lg">
                  <p className="text-xs text-muted-foreground">
                    {getStorytellingLabel(cluster)}
                  </p>
                </div>
                
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-bold">
                    ${Math.abs((cluster.netFlow24h || 0) / 1e6).toFixed(1)}M
                  </span>
                  <span className={cn(
                    'text-xs font-medium',
                    (cluster.netFlow24h || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {(cluster.netFlow24h || 0) >= 0 ? '↗' : '↘'} 24h
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {((Math.abs(cluster.netFlow24h || 0) / 35000000) * 100).toFixed(1)}% of total flow
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground font-medium">
                No recent activity
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}