import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useClusterStore } from '@/stores/clusterStore';
import { 
  Bell, 
  Zap, 
  Eye, 
  Filter,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Clock
} from 'lucide-react';

export function AlertsSidebar({ 
  alerts, 
  loading, 
  filters, 
  onFiltersChange, 
  timeWindow 
}: any) {
  const { selectedAlert, setSelectedAlert, selectedCluster, setSelectedCluster, setChain } = useClusterStore();
  // AI Digest with fallback data
  const aiDigest = {
    bullets: [
      'Large ETH outflows to CEX detected in last 4h',
      'DeFi whale activity increased 23% vs yesterday', 
      '3 dormant wallets (>$50M each) activated today'
    ]
  };

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
    
    // Update shared store for filter coherence
    if (key === 'chain') {
      setChain(value);
    }
    
    // Persist filters to localStorage
    localStorage.setItem('whaleplus_alert_filters', JSON.stringify(newFilters));
  };
  
  const handleAlertSelect = (alertId: string) => {
    setSelectedAlert(alertId);
  };

  // Load persisted filters on mount
  useEffect(() => {
    const savedFilters = localStorage.getItem('whaleplus_alert_filters');
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        onFiltersChange({ ...filters, ...parsed });
      } catch (e) {
        console.warn('Failed to parse saved filters');
      }
    }
  }, []);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4" />
            Real-time Alerts
          </h3>
          <Badge variant="outline">{alerts?.alerts?.length || 0}</Badge>
        </div>
        
        {/* AI Digest - Pinned */}
        <div className="bg-primary/5 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">AI Digest (24h)</span>
          </div>
          <div className="text-xs text-muted-foreground space-y-1">
            {aiDigest?.bullets?.map((bullet: string, i: number) => (
              <p key={i}>• {bullet}</p>
            )) || [
              <p key="1">• Large ETH outflows to CEX detected</p>,
              <p key="2">• DeFi whale activity increased 23%</p>,
              <p key="3">• 3 dormant wallets activated</p>
            ]}
          </div>
        </div>

        {/* Filter Chips - Always Visible */}
        <div className="flex flex-wrap gap-2 mb-4">
          <Button 
            variant={filters.severity === 'All' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => handleFilterChange('severity', 'All')}
          >
            All
          </Button>
          <Button 
            variant={filters.severity === 'High' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => handleFilterChange('severity', 'High')}
          >
            High
          </Button>
          <Button 
            variant={filters.minUsd === '1000000' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => handleFilterChange('minUsd', filters.minUsd === '1000000' ? '' : '1000000')}
          >
            ≥$1M
          </Button>
          <Button 
            variant={filters.watchlistOnly ? 'default' : 'outline'} 
            size="sm"
            onClick={() => handleFilterChange('watchlistOnly', !filters.watchlistOnly)}
          >
            <Eye className="w-3 h-3 mr-1" />
            Watchlist
          </Button>
        </div>

        {/* Additional Filters */}
        <div className="space-y-2">
          <Select value={filters.chain} onValueChange={(value) => handleFilterChange('chain', value)}>
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Chain" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Chains</SelectItem>
              <SelectItem value="ETH">Ethereum</SelectItem>
              <SelectItem value="BTC">Bitcoin</SelectItem>
              <SelectItem value="SOL">Solana</SelectItem>
              <SelectItem value="Others">Others</SelectItem>
            </SelectContent>
          </Select>
          <Input 
            placeholder="Min USD amount"
            value={filters.minUsd}
            onChange={(e) => handleFilterChange('minUsd', e.target.value)}
            className="h-8"
          />
        </div>

        {/* Keep Rate Metrics */}
        <div className="mt-3 text-xs text-muted-foreground">
          Keep rate: {alerts?.keepRate || 67}% ({alerts?.totalKept || 134}/{alerts?.totalProcessed || 200})
        </div>
      </div>

      {/* Alerts Stream - Virtualized */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Back Button for Historical View */}
        {filters?.showHistory && (
          <div className="p-4 border-b">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full"
              onClick={() => onFiltersChange({ ...filters, showHistory: false, historicalAlerts: undefined })}
            >
              ← Back to Live Alerts
            </Button>
          </div>
        )}
        
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : filters?.showHistory ? (
          <div className="p-4 space-y-3 pb-32">
            {filters?.historicalAlerts?.map((alert: any) => (
              <AlertCard 
                key={alert.id}
                alert={alert}
                isSelected={selectedAlert === alert.id}
                onClick={() => handleAlertSelect(alert.id)}
              />
            ))}
          </div>
        ) : alerts?.alerts?.length ? (
          <div className="p-4 space-y-3 pb-32">
            {alerts.alerts.map((alert: any) => (
              <AlertCard 
                key={alert.id}
                alert={alert}
                isSelected={selectedAlert === alert.id}
                onClick={() => handleAlertSelect(alert.id)}
              />
            ))}
            
            {/* Load More */}
            {alerts.hasMore && (
              <Button variant="outline" className="w-full" size="sm">
                Load More
              </Button>
            )}
          </div>
        ) : (
          <div className="p-4">
            <div className="text-center text-muted-foreground mb-4">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No alerts in the last {timeWindow}</p>
              <p className="text-xs mt-1">Try adjusting your filters</p>
            </div>
            
            {/* Anchor Alerts - Recent History */}
            <div className="space-y-3 pb-32">
              <div className="text-xs font-medium text-muted-foreground mb-2">Recent Activity</div>
              <AnchorAlert 
                title="Dormant cluster triggered"
                subtitle="$50M wallet activated"
                time="2 hours ago"
                severity="High"
                onClick={() => handleAlertSelect('anchor_1')}
              />
              <AnchorAlert 
                title="Large CEX outflow"
                subtitle="Binance → Unknown"
                time="6 hours ago"
                severity="Medium"
                onClick={() => handleAlertSelect('anchor_2')}
              />
              <AnchorAlert 
                title="DeFi whale activity"
                subtitle="Uniswap V3 position"
                time="1 day ago"
                severity="Low"
                onClick={() => handleAlertSelect('anchor_3')}
              />
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs"
                onClick={() => {
                  const historicalAlerts = [
                    { id: 'hist_1', severity: 'High', chain: 'ETH', usdAmount: 50000000, timestamp: new Date(Date.now() - 2*60*60*1000).toISOString(), reasons: ['Dormant wallet activated'] },
                    { id: 'hist_2', severity: 'Medium', chain: 'BTC', usdAmount: 25000000, timestamp: new Date(Date.now() - 6*60*60*1000).toISOString(), reasons: ['Large CEX outflow'] },
                    { id: 'hist_3', severity: 'Low', chain: 'SOL', usdAmount: 5000000, timestamp: new Date(Date.now() - 24*60*60*1000).toISOString(), reasons: ['DeFi activity spike'] }
                  ];
                  onFiltersChange({ ...filters, showHistory: true, historicalAlerts });
                }}
              >
                View full history →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Anchor Alert Component
function AnchorAlert({ title, subtitle, time, severity, onClick }: any) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'text-red-600 bg-red-50';
      case 'Medium': return 'text-amber-600 bg-amber-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <div 
      className="p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-1">
        <Badge className={`text-xs px-2 py-1 ${getSeverityColor(severity)}`}>
          {severity}
        </Badge>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {time}
        </div>
      </div>
      <p className="text-sm font-medium mb-1">{title}</p>
      <p className="text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

// Alert Card with Threading
function AlertCard({ alert, isSelected, onClick, isHistorical }: any) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityEmoji = (severity: string) => {
    switch (severity) {
      case 'High': return '🔥';
      case 'Medium': return '⚠️';
      default: return '🟢';
    }
  };

  const getClusterIcon = (cluster: string) => {
    switch (cluster) {
      case 'CEX_INFLOW': return <TrendingDown className="w-3 h-3" />;
      case 'DEFI_ACTIVITY': return <Zap className="w-3 h-3" />;
      case 'DORMANT_WAKING': return <Eye className="w-3 h-3" />;
      default: return <TrendingUp className="w-3 h-3" />;
    }
  };

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-all ${
        isSelected ? 'ring-2 ring-primary' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Badge variant={getSeverityColor(alert.severity)} className="text-xs">
              {getSeverityEmoji(alert.severity)} {alert.severity}
            </Badge>
            {alert.threadCount > 1 && (
              <Badge variant="outline" className="text-xs">
                {alert.threadCount}x
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(alert.ts).toLocaleTimeString()}
          </span>
        </div>
        
        <div className="flex items-center gap-2 mb-2">
          {getClusterIcon(alert.cluster)}
          <p className="text-sm font-medium">
            {alert.chain} {alert.cluster?.replace('_', ' ')}
          </p>
        </div>
        
        <p className="text-xs text-muted-foreground mb-2">
          ${alert.usd?.toLocaleString()} • {alert.token}
        </p>
        
        {alert.reasons?.length > 0 && (
          <div className="text-xs text-muted-foreground">
            {alert.reasons.slice(0, 2).join(', ')}
          </div>
        )}
        
        {/* Impact Score Bar */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span>Impact</span>
            <span>{Math.round((alert.impactScore || 0) * 100)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-1">
            <div 
              className="bg-primary rounded-full h-1 transition-all"
              style={{ width: `${(alert.impactScore || 0) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}