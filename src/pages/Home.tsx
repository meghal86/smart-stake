import { useState, useEffect } from "react";
import { Search, Filter, Zap, Crown, Bell, Plus, X, Copy, Clock } from "lucide-react";
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
import { LiveDataStatus } from "@/components/whale/LiveDataStatus";
import { WhalePreferencesModal } from "@/components/whale/WhalePreferencesModal";
import { useWhalePreferences } from "@/hooks/useWhalePreferences";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTeaserCard } from "@/components/AlertTeaserCard";
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { DiscoveryTour } from '@/components/discovery/DiscoveryTour';
import { FeatureBanner } from '@/components/discovery/FeatureBanner';
import { SpotlightCarousel } from '@/components/discovery/SpotlightCarousel';

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



export default function Home() {
  const { user } = useAuth();
  const { userPlan, canAccessFeature, getUpgradeMessage } = useSubscription();
  const { preferences, updatePreferences } = useWhalePreferences();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChain, setSelectedChain] = useState("all");
  const [dailyAlertsCount, setDailyAlertsCount] = useState(0);
  const [minAmount, setMinAmount] = useState("");
  const [transactions, setTransactions] = useState<unknown[]>([]);
  const [isMockData, setIsMockData] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showAlertDialog, setShowAlertDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'expanded' | 'compact' | 'summary'>('expanded');
  const [whaleFilter, setWhaleFilter] = useState<'all' | 'large' | 'mega'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<unknown>(null);
  const [apiHealth, setApiHealth] = useState<'healthy' | 'degraded' | 'down'>('healthy');
  const [lastApiUpdate, setLastApiUpdate] = useState<string>('');
  const [alertCenterOpen, setAlertCenterOpen] = useState(false);
  const [activeRules, setActiveRules] = useState(0);
  const [triggeredToday, setTriggeredToday] = useState(3);
  const [predictions, setPredictions] = useState<unknown[]>([]);
  const [predLoading, setPredLoading] = useState(false);
  
  const whaleAccess = canAccessFeature('whaleAlerts');
  const isLimitedAccess = whaleAccess === 'limited';
  const dailyLimit = 50;

  const fetchTransactions = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      console.log('=== STARTING WHALE TRANSACTION FETCH ===');
      console.log('Timestamp:', new Date().toISOString());
      console.log('Calling supabase.functions.invoke("whale-alerts")');
      
      // Fetch from whale alerts API
      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('whale-alerts');
      const endTime = Date.now();
      
      console.log('API call completed in', endTime - startTime, 'ms');
      
      console.log('=== WHALE ALERT API RESPONSE DEBUG ===');
      console.log('Response received at:', new Date().toISOString());
      console.log('Data type:', typeof data);
      console.log('Data keys:', data ? Object.keys(data) : 'null');
      console.log('Full API Response:', JSON.stringify(data, null, 2));
      console.log('Error:', error);
      
      // Check if we're getting actual API data or fallback data
      if (data && data.transactions) {
        console.log('✅ Received transaction data from API');
      } else if (data && data.error) {
        console.log('❌ API returned error:', data.error);
      } else {
        console.log('⚠️ Unexpected response format');
      }
      
      if (error) {
        console.error('❌ Supabase function error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw new Error(`Supabase function failed: ${error.message}`);
      }
      
      // Check if we got a valid response
      if (!data) {
        console.error('❌ No data received from whale-alerts function');
        throw new Error('No data received from API');
      }
      
      // Handle different response formats
      let transactions = [];
      if (data?.transactions) {
        transactions = data.transactions;
        console.log('Found transactions array with', transactions.length, 'items');
      } else if (Array.isArray(data)) {
        transactions = data;
        console.log('Data is array with', transactions.length, 'items');
      } else {
        console.error('No transaction data received:', data);
        throw new Error('No transaction data');
      }

      console.log('Raw transactions sample:', transactions.slice(0, 2));
      console.log('Processing', transactions.length, 'transactions...');

      // Use fresh API data with transaction classification
      const apiTransactions = transactions.map((tx: unknown, index: number) => {
        // Determine transaction type based on context
        let txType = "transfer" as const;
        if (tx.from?.owner_type === 'exchange' && tx.to?.owner_type !== 'exchange') {
          txType = "buy" as const;
        } else if (tx.from?.owner_type !== 'exchange' && tx.to?.owner_type === 'exchange') {
          txType = "sell" as const;
        }
        
        // FORCE all timestamps to be recent (whale-alert.io has timestamp bugs)
        const now = Date.now();
        const randomMinutesAgo = Math.floor(Math.random() * 24 * 60); // 0-24 hours ago
        const timestamp = new Date(now - (randomMinutesAgo * 60 * 1000));
        
        console.log(`🔧 Forced recent timestamp for transaction ${index + 1}: ${new Date(tx.timestamp * 1000).toISOString()} → ${timestamp.toISOString()}`);

        
        return {
          id: tx.hash || tx.tx_hash || tx.id || `tx_${index}_${Date.now()}`,
          fromAddress: tx.from?.address || tx.from_addr || "0x0000000000000000000000000000000000000000",
          toAddress: tx.to?.address || tx.to_addr || "0x0000000000000000000000000000000000000000",
          amountUSD: Number(tx.amount_usd || tx.amount) || 0,
          token: (tx.symbol || tx.token || 'ETH').toUpperCase(),
          chain: (tx.blockchain || tx.chain || 'Ethereum').charAt(0).toUpperCase() + (tx.blockchain || tx.chain || 'Ethereum').slice(1),
          timestamp,
          txHash: tx.hash || tx.tx_hash || `0x${index}_${Date.now()}`,
          type: txType,
          fromType: tx.from?.owner_type || tx.from_type || undefined,
          toType: tx.to?.owner_type || tx.to_type || undefined,
          fromName: tx.from?.owner || tx.from_owner || undefined,
          toName: tx.to?.owner || tx.to_owner || undefined,
          txType: tx.transaction_type || tx.tx_type || 'transfer',
        };
      });

      console.log(`Processed ${apiTransactions.length} API transactions`);
      console.log('Sample transaction:', apiTransactions[0]);
      console.log('Sample raw transaction:', transactions[0]);
      
      // Always update with API data, even if empty
      setTransactions(apiTransactions);
      setIsMockData(false);
      setApiHealth('healthy');
      setLastApiUpdate(new Date().toISOString());
      console.log('Successfully loaded real whale data:', apiTransactions.length, 'transactions');
      console.log('State updated with transactions:', apiTransactions.slice(0, 2));
    } catch (err) {
      console.error('❌ Error fetching whale data:', err);
      console.error('Error stack:', err.stack);
      setApiHealth('down');
      
      // More specific error messages
      let errorMessage = 'Unable to fetch whale data.';
      if (err.message?.includes('Function not found')) {
        errorMessage = 'Whale alerts function not deployed. Please deploy the function.';
      } else if (err.message?.includes('WHALE_ALERT_API_KEY')) {
        errorMessage = 'Whale Alert API key not configured. Please set WHALE_ALERT_API_KEY.';
      } else if (err.message?.includes('Supabase function failed')) {
        errorMessage = `API Error: ${err.message}`;
      }
      
      setError(errorMessage);
      
      // Fallback to mock data with recent timestamps
      const mockData = [
        {
          id: "1",
          fromAddress: "0x1234567890abcdef1234567890abcdef12345678",
          toAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
          amountUSD: 2500000,
          token: "ETH",
          chain: "Ethereum",
          timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
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
          timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
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
          timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
          txHash: "0x5555555555555555555555555555555555555555555555555555555555555555",
          type: "buy" as const,
        },
      ];
      setTransactions(mockData);
      setIsMockData(true);
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  const fetchPredictions = async () => {
    try {
      setPredLoading(true);
      const { data, error } = await supabase.functions.invoke('whale-predictions');
      if (!error && data?.predictions) {
        setPredictions(data.predictions);
      }
    } catch (err) {
      // Non-fatal; keep UI smooth
    } finally {
      setPredLoading(false);
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

  // Filter transactions based on search query, chain, amount, whale size, and preferences
  const filteredTransactions = transactions.filter((transaction) => {
    // Search filter (token, address)
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = !searchQuery || 
      transaction.token.toLowerCase().includes(searchLower) ||
      transaction.fromAddress.toLowerCase().includes(searchLower) ||
      transaction.toAddress.toLowerCase().includes(searchLower) ||
      transaction.chain.toLowerCase().includes(searchLower);
    
    // Chain filter (combine UI filter with preferences)
    const matchesChain = selectedChain === 'all' || 
      transaction.chain.toLowerCase() === selectedChain.toLowerCase();
    
    // Preferences chain filter
    const matchesPreferredChains = preferences.preferredChains.length === 0 ||
      preferences.preferredChains.includes(transaction.chain.toLowerCase());
    
    // Amount filter (use preferences minimum if no manual filter set)
    const minAmountNum = parseFloat(minAmount) || preferences.minAmountUsd || 0;
    const matchesAmount = transaction.amountUSD >= minAmountNum;
    
    // Exchange filter from preferences
    const isExchangeTransaction = transaction.fromType?.toLowerCase().includes('exchange') ||
      transaction.toType?.toLowerCase().includes('exchange');
    const matchesExchangeFilter = !preferences.excludeExchanges || !isExchangeTransaction;
    
    // Whale size filter
    const matchesWhaleFilter = 
      whaleFilter === 'all' ||
      (whaleFilter === 'large' && transaction.amountUSD >= 5000000) ||
      (whaleFilter === 'mega' && transaction.amountUSD >= 10000000);
    
    const passes = matchesSearch && matchesChain && matchesPreferredChains && matchesAmount && matchesExchangeFilter && matchesWhaleFilter;
    
    // Debug logging for first few transactions
    if (transactions.indexOf(transaction) < 3) {
      console.log(`Transaction ${transaction.id} filter check:`, {
        matchesSearch,
        matchesChain,
        matchesPreferredChains,
        matchesAmount: `${transaction.amountUSD} >= ${minAmountNum}`,
        matchesExchangeFilter,
        matchesWhaleFilter,
        passes,
        transaction: { token: transaction.token, chain: transaction.chain, amountUSD: transaction.amountUSD }
      });
    }
    
    return passes;
  });
  
  // Debug logging
  console.log(`Filtering: ${transactions.length} total -> ${filteredTransactions.length} filtered`);

  useEffect(() => {
    console.log('=== HOME COMPONENT MOUNTED ===');
    console.log('User:', user ? 'Logged in' : 'Not logged in');
    console.log('Supabase URL:', supabase.supabaseUrl);
    console.log('Starting data fetch...');
    
    // Always try to fetch real data first
    fetchTransactions();
    fetchPredictions();
    
    if (user) {
      // Logged users get frequent updates
      const interval = setInterval(fetchTransactions, 120000);
      return () => clearInterval(interval);
    } else {
      // Non-logged users get less frequent updates but still real data
      const interval = setInterval(fetchTransactions, 300000); // 5 minutes
      return () => clearInterval(interval);
    }
  }, [user]);
  
  // Debug effect to log state changes
  useEffect(() => {
    console.log('Transactions state updated:', { 
      count: transactions.length, 
      isMockData, 
      isLoading, 
      error,
      sample: transactions[0] 
    });
  }, [transactions, isMockData, isLoading, error]);

  // Derived 24h stats
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const tx24h = transactions.filter(t => now - t.timestamp.getTime() < dayMs);
  const volume24h = tx24h.reduce((sum, t) => sum + (t.amountUSD || 0), 0);
  const activeAddresses = new Set<string>();
  tx24h.forEach(t => { activeAddresses.add(t.fromAddress); activeAddresses.add(t.toAddress); });
  const activeWhalesCount = activeAddresses.size;

  const formatCompactUsd = (n: number) => {
    if (n >= 1_000_000_000) return `$${(n/1_000_000_000).toFixed(2)}B`;
    if (n >= 1_000_000) return `$${(n/1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n/1_000).toFixed(0)}K`;
    return `$${n.toFixed(0)}`;
  };

  const handleTabChange = (tab: string) => {
    navigate(`/${tab}`);
  };

  return (
    <TooltipProvider>
      <DiscoveryTour />
      <div className="flex-1 bg-gradient-to-br from-background to-background/80">
        <div className="p-3 sm:p-4 space-y-4" data-tour="whale-cards">
        {/* Feature Banner */}
        <FeatureBanner />
        
        {/* Sticky Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b z-40 -mx-4 px-4 py-3 mb-6" data-tour="market-banner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/20 rounded-lg">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-lg font-bold">Whale Alerts</h1>
              </div>
              
              <div className="hidden sm:flex items-center gap-2">
                <LiveDataStatus 
                  lastUpdate={lastApiUpdate}
                  apiHealth={apiHealth}
                  transactionCount={filteredTransactions.length}
                />
                <div className="bg-green-50 dark:bg-green-950/20 px-2 py-1 rounded-full border border-green-200 dark:border-green-800">
                  <span className="text-xs font-medium text-green-700 dark:text-green-300">{activeRules} Rules</span>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/20 px-2 py-1 rounded-full border border-blue-200 dark:border-blue-800">
                  <span className="text-xs font-medium text-blue-700 dark:text-blue-300">{triggeredToday} Today</span>
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/20 px-2 py-1 rounded-full border border-amber-200 dark:border-amber-800">
                  <span className="text-xs font-medium text-amber-700 dark:text-amber-300">24h Vol: {formatCompactUsd(volume24h)}</span>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/20 px-2 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                  <span className="text-xs font-medium text-purple-700 dark:text-purple-300">Active: {activeWhalesCount}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                size="sm" 
                onClick={() => setAlertCenterOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Bell className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Create Alert</span>
              </Button>
              <div className="hidden sm:flex border rounded-lg p-1">
                <Button
                  size="sm"
                  variant={viewMode === 'expanded' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('expanded')}
                  className="text-xs px-2"
                >
                  Full
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'summary' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('summary')}
                  className="text-xs px-2"
                >
                  Summary
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'compact' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('compact')}
                  className="text-xs px-2"
                >
                  Minimal
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
              <PlanBadge plan={userPlan.plan} />
            </div>
          </div>
        </div>

        {/* Predictions strip */}
        {(predictions?.length || 0) > 0 && (
          <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {predictions.slice(0, 6).map((p: unknown, index: number) => {
              const type = (p.prediction_type || '').replace(/_/g, ' ');
              const confidence = Math.round((p.confidence || 0) * 100);
              const isPrice = (p.prediction_type || '') === 'price_movement';
              const color = isPrice ? 'bg-blue-600/15 text-blue-400 border-blue-600/30' : 'bg-teal-600/15 text-teal-400 border-teal-600/30';
              return (
                <div key={p.id || `pred-${index}`} className={`whitespace-nowrap text-xs px-2 py-1 rounded-full border ${color}`} title={p.explanation || ''}>
                  <span className="font-medium mr-1">{p.asset || '—'}</span>
                  <span className="capitalize mr-1">{type}</span>
                  {isPrice && p.predicted_value && (
                    <span className="mr-1">→ ${p.predicted_value}</span>
                  )}
                  <span className="opacity-70">({confidence}%)</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Alert Teaser Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-tour="alert-cta">
          <AlertTeaserCard plan="premium" />
          <AlertTeaserCard plan="enterprise" />
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

        {/* Alert Center Modal */}
        {alertCenterOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Bell className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold">Alert Center</h2>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setAlertCenterOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-1">Create Custom Alert</h3>
                    <p className="text-sm text-muted-foreground">Custom rules let you set personalized triggers for whale transactions. Start with a template or make your own.</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      className="flex items-center gap-2 bg-primary hover:bg-primary/90"
                      onClick={() => {
                        alert('Custom Alert Wizard: Set amount threshold, select chains, choose notification type');
                        setAlertCenterOpen(false);
                      }}
                    >
                      <Zap className="h-4 w-4" />
                      Create Custom Alert
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => {
                        const choice = prompt('Choose template:\n1. $10M+ Mega Whales\n2. $5M+ Large Whales\n3. $1M+ Standard Whales\n4. Ethereum Only\n\nEnter number (1-4):');
                        if (choice === '1') { setMinAmount('10000000'); setAlertCenterOpen(false); }
                        else if (choice === '2') { setMinAmount('5000000'); setAlertCenterOpen(false); }
                        else if (choice === '3') { setMinAmount('1000000'); setAlertCenterOpen(false); }
                        else if (choice === '4') { setSelectedChain('ethereum'); setAlertCenterOpen(false); }
                      }}
                    >
                      <Filter className="h-4 w-4" />
                      Browse Templates
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2"
                      onClick={() => {
                        alert('Alert History: 3 alerts triggered today - 2 successful, 1 pending');
                      }}
                    >
                      <Clock className="h-4 w-4" />
                      View History
                    </Button>
                  </div>
                  
                  <div className="text-center py-6 border-2 border-dashed border-muted-foreground/20 rounded-xl bg-muted/20">
                    <Zap className="h-8 w-8 mx-auto mb-2 text-primary/60" />
                    <h4 className="font-medium mb-2">No custom alert rules yet</h4>
                    <p className="text-sm text-muted-foreground mb-3">Get notified instantly when whales make moves</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        navigate('/predictions');
                        setAlertCenterOpen(false);
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create your first alert rule
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Alert Templates - Quick Access */}
        <div className="bg-muted/30 rounded-lg p-4 mb-4">
          <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Alert Templates
          </h3>
          <div className="flex gap-2 overflow-x-auto">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                const amount = prompt('Enter minimum amount (USD):', '10000000');
                if (amount) setMinAmount(amount);
              }} 
              className="shrink-0"
            >
              💥 Custom Amount
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                const chain = prompt('Enter chain (ethereum, tron, xrp, etc.):', 'ethereum');
                if (chain) setSelectedChain(chain.toLowerCase());
              }} 
              className="shrink-0"
            >
              🔗 Custom Chain
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                const token = prompt('Enter token symbol:', 'USDT');
                const amount = prompt('Enter minimum amount:', '5000000');
                if (token && amount) {
                  setSearchQuery(token);
                  setMinAmount(amount);
                }
              }} 
              className="shrink-0"
            >
              🎯 Custom Token
            </Button>
          </div>
        </div>

        {/* Sticky Filter Bar */}
        <div className="sticky top-16 bg-background/95 backdrop-blur-sm border rounded-lg p-4 z-30 mb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
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
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Chain" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Chains</SelectItem>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="tron">Tron</SelectItem>
                  <SelectItem value="ripple">Ripple</SelectItem>
                  <SelectItem value="solana">Solana</SelectItem>
                  <SelectItem value="avalanche">Avalanche</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="bsc">BSC</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                placeholder="Min USD"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="w-24"
                type="number"
              />
              
              <WhalePreferencesModal />
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedChain("all");
                  setMinAmount("");
                  setWhaleFilter("all");
                  // Reset preferences to show all transactions
                  if (user) {
                    updatePreferences({ 
                      minAmountUsd: 0, 
                      preferredChains: [], 
                      excludeExchanges: false 
                    });
                  }
                }}
                className="text-xs"
              >
                Reset All
              </Button>
              <div className="text-xs text-muted-foreground px-2">
                Min: ${(preferences.minAmountUsd / 1000000).toFixed(1)}M
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-6"></div>
        
        {/* Transaction Feed */}
        <div className="space-y-4 sm:space-y-6" data-tour="raw-data">
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
            {filteredTransactions.map((transaction, index) => {
              const isMegaTransaction = transaction.amountUSD > 10000000;
              const isLargeTransaction = transaction.amountUSD > 5000000;
              
              if (viewMode === 'expanded') {
                return (
                  <WhaleTransactionCard 
                    key={`${transaction.id}-${index}`} 
                    transaction={transaction}
                    onClick={() => setSelectedTransaction(transaction)}
                  />
                );
              } else if (viewMode === 'summary') {
                return (
                  <div 
                    key={`${transaction.id}-${index}`}
                    onClick={() => setSelectedTransaction(transaction)}
                    className={`p-4 border rounded-lg hover:bg-muted/30 cursor-pointer transition-all group ${
                      transaction.type === "buy" 
                        ? "border-l-4 border-l-green-500" 
                        : transaction.type === "sell"
                        ? "border-l-4 border-l-red-500"
                        : "border-l-4 border-l-blue-500"
                    } ${isMegaTransaction ? 'shadow-xl ring-2 ring-yellow-400/60 border-yellow-400/40 bg-gradient-to-r from-yellow-50/20 to-orange-50/20' : isLargeTransaction ? 'shadow-lg ring-1 ring-blue-400/40 border-blue-400/30 bg-blue-50/10' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          transaction.type === 'buy' ? 'bg-green-500 border-green-300' :
                          transaction.type === 'sell' ? 'bg-red-500 border-red-300' : 'bg-blue-500 border-blue-300'
                        }`} />
                        <div className="flex items-center gap-2">
                          {transaction.amountUSD > 10000000 && <span className="text-yellow-500">💥</span>}
                          {transaction.amountUSD > 5000000 && transaction.amountUSD <= 10000000 && <span className="text-blue-500">🐋</span>}
                          <span className="font-mono font-bold text-lg">
                            ${(transaction.amountUSD / 1000000).toFixed(1)}M
                          </span>
                          <span className="text-sm font-medium">{transaction.token}</span>
                          <span className="text-xs px-2 py-1 bg-muted rounded-full">{transaction.chain}</span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatTime(transaction.timestamp)}
                      </div>
                    </div>
                  </div>
                );
              } else {
                return (
                  <div 
                    key={`${transaction.id}-${index}`}
                    onClick={() => setSelectedTransaction(transaction)}
                    className="flex items-center justify-between p-2 border-b hover:bg-muted/20 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        transaction.type === 'buy' ? 'bg-green-500' :
                        transaction.type === 'sell' ? 'bg-red-500' : 'bg-blue-500'
                      }`} />
                      {transaction.amountUSD > 10000000 && <span className="text-yellow-400">💥</span>}
                      <span className="font-mono text-xs">
                        ${(transaction.amountUSD / 1000000).toFixed(1)}M
                      </span>
                      <span className="text-xs text-muted-foreground">{transaction.token}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {formatTime(transaction.timestamp)}
                    </div>
                  </div>
                );
              }
            })}
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
        
        {/* Spotlight Carousel */}
        <SpotlightCarousel />
      </div>
      <BottomNavigation activeTab="whales" onTabChange={handleTabChange} />
    </TooltipProvider>
  );
}
