import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, Database } from 'lucide-react';
import { usePriceHealth } from '@/hooks/usePrices';

export function PriceProviderStatus() {
  const { health, isLoading } = usePriceHealth();

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
      </Card>
    );
  }

  if (!health) return null;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="h-4 w-4" />
        <span className="font-medium text-sm">Price Providers</span>
      </div>
      
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span>CoinGecko</span>
            <Badge variant={health.coingecko?.breaker === 'closed' ? 'default' : 'destructive'} className="text-xs">
              {health.coingecko?.breaker === 'closed' ? 'Active' : 'Down'}
            </Badge>
          </div>
          <div className="text-muted-foreground">
            {health.coingecko?.minuteRemaining || 0}/10 requests
          </div>
        </div>
        
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span>CoinMarketCap</span>
            <Badge variant={health.cmc?.breaker === 'closed' ? 'secondary' : 'destructive'} className="text-xs">
              {health.cmc?.breaker === 'closed' ? 'Backup' : 'Down'}
            </Badge>
          </div>
          <div className="text-muted-foreground">
            {health.cmc?.dayRemaining || 0}/333 daily
          </div>
        </div>
      </div>
      
      <div className="mt-3 pt-2 border-t flex items-center gap-2 text-xs text-muted-foreground">
        <Database className="h-3 w-3" />
        <span>Cache: {health.cache?.memoryKeys || 0} keys</span>
      </div>
    </Card>
  );
}