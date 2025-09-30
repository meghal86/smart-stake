import { TrendingUp, TrendingDown, Eye, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface PortfolioSummaryProps {
  totalValue: number;
  avgPnL: number;
  addressCount: number;
}

export function PortfolioSummary({ totalValue, avgPnL, addressCount }: PortfolioSummaryProps) {
  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Portfolio Value</p>
            <p className="text-2xl font-bold">{formatValue(totalValue)}</p>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-12 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full" />
              <span className="text-xs text-muted-foreground">24h trend</span>
            </div>
          </div>
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <BarChart3 className="h-5 w-5 text-blue-500" />
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Avg P&L</p>
            <div className="flex items-center gap-1">
              <p className={`text-2xl font-bold ${avgPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {avgPnL >= 0 ? '+' : ''}{avgPnL.toFixed(1)}%
              </p>
              {avgPnL >= 0 ? 
                <TrendingUp className="h-4 w-4 text-green-500" /> : 
                <TrendingDown className="h-4 w-4 text-red-500" />
              }
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Monitored Addresses</p>
            <p className="text-2xl font-bold">{addressCount}</p>
          </div>
          <div className="p-2 bg-[#14B8A6]/20 rounded-lg">
            <Eye className="h-5 w-5 text-[#14B8A6]" />
          </div>
        </div>
      </Card>
    </div>
  );
}