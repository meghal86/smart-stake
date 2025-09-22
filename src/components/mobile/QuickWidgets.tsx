import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Fish, DollarSign } from 'lucide-react';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';

interface QuickWidgetsProps {
  marketMood?: { mood: number; label: string; color: string };
  topWhales?: Array<{ address: string; balance: number; change: number }>;
  portfolioPnL?: { value: number; change: number; percentage: number };
}

export function QuickWidgets({ marketMood, topWhales = [], portfolioPnL }: QuickWidgetsProps) {
  const { isEnabled } = useFeatureFlags();

  if (!isEnabled('mobile_widgets')) {
    return null;
  }

  const formatCurrency = (value: number) => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  return (
    <div className="lg:hidden p-4 space-y-3">
      {/* Market Mood Widget */}
      {marketMood && (
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Market Mood</span>
            </div>
            <Badge variant="secondary" className={`text-xs ${marketMood.color}`}>
              {marketMood.label} ({marketMood.mood}%)
            </Badge>
          </div>
        </Card>
      )}

      {/* Top 3 Whales Widget */}
      {topWhales.length > 0 && (
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Fish className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">Top Whales</span>
          </div>
          <div className="space-y-1">
            {topWhales.slice(0, 3).map((whale, index) => (
              <div key={whale.address} className="flex items-center justify-between text-xs">
                <span className="font-mono">
                  #{index + 1} {whale.address.slice(0, 6)}...{whale.address.slice(-4)}
                </span>
                <div className="flex items-center gap-1">
                  <span>{formatCurrency(whale.balance)}</span>
                  <span className={whale.change >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {whale.change >= 0 ? '+' : ''}{whale.change.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Portfolio P&L Widget */}
      {portfolioPnL && (
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Portfolio P&L</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold">{formatCurrency(portfolioPnL.value)}</div>
              <div className={`text-xs flex items-center gap-1 ${portfolioPnL.change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {portfolioPnL.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {portfolioPnL.change >= 0 ? '+' : ''}{portfolioPnL.change.toFixed(1)}% ({portfolioPnL.percentage.toFixed(1)}%)
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}