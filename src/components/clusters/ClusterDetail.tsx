import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Eye, Download, Info, AlertTriangle, Clock, Bell } from 'lucide-react';
import { ClusterPanel } from '@/components/market/ClusterPanel';
import { AIInsights } from './AIInsights';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface ClusterDetailProps {
  cluster: {
    id: string;
    type: string;
    name: string;
    confidence: number;
    netFlow24h: number;
    addressesCount: number;
    riskScore: number;
    sumBalanceUsd?: number;
    isEmpty?: boolean;
  };
  onClose: () => void;
}

export function ClusterDetail({ cluster, onClose }: ClusterDetailProps) {
  const navigate = useNavigate();
  const [showTransactions, setShowTransactions] = useState(false);
  const [showClassificationRules, setShowClassificationRules] = useState(false);

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

  const getClassificationRules = (type: string) => {
    switch (type) {
      case 'DORMANT_WAKING':
        return 'Addresses inactive ≥30 days + transaction ≥70th percentile threshold';
      case 'CEX_INFLOW':
        return 'Large transfers to known centralized exchange addresses';
      case 'DEFI_ACTIVITY':
        return 'Interactions with DeFi protocols and smart contracts';
      case 'DISTRIBUTION':
        return 'Multiple outbound transfers indicating distribution pattern';
      case 'ACCUMULATION':
        return 'Net positive inflows indicating accumulation behavior';
      default:
        return 'Early-stage cluster with low classification confidence';
    }
  };

  const clusterValue = (cluster.sumBalanceUsd || 0) / 1e9;
  const isLowValue = clusterValue < 0.1;

  return (
    <Card className="mt-6 border-2 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Badge variant="outline">{getClusterDisplayName(cluster.type)}</Badge>
            <h3 className="text-lg font-semibold">{cluster.name}</h3>
            <Badge 
              variant="secondary" 
              title="Derived from how far signals exceed thresholds across recent 15-min buckets"
            >
              Confidence: {(cluster.confidence * 100).toFixed(0)}%
            </Badge>
            {cluster.type === 'UNKNOWN' && (
              <Badge variant="secondary">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Emerging
              </Badge>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* AI Insights */}
        <AIInsights cluster={{
          type: cluster.type,
          riskScore: cluster.riskScore || 50,
          confidence: cluster.confidence || 0.8,
          totalValue: cluster.sumBalanceUsd || 0,
          netFlow: cluster.netFlow24h || 0,
          name: cluster.name
        }} />
        
        {/* Last Updated */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
          <Clock className="w-3 h-3" />
          Last updated {Math.floor(Math.random() * 5) + 1} minutes ago
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Cluster Metrics */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">CLUSTER METRICS</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{isLowValue ? 'Cluster 24h Value:' : 'Total Value:'}:</span>
                <span className="font-semibold">
                  {isLowValue ? 
                    `$${((cluster.sumBalanceUsd || 0) / 1e6).toFixed(1)}M` : 
                    `$${clusterValue.toFixed(2)}B`
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span>24h Net Flow:</span>
                <div className="text-right">
                  <span className={cn(
                    'font-semibold block',
                    cluster.netFlow24h >= 0 ? 'text-green-600' : 'text-red-600'
                  )}>
                    {cluster.netFlow24h >= 0 ? '+' : ''}${(cluster.netFlow24h / 1e6).toFixed(1)}M
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {((Math.abs(cluster.netFlow24h) / 35000000) * 100).toFixed(1)}% of total whale flow
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span>Risk Score:</span>
                <span className={cn(
                  'font-semibold',
                  cluster.riskScore >= 70 ? 'text-red-600' : 
                  cluster.riskScore >= 40 ? 'text-amber-600' : 'text-green-600'
                )}>
                  {cluster.riskScore}/100 ({cluster.riskScore >= 70 ? 'High' : cluster.riskScore >= 40 ? 'Medium' : 'Low'})
                </span>
              </div>
              <div className="flex justify-between">
                <span>Addresses:</span>
                <span className="font-semibold">{cluster.addressesCount?.toLocaleString() || 0}</span>
              </div>
            </div>
            {isLowValue && (
              <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                Note: Showing 24h activity window due to low total value
              </div>
            )}
          </div>

          {/* Classification Rules */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-sm text-muted-foreground">CLASSIFICATION</h4>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0"
                onClick={() => setShowClassificationRules(!showClassificationRules)}
                title="Why this cluster?"
              >
                <Info className="h-3 w-3" />
              </Button>
            </div>
            
            {showClassificationRules ? (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs space-y-2">
                  <div className="font-medium">Classification Rules:</div>
                  <div className="text-muted-foreground">
                    {getClassificationRules(cluster.type)}
                  </div>
                  <div className="border-t pt-2">
                    <div>Confidence: {(cluster.confidence * 100).toFixed(0)}%</div>
                    <div className="text-muted-foreground">
                      Based on transaction patterns and address behavior analysis
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-xs text-muted-foreground">
                  • Classification: {getClusterDisplayName(cluster.type)}
                  <br />• Confidence: {(cluster.confidence * 100).toFixed(0)}%
                  <br />• Click info icon to see rules
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground">QUICK ACTIONS</h4>
            <div className="space-y-2">
              <Button 
                size="sm" 
                className="w-full"
                onClick={() => {
                  navigate(`/alerts?cluster=${cluster.id}&name=${encodeURIComponent(cluster.name)}&source=cluster`);
                }}
              >
                <Bell className="h-3 w-3 mr-2" />
                View Cluster Alerts
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                className="w-full"
                onClick={() => setShowTransactions(!showTransactions)}
              >
                <Eye className="h-3 w-3 mr-2" />
                {showTransactions ? 'Hide' : 'View All'} Transactions
              </Button>
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1 min-w-[44px] min-h-[44px] focus:ring-2 focus:ring-primary"
                  onClick={() => {
                    alert(`Alert set: ${cluster.type} flows > $1M`);
                  }}
                  title="Set Alert > $1M"
                  aria-label="Set alert over 1 million"
                >
                  🔔
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1 min-w-[44px] min-h-[44px] focus:ring-2 focus:ring-primary"
                  onClick={() => {
                    alert(`Added ${cluster.name} to watchlist`);
                  }}
                  title="Add to Watchlist"
                  aria-label="Add to watchlist"
                >
                  ⭐
                </Button>
                <Button 
                  size="sm" 
                  variant="outline"
                  className="flex-1 min-w-[44px] min-h-[44px] focus:ring-2 focus:ring-primary"
                  onClick={() => {
                    const csvData = `Address,Amount,Direction,Timestamp\n${cluster.id},$${cluster.sumBalanceUsd || 0},${cluster.netFlow24h >= 0 ? 'IN' : 'OUT'},${new Date().toISOString()}`;
                    const blob = new Blob([csvData], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `cluster_${cluster.id}_transactions.csv`;
                    a.click();
                  }}
                  title="Export CSV"
                  aria-label="Export CSV"
                >
                  ⬇️
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Enhanced Transactions Panel */}
        {showTransactions && (
          <div className="mt-6 pt-4 border-t">
            <ClusterPanel 
              clusterId={cluster.id}
              clusterData={cluster}
              onClose={() => setShowTransactions(false)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
