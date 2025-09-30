import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, Wifi, WifiOff } from 'lucide-react';

interface DataSourceBadgeProps {
  isLive: boolean;
  simVersion: string;
  lastUpdated?: Date;
}

export function DataSourceBadge({ isLive, simVersion, lastUpdated }: DataSourceBadgeProps) {
  return (
    <div className="flex items-center gap-2">
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            {isLive ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
            Simulated balances • Live prices
            <Info className="h-3 w-3" />
          </Badge>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">Data Sources:</p>
            <ul className="text-xs space-y-1">
              <li>• ETH: Real balances (Etherscan)</li>
              <li>• Tokens: Simulated (v{simVersion})</li>
              <li>• Prices: Live (CoinGecko)</li>
            </ul>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground">
                Updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
            <div className="pt-2 border-t">
              <button className="text-xs text-primary hover:underline">
                Connect wallet for real data (coming soon)
              </button>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}