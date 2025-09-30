import { useState, useEffect } from 'react';
import { Search, Grid, List, Star, TrendingUp, TrendingDown, Bell, Info, ChevronUp, ChevronDown, Heart, Share2, Download, X, BarChart, Newspaper, Volume2, Zap, StickyNote, Maximize2, Fish, ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

interface CoinSentiment {
  id: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume: number;
  sentimentScore: number;
  sentiment: 'positive' | 'neutral' | 'negative';
  fearGreedIndex: number;
  sentimentTrend: 'up' | 'down' | 'stable';
  sentimentHistory: number[];
}

export default function MultiCoinSentiment() {
  const [coins, setCoins] = useState<CoinSentiment[]>([]);
  const [filteredCoins, setFilteredCoins] = useState<CoinSentiment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortBy, setSortBy] = useState<'sentiment' | 'price' | 'change'>('sentiment');
  const [filterSentiment, setFilterSentiment] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [alerts, setAlerts] = useState<Record<string, { enabled: boolean; threshold: number }>>({});
  const [selectedCoin, setSelectedCoin] = useState<CoinSentiment | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [userNotes, setUserNotes] = useState<Record<string, string>>({});
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeAlerts, setActiveAlerts] = useState<Record<string, number>>({}); // coin -> alert count
  const [newNews, setNewNews] = useState<Record<string, boolean>>({}); // coin -> has new news
  const coinsPerPage = 20;
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchMultiCoinSentiment();
    const interval = setInterval(fetchMultiCoinSentiment, 300000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let filtered = coins.filter(coin => 
      coin.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filterSentiment !== 'all') {
      filtered = filtered.filter(coin => coin.sentiment === filterSentiment);
    }

    if (showFavoritesOnly) {
      filtered = filtered.filter(coin => favorites.includes(coin.id));
    }

    // Sort coins - favorites first, then by selected criteria
    filtered.sort((a, b) => {
      // Favorites first
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      
      // Then by selected sort criteria
      switch (sortBy) {
        case 'sentiment':
          return b.sentimentScore - a.sentimentScore;
        case 'price':
          return b.price - a.price;
        case 'change':
          return b.change24h - a.change24h;
        default:
          return 0;
      }
    });

    setFilteredCoins(filtered);
  }, [coins, searchTerm, filterSentiment, sortBy, favorites, showFavoritesOnly]);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isMobile && viewMode !== 'grid') {
      setViewMode('grid');
    }
  }, [isMobile, viewMode]);

  const fetchMultiCoinSentiment = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('multi-coin-sentiment', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('No data received from API');
      }
      
      console.log('API Response:', data);
      
      // Handle both response formats
      const coinData = data.success ? data.data : (data.data || data);
      if (!coinData || !Array.isArray(coinData)) {
        throw new Error('Invalid data format received');
      }
      
      setCoins(coinData);
      setError(null);
    } catch (error: any) {
      console.error('Failed to fetch multi-coin sentiment:', error);
      setError(`Failed to load sentiment data: ${error.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string, score: number) => {
    if (score >= 70) return 'bg-gradient-to-r from-green-400 to-green-600';
    if (score >= 60) return 'bg-gradient-to-r from-green-300 to-green-500';
    if (score <= 30) return 'bg-gradient-to-r from-red-400 to-red-600';
    if (score <= 40) return 'bg-gradient-to-r from-red-300 to-red-500';
    return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
  };

  const getSentimentBorderColor = (sentiment: string, score: number) => {
    if (score >= 60) return 'border-l-4 border-green-500';
    if (score <= 40) return 'border-l-4 border-red-500';
    return 'border-l-4 border-yellow-500';
  };

  const getSentimentBadge = (sentiment: string) => {
    const colors = {
      positive: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      negative: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      neutral: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
    };
    return colors[sentiment as keyof typeof colors];
  };

  const formatNumber = (num: number, decimals = 0) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(decimals)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(decimals)}M`;
    return `$${num.toLocaleString()}`;
  };

  const toggleWatchlist = (coinId: string) => {
    setWatchlist(prev => 
      prev.includes(coinId) 
        ? prev.filter(id => id !== coinId)
        : [...prev, coinId]
    );
  };

  const toggleFavorite = (coinId: string) => {
    setFavorites(prev => 
      prev.includes(coinId) 
        ? prev.filter(id => id !== coinId)
        : [...prev, coinId]
    );
  };

  const toggleAlert = (coinId: string) => {
    setAlerts(prev => ({
      ...prev,
      [coinId]: {
        enabled: !prev[coinId]?.enabled,
        threshold: prev[coinId]?.threshold || 10
      }
    }));
  };

  const updateAlertThreshold = (coinId: string, threshold: number) => {
    setAlerts(prev => ({
      ...prev,
      [coinId]: {
        ...prev[coinId],
        threshold
      }
    }));
  };

  const Sparkline = ({ data, trend }: { data: number[], trend: 'up' | 'down' | 'stable' }) => {
    const color = trend === 'up' ? '#10b981' : trend === 'down' ? '#ef4444' : '#6b7280';
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    return (
      <div className="flex items-center gap-1">
        <svg width="40" height="16" className="inline-block">
          <polyline
            points={data.map((value, index) => 
              `${(index / (data.length - 1)) * 40},${16 - ((value - min) / range) * 16}`
            ).join(' ')}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
          />
        </svg>
        {trend === 'up' && <ChevronUp className="h-3 w-3 text-green-500" />}
        {trend === 'down' && <ChevronDown className="h-3 w-3 text-red-500" />}
      </div>
    );
  };

  const CoinDetailModal = ({ coin }: { coin: CoinSentiment }) => {
    const [alertType, setAlertType] = useState<'price' | 'sentiment' | 'volume' | 'breaking'>('price');
    const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');
    const [alertValue, setAlertValue] = useState(10);
    const [userNote, setUserNote] = useState(userNotes[coin.id] || '');
    const [whaleData, setWhaleData] = useState({ transactions: 3, volume: '$2.4M', lastActivity: '2h ago' });
    
    // Enhanced AI Analysis with predictions
    const getEnhancedAiAnalysis = () => {
      let analysis = `${coin.name} shows ${coin.sentiment} sentiment (${coin.sentimentScore}/100) with ${coin.change24h >= 0 ? 'positive' : 'negative'} 24h movement of ${coin.change24h.toFixed(1)}%.`;
      
      // Add predictive statements
      if (coin.sentimentScore > 70 && coin.change24h > 5) {
        analysis += ` Strong bullish momentum suggests potential continued upward movement if market conditions remain favorable.`;
      } else if (coin.sentimentScore < 30 && coin.change24h < -5) {
        analysis += ` Oversold conditions may present a buying opportunity if broader market sentiment improves.`;
      } else if (coin.sentimentTrend === 'up' && coin.sentimentScore > 60) {
        analysis += ` Rising sentiment trend indicates ${coin.name} may outperform if current momentum continues.`;
      } else if (coin.sentimentTrend === 'down' && coin.sentimentScore < 40) {
        analysis += ` Declining sentiment suggests caution, though contrarian opportunities may emerge.`;
      }
      
      return analysis;
    };
    
    // Mock historical data
    const priceHistory = [coin.price * 0.95, coin.price * 0.98, coin.price * 1.02, coin.price];
    
    const [realNews, setRealNews] = useState<any[]>([]);
    const [newsLoading, setNewsLoading] = useState(true);
    const [selectedNews, setSelectedNews] = useState<any>(null);
    const [showNewsModal, setShowNewsModal] = useState(false);
    
    // Fetch real news data with caching
    useEffect(() => {
      const fetchNews = async () => {
        // Check cache first (10 minutes)
        const cacheKey = `crypto-news-${coin.id}`;
        const cached = localStorage.getItem(cacheKey);
        const cacheTime = localStorage.getItem(`${cacheKey}-time`);
        
        if (cached && cacheTime) {
          const age = Date.now() - parseInt(cacheTime);
          if (age < 10 * 60 * 1000) { // 10 minutes cache
            setRealNews(JSON.parse(cached));
            setNewsLoading(false);
            return;
          }
        }
        
        try {
          const { data, error } = await supabase.functions.invoke('crypto-news', {
            body: { coinSymbol: coin.id.toUpperCase() }
          });
          if (error) throw error;
          
          const newsData = data.news || [];
          setRealNews(newsData);
          
          // Cache the result
          localStorage.setItem(cacheKey, JSON.stringify(newsData));
          localStorage.setItem(`${cacheKey}-time`, Date.now().toString());
        } catch (error) {
          console.error('Failed to fetch news:', error);
          setRealNews([]);
        } finally {
          setNewsLoading(false);
        }
      };
      
      fetchNews();
    }, [coin.id]);
    
    const shareInsights = () => {
      const text = `${coin.name} Sentiment Analysis:\n• Score: ${coin.sentimentScore}/100\n• 24h Change: ${coin.change24h.toFixed(1)}%\n• Price: $${coin.price.toLocaleString()}\n• Trend: ${coin.sentimentTrend}\n\nAnalysis: ${getEnhancedAiAnalysis()}`;
      navigator.clipboard.writeText(text);
    };
    
    const downloadReport = () => {
      const data = {
        coin: coin.name,
        timestamp: new Date().toISOString(),
        metrics: {
          price: coin.price,
          change24h: coin.change24h,
          sentimentScore: coin.sentimentScore,
          sentiment: coin.sentiment,
          trend: coin.sentimentTrend
        },
        analysis: getEnhancedAiAnalysis()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${coin.name.toLowerCase()}-sentiment-report.json`;
      a.click();
    };
    
    const HistoricalChart = ({ data, label, isPrice = false }: { data: number[], label: string, isPrice?: boolean }) => {
      const max = Math.max(...data);
      const min = Math.min(...data);
      const range = max - min || 1;
      const formatValue = (value: number) => {
        if (isPrice) {
          return value >= 1000 ? `$${(value/1000).toFixed(1)}k` : `$${value.toFixed(2)}`;
        }
        return value.toFixed(0);
      };
      
      return (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground">{label}</Label>
            <div className="flex gap-4 text-xs">
              <span className="text-green-500">High: {formatValue(max)}</span>
              <span className="text-red-500">Low: {formatValue(min)}</span>
            </div>
          </div>
          <div className="h-32 bg-muted/30 rounded p-4 relative">
            {/* Y-axis labels */}
            <div className="absolute left-1 top-2 text-xs text-muted-foreground">
              {formatValue(max)}
            </div>
            <div className="absolute left-1 bottom-2 text-xs text-muted-foreground">
              {formatValue(min)}
            </div>
            
            <svg width="100%" height="100" className="overflow-visible">
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e5e7eb" strokeWidth="0.5" opacity="0.3"/>
                </pattern>
              </defs>
              <rect width="100%" height="100" fill="url(#grid)" />
              
              {/* Chart line */}
              <polyline
                points={data.map((value, index) => 
                  `${(index / (data.length - 1)) * 100}%,${100 - ((value - min) / range) * 80}`
                ).join(' ')}
                fill="none"
                stroke={isPrice ? "#10b981" : "#3b82f6"}
                strokeWidth="2"
              />
              
              {/* Data points with values */}
              {data.map((value, index) => {
                const x = (index / (data.length - 1)) * 100;
                const y = 100 - ((value - min) / range) * 80;
                return (
                  <g key={index}>
                    <circle
                      cx={`${x}%`}
                      cy={y}
                      r="4"
                      fill={isPrice ? "#10b981" : "#3b82f6"}
                      className="hover:r-6 transition-all cursor-pointer"
                    />
                    <text
                      x={`${x}%`}
                      y={y - 8}
                      textAnchor="middle"
                      className="text-xs fill-current text-foreground font-medium"
                    >
                      {formatValue(value)}
                    </text>
                  </g>
                );
              })}
              
              {/* X-axis labels */}
              {data.map((_, index) => (
                <text
                  key={index}
                  x={`${(index / (data.length - 1)) * 100}%`}
                  y="115"
                  textAnchor="middle"
                  className="text-xs fill-current text-muted-foreground"
                >
                  Day {index + 1}
                </text>
              ))}
            </svg>
            
            {/* Trend indicator */}
            <div className="absolute top-2 right-2">
              {data[data.length - 1] > data[0] ? (
                <div className="flex items-center gap-1 text-green-500 text-xs">
                  <TrendingUp className="h-3 w-3" />
                  +{(((data[data.length - 1] - data[0]) / data[0]) * 100).toFixed(1)}%
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-500 text-xs">
                  <TrendingDown className="h-3 w-3" />
                  {(((data[data.length - 1] - data[0]) / data[0]) * 100).toFixed(1)}%
                </div>
              )}
            </div>
          </div>
        </div>
      );
    };
    
    const saveNote = () => {
      setUserNotes(prev => ({ ...prev, [coin.id]: userNote }));
    };
    
    return (
      <DialogContent className={`${isFullscreen ? 'max-w-[95vw] max-h-[95vh]' : 'max-w-2xl max-h-[90vh]'} overflow-y-auto`}>
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {coin.name}
              <Badge className={getSentimentBadge(coin.sentiment)}>
                {coin.sentiment.toUpperCase()}
              </Badge>
              {activeAlerts[coin.id] > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {activeAlerts[coin.id]} alerts
                </Badge>
              )}
            </div>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
                <Maximize2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={shareInsights}>
                <Share2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={downloadReport}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="charts">Charts</TabsTrigger>
            <TabsTrigger value="news" className="relative">
              News
              {newNews[coin.id] && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
              )}
            </TabsTrigger>
            <TabsTrigger value="whales">
              <Fish className="h-3 w-3 mr-1" />
              Whales
            </TabsTrigger>
            <TabsTrigger value="alerts" className="relative">
              Alerts
              {activeAlerts[coin.id] > 0 && (
                <Badge variant="destructive" className="absolute -top-2 -right-2 text-xs h-4 w-4 p-0 flex items-center justify-center">
                  {activeAlerts[coin.id]}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="notes">
              <StickyNote className="h-3 w-3 mr-1" />
              Notes
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Price</Label>
                <p className="font-bold">${coin.price.toLocaleString()}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">24h Change</Label>
                <p className={`font-bold ${coin.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {coin.change24h.toFixed(2)}%
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Market Cap</Label>
                <p className="font-bold">{formatNumber(coin.marketCap, 1)}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Sentiment Score</Label>
                <p className="font-bold">{coin.sentimentScore}/100</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <Label className="text-xs text-muted-foreground">Enhanced AI Analysis</Label>
              <p className="text-sm mt-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border">
                {getEnhancedAiAnalysis()}
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => toggleFavorite(coin.id)}
                className="flex-1"
              >
                <Heart className={`h-4 w-4 mr-1 ${favorites.includes(coin.id) ? 'fill-red-500 text-red-500' : ''}`} />
                {favorites.includes(coin.id) ? 'Remove Favorite' : 'Add Favorite'}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => toggleWatchlist(coin.id)}
                className="flex-1"
              >
                <Star className={`h-4 w-4 mr-1 ${watchlist.includes(coin.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                Watchlist
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="charts" className="space-y-4">
            <div className="grid grid-cols-1 gap-6">
              <HistoricalChart data={priceHistory} label="7-Day Price History" isPrice={true} />
              <HistoricalChart data={coin.sentimentHistory} label="7-Day Sentiment History" isPrice={false} />
            </div>
          </TabsContent>
          
          <TabsContent value="news" className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Newspaper className="h-4 w-4" />
                <Label>Latest News & Updates</Label>
              </div>
              {newsLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className="p-4 border rounded-lg animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : realNews.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <Newspaper className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No recent news available for {coin.name}</p>
                </div>
              ) : (
                realNews.map((item) => (
                <div 
                  key={item.id} 
                  className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-all hover:shadow-md"
                  onClick={() => {
                    setSelectedNews(item);
                    setShowNewsModal(true);
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-medium hover:text-primary transition-colors">
                        {item.title}
                      </h4>
                      {item.badge && (
                        <Badge 
                          variant={item.badge === 'Hot' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <Badge 
                      className={`text-xs ${
                        item.sentiment === 'positive' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : item.sentiment === 'negative'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}
                    >
                      {item.sentimentScore}/100
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    {item.excerpt}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{item.source}</span>
                      <span>•</span>
                      <span>{item.time}</span>
                    </div>
                    <Button variant="ghost" size="sm" className="h-6 text-xs">
                      Read More →
                    </Button>
                  </div>
                </div>
              )))}
            </div>
            
            {/* News Detail Modal */}
            {selectedNews && (
              <Dialog open={showNewsModal} onOpenChange={setShowNewsModal}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{selectedNews.title}</span>
                        {selectedNews.badge && (
                          <Badge 
                            variant={selectedNews.badge === 'Hot' ? 'destructive' : 'secondary'}
                            className="text-xs"
                          >
                            {selectedNews.badge}
                          </Badge>
                        )}
                      </div>
                      <Badge 
                        className={`text-xs ${
                          selectedNews.sentiment === 'positive' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : selectedNews.sentiment === 'negative'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        Sentiment: {selectedNews.sentimentScore}/100
                      </Badge>
                    </DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="font-medium">{selectedNews.source}</span>
                      <span>•</span>
                      <span>{selectedNews.time}</span>
                      <span>•</span>
                      <span className="capitalize">{selectedNews.sentiment} sentiment</span>
                    </div>
                    
                    <Separator />
                    
                    <div>
                      <h3 className="font-semibold mb-2">Article Summary</h3>
                      <p className="text-sm leading-relaxed">{selectedNews.excerpt}</p>
                    </div>
                    
                    <div>
                      <h3 className="font-semibold mb-2">Key Points</h3>
                      <ul className="space-y-1">
                        {selectedNews.keyPoints.map((point: string, index: number) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <h4 className="font-medium text-sm mb-1">Market Impact Analysis</h4>
                      <p className="text-xs text-muted-foreground">
                        This news has a {selectedNews.sentiment} sentiment impact on {coin.name} with a confidence score of {selectedNews.sentimentScore}/100. 
                        {selectedNews.sentiment === 'positive' 
                          ? 'This could drive short-term price momentum and increased trading volume.'
                          : selectedNews.sentiment === 'negative'
                          ? 'This may create selling pressure and increased volatility.'
                          : 'This is likely to have minimal immediate price impact.'}
                      </p>
                    </div>
                    
                    <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-700 dark:text-green-300 mb-2">
                        📰 <strong>Live News Article</strong>
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        Real-time crypto news from {selectedNews.source} with automated sentiment analysis.
                      </p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          const text = `${selectedNews.title}\n\n${selectedNews.excerpt}\n\nSentiment: ${selectedNews.sentimentScore}/100\nSource: ${selectedNews.source}`;
                          navigator.clipboard.writeText(text);
                        }}
                        className="flex-1"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Copy Summary
                      </Button>
                      <Button 
                        onClick={() => window.open(selectedNews.url, '_blank')}
                        className="flex-1"
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Read Full Article
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>
          
          <TabsContent value="whales" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Fish className="h-4 w-4" />
                <Label>Whale Activity Integration</Label>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 border rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-500">{whaleData.transactions}</p>
                  <p className="text-xs text-muted-foreground">Large Transactions</p>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-500">{whaleData.volume}</p>
                  <p className="text-xs text-muted-foreground">Whale Volume</p>
                </div>
                <div className="p-3 border rounded-lg text-center">
                  <p className="text-sm font-bold">{whaleData.lastActivity}</p>
                  <p className="text-xs text-muted-foreground">Last Activity</p>
                </div>
              </div>
              
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-sm">
                  Recent whale activity shows {whaleData.transactions} large transactions totaling {whaleData.volume}. 
                  This correlates with the current {coin.sentiment} sentiment trend.
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="alerts" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <Label>Advanced Alert Settings</Label>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Alert Type</Label>
                  <Select value={alertType} onValueChange={(value: any) => setAlertType(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="price">💰 Price Movement</SelectItem>
                      <SelectItem value="sentiment">😊 Sentiment Change</SelectItem>
                      <SelectItem value="volume">📊 Volume Spike</SelectItem>
                      <SelectItem value="breaking">⚡ Breaking News</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs">Condition</Label>
                  <Select value={alertCondition} onValueChange={(value: any) => setAlertCondition(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="above">Above</SelectItem>
                      <SelectItem value="below">Below</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label className="text-xs">
                  {alertType === 'price' && 'Price Change (%)'}
                  {alertType === 'sentiment' && 'Sentiment Score'}
                  {alertType === 'volume' && 'Volume Increase (%)'}
                  {alertType === 'breaking' && 'News Impact Score'}
                </Label>
                <Input 
                  type="number" 
                  value={alertValue}
                  onChange={(e) => setAlertValue(Number(e.target.value))}
                  placeholder={alertType === 'price' ? '10' : alertType === 'sentiment' ? '70' : alertType === 'volume' ? '200' : '8'}
                />
              </div>
              
              <Button 
                onClick={() => {
                  toggleAlert(coin.id);
                  updateAlertThreshold(coin.id, alertValue);
                  setActiveAlerts(prev => ({ ...prev, [coin.id]: (prev[coin.id] || 0) + 1 }));
                }}
                className="w-full"
              >
                <Bell className="h-4 w-4 mr-2" />
                {alerts[coin.id]?.enabled ? 'Update Alert' : 'Enable Alert'}
              </Button>
              
              {alerts[coin.id]?.enabled && (
                <div className="space-y-2">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <p className="text-sm font-medium">Active Alert:</p>
                    <p className="text-sm">
                      {coin.name} {alertType} {alertCondition} {alertValue}
                      {alertType === 'price' && '%'}
                      {alertType === 'volume' && '%'}
                      {alertType === 'breaking' && '/10'}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Volume2 className="h-3 w-3 mr-1" />
                      Volume Alert
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Zap className="h-3 w-3 mr-1" />
                      Breaking News
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="notes" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <StickyNote className="h-4 w-4" />
                <Label>Personal Trading Notes</Label>
              </div>
              
              <Textarea
                placeholder={`Add your personal notes about ${coin.name}...\n\nStrategy ideas, key levels, research notes, etc.`}
                value={userNote}
                onChange={(e) => setUserNote(e.target.value)}
                className="min-h-[120px]"
              />
              
              <div className="flex gap-2">
                <Button onClick={saveNote} className="flex-1">
                  <StickyNote className="h-4 w-4 mr-2" />
                  Save Notes
                </Button>
                <Button variant="outline" onClick={() => setUserNote('')} className="flex-1">
                  Clear
                </Button>
              </div>
              
              {userNotes[coin.id] && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    ✓ Notes saved for {coin.name}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    );
  };

  if (isLoading) {
    return (
      <div className="flex-1 bg-gradient-to-br from-background to-background/80 pb-20">
        <div className="p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 bg-gradient-to-br from-background to-background/80 pb-20">
        <div className="p-4 flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <p className="text-lg font-semibold text-red-500 mb-2">API Failed</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gradient-to-br from-background to-background/80 pb-20">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold">Multi-Coin Sentiment</h1>
            <p className="text-sm text-muted-foreground">Real-time sentiment analysis for top 20 cryptocurrencies</p>
          </div>
          {!isMobile && (
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <div className="relative w-full sm:flex-1 sm:min-w-[220px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search coins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sentiment">Sort by Sentiment</SelectItem>
              <SelectItem value="price">Sort by Price</SelectItem>
              <SelectItem value="change">Sort by 24h Change</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterSentiment} onValueChange={(value) => setFilterSentiment(value as any)}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sentiment</SelectItem>
              <SelectItem value="positive">Positive Only</SelectItem>
              <SelectItem value="neutral">Neutral Only</SelectItem>
              <SelectItem value="negative">Negative Only</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant={showFavoritesOnly ? "default" : "outline"}
            size="sm"
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className="flex items-center gap-1 justify-center sm:w-auto w-full"
          >
            <Heart className={`h-4 w-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            Favorites
          </Button>
        </div>

        {/* Grid View */}
        {viewMode === 'grid' && (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {filteredCoins.slice((page - 1) * coinsPerPage, page * coinsPerPage).map((coin) => {
              // Mock sentiment history and trend
              const mockHistory = [coin.sentimentScore - 5, coin.sentimentScore - 2, coin.sentimentScore + 1, coin.sentimentScore];
              const mockTrend = coin.change24h > 2 ? 'up' : coin.change24h < -2 ? 'down' : 'stable';
              const coinWithTrend = { ...coin, sentimentHistory: mockHistory, sentimentTrend: mockTrend };
              
              return (
                <Card key={coin.id} className={`p-4 hover:shadow-lg transition-all cursor-pointer ${getSentimentBorderColor(coin.sentiment, coin.sentimentScore)}`}>
                  <div className="flex items-start justify-between mb-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <h3 className="font-semibold text-sm hover:text-primary cursor-pointer flex items-center gap-1">
                          {coin.name}
                          <Info className="h-3 w-3 opacity-50" />
                        </h3>
                      </DialogTrigger>
                      <CoinDetailModal coin={coinWithTrend} />
                    </Dialog>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleFavorite(coin.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Heart className={`h-3 w-3 ${favorites.includes(coin.id) ? 'fill-red-500 text-red-500' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleWatchlist(coin.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Star className={`h-3 w-3 ${watchlist.includes(coin.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleAlert(coin.id)}
                        className="h-6 w-6 p-0"
                      >
                        <Bell className={`h-3 w-3 ${alerts[coin.id]?.enabled ? 'text-blue-500' : ''}`} />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">${coin.price.toLocaleString()}</span>
                      <div className="flex items-center gap-1">
                        {coin.change24h >= 0 ? 
                          <TrendingUp className="h-3 w-3 text-green-500" /> : 
                          <TrendingDown className="h-3 w-3 text-red-500" />
                        }
                        <span className={`text-xs ${coin.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {coin.change24h.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <span>Sentiment</span>
                        <div className="flex items-center gap-1">
                          <span>{coin.sentimentScore}/100</span>
                          <Sparkline data={mockHistory} trend={mockTrend} />
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full ${getSentimentColor(coin.sentiment, coin.sentimentScore)}`}
                          style={{ width: `${coin.sentimentScore}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <Badge className={getSentimentBadge(coin.sentiment)}>
                      {coin.sentiment.toUpperCase()}
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
        
        {/* Pagination */}
        {filteredCoins.length > coinsPerPage && (
          <div className="flex justify-center gap-2 mt-6">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm">
              Page {page} of {Math.ceil(filteredCoins.length / coinsPerPage)}
            </span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => p + 1)}
              disabled={page >= Math.ceil(filteredCoins.length / coinsPerPage)}
            >
              Next
            </Button>
          </div>
        )}

        {/* Table View */}
        {viewMode === 'table' && (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3">Coin</th>
                    <th className="text-right p-3">Price</th>
                    <th className="text-right p-3">24h Change</th>
                    <th className="text-right p-3">Market Cap</th>
                    <th className="text-center p-3">Sentiment</th>
                    <th className="text-center p-3">Score</th>
                    <th className="text-center p-3">Watch</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoins.map((coin) => (
                    <tr key={coin.id} className="border-t hover:bg-muted/30">
                      <td className="p-3 font-medium">{coin.name}</td>
                      <td className="p-3 text-right">${coin.price.toLocaleString()}</td>
                      <td className={`p-3 text-right ${coin.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {coin.change24h.toFixed(2)}%
                      </td>
                      <td className="p-3 text-right">{formatNumber(coin.marketCap, 1)}</td>
                      <td className="p-3 text-center">
                        <Badge className={getSentimentBadge(coin.sentiment)}>
                          {coin.sentiment}
                        </Badge>
                      </td>
                      <td className="p-3 text-center font-mono">{coin.sentimentScore}</td>
                      <td className="p-3 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleWatchlist(coin.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Star className={`h-3 w-3 ${watchlist.includes(coin.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
