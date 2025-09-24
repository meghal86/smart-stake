import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  Bell, 
  Zap, 
  Eye, 
  Filter,
  AlertTriangle,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

export function AlertsSidebar({ 
  alerts, 
  loading, 
  filters, 
  onFiltersChange, 
  selectedAlert, 
  onAlertSelect, 
  timeWindow 
}: any) {
  // AI Digest with fallback data
  const aiDigest = {
    bullets: [
      'Large ETH outflows to CEX detected in last 4h',
      'DeFi whale activity increased 23% vs yesterday', 
      '3 dormant wallets (>$50M each) activated today'
    ]
  };

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
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
        {alerts?.keepRate && (
          <div className="mt-3 text-xs text-muted-foreground">
            Keep rate: {alerts.keepRate}% ({alerts.totalKept}/{alerts.totalProcessed})
          </div>
        )}
      </div>

      {/* Alerts Stream - Virtualized */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : alerts?.alerts?.length ? (
          <div className="p-4 space-y-3">
            {alerts.alerts.map((alert: any) => (
              <AlertCard 
                key={alert.id}
                alert={alert}
                isSelected={selectedAlert === alert.id}
                onClick={() => onAlertSelect(alert.id)}
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
          <div className="p-4 text-center text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No alerts in the last {timeWindow}</p>
            <p className="text-xs mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Alert Card with Threading
function AlertCard({ alert, isSelected, onClick }: any) {
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High': return 'destructive';
      case 'Medium': return 'secondary';
      default: return 'outline';
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
              {alert.severity}
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