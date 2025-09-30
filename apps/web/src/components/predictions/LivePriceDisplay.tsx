import { usePrice } from '@/hooks/usePrices';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface LivePriceDisplayProps {
  asset: string;
  showChange?: boolean;
  className?: string;
}

export function LivePriceDisplay({ asset, showChange = true, className = "" }: LivePriceDisplayProps) {
  const { price, isLoading, error, provider, quality } = usePrice(asset, 30000);

  if (isLoading) {
    return (
      <div className={`animate-pulse bg-muted rounded px-2 py-1 ${className}`}>
        <div className="h-4 w-16 bg-muted-foreground/20 rounded"></div>
      </div>
    );
  }

  if (error || !price) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="outline" className="border-red-300 text-red-700">
              <AlertCircle className="h-3 w-3 mr-1" />
              Price Error
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            Failed to fetch live price data
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  const formatPrice = (price: number) => {
    if (price >= 1000) {
      return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    }
    return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  const getQualityBadge = () => {
    if (quality === 'stale') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="border-yellow-300 text-yellow-700 text-xs ml-1">
                Stale
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              Using last known price (providers temporarily unavailable)
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }
    
    if (quality === 'degraded') {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="border-orange-300 text-orange-700 text-xs ml-1">
                Backup
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              Using backup price provider (CoinMarketCap)
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return null;
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="font-medium text-lg">
        {formatPrice(price)}
      </span>
      
      {getQualityBadge()}
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>
            <Badge variant="secondary" className="text-xs cursor-help">
              {provider === 'coingecko' ? 'CG' : provider === 'cmc' ? 'CMC' : 'Cache'}
            </Badge>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <div className="space-y-1">
              <div className="font-medium">
                {provider === 'coingecko' ? 'CoinGecko (Primary)' : 
                 provider === 'cmc' ? 'CoinMarketCap (Backup)' : 'Cached Data'}
              </div>
              <div className="text-xs text-muted-foreground">
                {provider === 'coingecko' && 'Real-time price from CoinGecko API'}
                {provider === 'cmc' && 'Backup price from CoinMarketCap API'}
                {provider === 'stale' && 'Using cached price data'}
              </div>
              {quality === 'ok' && <div className="text-xs text-green-600">✓ Fresh data</div>}
              {quality === 'degraded' && <div className="text-xs text-yellow-600">⚠ Using backup provider</div>}
              {quality === 'stale' && <div className="text-xs text-red-600">⚠ Stale data (providers unavailable)</div>}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}