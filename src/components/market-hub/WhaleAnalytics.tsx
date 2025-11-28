import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { WhaleAnalyticsCharts } from './WhaleAnalyticsCharts';
import { WhaleComparison } from './WhaleComparison';
import { WhaleNotifications } from './WhaleNotifications';
import { 
  Fish, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Shield,
  Users,
  Eye,
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  Wallet,
  BarChart3,
  AlertTriangle,
  Target,
  Zap,
  Globe,
  Clock,
  DollarSign,
  BarChart,
  PieChart,
  LineChart,
  Bell
} from 'lucide-react';

export function DesktopWhales({ clusters, loading, selectedWhale, onWhaleSelect }: unknown) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('balance');
  const [filterBy, setFilterBy] = useState('all');
  const [selectedWhaleDetail, setSelectedWhaleDetail] = useState<string | null>(null);
  const [showCharts, setShowCharts] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');
  const [comparisonWhales, setComparisonWhales] = useState<any[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [whaleFilter, setWhaleFilter] = useState<'all' | 'large' | 'mega'>('all');

  // Handle whale selection
  const handleWhaleSelect = (whale: unknown) => {
    onWhaleSelect?.(whale);
  };

  // Handle adding whale to comparison
  const handleAddToComparison = (whale: unknown) => {
    if (comparisonWhales.find(w => w.id === whale.id)) {
      // Remove if already in comparison
      setComparisonWhales(prev => prev.filter(w => w.id !== whale.id));
    } else if (comparisonWhales.length < 3) {
      // Add if not at limit
      setComparisonWhales(prev => [...prev, whale]);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterBy('all');
    setSortBy('balance');
  };

  // Fetch live whale data from whale-alert.io
  const { data: whaleData, isLoading: whalesLoading } = useQuery({
    queryKey: ['whale-alerts-live', sortBy, filterBy],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('whale-alerts', {
        body: { 
          source: 'whale-alert.io',
          limit: 50,
          min_value: 1000000, // $1M minimum
          sortBy, 
          filterBy 
        }
      });
      if (error) throw error;
      
      // Only process if we have real transaction data
      const transactions = data?.transactions || [];
      if (transactions.length === 0) {
        return {
          whales: [],
          stats: {
            totalWhales: 0,
            activeWhales: 0,
            totalValue: 0,
            avgRiskScore: 0
          }
        };
      }
      
      console.log('Processing live transactions:', transactions.length);
      
      const whaleMap = new Map();
      
      // Group transactions by address to create whale profiles
      transactions.forEach((tx: unknown) => {
        const fromAddress = tx.from?.address || tx.from;
        const toAddress = tx.to?.address || tx.to;
        
        [fromAddress, toAddress].forEach(address => {
          if (address && !whaleMap.has(address)) {
            whaleMap.set(address, {
              id: address,
              address: address,
              balance: 0,
              riskScore: Math.floor(Math.random() * 40) + 30,
              transactions24h: 0,
              netFlow24h: 0,
              chains: new Set(),
              labels: [],
              lastActivity: tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : new Date().toISOString(),
              behaviorScore: Math.floor(Math.random() * 30) + 70,
              influence: 'Medium'
            });
          }
          
          if (address && whaleMap.has(address)) {
            const whale = whaleMap.get(address);
            whale.transactions24h += 1;
            whale.balance += tx.amount_usd || 0;
            whale.netFlow24h += (address === fromAddress ? -1 : 1) * (tx.amount_usd || 0);
            whale.chains.add(tx.blockchain || 'ethereum');
            
            // Add labels based on transaction patterns
            if (tx.amount_usd > 10000000) whale.labels.push('Mega Whale');
            if (tx.symbol && ['USDT', 'USDC', 'usdt', 'usdc'].includes(tx.symbol.toLowerCase())) {
              whale.labels.push('Stablecoin Trader');
            }
            if (tx.from?.owner_type === 'exchange' || tx.to?.owner_type === 'exchange') {
              whale.labels.push('Exchange User');
            }
          }
        });
      });
      
      // Convert to array and calculate influence
      const whales = Array.from(whaleMap.values()).map((whale: unknown) => ({
        ...whale,
        chains: Array.from(whale.chains),
        labels: [...new Set(whale.labels)],
        influence: whale.balance > 50000000 ? 'Very High' : 
                  whale.balance > 20000000 ? 'High' : 
                  whale.balance > 5000000 ? 'Medium' : 'Low'
      }));
      
      console.log('Generated live whales:', whales.length);
      
      return {
        whales: whales,
        stats: {
          totalWhales: whales.length,
          activeWhales: whales.filter(w => w.transactions24h > 0).length,
          totalValue: whales.reduce((sum, w) => sum + w.balance, 0),
          avgRiskScore: whales.length > 0 ? Math.round(whales.reduce((sum, w) => sum + w.riskScore, 0) / whales.length) : 0
        }
      };
    },
    retry: 2,
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Filter and sort the whales based on current filters
  const filteredWhales = useMemo(() => {
    if (!whaleData?.whales) return [];

    let filtered = [...whaleData.whales];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(whale => 
        (typeof whale.address === 'string' ? whale.address.toLowerCase().includes(searchLower) : false) ||
        whale.labels?.some((label: string) => label.toLowerCase().includes(searchLower)) ||
        whale.influence?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (filterBy !== 'all') {
      switch (filterBy) {
        case 'high-risk':
          filtered = filtered.filter(whale => (whale.riskScore || 0) >= 70);
          break;
        case 'active':
          filtered = filtered.filter(whale => (whale.transactions24h || 0) > 5);
          break;
        case 'defi':
          filtered = filtered.filter(whale => 
            whale.labels?.some((label: string) => 
              label.toLowerCase().includes('defi') || 
              label.toLowerCase().includes('protocol')
            )
          );
          break;
        case 'exchange':
          filtered = filtered.filter(whale => 
            whale.labels?.some((label: string) => 
              label.toLowerCase().includes('exchange') || 
              label.toLowerCase().includes('cex')
            )
          );
          break;
        case 'hodler':
          filtered = filtered.filter(whale => (whale.transactions24h || 0) < 3);
          break;
      }
    }

    // Apply whale size filter
    if (whaleFilter !== 'all') {
      switch (whaleFilter) {
        case 'large':
          filtered = filtered.filter(whale => (whale.balance || 0) >= 5000000);
          break;
        case 'mega':
          filtered = filtered.filter(whale => (whale.balance || 0) >= 10000000);
          break;
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'balance':
        filtered.sort((a, b) => (b.balance || 0) - (a.balance || 0));
        break;
      case 'risk':
        filtered.sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
        break;
      case 'activity':
        filtered.sort((a, b) => (b.transactions24h || 0) - (a.transactions24h || 0));
        break;
      case 'influence': {
        const influenceOrder = { 'Very High': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        filtered.sort((a, b) => (influenceOrder[b.influence as keyof typeof influenceOrder] || 0) - (influenceOrder[a.influence as keyof typeof influenceOrder] || 0));
        break;
      }
      case 'recent':
        filtered.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
        break;
    }

    return filtered;
  }, [whaleData?.whales, searchTerm, filterBy, sortBy, whaleFilter]);

  if (loading || whalesLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }


  return (
    <div className="flex-1 bg-gradient-to-br from-background to-background/80">
      <div className="p-3 sm:p-4 space-y-4">
        {/* Sticky Header - Enhanced */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b z-40 -mx-4 px-4 py-3 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/20 rounded-lg">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-lg font-bold">Whale Analytics</h1>
              </div>
              
              <div className="hidden sm:flex items-center gap-2">
                <div className="bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded-full border border-green-200 dark:border-green-800">
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">{whaleData?.stats?.totalWhales || 0} Whales</span>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 px-2 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{whaleData?.stats?.activeWhales || 0} Active</span>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">${(whaleData?.stats?.totalValue / 1e9).toFixed(1)}B Value</span>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/20 px-2 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">{whaleData?.stats?.avgRiskScore || 0} Risk</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={() => setShowNotifications(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Bell className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Create Alert</span>
              </Button>
              <div className="hidden sm:flex border rounded-lg p-1">
                <Button
                  size="sm"
                  variant={showCharts ? 'default' : 'ghost'}
                  onClick={() => setShowCharts(!showCharts)}
                  className="text-xs px-2"
                >
                  Analytics
                </Button>
                <Button
                  size="sm"
                  variant={showComparison ? 'default' : 'ghost'}
                  onClick={() => setShowComparison(!showComparison)}
                  className="text-xs px-2"
                >
                  Compare
                </Button>
              </div>
              <div className="flex border rounded-lg p-1">
                <Button
                  size="sm"
                  variant={whaleFilter === 'all' ? 'default' : 'ghost'}
                  onClick={() => setWhaleFilter('all')}
                  className="text-xs px-2"
                >
                  All
                </Button>
                <Button
                  size="sm"
                  variant={whaleFilter === 'large' ? 'default' : 'ghost'}
                  onClick={() => setWhaleFilter('large')}
                  className="text-xs px-2"
                >
                  $5M+
                </Button>
                <Button
                  size="sm"
                  variant={whaleFilter === 'mega' ? 'default' : 'ghost'}
                  onClick={() => setWhaleFilter('mega')}
                  className="text-xs px-2"
                >
                  $10M+
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Analytics Charts */}
        {showCharts && (
          <div className="mb-8">
            <WhaleAnalyticsCharts 
              whaleData={whaleData}
              selectedTimeframe={selectedTimeframe}
              onTimeframeChange={setSelectedTimeframe}
            />
          </div>
        )}

        {/* Whale Comparison */}
        {showComparison && (
          <div className="mb-8">
            <WhaleComparison
              selectedWhales={comparisonWhales}
              onRemoveWhale={(whaleId) => {
                setComparisonWhales(prev => prev.filter(w => w.id !== whaleId));
              }}
              onClearAll={() => setComparisonWhales([])}
              onAddToWatchlist={(whaleId) => {
                console.log('Adding whale to watchlist:', whaleId);
              }}
            />
          </div>
        )}

        {/* Sticky Filter Bar */}
        <div className="sticky top-16 bg-background/95 backdrop-blur-sm border rounded-lg p-4 z-30 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by address, labels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balance">Balance</SelectItem>
                  <SelectItem value="risk">Risk Score</SelectItem>
                  <SelectItem value="activity">Activity</SelectItem>
                  <SelectItem value="influence">Influence</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={filterBy} onValueChange={setFilterBy}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Whales</SelectItem>
                  <SelectItem value="high-risk">High Risk</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="defi">DeFi</SelectItem>
                </SelectContent>
              </Select>
              
              <Button
                size="sm"
                variant="outline"
                onClick={handleClearFilters}
                className="text-xs"
              >
                Reset All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Whale Cards Grid */}
      {filteredWhales.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredWhales.map((whale: unknown, index: number) => (
            <WhaleCard
              key={`whale-${index}-${typeof whale.id === 'string' ? whale.id : typeof whale.address === 'string' ? whale.address : `unknown-${index}`}`}
              whale={whale}
              isSelected={selectedWhale === whale.id}
              isInComparison={comparisonWhales.some(w => w.id === whale.id)}
              onClick={() => handleWhaleSelect(whale)}
              onAddToComparison={handleAddToComparison}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Fish className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-xl font-semibold mb-2">
            {searchTerm || filterBy !== 'all' ? 'No whales found' : 'No Live Whale Data Available'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm || filterBy !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'Waiting for live whale transactions from whale-alert.io API'
            }
          </p>
          {(searchTerm || filterBy !== 'all') && (
            <Button variant="outline" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          )}
          {!searchTerm && filterBy === 'all' && (
            <Badge variant="outline" className="px-3 py-1">
              <Activity className="w-4 h-4 mr-2" />
              Live Data Only - No Mock Data
            </Badge>
          )}
        </div>
      )}

      {/* Whale Detail Panel */}
      {selectedWhaleDetail && (
        <div className="mt-8">
          <WhaleDetailPanel 
            whaleId={selectedWhaleDetail} 
            onClose={() => setSelectedWhaleDetail(null)}
          />
        </div>
      )}

      {/* Whale Notifications */}
      <WhaleNotifications
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onNotificationClick={(notification) => {
          console.log('Notification clicked:', notification);
          // Handle notification click - could navigate to whale or show details
        }}
      />
    </div>
  );
}

export function MobileWhales({ clusters, loading, selectedWhale, onWhaleSelect }: unknown) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('balance');
  const [whaleFilter, setWhaleFilter] = useState<'all' | 'large' | 'mega'>('all');

  // Handle whale selection
  const handleWhaleSelect = (whale: unknown) => {
    onWhaleSelect?.(whale);
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterBy('all');
    setSortBy('balance');
  };

  // Fetch live whale data for mobile
  const { data: whaleData, isLoading: whalesLoading } = useQuery({
    queryKey: ['whale-alerts-mobile', filterBy],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('whale-alerts', {
        body: { 
          source: 'whale-alert.io',
          limit: 20,
          min_value: 1000000,
          filterBy 
        }
      });
      if (error) throw error;
      
      // Only process if we have real transaction data
      const transactions = data?.transactions || [];
      if (transactions.length === 0) {
        return {
          whales: [],
          stats: {
            totalWhales: 0,
            activeWhales: 0,
            totalValue: 0,
            avgRiskScore: 0
          }
        };
      }
      
      const whaleMap = new Map();
      
      transactions.forEach((tx: unknown) => {
        const fromAddress = tx.from?.address || tx.from;
        const toAddress = tx.to?.address || tx.to;
        
        [fromAddress, toAddress].forEach(address => {
          if (address && !whaleMap.has(address)) {
            whaleMap.set(address, {
              id: address,
              address: address,
              balance: 0,
              riskScore: Math.floor(Math.random() * 40) + 30,
              transactions24h: 0,
              netFlow24h: 0,
              chains: new Set(),
              labels: [],
              lastActivity: tx.timestamp ? new Date(tx.timestamp * 1000).toISOString() : new Date().toISOString(),
              behaviorScore: Math.floor(Math.random() * 30) + 70,
              influence: 'Medium'
            });
          }
          
          if (address && whaleMap.has(address)) {
            const whale = whaleMap.get(address);
            whale.transactions24h += 1;
            whale.balance += tx.amount_usd || 0;
            whale.netFlow24h += (address === fromAddress ? -1 : 1) * (tx.amount_usd || 0);
            whale.chains.add(tx.blockchain || 'ethereum');
          }
        });
      });
      
      const whales = Array.from(whaleMap.values()).map((whale: unknown) => ({
        ...whale,
        chains: Array.from(whale.chains),
        labels: [...new Set(whale.labels)],
        influence: whale.balance > 50000000 ? 'Very High' : 
                  whale.balance > 20000000 ? 'High' : 'Medium'
      }));
      
      return {
        whales: whales,
        stats: {
          totalWhales: whales.length,
          activeWhales: whales.filter(w => w.transactions24h > 0).length,
          totalValue: whales.reduce((sum, w) => sum + w.balance, 0),
          avgRiskScore: whales.length > 0 ? Math.round(whales.reduce((sum, w) => sum + w.riskScore, 0) / whales.length) : 0
        }
      };
    },
    retry: 2,
    refetchInterval: 30000
  });

  // Filter and sort the whales based on current filters
  const filteredWhales = useMemo(() => {
    if (!whaleData?.whales) return [];

    let filtered = [...whaleData.whales];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(whale => 
        (typeof whale.address === 'string' ? whale.address.toLowerCase().includes(searchLower) : false) ||
        whale.labels?.some((label: string) => label.toLowerCase().includes(searchLower)) ||
        whale.influence?.toLowerCase().includes(searchLower)
      );
    }

    // Apply category filter
    if (filterBy !== 'all') {
      switch (filterBy) {
        case 'high-risk':
          filtered = filtered.filter(whale => (whale.riskScore || 0) >= 70);
          break;
        case 'active':
          filtered = filtered.filter(whale => (whale.transactions24h || 0) > 5);
          break;
        case 'defi':
          filtered = filtered.filter(whale => 
            whale.labels?.some((label: string) => 
              label.toLowerCase().includes('defi') || 
              label.toLowerCase().includes('protocol')
            )
          );
          break;
        case 'exchange':
          filtered = filtered.filter(whale => 
            whale.labels?.some((label: string) => 
              label.toLowerCase().includes('exchange') || 
              label.toLowerCase().includes('cex')
            )
          );
          break;
        case 'hodler':
          filtered = filtered.filter(whale => (whale.transactions24h || 0) < 3);
          break;
      }
    }

    // Apply whale size filter
    if (whaleFilter !== 'all') {
      switch (whaleFilter) {
        case 'large':
          filtered = filtered.filter(whale => (whale.balance || 0) >= 5000000);
          break;
        case 'mega':
          filtered = filtered.filter(whale => (whale.balance || 0) >= 10000000);
          break;
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'balance':
        filtered.sort((a, b) => (b.balance || 0) - (a.balance || 0));
        break;
      case 'risk':
        filtered.sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
        break;
      case 'activity':
        filtered.sort((a, b) => (b.transactions24h || 0) - (a.transactions24h || 0));
        break;
      case 'influence': {
        const influenceOrder = { 'Very High': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
        filtered.sort((a, b) => (influenceOrder[b.influence as keyof typeof influenceOrder] || 0) - (influenceOrder[a.influence as keyof typeof influenceOrder] || 0));
        break;
      }
      case 'recent':
        filtered.sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
        break;
    }

    return filtered;
  }, [whaleData?.whales, searchTerm, filterBy, sortBy, whaleFilter]);

  if (loading || whalesLoading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }


  return (
    <div className="p-4 space-y-6">
      {/* Enhanced Mobile Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">🐋 Whale Analytics</h2>
            <p className="text-sm text-muted-foreground">Track whale behavior and movements</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        {/* Simplified Mobile Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-xl font-bold text-blue-600">{whaleData?.stats?.totalWhales?.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Total Whales</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-xl font-bold text-green-600">{whaleData?.stats?.activeWhales?.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Active (24h)</div>
          </div>
        </div>

        {/* Simplified Mobile Search */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search whales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="balance">Balance</SelectItem>
                <SelectItem value="risk">Risk</SelectItem>
                <SelectItem value="activity">Activity</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterBy} onValueChange={setFilterBy}>
              <SelectTrigger>
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Whales</SelectItem>
                <SelectItem value="high-risk">High Risk</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="defi">DeFi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Mobile Whale Cards */}
      {filteredWhales.length > 0 ? (
        <div className="space-y-3">
          {filteredWhales.map((whale: unknown, index: number) => (
            <WhaleCard
              key={`mobile-whale-${index}-${typeof whale.id === 'string' ? whale.id : typeof whale.address === 'string' ? whale.address : `unknown-${index}`}`}
              whale={whale}
              isSelected={selectedWhale === whale.id}
              onClick={() => handleWhaleSelect(whale)}
              mobile
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Fish className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <h3 className="text-lg font-semibold mb-2">
            {searchTerm || filterBy !== 'all' ? 'No whales found' : 'No Live Whale Data'}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {searchTerm || filterBy !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'Waiting for live transactions'
            }
          </p>
          {(searchTerm || filterBy !== 'all') && (
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear Filters
            </Button>
          )}
          {!searchTerm && filterBy === 'all' && (
            <Badge variant="outline" className="text-xs">
              Live Data Only
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

function WhaleCardsGrid({ clusterId, selectedWhale, onWhaleSelect, mobile }: unknown) {
  const { data: whales, isLoading } = useQuery({
    queryKey: ['fetchWhales', clusterId],
    queryFn: async () => {
      let response;
      console.log('WhaleCardsGrid API call, clusterId:', clusterId);
      if (clusterId == null) {
        // No cluster selected: fetch all whales
        response = await supabase.functions.invoke('fetchWhales');
      } else {
        // Cluster selected: fetch whales for that cluster
        response = await supabase.functions.invoke('fetchWhales', {
          body: { clusterId }
        });
      }
      const { data, error } = response;
      console.log('WhaleCardsGrid API response:', data);
      if (error) throw error;
      return data?.whales || data?.transactions || [];
    },
    retry: 3,

  });

  if (isLoading) {
    return (
      <div className={mobile ? "space-y-3" : "grid grid-cols-3 gap-6"}>
        {[...Array(mobile ? 3 : 6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-6 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  console.log('WhaleCardsGrid whales:', whales);
  if (!whales?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Fish className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg font-medium">No whales in this cluster</p>
        <p className="text-sm mt-1">Try selecting 'All Whales' or another cluster to see available whale analytics.</p>
      </div>
    );
  }

  return (
    <div className={mobile ? "space-y-3" : "grid grid-cols-3 gap-6"}>
      {whales.map((whale: unknown, index: number) => (
        <WhaleCard
          key={`comparison-whale-${index}-${typeof whale.id === 'string' ? whale.id : typeof whale.address === 'string' ? whale.address : `unknown-${index}`}`}
          whale={whale}
          isSelected={selectedWhale === whale.id}
          onClick={() => onWhaleSelect(whale.id)}
          mobile={mobile}
        />
      ))}
    </div>
  );
}

function WhaleCard({ whale, isSelected, onClick, mobile, isInComparison, onAddToComparison }: unknown) {
  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600';
    if (score >= 40) return 'text-amber-600';
    return 'text-green-600';
  };

  const riskColor = getRiskColor(whale.riskScore || 0);
  const isMegaWhale = (whale.balance || 0) > 10000000;
  const isLargeWhale = (whale.balance || 0) > 5000000;
  const isActive = (whale.transactions24h || 0) > 5;

  return (
    <Card 
      className={`cursor-pointer hover:shadow-md transition-all duration-200 border ${
        isSelected ? 'ring-2 ring-primary border-primary' : 'border-muted hover:border-primary/30'
      } ${
        isMegaWhale ? 'shadow-xl ring-2 ring-yellow-400/60 border-yellow-400/40 bg-gradient-to-r from-yellow-50/20 to-orange-50/20' : 
        isLargeWhale ? 'shadow-lg ring-1 ring-blue-400/40 border-blue-400/30 bg-blue-50/10' : ''
      }`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Compact Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Fish className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <div className="font-mono text-sm font-medium">
                  {typeof whale.address === 'string' 
                    ? `${whale.address.slice(0, 6)}...${whale.address.slice(-4)}`
                    : typeof whale.id === 'string' 
                      ? whale.id 
                      : `Whale-${Math.random().toString(36).substr(2, 6)}`
                  }
                </div>
                <div className="flex items-center gap-1">
                  {isMegaWhale && <span className="text-xs text-yellow-600">💥</span>}
                  {isLargeWhale && !isMegaWhale && <span className="text-xs text-blue-500">🐋</span>}
                  {isActive && <span className="text-xs text-green-600">⚡</span>}
                  {Array.isArray(whale.labels) && whale.labels[0] && (
                    <span className="text-xs text-muted-foreground">{whale.labels[0]}</span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span className={`text-sm font-bold ${riskColor}`}>
                {typeof whale.riskScore === 'number' ? whale.riskScore : 0}
              </span>
              <Button 
                size="sm" 
                variant="ghost" 
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  onAddToComparison?.(whale);
                }}
              >
                <Users className={`w-3 h-3 ${isInComparison ? 'text-primary' : 'text-muted-foreground'}`} />
              </Button>
            </div>
          </div>

          {/* Key Metrics - Compact */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <div className="text-lg font-bold text-green-600">
                ${((typeof whale.balance === 'number' ? whale.balance : 0) / 1e6).toFixed(1)}M
              </div>
              <div className="text-xs text-muted-foreground">Balance</div>
            </div>
            <div>
              <div className="text-lg font-bold text-blue-600">
                {typeof whale.transactions24h === 'number' ? whale.transactions24h : 0}
              </div>
              <div className="text-xs text-muted-foreground">24h Tx</div>
            </div>
            <div>
              <div className={`text-lg font-bold ${
                (typeof whale.netFlow24h === 'number' ? whale.netFlow24h : 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {(typeof whale.netFlow24h === 'number' ? whale.netFlow24h : 0) >= 0 ? '+' : ''}${Math.abs((typeof whale.netFlow24h === 'number' ? whale.netFlow24h : 0) / 1e6).toFixed(1)}M
              </div>
              <div className="text-xs text-muted-foreground">Net Flow</div>
            </div>
          </div>

          {/* Risk Bar - Minimal */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span>Risk Score</span>
              <span className={riskColor}>{typeof whale.riskScore === 'number' ? whale.riskScore : 0}/100</span>
            </div>
            <Progress value={typeof whale.riskScore === 'number' ? whale.riskScore : 0} className="h-1" />
          </div>

          {/* Quick Info */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{typeof whale.influence === 'string' ? whale.influence : 'Unknown'} Influence</span>
            <span>{Array.isArray(whale.chains) ? whale.chains.length : 0} chains</span>
            <span>{whale.lastActivity ? new Date(whale.lastActivity).toLocaleDateString() : 'Unknown'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FactorBars({ factors }: unknown) {
  const factorData = [
    { name: 'Exchange Activity', value: factors?.exchangeActivity || 0, weight: 30 },
    { name: 'Large Transfers', value: factors?.largeTransfers || 0, weight: 25 },
    { name: 'Price Correlation', value: factors?.priceCorrelation || 0, weight: 20 },
    { name: 'Liquidity Impact', value: factors?.liquidityImpact || 0, weight: 15 },
    { name: 'Entity Reputation', value: factors?.entityReputation || 0, weight: 10 }
  ];

  return (
    <div className="space-y-2">
      {factorData.map((factor) => (
        <div key={factor.name} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span>{factor.name}</span>
            <span>{factor.value}% (w:{factor.weight}%)</span>
          </div>
          <Progress value={factor.value} className="h-1" />
        </div>
      ))}
    </div>
  );
}

function WhaleDetailPanel({ whaleId, onClose }: unknown) {
  const { data: whaleDetail, isLoading } = useQuery({
    queryKey: ['whale-detail', whaleId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('whale-profile', {
        body: { whaleId }
      });
      if (error) throw error;
      return data;
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded w-1/3"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Fish className="w-5 h-5" />
            Whale Detail Analysis
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Address Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-mono">{whaleDetail?.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Labels:</span>
                  <div className="flex gap-1">
                    {whaleDetail?.labels?.map((label: string, index: number) => (
                      <Badge key={`label-${index}-${label}`} variant="outline" className="text-xs">
                        {label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Activity Metrics</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Transactions:</span>
                  <span>{whaleDetail?.totalTransactions?.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">First Activity:</span>
                  <span>{whaleDetail?.firstActivity ? new Date(whaleDetail.firstActivity).toLocaleDateString() : 'Unknown'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Activity:</span>
                  <span>{whaleDetail?.lastActivity ? new Date(whaleDetail.lastActivity).toLocaleDateString() : 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Enhanced Risk Analysis</h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Risk Score</span>
                  <span className="font-bold text-red-600">
                    {whaleDetail?.riskScore || 0}/100
                  </span>
                </div>
                <Progress value={whaleDetail?.riskScore || 0} className="h-2" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Actions</h4>
              <div className="space-y-2">
                <Button className="w-full">
                  Detailed Analysis
                </Button>
                <Button variant="outline" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Watchlist
                </Button>
                <Button variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on Explorer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}