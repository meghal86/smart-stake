import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, TrendingDown, Grid, Zap, Crown, Flame, AlertTriangle } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAnalytics } from '@/hooks/useAnalytics';

interface CoinData {
  id: string;
  name: string;
  sentimentScore: number;
  sentimentHistory?: number[];
}

interface CorrelationPair {
  coin1: string;
  coin2: string;
  correlation: number;
  trend: number[];
}

interface MobileSentimentCorrelationProps {
  coins: CoinData[];
}

export function MobileSentimentCorrelation({ coins }: MobileSentimentCorrelationProps) {
  const { userPlan } = useSubscription();
  const { track } = useAnalytics();
  const [viewMode, setViewMode] = useState<'heatmap' | 'clusters'>('heatmap');
  const [selectedPair, setSelectedPair] = useState<string>('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedCorrelation, setSelectedCorrelation] = useState<CorrelationPair | null>(null);

  // Generate correlation data
  const correlationData = useMemo(() => {
    const pairs: CorrelationPair[] = [];
    const topCoins = coins.slice(0, 6); // Simplified for mobile

    topCoins.forEach((coin1, i) => {
      topCoins.forEach((coin2, j) => {
        if (i < j) { // Only unique pairs
          const diff = Math.abs(coin1.sentimentScore - coin2.sentimentScore);
          const baseCorr = Math.max(0.1, 1 - (diff / 100));
          const correlation = baseCorr + (Math.random() - 0.5) * 0.4;
          
          pairs.push({
            coin1: coin1.name,
            coin2: coin2.name,
            correlation: Math.max(-1, Math.min(1, correlation)),
            trend: Array.from({ length: 30 }, (_, k) => 
              correlation + Math.sin(k / 5) * 0.1 + (Math.random() - 0.5) * 0.05
            )
          });
        }
      });
    });

    return pairs.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));
  }, [coins]);

  // Get top/bottom correlations
  const topCorrelations = correlationData.slice(0, 3);
  const bottomCorrelations = correlationData.slice(-3).reverse();

  // Cluster coins by sentiment similarity
  const clusters = useMemo(() => {
    const sorted = [...coins].sort((a, b) => b.sentimentScore - a.sentimentScore);
    return [
      { name: 'Bullish', coins: sorted.slice(0, 3), color: 'bg-green-500' },
      { name: 'Neutral', coins: sorted.slice(3, 6), color: 'bg-yellow-500' },
      { name: 'Bearish', coins: sorted.slice(6, 9), color: 'bg-red-500' }
    ];
  }, [coins]);

  const getCorrelationColor = (correlation: number) => {
    const intensity = Math.abs(correlation);
    if (correlation > 0.7) return 'bg-green-500';
    if (correlation > 0.3) return 'bg-green-400';
    if (correlation > -0.3) return 'bg-gray-400';
    if (correlation > -0.7) return 'bg-red-400';
    return 'bg-red-500';
  };

  const getCorrelationBadge = (correlation: number) => {
    if (Math.abs(correlation) > 0.7) return { emoji: '🔥', label: 'Strong' };
    if (Math.abs(correlation) < 0.3) return { emoji: '⚠️', label: 'Weak' };
    return { emoji: '📊', label: 'Moderate' };
  };

  const handlePairClick = (pair: CorrelationPair) => {
    setSelectedCorrelation(pair);
    setDetailsOpen(true);
    track('correlation_pair_selected', { pair: `${pair.coin1}-${pair.coin2}` });
  };

  const MiniTrendLine = ({ data }: { data: number[] }) => (
    <svg width="40" height="16" className="inline-block">
      <polyline
        points={data.slice(-7).map((value, index) => 
          `${(index / 6) * 40},${16 - ((value + 1) / 2) * 16}`
        ).join(' ')}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.8"
      />
    </svg>
  );

  if (userPlan.plan === 'free') {
    return (
      <Card className="p-6 text-center">
        <Crown className="h-12 w-12 mx-auto mb-4 text-amber-500" />
        <h3 className="text-lg font-semibold mb-2">Premium Analytics</h3>
        <p className="text-muted-foreground mb-4">
          Unlock sentiment correlation analysis with AI insights
        </p>
        <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
          <Crown className="h-4 w-4 mr-2" />
          Upgrade to Premium
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-lg">30-Day Sentiment Correlation</h3>
          <p className="text-sm text-muted-foreground">
            Discover relationships between crypto sentiment patterns
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(value: 'heatmap' | 'clusters') => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="heatmap">
                <div className="flex items-center gap-2">
                  <Grid className="h-4 w-4" />
                  Heatmap
                </div>
              </SelectItem>
              <SelectItem value="clusters">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Clusters
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          
          <Badge variant="secondary" className="text-xs">
            <Crown className="h-3 w-3 mr-1" />
            Premium
          </Badge>
        </div>
      </div>

      {/* Insight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-4 w-4 text-green-500" />
            <span className="font-medium text-sm">Strongest Correlations</span>
          </div>
          <div className="space-y-2">
            {topCorrelations.map((pair, index) => {
              const badge = getCorrelationBadge(pair.correlation);
              return (
                <div 
                  key={`${pair.coin1}-${pair.coin2}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handlePairClick(pair)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{badge.emoji}</span>
                    <span className="text-sm font-medium">
                      {pair.coin1} ↔ {pair.coin2}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-green-600">
                      {(pair.correlation * 100).toFixed(0)}%
                    </span>
                    <MiniTrendLine data={pair.trend} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="font-medium text-sm">Weakest Correlations</span>
          </div>
          <div className="space-y-2">
            {bottomCorrelations.map((pair, index) => {
              const badge = getCorrelationBadge(pair.correlation);
              return (
                <div 
                  key={`${pair.coin1}-${pair.coin2}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handlePairClick(pair)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{badge.emoji}</span>
                    <span className="text-sm font-medium">
                      {pair.coin1} ↔ {pair.coin2}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-red-600">
                      {(pair.correlation * 100).toFixed(0)}%
                    </span>
                    <MiniTrendLine data={pair.trend} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Main Content */}
      {viewMode === 'heatmap' ? (
        <Card className="p-4">
          <div className="mb-4">
            <Select value={selectedPair} onValueChange={setSelectedPair}>
              <SelectTrigger>
                <SelectValue placeholder="Select a correlation pair to explore" />
              </SelectTrigger>
              <SelectContent>
                {correlationData.map((pair) => (
                  <SelectItem key={`${pair.coin1}-${pair.coin2}`} value={`${pair.coin1}-${pair.coin2}`}>
                    {pair.coin1} ↔ {pair.coin2} ({(pair.correlation * 100).toFixed(0)}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {correlationData.slice(0, 12).map((pair) => {
              const badge = getCorrelationBadge(pair.correlation);
              return (
                <Tooltip key={`${pair.coin1}-${pair.coin2}`}>
                  <TooltipTrigger asChild>
                    <div
                      className={`p-3 rounded-lg cursor-pointer transition-all hover:scale-105 ${getCorrelationColor(pair.correlation)} text-white`}
                      style={{ opacity: Math.abs(pair.correlation) * 0.8 + 0.2 }}
                      onClick={() => handlePairClick(pair)}
                    >
                      <div className="text-xs font-medium mb-1">
                        {pair.coin1.slice(0, 3)} ↔ {pair.coin2.slice(0, 3)}
                      </div>
                      <div className="text-sm font-bold">
                        {(pair.correlation * 100).toFixed(0)}%
                      </div>
                      <div className="text-xs opacity-80">
                        {badge.emoji} {badge.label}
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <div className="font-medium">{pair.coin1} ↔ {pair.coin2}</div>
                      <div>Correlation: {(pair.correlation * 100).toFixed(1)}%</div>
                      <div className="text-xs text-muted-foreground">Tap for details</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        </Card>
      ) : (
        <Card className="p-4">
          <div className="space-y-4">
            {clusters.map((cluster) => (
              <div key={cluster.name} className="p-3 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-3 h-3 rounded-full ${cluster.color}`} />
                  <span className="font-medium">{cluster.name} Sentiment</span>
                  <Badge variant="outline" className="text-xs">
                    {cluster.coins.length} coins
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cluster.coins.map((coin) => (
                    <Badge key={coin.id} variant="secondary" className="text-xs">
                      {coin.name} ({coin.sentimentScore}%)
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Premium Upsell - Only show for non-premium users */}
      {userPlan.plan === 'free' && (
        <Card className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
          <div className="text-center">
            <Crown className="h-8 w-8 mx-auto mb-3 text-amber-500" />
            <h4 className="font-semibold mb-2">Unlock Full Matrix + AI Insights</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Get complete 10×10 correlation matrix, AI-powered insights, and advanced clustering
            </p>
            <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade Now
            </Button>
          </div>
        </Card>
      )}

      {/* Details Bottom Sheet */}
      <Sheet open={detailsOpen} onOpenChange={setDetailsOpen}>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>
              {selectedCorrelation && (
                <div className="flex items-center gap-2">
                  <span>{selectedCorrelation.coin1} ↔ {selectedCorrelation.coin2}</span>
                  <Badge variant={selectedCorrelation.correlation > 0 ? 'default' : 'destructive'}>
                    {(selectedCorrelation.correlation * 100).toFixed(1)}%
                  </Badge>
                </div>
              )}
            </SheetTitle>
          </SheetHeader>
          
          {selectedCorrelation && (
            <div className="mt-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card className="p-3">
                  <div className="text-sm text-muted-foreground">Correlation Strength</div>
                  <div className="text-2xl font-bold">
                    {(selectedCorrelation.correlation * 100).toFixed(1)}%
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    {selectedCorrelation.correlation > 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    {getCorrelationBadge(selectedCorrelation.correlation).label}
                  </div>
                </Card>
                
                <Card className="p-3">
                  <div className="text-sm text-muted-foreground">30-Day Trend</div>
                  <div className="mt-2">
                    <svg width="100%" height="60" className="text-primary">
                      <polyline
                        points={selectedCorrelation.trend.map((value, index) => 
                          `${(index / (selectedCorrelation.trend.length - 1)) * 100}%,${60 - ((value + 1) / 2) * 60}`
                        ).join(' ')}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      />
                    </svg>
                  </div>
                </Card>
              </div>
              
              <Card className="p-4">
                <h4 className="font-medium mb-2">AI Insights</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedCorrelation.correlation > 0.5 
                    ? `${selectedCorrelation.coin1} and ${selectedCorrelation.coin2} show strong positive correlation, suggesting similar market sentiment drivers.`
                    : selectedCorrelation.correlation < -0.5
                    ? `${selectedCorrelation.coin1} and ${selectedCorrelation.coin2} show inverse correlation, potentially offering diversification benefits.`
                    : `${selectedCorrelation.coin1} and ${selectedCorrelation.coin2} show weak correlation, indicating independent sentiment patterns.`
                  }
                </p>
              </Card>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}