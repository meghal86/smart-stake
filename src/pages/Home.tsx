import { useState, useEffect } from "react";
import { Search, Filter, Zap, Crown, Bell, Plus, X, Copy } from "lucide-react";
import { WhaleTransactionCard } from "@/components/whale/WhaleTransactionCard";
import { WhaleTransactionSkeleton } from "@/components/whale/WhaleTransactionSkeleton";
import { ErrorState } from "@/components/whale/ErrorState";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { PlanBadge } from "@/components/subscription/PlanBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AlertQuickActions } from "@/components/alerts/AlertQuickActions";

// Utility function to format time
const formatTime = (timestamp: Date) => {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
};

// Mock data for whale transactions
const mockTransactions = [
  {
    id: "1",
    fromAddress: "0x1234567890abcdef1234567890abcdef12345678",
    toAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    amountUSD: 2500000,
    token: "ETH",
    chain: "Ethereum",
    timestamp: new Date(Date.now() - 300000), // 5 minutes ago
    txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
    type: "buy" as const,
  },
  {
    id: "2",
    fromAddress: "0x9876543210fedcba9876543210fedcba98765432",
    toAddress: "0xfedcba9876543210fedcba9876543210fedcba98",
    amountUSD: 1800000,
    token: "USDC",
    chain: "Polygon",
    timestamp: new Date(Date.now() - 900000), // 15 minutes ago
    txHash: "0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210fe",
    type: "sell" as const,
  },
  {
    id: "3",
    fromAddress: "0x5555555555555555555555555555555555555555",
    toAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    amountUSD: 950000,
    token: "BTC",
    chain: "Bitcoin",
    timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
    txHash: "0x5555555555555555555555555555555555555555555555555555555555555555",
    type: "buy" as const,
  },
];

export default function Home() {
  const { user } = useAuth();
  const { userPlan, canAccessFeature, getUpgradeMessage } = useSubscription();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChain, setSelectedChain] = useState("all");
  const [dailyAlertsCount, setDailyAlertsCount] = useState(0);
  const [minAmount, setMinAmount] = useState("");
  const [transactions, setTransactions] = useState(mockTransactions);
  const [isMockData, setIsMockData] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'expanded' | 'compact'>('expanded');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  
  const whaleAccess = canAccessFeature('whaleAlerts');
  const isLimitedAccess = whaleAccess === 'limited';
  const dailyLimit = 50;

  const fetchTransactions = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      // Fetch from whale alerts API
      const { data, error } = await supabase.functions.invoke('whale-alerts');
      
      if (error) {
        console.log('Whale Alert API error, using database fallback:', error);
        
        // Fallback to database
        const { data: alerts, error: alertsError } = await supabase
          .from('alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (alertsError) {
          console.log('Database fallback failed, using mock data:', alertsError.message);
          return;
        }

        const transformedTransactions = alerts?.map((alert, index) => ({
          id: alert.id || alert.tx_hash,
          fromAddress: alert.from_addr || "0x0000000000000000000000000000000000000000",
          toAddress: alert.to_addr || "0x0000000000000000000000000000000000000000",
          amountUSD: Number(alert.amount_usd) || 0,
          token: alert.token || 'ETH',
          chain: alert.chain || 'Ethereum',
          timestamp: new Date(alert.timestamp || alert.created_at),
          txHash: alert.tx_hash || `0x${index.toString().padStart(64, '0')}`,
          type: alert.tx_type === 'buy' ? "buy" as const : alert.tx_type === 'sell' ? "sell" as const : "transfer" as const,
          fromType: alert.from_type,
          toType: alert.to_type,
          txType: alert.tx_type,
        })) || [];

        if (transformedTransactions.length > 0) {
          setTransactions(transformedTransactions);
          setIsMockData(false);
        }
        return;
      }

      // Use fresh API data with transaction classification
      const apiTransactions = data.transactions?.map((tx: any) => ({
        id: tx.tx_hash,
        fromAddress: tx.from_addr || "0x0000000000000000000000000000000000000000",
        toAddress: tx.to_addr || "0x0000000000000000000000000000000000000000",
        amountUSD: Number(tx.amount_usd) || 0,
        token: tx.token || 'ETH',
        chain: tx.chain || 'Ethereum',
        timestamp: new Date(tx.timestamp),
        txHash: tx.tx_hash,
        type: tx.tx_type === 'buy' ? "buy" as const : tx.tx_type === 'sell' ? "sell" as const : "transfer" as const,
        fromType: tx.from_type,
        toType: tx.to_type,
        txType: tx.tx_type,
      })) || [];

      if (apiTransactions.length > 0) {
        setTransactions(apiTransactions);
        setIsMockData(false);
      }
    } catch (err) {
      console.log('Error fetching whale data, using mock data:', err);
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  const handleRetry = () => {
    setIsRetrying(true);
    setIsLoading(true);
    fetchTransactions();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Filter transactions based on search query, chain, and minimum amount
  const filteredTransactions = transactions.filter((transaction) => {
    // Search filter (token, address)
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      transaction.token.toLowerCase().includes(searchLower) ||
      transaction.fromAddress.toLowerCase().includes(searchLower) ||
      transaction.toAddress.toLowerCase().includes(searchLower) ||
      transaction.chain.toLowerCase().includes(searchLower);
    
    // Chain filter
    const matchesChain = selectedChain === 'all' || 
      transaction.chain.toLowerCase() === selectedChain.toLowerCase();
    
    // Amount filter
    const minAmountNum = parseFloat(minAmount) || 0;
    const matchesAmount = transaction.amountUSD >= minAmountNum;
    
    return matchesSearch && matchesChain && matchesAmount;
  });

  useEffect(() => {
    if (user) {
      // Logged users get real API data
      fetchTransactions();
      const interval = setInterval(fetchTransactions, 120000);
      return () => clearInterval(interval);
    } else {
      // Non-logged users get mock data (Free Plan)
      setTransactions(mockTransactions);
      setIsMockData(true);
      setIsLoading(false);
    }
  }, [user]);

  return (
    <TooltipProvider>
      <div className="flex-1 bg-gradient-to-br from-background to-background/80">
        <div className="p-3 sm:p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-primary/20 rounded-xl">
              <Zap className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-foreground">Whale Alerts</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">Live whale transactions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex border rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'expanded' ? 'default' : 'ghost'}
                onClick={() => setViewMode('expanded')}
                className="text-xs px-2"
              >
                Expanded
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'compact' ? 'default' : 'ghost'}
                onClick={() => setViewMode('compact')}
                className="text-xs px-2"
              >
                Compact
              </Button>
            </div>
            <PlanBadge plan={userPlan.plan} />
          </div>
        </div>

        {/* Plan-based alert counter */}
        {isLimitedAccess && (
          <Alert>
            <AlertDescription className="flex items-center justify-between">
              <span className="text-xs sm:text-sm">Daily alerts: {dailyAlertsCount}/{dailyLimit}</span>
              <Button size="sm" variant="outline" onClick={() => navigate('/subscription')} className="text-xs">
                Upgrade <Crown className="h-3 w-3 ml-1" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Alert Quick Actions */}
        <AlertQuickActions />

        {/* Quick Filters */}
        <div className="flex gap-2 mb-3 overflow-x-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={() => setMinAmount('10000000')}>
                💥 $10M+
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Show only mega whale transactions above $10M</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={() => setMinAmount('5000000')}>
                🐋 $5M+
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Show large whale transactions above $5M</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={() => setMinAmount('1000000')}>
                🐟 $1M+
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Show whale transactions above $1M</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={() => setSelectedChain('ethereum')}>
                Ξ ETH Only
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Filter to Ethereum blockchain only</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={() => setSelectedChain('tron')}>
                ⚡ TRX Only
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Filter to Tron blockchain only</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={() => setSelectedChain('solana')}>
                ◎ SOL Only
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Filter to Solana blockchain only</p>
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="sm" variant="outline" onClick={() => setSelectedChain('avalanche')}>
                🔺 AVAX Only
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Filter to Avalanche blockchain only</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Filters */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search by token, address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedChain} onValueChange={setSelectedChain}>
              <SelectTrigger className="flex-1 text-sm">
                <SelectValue placeholder="Chain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chains</SelectItem>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="tron">Tron</SelectItem>
                <SelectItem value="ripple">Ripple</SelectItem>
                <SelectItem value="solana">Solana</SelectItem>
                <SelectItem value="avalanche">Avalanche</SelectItem>
                <SelectItem value="fantom">Fantom</SelectItem>
                <SelectItem value="polygon">Polygon</SelectItem>
                <SelectItem value="bsc">BSC</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Min USD"
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              className="flex-1 text-sm"
              type="number"
            />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline" className="shrink-0">
                  <Filter className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Advanced filtering options</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="outline" className="shrink-0">
                  <Bell className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Set custom whale alerts</p>
              </TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => alert('Alert: Notify me of all USDT transfers > $5M')}
                  className="text-xs px-2 shrink-0"
                >
                  🚨 USDT
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Quick alert for USDT $5M+ transfers</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Transaction Feed */}
        <div className="space-y-3 sm:space-y-4">
          {isLoading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, index) => (
            <WhaleTransactionSkeleton key={index} />
          ))
        ) : error ? (
          // Error state
          <ErrorState onRetry={handleRetry} isRetrying={isRetrying} />
        ) : filteredTransactions.length === 0 ? (
          // No data state
          <div className="text-center py-12">
            <div className="space-y-3">
              <div className="p-3 bg-muted/20 rounded-full inline-block">
                <Zap className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground">No Whale Activity</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                There are no large transactions matching your criteria at the moment. 
                Try adjusting your filters or check back later.
              </p>
            </div>
          </div>
        ) : (
          // Transaction list
          <>
            {filteredTransactions.map((transaction) => (
              viewMode === 'expanded' ? (
                <WhaleTransactionCard 
                  key={transaction.id} 
                  transaction={transaction}
                  onClick={() => setSelectedTransaction(transaction)}
                />
              ) : (
                <div 
                  key={transaction.id}
                  onClick={() => setSelectedTransaction(transaction)}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      transaction.type === 'buy' ? 'bg-green-500' :
                      transaction.type === 'sell' ? 'bg-red-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex items-center gap-2">
                      {transaction.amountUSD > 10000000 && <span className="text-yellow-400">💥</span>}
                      <span className="font-mono text-sm">
                        ${(transaction.amountUSD / 1000000).toFixed(1)}M
                      </span>
                      <span className="text-xs text-muted-foreground">{transaction.token}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(transaction.timestamp)}
                  </div>
                </div>
              )
            ))}
            {/* Show end of feed message only for real data */}
            {error === null && !isLoading && !isMockData && filteredTransactions.length > 0 && (
              <div className="text-center py-8">
                <div className="text-muted-foreground text-sm">
                  You're all caught up!
                </div>
              </div>
            )}
            {/* Show demo data indicator */}
            {error === null && !isLoading && isMockData && filteredTransactions.length > 0 && (
              <div className="text-center py-8">
                <div className="text-muted-foreground text-sm bg-muted/20 rounded-lg p-3 mx-4">
                  📊 Showing demo data - Sign up to see real whale alerts
                </div>
              </div>
            )}
            {/* Show live data indicator */}
            {error === null && !isLoading && !isMockData && filteredTransactions.length > 0 && (
              <div className="text-center py-6">
                <div className="inline-flex items-center gap-2 text-green-600 text-sm bg-green-50 dark:bg-green-950/20 rounded-full px-4 py-2 border border-green-200 dark:border-green-800">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="font-medium">Live Whale Alert API</span>
                  <div className="text-xs text-green-500 bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded-full">
                    {filteredTransactions.length} alerts
                  </div>
                </div>
              </div>
            )}
            
            {/* Transaction Details Modal */}
            {selectedTransaction && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-card rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold">Transaction Details</h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedTransaction(null)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Amount</label>
                          <p className="text-2xl font-bold">
                            ${selectedTransaction.amountUSD.toLocaleString()}
                            {selectedTransaction.amountUSD > 10000000 && 
                              <span className="ml-2 text-yellow-400 animate-pulse">💥 MEGA WHALE</span>
                            }
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Type</label>
                          <p className={`text-lg font-semibold ${
                            selectedTransaction.type === 'buy' ? 'text-green-500' :
                            selectedTransaction.type === 'sell' ? 'text-red-500' : 'text-blue-500'
                          }`}>
                            {selectedTransaction.type.toUpperCase()}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Transaction Hash</label>
                        <div className="flex items-center gap-2 font-mono text-sm bg-muted p-2 rounded">
                          <span className="flex-1 truncate">{selectedTransaction.txHash}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(selectedTransaction.txHash)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">From Address</label>
                        <div className="flex items-center gap-2 font-mono text-sm bg-muted p-2 rounded">
                          <span className="flex-1">{selectedTransaction.fromAddress}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(selectedTransaction.fromAddress)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">To Address</label>
                        <div className="flex items-center gap-2 font-mono text-sm bg-muted p-2 rounded">
                          <span className="flex-1">{selectedTransaction.toAddress}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(selectedTransaction.toAddress)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        <Button
                          onClick={() => {
                            const getExplorerUrl = (chain: string, txHash: string) => {
                              switch (chain.toLowerCase()) {
                                case 'ethereum': return `https://etherscan.io/tx/${txHash}`
                                case 'tron': return `https://tronscan.org/#/transaction/${txHash}`
                                case 'ripple': case 'xrp': return `https://xrpscan.com/tx/${txHash}`
                                case 'solana': return `https://solscan.io/tx/${txHash}`
                                case 'avalanche': return `https://snowtrace.io/tx/${txHash}`
                                case 'fantom': return `https://ftmscan.com/tx/${txHash}`
                                default: return `https://etherscan.io/tx/${txHash}`
                              }
                            }
                            window.open(getExplorerUrl(selectedTransaction.chain, selectedTransaction.txHash), '_blank')
                          }}
                          className="flex-1"
                        >
                          View on Explorer
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            // Future: Open alert creation dialog
                            alert(`Alert setup for ${selectedTransaction.token} transactions > $${(selectedTransaction.amountUSD/1000000).toFixed(1)}M`)
                          }}
                          className="flex-1"
                        >
                          <Bell className="h-4 w-4 mr-2" />
                          Create Alert
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Load More Button */}
            {!isLoading && filteredTransactions.length >= 10 && (
              <div className="text-center py-4">
                <Button variant="outline" onClick={() => setMinAmount('')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Load More Transactions
                </Button>
              </div>
            )}
          </>
        )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}