import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Info, BarChart3, DollarSign, Settings, History, Sparkles, Grid } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SentimentData {
  fearGreedIndex: number;
  btcDominance: number;
  ethDominance: number;
  ethPrice: number;
  btcPrice: number;
  marketCap: number;
  totalVolume: number;
  btcChange24h: number;
  ethChange24h: number;
  sentiment: 'extreme-fear' | 'fear' | 'neutral' | 'greed' | 'extreme-greed';
}

export default function MarketSentiment() {
  const { user } = useAuth();
  const [sentimentData, setSentimentData] = useState<SentimentData>({
    fearGreedIndex: 42,
    btcDominance: 54.2,
    ethDominance: 18.5,
    ethPrice: 2340,
    btcPrice: 43250,
    marketCap: 1.7e12,
    totalVolume: 45e9,
    btcChange24h: 2.5,
    ethChange24h: -1.2,
    sentiment: 'fear'
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [aiInsight, setAiInsight] = useState('');
  const [alerts, setAlerts] = useState({ fearGreed: 25, btcChange: 5, ethChange: 5 });


  useEffect(() => {
    const fetchLiveSentiment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-sentiment');
        if (error) throw error;
        
        const sentiment = data.data;
        const getSentimentType = (value: number) => {
          if (value <= 20) return 'extreme-fear';
          if (value <= 40) return 'fear';
          if (value <= 60) return 'neutral';
          if (value <= 80) return 'greed';
          return 'extreme-greed';
        };
        
        setSentimentData({
          fearGreedIndex: sentiment.fearGreedIndex.value,
          btcDominance: sentiment.market.btcDominance,
          ethDominance: sentiment.market.ethDominance,
          ethPrice: sentiment.prices.ethereum.price,
          btcPrice: sentiment.prices.bitcoin.price,
          marketCap: sentiment.market.totalMarketCap,
          totalVolume: sentiment.market.totalVolume,
          btcChange24h: sentiment.prices.bitcoin.change24h,
          ethChange24h: sentiment.prices.ethereum.change24h,
          sentiment: getSentimentType(sentiment.fearGreedIndex.value)
        });
        
        // Generate AI insight for premium users
        if (user?.plan === 'premium') {
          generateAiInsight(sentiment);
        }
      } catch (error) {
        console.error('Failed to fetch live sentiment:', error);
      }
    };

    fetchLiveSentiment();
    const interval = setInterval(fetchLiveSentiment, 60000);
    return () => clearInterval(interval);
  }, []);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'extreme-greed': return 'text-green-500';
      case 'greed': return 'text-green-400';
      case 'neutral': return 'text-yellow-500';
      case 'fear': return 'text-orange-500';
      case 'extreme-fear': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getSentimentSummary = () => {
    const fearGreed = sentimentData.fearGreedIndex || 0;
    const btcChange = sentimentData.btcChange24h || 0;
    const btcDom = sentimentData.btcDominance || 0;
    const btcTrend = btcChange > 0 ? 'positive' : 'negative';
    const dominanceTrend = btcDom > 50 ? 'rising' : 'declining';
    
    return `Market sentiment is ${sentimentData.sentiment.replace('-', ' ')}, BTC trend is ${btcTrend} (${btcChange.toFixed(1)}%), and dominance is ${dominanceTrend} at ${btcDom.toFixed(1)}%.`;
  };

  const formatNumber = (num: number, decimals = 0) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(decimals)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(decimals)}M`;
    return `$${num.toLocaleString()}`;
  };

  const generateAiInsight = (data: any) => {
    const fearGreed = data.fearGreedIndex.value;
    const btcChange = data.prices.bitcoin.change24h;
    const btcDom = data.market.btcDominance;
    
    let insight = '';
    if (fearGreed < 25 && btcChange < -5) {
      insight = 'Extreme fear combined with significant price decline suggests potential buying opportunity for long-term investors.';
    } else if (fearGreed > 75 && btcChange > 5) {
      insight = 'High greed levels with strong price momentum indicate potential profit-taking zone approaching.';
    } else if (btcDom > 55 && btcChange > 0) {
      insight = 'Rising Bitcoin dominance with positive price action suggests altcoin rotation may be slowing.';
    } else {
      insight = 'Current market conditions show balanced sentiment with moderate volatility expected.';
    }
    setAiInsight(insight);
  };

  const Sparkline = ({ data, color }: { data: number[], color: string }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min;
    
    return (
      <svg width="60" height="20" className="inline-block ml-2">
        <polyline
          points={data.map((value, index) => 
            `${(index / (data.length - 1)) * 60},${20 - ((value - min) / range) * 20}`
          ).join(' ')}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
        />
      </svg>
    );
  };

  // Mock sparkline data (in real app, fetch from API)
  const btcSparkline = [42000, 43500, 42800, 44200, 43250];
  const ethSparkline = [2200, 2350, 2280, 2400, 2340];
  const fearSparkline = [35, 42, 38, 45, 42];

  return (
    <div className="flex-1 bg-gradient-to-br from-background to-background/80 pb-20 overflow-x-hidden">
      <div className="p-2 sm:p-4 space-y-3 sm:space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-xl">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Market Sentiment</h1>
              <p className="text-sm text-muted-foreground">Real-time market psychology</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => window.location.href = '/?tab=basic-sentiment'}>
              <Grid className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowHistory(!showHistory)}>
              <History className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowSettings(!showSettings)}>
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <Card className="p-4 mb-4">
            <h3 className="font-semibold mb-3">Alert Settings</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Fear & Greed Threshold</Label>
                <Input 
                  type="number" 
                  value={alerts.fearGreed} 
                  onChange={(e) => setAlerts({...alerts, fearGreed: Number(e.target.value)})}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">BTC Change Alert (%)</Label>
                <Input 
                  type="number" 
                  value={alerts.btcChange} 
                  onChange={(e) => setAlerts({...alerts, btcChange: Number(e.target.value)})}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">ETH Change Alert (%)</Label>
                <Input 
                  type="number" 
                  value={alerts.ethChange} 
                  onChange={(e) => setAlerts({...alerts, ethChange: Number(e.target.value)})}
                  className="h-8"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Fear & Greed Index */}
        <Card className="p-4 sm:p-6">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <h3 className="font-semibold">Fear & Greed Index</h3>
              <div className="hidden sm:block">
                <Sparkline data={fearSparkline} color="#8b5cf6" />
              </div>
            </div>
            <div className="relative w-32 h-32 mx-auto mb-4">
              <Progress value={sentimentData.fearGreedIndex} className="w-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{sentimentData.fearGreedIndex}</span>
              </div>
            </div>
            <Badge className={getSentimentColor(sentimentData.sentiment)}>
              {sentimentData.sentiment.replace('-', ' ').toUpperCase()}
            </Badge>
          </div>
        </Card>

        {/* Market Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-sm text-muted-foreground">BTC Price</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Current Bitcoin price from CoinGecko</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-base sm:text-lg font-bold">${sentimentData.btcPrice.toLocaleString()}</p>
                  <div className="hidden sm:block">
                    <Sparkline data={btcSparkline} color="#f97316" />
                  </div>
                </div>
                <p className={`text-xs ${(sentimentData.btcChange24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {(sentimentData.btcChange24h || 0) >= 0 ? '+' : ''}{(sentimentData.btcChange24h || 0).toFixed(2)}% 24h
                </p>
              </div>
              {(sentimentData.btcChange24h || 0) >= 0 ? 
                <TrendingUp className="h-5 w-5 text-green-500" /> : 
                <TrendingDown className="h-5 w-5 text-red-500" />
              }
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-sm text-muted-foreground">ETH Price</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Current Ethereum price from CoinGecko</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-base sm:text-lg font-bold">${sentimentData.ethPrice.toLocaleString()}</p>
                  <div className="hidden sm:block">
                    <Sparkline data={ethSparkline} color="#3b82f6" />
                  </div>
                </div>
                <p className={`text-xs ${(sentimentData.ethChange24h || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {(sentimentData.ethChange24h || 0) >= 0 ? '+' : ''}{(sentimentData.ethChange24h || 0).toFixed(2)}% 24h
                </p>
              </div>
              {(sentimentData.ethChange24h || 0) >= 0 ? 
                <TrendingUp className="h-5 w-5 text-green-500" /> : 
                <TrendingDown className="h-5 w-5 text-red-500" />
              }
            </div>
          </Card>
        </div>

        {/* Global Market Data */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-sm text-muted-foreground">Market Cap</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total cryptocurrency market capitalization</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-base sm:text-lg font-bold">{formatNumber(sentimentData.marketCap, 2)}</p>
              </div>
              <BarChart3 className="h-5 w-5 text-blue-500" />
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1">
                  <p className="text-sm text-muted-foreground">24h Volume</p>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total 24-hour trading volume across all cryptocurrencies</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <p className="text-base sm:text-lg font-bold">{formatNumber(sentimentData.totalVolume, 1)}</p>
              </div>
              <DollarSign className="h-5 w-5 text-purple-500" />
            </div>
          </Card>
        </div>

        {/* Market Dominance */}
        <Card className="p-2 sm:p-4">
          <div className="flex items-center gap-1 mb-3">
            <h3 className="font-semibold">Market Dominance</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Percentage of total crypto market cap held by each asset</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Bitcoin (BTC)</span>
                <span className="font-medium">{(sentimentData.btcDominance || 0).toFixed(1)}%</span>
              </div>
              <Progress value={sentimentData.btcDominance || 0} className="h-2 [&>div]:bg-orange-500" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">Ethereum (ETH)</span>
                <span className="font-medium">{(sentimentData.ethDominance || 0).toFixed(1)}%</span>
              </div>
              <Progress value={sentimentData.ethDominance || 0} className="h-2 [&>div]:bg-blue-500" />
            </div>
          </div>
        </Card>

        {/* Sentiment Summary */}
        <Card className="p-2 sm:p-4">
          <h3 className="font-semibold mb-3">Market Summary</h3>
          <p className="text-sm text-muted-foreground mb-4">{getSentimentSummary()}</p>
          
          {/* AI Insight for Premium Users */}
          {user?.plan === 'premium' && aiInsight && (
            <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-300">AI Market Insight</span>
              </div>
              <p className="text-sm text-purple-600 dark:text-purple-400">{aiInsight}</p>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <Activity className="h-4 w-4 text-blue-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Live Data Active</p>
                <p className="text-xs text-muted-foreground">Market data updates every minute from multiple sources</p>
              </div>
            </div>
            {sentimentData.fearGreedIndex <= alerts.fearGreed && (
              <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Fear Alert Triggered</p>
                  <p className="text-xs text-muted-foreground">Fear & Greed Index below {alerts.fearGreed} - potential opportunity</p>
                </div>
              </div>
            )}
            {Math.abs(sentimentData.btcChange24h || 0) >= alerts.btcChange && (
              <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">BTC Movement Alert</p>
                  <p className="text-xs text-muted-foreground">Bitcoin moved {(sentimentData.btcChange24h || 0).toFixed(1)}% in 24h</p>
                </div>
              </div>
            )}
            {Math.abs(sentimentData.ethChange24h || 0) >= alerts.ethChange && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">ETH Movement Alert</p>
                  <p className="text-xs text-muted-foreground">Ethereum moved {(sentimentData.ethChange24h || 0).toFixed(1)}% in 24h</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}