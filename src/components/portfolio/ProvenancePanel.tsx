import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, Activity, Zap, Clock, ExternalLink } from 'lucide-react';

interface ProvenancePanelProps {
  etherscanStatus: {
    status: 'healthy' | 'degraded' | 'down';
    lastUpdate: Date;
    latency: number;
  };
  coingeckoStatus: {
    status: 'healthy' | 'degraded' | 'down';
    lastUpdate: Date;
    cacheAge: number;
  };
  simVersion: string;
  totalHoldings: number;
  realHoldings: number;
}

export function ProvenancePanel({ 
  etherscanStatus, 
  coingeckoStatus, 
  simVersion, 
  totalHoldings,
  realHoldings 
}: ProvenancePanelProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600 bg-green-100 dark:bg-green-900';
      case 'degraded': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900';
      case 'down': return 'text-red-600 bg-red-100 dark:bg-red-900';
      default: return 'text-meta bg-gray-100 dark:bg-gray-900';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'degraded': return Activity;
      case 'down': return Activity;
      default: return Clock;
    }
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50/50 to-green-50/50 dark:from-blue-950/50 dark:to-green-950/50 border-l-4 border-l-primary">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-sm flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Data Provenance & Lineage
        </h4>
        <Badge variant="outline" className="text-xs">
          Institutional Grade
        </Badge>
      </div>

      <div className="space-y-3">
        {/* Real Blockchain Data */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-background/60">
          <div className="flex items-center gap-3">
            <div className={`p-1 rounded-full ${getStatusColor(etherscanStatus.status)}`}>
              {(() => {
                const IconComponent = getStatusIcon(etherscanStatus.status);
                return <IconComponent className="h-3 w-3" />;
              })()}
            </div>
            <div>
              <p className="font-medium text-sm">Real Blockchain Data</p>
              <p className="text-xs text-muted-foreground">
                ETH balances via Etherscan API
              </p>
            </div>
          </div>
          <div className="text-right">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-help">
                  <span>Updated {formatTimeAgo(etherscanStatus.lastUpdate)}</span>
                  <ExternalLink className="h-3 w-3" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p>Real ETH balances from Ethereum mainnet</p>
                  <p>Latency: {etherscanStatus.latency}ms</p>
                  <p>Status: {etherscanStatus.status}</p>
                  <p>Provider: Etherscan.io</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Live Market Prices */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-background/60">
          <div className="flex items-center gap-3">
            <div className={`p-1 rounded-full ${getStatusColor(coingeckoStatus.status)}`}>
              {(() => {
                const IconComponent = getStatusIcon(coingeckoStatus.status);
                return <IconComponent className="h-3 w-3" />;
              })()}
            </div>
            <div>
              <p className="font-medium text-sm">Live Market Prices</p>
              <p className="text-xs text-muted-foreground">
                Real-time pricing via CoinGecko
              </p>
            </div>
          </div>
          <div className="text-right">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-help">
                  <span>Cache: {coingeckoStatus.cacheAge}s</span>
                  <Activity className="h-3 w-3" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p>Live market prices with 60s cache</p>
                  <p>Last update: {formatTimeAgo(coingeckoStatus.lastUpdate)}</p>
                  <p>Status: {coingeckoStatus.status}</p>
                  <p>Provider: CoinGecko Free API</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Simulated Balances */}
        <div className="flex items-center justify-between p-2 rounded-lg bg-background/60">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-full text-orange-600 bg-orange-100 dark:bg-orange-900">
              <Zap className="h-3 w-3" />
            </div>
            <div>
              <p className="font-medium text-sm">Simulated Balances</p>
              <p className="text-xs text-muted-foreground">
                Deterministic v{simVersion} (HMAC-seeded)
              </p>
            </div>
          </div>
          <div className="text-right">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground cursor-help">
                  <span>{totalHoldings - realHoldings} tokens</span>
                  <Zap className="h-3 w-3" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1">
                  <p>Token quantities: Deterministic simulation</p>
                  <p>USD values: Live market prices</p>
                  <p>Algorithm: HMAC-SHA256 seeded</p>
                  <p>Version: {simVersion}</p>
                  <p className="pt-1 border-t text-primary">
                    Connect wallet for real token balances →
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>

      {/* Reality Roadmap CTA */}
      <div className="mt-4 pt-3 border-t">
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium text-green-600">{realHoldings}</span> real • 
            <span className="font-medium text-orange-600"> {totalHoldings - realHoldings}</span> simulated
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-xs text-primary hover:underline font-medium">
                Connect wallet for real tokens →
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Coming soon: Real ERC-20 token balances</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </Card>
  );
}