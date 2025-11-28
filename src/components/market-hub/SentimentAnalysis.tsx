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
import { useWindowSize } from '@/hooks/use-mobile';

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

export function DesktopSentiment() {
  return <MultiCoinSentimentComponent />;
}

export function MobileSentiment() {
  return <MultiCoinSentimentComponent />;
}

function MultiCoinSentimentComponent() {
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
  const [activeAlerts, setActiveAlerts] = useState<Record<string, number>>({});
  const [newNews, setNewNews] = useState<Record<string, boolean>>({});
  const coinsPerPage = 20;
  const { width } = useWindowSize();
  const isMobile = width < 1024;

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
    } catch (error: unknown) {
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

  if (isLoading) {
    return (
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
    );
  }

  if (error) {
    return (
      <div className="p-4 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-semibold text-red-500 mb-2">API Failed</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">Multi-Coin Sentiment</h1>
          <p className="text-sm text-muted-foreground">Real-time sentiment analysis for top cryptocurrencies</p>
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
        
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as unknown)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sentiment">Sort by Sentiment</SelectItem>
            <SelectItem value="price">Sort by Price</SelectItem>
            <SelectItem value="change">Sort by 24h Change</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={filterSentiment} onValueChange={(value) => setFilterSentiment(value as unknown)}>
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
                  <h3 className="font-semibold text-sm hover:text-primary cursor-pointer flex items-center gap-1">
                    {coin.name}
                    <Info className="h-3 w-3 opacity-50" />
                  </h3>
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
  );
}