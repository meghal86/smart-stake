import { useState, useEffect } from 'react';
import { Fish, TrendingUp, Filter, Star, Eye, Info, Bell, X, ExternalLink, Activity, Users, Share2, Globe } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { WhaleBehaviorAnalytics } from '@/components/whale-analytics/WhaleBehaviorAnalytics';

interface WhaleWallet {
  id: string;
  address: string;
  fullAddress: string;
  label: string;
  type: 'trading' | 'investment';
  balance: number;
  roi: number;
  riskScore: number;
  recentActivity: number;
  chain: string;
  activityData: number[];
  isWatched: boolean;
}

interface SharedWatchlist {
  id: string;
  name: string;
  description: string;
  follower_count: number;
  shared_watchlist_whales: any[];
}

export default function WhaleAnalytics() {
  const { user } = useAuth();
  const { planLimits, canAccessFeature } = useSubscription();
  const whaleAccess = canAccessFeature('whaleAnalytics');
  const [whales, setWhales] = useState<WhaleWallet[]>([]);
  const [sharedWatchlists, setSharedWatchlists] = useState<SharedWatchlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWhale, setSelectedWhale] = useState<WhaleWallet | null>(null);
  const [showAlertModal, setShowAlertModal] = useState<string | null>(null);
  const [riskTooltip, setRiskTooltip] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState('ethereum');
  const [supportedChains, setSupportedChains] = useState<string[]>([]);
  const [watchedAddresses, setWatchedAddresses] = useState<string[]>([]);

  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('balance');
  const [activeView, setActiveView] = useState<'analytics' | 'behavior'>('analytics');

  useEffect(() => {
    fetchWhaleData();
  }, []);

  const fetchWhaleData = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('whale-analytics');
      if (error) throw error;
      setWhales(data.whales || []);
    } catch (error) {
      console.error('Error fetching whale data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWatchlist = (id: string) => {
    setWhales(prev => prev.map(whale => 
      whale.id === id ? { ...whale, isWatched: !whale.isWatched } : whale
    ));
  };

  const getRiskColor = (score: number) => {
    if (score >= 8) return 'text-green-500';
    if (score >= 6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getRiskExplanation = (score: number, type: string) => {
    if (score >= 8) return 'Low risk: Stable holdings and consistent patterns';
    if (score >= 6) return type === 'trading' ? 'Medium risk: Active trading with DEX exposure' : 'Medium risk: Some volatility in holdings';
    return 'High risk: Frequent large movements and high DEX exposure';
  };

  const generateActivityData = () => {
    return Array.from({ length: 30 }, () => Math.floor(Math.random() * 50) + 10);
  };

  const ActivitySparkline = ({ data }: { data: number[] }) => {
    const max = Math.max(...data);
    const points = data.map((value, index) => {
      const x = (index / (data.length - 1)) * 60;
      const y = 20 - (value / max) * 15;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width="60" height="20" className="inline-block">
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          className="text-primary"
        />
      </svg>
    );
  };

  const filteredWhales = whales.filter(whale => 
    filterType === 'all' || whale.type === filterType
  ).slice(0, whaleAccess === 'limited' ? planLimits.whaleAnalyticsLimit : whales.length);

  return (
    <div className="flex-1 bg-gradient-to-br from-background to-background/80 pb-20">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-xl">
              <Fish className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Whale Analytics</h1>
              <p className="text-sm text-muted-foreground">Track top crypto whales</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={activeView === 'analytics' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveView('analytics')}
            >
              Analytics
            </Button>
            <Button 
              variant={activeView === 'behavior' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveView('behavior')}
            >
              Behavior AI
            </Button>
          </div>
        </div>

        {/* Conditional Content */}
        {activeView === 'behavior' ? (
          <WhaleBehaviorAnalytics />
        ) : (
          <>
            {/* Filters */}
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Whales</SelectItem>
                  <SelectItem value="trading">Trading Wallets</SelectItem>
                  <SelectItem value="investment">Investment Wallets</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="balance">Balance</SelectItem>
                  <SelectItem value="roi">ROI</SelectItem>
                  <SelectItem value="risk">Risk Score</SelectItem>
                  <SelectItem value="activity">Recent Activity</SelectItem>
                </SelectContent>
              </Select>
              
              <Button size="icon" variant="outline">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

        {/* Whale List */}
        <div className="space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1,2,3,4,5].map(i => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </Card>
              ))}
            </div>
          ) : filteredWhales.map((whale) => (
            <Card key={whale.id} className="p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Fish className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{whale.label}</h3>
                    <p className="text-sm text-muted-foreground">{whale.address}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={whale.type === 'trading' ? 'default' : 'secondary'}>
                    {whale.type}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowAlertModal(whale.id)}
                  >
                    <Bell className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant={whale.isWatched ? 'default' : 'outline'}
                    onClick={() => toggleWatchlist(whale.id)}
                  >
                    {whale.isWatched ? <Eye className="h-4 w-4" /> : <Star className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 text-sm">
                <div className="cursor-pointer" onClick={() => setSelectedWhale(whale)}>
                  <p className="text-muted-foreground">Balance</p>
                  <p className="font-medium hover:text-primary">{whale.balance?.toLocaleString() || '0'} ETH</p>
                </div>
                <div className="cursor-pointer" onClick={() => setSelectedWhale(whale)}>
                  <p className="text-muted-foreground">ROI</p>
                  <p className="font-medium text-green-500 hover:text-green-600">+{whale.roi || 0}%</p>
                </div>
                <div className="relative">
                  <p className="text-muted-foreground">Risk Score</p>
                  <div className="flex items-center gap-1">
                    <p className={`font-medium ${getRiskColor(whale.riskScore || 0)}`}>
                      {whale.riskScore || 0}/10
                    </p>
                    <button
                      onMouseEnter={() => setRiskTooltip(whale.id)}
                      onMouseLeave={() => setRiskTooltip(null)}
                      className="text-muted-foreground hover:text-[#14B8A6] transition-colors"
                      title="Click for risk explanation"
                    >
                      <Info size={14} />
                    </button>
                    {riskTooltip === whale.id && (
                      <div className="absolute bottom-full left-0 mb-2 p-3 bg-popover border rounded-lg shadow-xl text-xs w-64 z-10">
                        <div className="space-y-2">
                          <p className="font-semibold text-sm">
                            {whale.riskScore >= 8 ? '🟢 Low Risk Whale' : whale.riskScore >= 6 ? '🟡 Medium Risk Whale' : '🔴 High Risk Whale'}
                          </p>
                          <p>{getRiskExplanation(whale.riskScore || 0, whale.type)}</p>
                          <div className="text-xs text-muted-foreground border-t pt-2">
                            💡 <strong>Tip:</strong> Lower risk whales typically have more predictable patterns
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    Activity
                    <ActivitySparkline data={generateActivityData()} />
                  </p>
                  <p className="font-medium">{whale.recentActivity || 0} txns</p>
                </div>
              </div>
            </Card>
          ))}
          {!isLoading && filteredWhales.length === 0 && (
            <Card className="p-8 text-center">
              <Fish className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Whales Found</h3>
              <p className="text-muted-foreground">Unable to load whale data at this time.</p>
            </Card>
          )}
        </div>

        {/* Watchlist Summary */}
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Watchlist Summary</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {whales.filter(w => w.isWatched).length} whales watched
            </span>
            <Button variant="outline" size="sm">
              Manage Alerts
            </Button>
          </div>
        </Card>

        {/* Whale Details Modal */}
        {selectedWhale && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">{selectedWhale.label} Details</h2>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedWhale(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {/* Overview */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Wallet Address</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-sm bg-muted px-2 py-1 rounded">{selectedWhale.address}</code>
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>Wallet Type</Label>
                      <Badge className="mt-1" variant={selectedWhale.type === 'trading' ? 'default' : 'secondary'}>
                        {selectedWhale.type}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Activity Timeline */}
                  <div>
                    <Label>30-Day Activity Timeline</Label>
                    <div className="mt-2 p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-end gap-1 h-20">
                        {generateActivityData().map((value, index) => (
                          <div
                            key={index}
                            className="bg-primary rounded-t flex-1"
                            style={{ height: `${(value / 60) * 100}%` }}
                            title={`Day ${index + 1}: ${value} transactions`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-2">
                        <span>30 days ago</span>
                        <span>Today</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Portfolio Breakdown */}
                  <div>
                    <Label>Portfolio Breakdown</Label>
                    <div className="mt-2 space-y-2">
                      <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                        <span className="text-sm">ETH</span>
                        <span className="font-medium">{selectedWhale.balance?.toLocaleString()} ETH (85%)</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                        <span className="text-sm">USDC</span>
                        <span className="font-medium">2.1M USDC (10%)</span>
                      </div>
                      <div className="flex justify-between items-center p-2 bg-muted/30 rounded">
                        <span className="text-sm">Other</span>
                        <span className="font-medium">Various (5%)</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Recent Counterparties */}
                  <div>
                    <Label>Recent Counterparties</Label>
                    <div className="mt-2 space-y-2">
                      {['Uniswap V3', 'Binance Hot Wallet', '1inch Router', 'Compound'].map((counterparty, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                          <span className="text-sm">{counterparty}</span>
                          <span className="text-xs text-muted-foreground">{Math.floor(Math.random() * 20) + 1} interactions</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Alert Setup Modal */}
        {showAlertModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold">Set Whale Alert</h2>
                  <Button variant="ghost" size="sm" onClick={() => setShowAlertModal(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <Label>Alert Type</Label>
                    <Select defaultValue="withdrawal">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="withdrawal">Large Withdrawal</SelectItem>
                        <SelectItem value="deposit">Large Deposit</SelectItem>
                        <SelectItem value="activity">Activity Spike</SelectItem>
                        <SelectItem value="balance">Balance Change</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Threshold Amount (ETH)</Label>
                    <Input type="number" placeholder="100" className="mt-1" />
                  </div>
                  
                  <div>
                    <Label>Notification Method</Label>
                    <Select defaultValue="email">
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="push">Push Notification</SelectItem>
                        <SelectItem value="both">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button className="flex-1">Create Alert</Button>
                    <Button variant="outline" className="flex-1" onClick={() => setShowAlertModal(null)}>Cancel</Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Community Watchlists */}
        {sharedWatchlists.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Globe className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Community Watchlists</h3>
            </div>
            <div className="space-y-3">
              {sharedWatchlists.map((watchlist) => (
                <div key={watchlist.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <div className="font-medium">{watchlist.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {watchlist.shared_watchlist_whales?.length || 0} whales • {watchlist.follower_count} followers
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      <Users className="h-4 w-4 mr-1" />
                      Follow
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
          </>
        )}
      </div>
    </div>
  );
}