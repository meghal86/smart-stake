import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, Zap } from 'lucide-react';

interface TokenSourceChipProps {
  symbol: string;
  source: 'real' | 'simulated';
  isLive?: boolean;
}

export function TokenSourceChip({ symbol, source, isLive = true }: TokenSourceChipProps) {
  if (source === 'real') {
    return (
      <Tooltip>
        <TooltipTrigger>
          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Real
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <div className="space-y-2 max-w-xs">
            <p className="font-medium">Real {symbol} Balance</p>
            <div className="text-xs space-y-1">
              <p>• Quantity: Etherscan API (mainnet)</p>
              <p>• Price: CoinGecko live feed</p>
              <p>• Value = qty × live price</p>
              <p>• Update: Every 30s</p>
            </div>
            <div className="pt-1 border-t text-xs text-green-600">
              ✓ Verified on-chain data
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 text-xs">
          <Zap className="h-3 w-3 mr-1" />
          Sim V2
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <div className="space-y-2 max-w-xs">
          <p className="font-medium">Simulated {symbol} Balance</p>
          <div className="text-xs space-y-1">
            <p>• Quantity: HMAC-seeded deterministic</p>
            <p>• Price: CoinGecko live feed</p>
            <p>• Value = qty × live price</p>
            <p>• Algorithm: Reproducible per address</p>
          </div>
          <div className="pt-1 border-t text-xs text-primary">
            → Connect wallet for real {symbol} balance
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}