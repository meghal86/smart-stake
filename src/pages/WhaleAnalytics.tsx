import { useState, useEffect, useMemo } from 'react';
import { Fish, Info, ExternalLink, Shield, Database, Activity, TrendingUp, Users, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { assessWhaleRisk } from '@/lib/whaleRiskScore';
import { MarketMakerFlowSentinel } from '@/components/premium/MarketMakerFlowSentinel';

// Whale data interface with risk scoring fields
interface WhaleData {
  id: string;
  address: string;
  fullAddress: string;
  label: string;
  balance: number;
  riskScore: number;
  recentActivity: number;
  chain: string;
  // Risk analysis fields
  reasons: string[];
  supporting_events: string[];
  provider: string;
  method: string;
  confidence: number;
}

// Market metrics interface
interface MarketMetrics {
  volume24h: number;
  activeWhales: number;
  topSignals: Array<{
    signal_type: string;
    confidence: number;
    value: string;
  }>;
}

// Blockchain explorer URLs for different chains
const getExplorerUrl = (txHash: string, chain: string = 'ethereum'): string => {
  const explorers = {
    ethereum: 'https://etherscan.io/tx/',
    polygon: 'https://polygonscan.com/tx/',
    bsc: 'https://bscscan.com/tx/'
  };
  return (explorers[chain as keyof typeof explorers] || explorers.ethereum) + txHash;
};

// Risk score color coding
const getRiskColor = (score: number): string => {
  if (score >= 70) return 'text-red-600';
  if (score >= 40) return 'text-yellow-600';
  return 'text-green-600';
};

// Risk level badge variant
const getRiskBadge = (score: number): { variant: 'destructive' | 'default' | 'secondary', label: string } => {
  if (score >= 70) return { variant: 'destructive', label: 'High Risk' };
  if (score >= 40) return { variant: 'default', label: 'Medium Risk' };
  return { variant: 'secondary', label: 'Low Risk' };
};

// Individual whale card component with inline explainability
const WhaleCard = ({ whale }: { whale: WhaleData }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showRiskFactors, setShowRiskFactors] = useState(false);
  const riskBadge = getRiskBadge(whale.riskScore);

  // Get blockchain explorer URL for wallet address
  const getWalletExplorerUrl = (address: string, chain: string = 'ethereum'): string => {
    const explorers = {
      ethereum: 'https://etherscan.io/address/',
      polygon: 'https://polygonscan.com/address/',
      bsc: 'https://bscscan.com/address/'
    };
    return (explorers[chain as keyof typeof explorers] || explorers.ethereum) + address;
  };

  return (
    <Card className="p-4 hover:shadow-md transition-shadow" role="article" aria-label={`Whale ${whale.label}`}>
      {/* Header with address, risk badge, and inline provenance */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Fish className="h-5 w-5 text-primary" aria-hidden="true" />
          <div>
            <h3 className="font-semibold">{whale.label}</h3>
            <a
              href={getWalletExplorerUrl(whale.fullAddress, whale.chain)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
              aria-label={`View wallet ${whale.fullAddress} on blockchain explorer`}
            >
              <code>{whale.address}</code>
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </a>
          </div>
        </div>
        
        {/* Inline provenance badges - always visible */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <Database className="h-3 w-3 mr-1" aria-hidden="true" />
            {whale.provider}
          </Badge>
          <Badge variant="outline" className="text-xs">
            <Shield className="h-3 w-3 mr-1" aria-hidden="true" />
            {Math.round(whale.confidence * 100)}%
          </Badge>
          <Badge variant={riskBadge.variant} className="font-medium">
            {riskBadge.label}
          </Badge>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-muted-foreground">Balance</p>
          <p className="font-medium">{whale.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ETH</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Activity</p>
          <p className="font-medium flex items-center gap-1">
            <Activity className="h-3 w-3" aria-hidden="true" />
            {whale.recentActivity}
          </p>
        </div>
        <div className="relative col-span-2 sm:col-span-1">
          <p className="text-sm text-muted-foreground">Risk Score</p>
          <div className="flex items-center gap-2">
            <span className={`font-bold ${getRiskColor(whale.riskScore)}`}>
              {whale.riskScore}/100
            </span>
            <button
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
              onFocus={() => setShowTooltip(true)}
              onBlur={() => setShowTooltip(false)}
              className="text-muted-foreground hover:text-primary transition-colors"
              aria-label="Show detailed risk analysis"
            >
              <Info className="h-4 w-4" />
            </button>
          </div>

          {/* Enhanced tooltip with full details */}
          {showTooltip && (
            <div 
              className="absolute top-full left-0 mt-2 p-4 bg-popover border rounded-lg shadow-lg w-80 z-10"
              role="tooltip"
              aria-live="polite"
            >
              <div className="text-xs text-muted-foreground mb-2">
                Method: {whale.method}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible risk factors panel */}
      {whale.reasons.length > 0 && whale.reasons[0] !== 'No risk analysis available' && (
        <div className="mb-4">
          <button
            onClick={() => setShowRiskFactors(!showRiskFactors)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowRiskFactors(!showRiskFactors);
              }
            }}
            className="w-full text-left p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors"
            aria-expanded={showRiskFactors}
            aria-controls={`risk-factors-${whale.id}`}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" aria-hidden="true" />
                Risk Factors ({whale.reasons.length})
              </h4>
              <span className="text-orange-600 transform transition-transform" style={{
                transform: showRiskFactors ? 'rotate(180deg)' : 'rotate(0deg)'
              }}>
                ▼
              </span>
            </div>
          </button>
          {showRiskFactors && (
            <div 
              id={`risk-factors-${whale.id}`}
              className="mt-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800"
              role="region"
              aria-labelledby={`risk-factors-header-${whale.id}`}
            >
              <ul className="space-y-1" role="list">
                {whale.reasons.map((reason, idx) => (
                  <li key={idx} className="text-sm flex items-start gap-2" role="listitem">
                    <span className="text-orange-500 mt-1 flex-shrink-0">•</span>
                    <span className="text-orange-800 dark:text-orange-200">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Inline supporting events - always visible */}
      {whale.supporting_events.length > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
            <ExternalLink className="h-4 w-4 text-blue-600" aria-hidden="true" />
            Supporting Evidence
          </h4>
          <div className="flex flex-wrap gap-2" role="list">
            {whale.supporting_events.slice(0, 4).map((txHash, idx) => (
              <a
                key={idx}
                href={getExplorerUrl(txHash, whale.chain)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                role="listitem"
                aria-label={`View transaction ${txHash} on blockchain explorer`}
              >
                <code>{txHash.slice(0, 6)}...{txHash.slice(-4)}</code>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            ))}
            {whale.supporting_events.length > 4 && (
              <span className="inline-flex items-center px-2 py-1 bg-muted text-muted-foreground rounded text-xs">
                +{whale.supporting_events.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

// Enhanced header component with market metrics
const EnhancedHeader = ({ metrics }: { metrics: MarketMetrics }) => {
  return (
    <div className="space-y-4">
      {/* Main header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-xl">
          <Fish className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Whale Analytics</h1>
          <p className="text-muted-foreground">AI-powered whale risk assessment</p>
        </div>
      </div>

      {/* Market metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-green-600" aria-hidden="true" />
            <div>
              <p className="text-sm text-muted-foreground">24h Volume</p>
              <p className="text-xl font-bold">${metrics.volume24h.toLocaleString()}M</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <div>
              <p className="text-sm text-muted-foreground">Active Whales</p>
              <p className="text-xl font-bold">{metrics.activeWhales}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-orange-600" aria-hidden="true" />
            <div>
              <p className="text-sm text-muted-foreground">Risk Alerts</p>
              <p className="text-xl font-bold">{metrics.topSignals.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Market signals prediction strip */}
      {metrics.topSignals.length > 0 && (
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4 text-orange-600" aria-hidden="true" />
            <span className="text-sm font-medium">Current Market Signals</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {metrics.topSignals.map((signal, idx) => (
              <Badge 
                key={idx} 
                variant="outline" 
                className="whitespace-nowrap flex items-center gap-1"
              >
                <span className="capitalize">{signal.signal_type.replace('_', ' ')}</span>
                <span className="text-xs opacity-70">({Math.round(signal.confidence * 100)}%)</span>
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// Main WhaleAnalytics component
export default function WhaleAnalytics() {
  const [whales, setWhales] = useState<WhaleData[]>([]);
  const [metrics, setMetrics] = useState<MarketMetrics>({ volume24h: 0, activeWhales: 0, topSignals: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch market metrics from database
  const fetchMarketMetrics = async (): Promise<MarketMetrics> => {
    try {
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      
      // Get 24h volume from whale_transfers
      const { data: transferData } = await supabase
        .from('whale_transfers')
        .select('value_usd')
        .gte('ts', yesterday)
        .not('value_usd', 'is', null);
      
      const volume24h = transferData?.reduce((sum, t) => sum + parseFloat(t.value_usd), 0) / 1000000 || 0;
      
      // Get active whales count from recent balances
      const { count: activeWhales } = await supabase
        .from('whale_balances')
        .select('address', { count: 'exact', head: true })
        .gte('ts', yesterday);
      
      // Get top market signals
      const { data: signalsData } = await supabase
        .from('whale_signals')
        .select('signal_type, confidence, value')
        .gte('ts', yesterday)
        .order('confidence', { ascending: false })
        .limit(5);
      
      return {
        volume24h: Math.round(volume24h),
        activeWhales: activeWhales || 0,
        topSignals: signalsData || []
      };
    } catch (error) {
      console.error('Failed to fetch market metrics:', error);
      return {
        volume24h: 0,
        activeWhales: 0,
        topSignals: []
      };
    }
  };

  // Fetch whale data directly from database
  const fetchWhaleData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch market metrics
      const metricsResult = await fetchMarketMetrics();
      setMetrics(metricsResult);

      // Fetch whale balances directly from database
      const { data: balances, error: balanceError } = await supabase
        .from('whale_balances')
        .select('address, balance, balance_usd, chain, ts, provider, method')
        .order('balance_usd', { ascending: false })
        .limit(50);

      if (balanceError) {
        console.error('Balance fetch error:', balanceError);
        throw new Error('Failed to fetch whale balances');
      }

      // Fetch whale signals for risk scores
      const { data: signals } = await supabase
        .from('whale_signals')
        .select('address, chain, risk_score, confidence, reasons, supporting_events, provider, method')
        .order('ts', { ascending: false });

      // Fetch recent transfers for activity calculation
      const { data: transfers } = await supabase
        .from('whale_transfers')
        .select('from_address, to_address, ts')
        .gte('ts', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      console.log('Database results:', {
        balances: balances?.length || 0,
        signals: signals?.length || 0,
        transfers: transfers?.length || 0
      });

      if (!balances || balances.length === 0) {
        setError('No whale data found in database. Please ensure whale_balances table has data.');
        setWhales([]);
        return;
      }

      // Transform database data to component format
      const enhancedWhales = balances.map((whale, index) => {
        // Find corresponding signal data
        const signal = signals?.find(s => s.address === whale.address && s.chain === whale.chain);
        
        // Calculate recent activity
        const recentActivity = transfers?.filter(t => 
          t.from_address === whale.address || t.to_address === whale.address
        ).length || 0;

        return {
          id: `whale-${index}`,
          address: whale.address.slice(0, 10) + '...' + whale.address.slice(-6),
          fullAddress: whale.address,
          label: `Whale ${index + 1}`,
          balance: parseFloat(whale.balance) || 0,
          riskScore: signal?.risk_score || 50,
          recentActivity,
          chain: whale.chain,
          reasons: signal?.reasons || ['No risk analysis available'],
          supporting_events: signal?.supporting_events || [],
          provider: signal?.provider || whale.provider,
          method: signal?.method || whale.method,
          confidence: signal?.confidence || 0.5
        };
      });

      setWhales(enhancedWhales);
    } catch (err) {
      console.error('Failed to fetch whale data:', err);
      setError(`Failed to load whale data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Ingest blockchain data
  const ingestBlockchainData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('blockchain-monitor');
      
      if (error) throw error;
      
      console.log('Blockchain ingestion result:', data);
      
      // Refresh whale data after ingestion
      await fetchWhaleData();
    } catch (error) {
      console.error('Blockchain ingestion failed:', error);
      setError(`Data ingestion failed: ${error.message}`);
    }
  };

  useEffect(() => {
    fetchWhaleData();
  }, []);

  // Memoized sorted whales for performance
  const sortedWhales = useMemo(() => 
    [...whales].sort((a, b) => b.riskScore - a.riskScore),
    [whales]
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Enhanced Header with Market Metrics */}
      <EnhancedHeader metrics={metrics} />

      {/* Market Maker Flow Sentinel - Premium Feature */}
      <MarketMakerFlowSentinel />

      {/* Loading state */}
      {loading && (
        <div className="space-y-4" aria-label="Loading whale data">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="p-4 animate-pulse">
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card className="p-6 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-500" />
          <h3 className="text-lg font-medium mb-2">No Whale Data Available</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="space-y-3">
            <button 
              onClick={fetchWhaleData}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors mr-2"
            >
              Retry
            </button>
            <div className="text-sm text-muted-foreground mt-4">
              <p className="mb-2">To populate whale data:</p>
              <ol className="text-left space-y-1">
                <li>1. Deploy blockchain-monitor Edge Function</li>
                <li>2. Configure ALCHEMY_API_KEY in Supabase secrets</li>
                <li>3. Click "Ingest Live Data" to fetch real blockchain data</li>
              </ol>
              <button 
                onClick={ingestBlockchainData}
                disabled={loading}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Ingesting...' : 'Ingest Live Data'}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Whale list */}
      {!loading && !error && (
        <div className="space-y-4" role="main" aria-label="Whale analytics results">
          {sortedWhales.length > 0 ? (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                Showing {sortedWhales.length} whales from live database
              </div>
              {sortedWhales.map(whale => (
                <WhaleCard key={whale.id} whale={whale} />
              ))}
            </>
          ) : (
            !loading && !error && (
              <Card className="p-8 text-center">
                <Fish className="h-12 w-12 mx-auto mb-4 text-muted-foreground" aria-hidden="true" />
                <h3 className="text-lg font-medium mb-2">No Whales Found</h3>
                <p className="text-muted-foreground mb-4">No whale data available in the database.</p>
                <div className="text-sm text-muted-foreground">
                  <p>Database tables checked:</p>
                  <ul className="mt-2 space-y-1">
                    <li>• whale_balances (primary data source)</li>
                    <li>• whale_signals (risk scores)</li>
                    <li>• whale_transfers (activity data)</li>
                  </ul>
                </div>
              </Card>
            )
          )}
        </div>
      )}

      {/* Summary stats and data source info */}
      {sortedWhales.length > 0 && (
        <Card className="p-4">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold">Risk Summary</h3>
            <Badge variant="outline" className="text-xs">
              <Database className="h-3 w-3 mr-1" />
              Live Data
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">High Risk</p>
              <p className="font-medium text-red-600">
                {sortedWhales.filter(w => w.riskScore >= 70).length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Medium Risk</p>
              <p className="font-medium text-yellow-600">
                {sortedWhales.filter(w => w.riskScore >= 40 && w.riskScore < 70).length}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Low Risk</p>
              <p className="font-medium text-green-600">
                {sortedWhales.filter(w => w.riskScore < 40).length}
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}