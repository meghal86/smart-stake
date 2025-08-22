import { useState, useEffect } from "react";
import { Search, Filter, Zap, Crown } from "lucide-react";
import { WhaleTransactionCard } from "@/components/whale/WhaleTransactionCard";
import { WhaleTransactionSkeleton } from "@/components/whale/WhaleTransactionSkeleton";
import { ErrorState } from "@/components/whale/ErrorState";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { PlanBadge } from "@/components/subscription/PlanBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

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
  
  const whaleAccess = canAccessFeature('whaleAlerts');
  const isLimitedAccess = whaleAccess === 'limited';
  const dailyLimit = 50;

  const fetchTransactions = async () => {
    try {
      setError(null);
      // Fetch real data from Supabase in the background
      const { data: alerts, error: alertsError } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (alertsError) {
        // Don't throw error, just log it and continue with mock data
        console.log('No real data available, using mock data:', alertsError.message);
        return;
      }

      // Transform alerts data to match component expectations
      const transformedTransactions = alerts?.map((alert, index) => ({
        id: alert.id,
        fromAddress: alert.from_addr || "0x0000000000000000000000000000000000000000",
        toAddress: alert.to_addr || "0x0000000000000000000000000000000000000000",
        amountUSD: Number(alert.amount_usd) || 0,
        token: alert.token || 'ETH',
        chain: alert.chain || 'Ethereum',
        timestamp: new Date(alert.created_at),
        txHash: alert.tx_hash || `0x${index.toString().padStart(64, '0')}`,
        type: Math.random() > 0.5 ? "buy" as const : "sell" as const,
      })) || [];

      if (transformedTransactions.length > 0) {
        setTransactions(transformedTransactions);
        setIsMockData(false);
      }
    } catch (err) {
      // Silently fail and keep using mock data
      console.log('Error fetching real data, using mock data:', err);
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

  useEffect(() => {
    // Only fetch real data if user is authenticated
    if (user) {
      fetchTransactions();
    } else {
      // For unauthenticated users, show mock data immediately
      setTransactions(mockTransactions);
      setIsMockData(true);
      setIsLoading(false);
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-xl">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Whale Alerts</h1>
                <p className="text-sm text-muted-foreground">Live whale transactions</p>
              </div>
            </div>
            <PlanBadge plan={userPlan.plan} />
          </div>

          {/* Plan-based alert counter */}
          {isLimitedAccess && (
            <Alert className="mb-4">
              <AlertDescription className="flex items-center justify-between">
                <span>Daily alerts: {dailyAlertsCount}/{dailyLimit}</span>
                <Button size="sm" variant="outline" onClick={() => navigate('/subscription')}>
                  Upgrade <Crown className="h-3 w-3 ml-1" />
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by token, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={selectedChain} onValueChange={setSelectedChain}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Chain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chains</SelectItem>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="bsc">BSC</SelectItem>
                  <SelectItem value="arbitrum">Arbitrum</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                placeholder="Min USD"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="flex-1"
                type="number"
              />
              
              <Button size="icon" variant="outline">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Feed */}
      <div className="p-4 space-y-4">
        {isLoading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, index) => (
            <WhaleTransactionSkeleton key={index} />
          ))
        ) : error ? (
          // Error state
          <ErrorState onRetry={handleRetry} isRetrying={isRetrying} />
        ) : transactions.length === 0 ? (
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
            {transactions.map((transaction) => (
              <WhaleTransactionCard key={transaction.id} transaction={transaction} />
            ))}
            {/* Show end of feed message only for real data */}
            {error === null && !isLoading && !isMockData && transactions.length > 0 && (
              <div className="text-center py-8">
                <div className="text-muted-foreground text-sm">
                  You're all caught up!
                </div>
              </div>
            )}
            {/* Show demo data indicator */}
            {error === null && !isLoading && isMockData && transactions.length > 0 && (
              <div className="text-center py-8">
                <div className="text-muted-foreground text-sm bg-muted/20 rounded-lg p-3 mx-4">
                  📊 Showing demo data - Sign up to see real whale alerts
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}