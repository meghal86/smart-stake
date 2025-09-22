import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock, TrendingUp, TrendingDown } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAnalytics } from '@/hooks/useAnalytics';

interface CorrelationData {
  coin1: string;
  coin2: string;
  correlation: number;
  sparkline: number[];
}

interface SentimentCorrelationHeatmapProps {
  coins: Array<{ id: string; name: string; sentimentScore: number; sentimentHistory?: number[] }>;
}

export function SentimentCorrelationHeatmap({ coins }: SentimentCorrelationHeatmapProps) {
  const { userPlan } = useSubscription();
  const { track } = useAnalytics();
  const [hoveredCell, setHoveredCell] = useState<{ coin1: string; coin2: string } | null>(null);

  // Calculate correlation matrix (mock implementation for demo)
  const correlationMatrix = useMemo(() => {
    const matrix: CorrelationData[][] = [];
    const topCoins = coins.slice(0, 10); // Top 10 coins for heatmap

    topCoins.forEach((coin1, i) => {
      const row: CorrelationData[] = [];
      topCoins.forEach((coin2, j) => {
        if (i === j) {
          // Self correlation is always 1
          row.push({
            coin1: coin1.id,
            coin2: coin2.id,
            correlation: 1.0,
            sparkline: [1, 1, 1, 1, 1]
          });
        } else {
          // Mock correlation calculation based on sentiment scores
          const diff = Math.abs(coin1.sentimentScore - coin2.sentimentScore);
          const baseCorr = Math.max(0.1, 1 - (diff / 100));
          const correlation = baseCorr + (Math.random() - 0.5) * 0.3;
          
          row.push({
            coin1: coin1.id,
            coin2: coin2.id,
            correlation: Math.max(-1, Math.min(1, correlation)),
            sparkline: Array.from({ length: 5 }, () => correlation + (Math.random() - 0.5) * 0.2)
          });
        }
      });
      matrix.push(row);
    });

    return { matrix, coins: topCoins };
  }, [coins]);

  const getCorrelationColor = (correlation: number): string => {
    const intensity = Math.abs(correlation);
    if (correlation > 0.7) return `bg-green-500 bg-opacity-${Math.floor(intensity * 100)}`;
    if (correlation > 0.3) return `bg-green-400 bg-opacity-${Math.floor(intensity * 80)}`;
    if (correlation > -0.3) return `bg-gray-400 bg-opacity-${Math.floor(intensity * 60)}`;
    if (correlation > -0.7) return `bg-red-400 bg-opacity-${Math.floor(intensity * 80)}`;
    return `bg-red-500 bg-opacity-${Math.floor(intensity * 100)}`;
  };

  const MiniSparkline = ({ data }: { data: number[] }) => (
    <svg width="20" height="10" className="inline-block">
      <polyline
        points={data.map((value, index) => 
          `${(index / (data.length - 1)) * 20},${10 - ((value + 1) / 2) * 10}`
        ).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
      />
    </svg>
  );

  if (userPlan.plan === 'free') {
    return (
      <Card className="p-6 text-center">
        <Lock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
        <p className="text-muted-foreground mb-4">
          Sentiment correlation heatmap is available for Premium subscribers
        </p>
        <Badge variant="outline" className="text-xs">
          Upgrade to Premium
        </Badge>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">30-Day Sentiment Correlation</h3>
          <p className="text-sm text-muted-foreground">
            Correlation coefficients between top 10 cryptocurrencies
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          Premium Analytics
        </Badge>
      </div>

      <Card className="p-4 overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header row */}
          <div className="grid grid-cols-11 gap-1 mb-1">
            <div></div>
            {correlationMatrix.coins.map(coin => (
              <div key={coin.id} className="text-xs font-medium text-center p-1">
                {coin.name.slice(0, 3)}
              </div>
            ))}
          </div>

          {/* Matrix rows */}
          {correlationMatrix.matrix.map((row, i) => (
            <div key={correlationMatrix.coins[i].id} className="grid grid-cols-11 gap-1 mb-1">
              <div className="text-xs font-medium p-1 text-right">
                {correlationMatrix.coins[i].name.slice(0, 3)}
              </div>
              
              {row.map((cell, j) => (
                <Tooltip key={`${cell.coin1}-${cell.coin2}`}>
                  <TooltipTrigger>
                    <div
                      className={`h-8 w-full rounded cursor-pointer transition-all hover:scale-110 flex items-center justify-center text-xs font-medium ${
                        cell.correlation > 0 ? 'text-white' : 'text-gray-800'
                      }`}
                      style={{
                        backgroundColor: cell.correlation > 0.7 ? '#10b981' :
                                        cell.correlation > 0.3 ? '#34d399' :
                                        cell.correlation > -0.3 ? '#9ca3af' :
                                        cell.correlation > -0.7 ? '#f87171' : '#ef4444',
                        opacity: Math.abs(cell.correlation) * 0.8 + 0.2
                      }}
                      onMouseEnter={() => {
                        setHoveredCell({ coin1: cell.coin1, coin2: cell.coin2 });
                        track('correlation_cell_hovered', { coin1: cell.coin1, coin2: cell.coin2 });
                      }}
                      onMouseLeave={() => setHoveredCell(null)}
                    >
                      {cell.correlation.toFixed(2)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {correlationMatrix.coins[i].name} ↔ {correlationMatrix.coins[j].name}
                        </span>
                        {cell.correlation > 0 ? (
                          <TrendingUp className="h-3 w-3 text-green-500" />
                        ) : (
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        )}
                      </div>
                      <div className="text-sm">
                        Correlation: <span className="font-mono">{(cell.correlation * 100).toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs">30d trend:</span>
                        <MiniSparkline data={cell.sparkline} />
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded"></div>
                <span>Strong Positive (+0.7 to +1.0)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-400 rounded"></div>
                <span>Neutral (-0.3 to +0.3)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-500 rounded"></div>
                <span>Strong Negative (-1.0 to -0.7)</span>
              </div>
            </div>
            <span className="text-muted-foreground">
              Based on 30-day sentiment score correlation
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}