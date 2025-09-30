import { useState, useEffect, useMemo } from 'react';
import { Fish, Info, ExternalLink, Shield, Database, Activity, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { assessWhaleRisk } from '@/lib/whaleRiskScore';
import { useWindowSize } from '@/hooks/use-mobile';

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

// Individual whale card component with mobile-first design
const WhaleCard = ({ whale }: { whale: WhaleData }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [showRiskFactors, setShowRiskFactors] = useState(false);
  const { width: windowWidth } = useWindowSize();
  const riskBadge = getRiskBadge(whale.riskScore);
  const isMobile = windowWidth < 640;

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
    <Card 
      className="hover:shadow-md transition-shadow" 
      style={{
        padding: isMobile ? '8px' : '16px'
      }}
      role="article" 
      aria-label={`Whale ${whale.label}`}
    >
      {/* Header with address, risk badge, and inline provenance */}
      <div 
        className="flex justify-between gap-2 mb-3"
        style={{
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center'
        }}
      >
        <div className="flex items-center gap-2">
          <Fish 
            className="text-primary" 
            style={{ width: isMobile ? '16px' : '20px', height: isMobile ? '16px' : '20px' }}
            aria-hidden="true" 
          />
          <div>
            <h3 
              className="font-semibold"
              style={{ fontSize: isMobile ? '14px' : '16px' }}
            >
              {whale.label}
            </h3>
            <a
              href={getWalletExplorerUrl(whale.fullAddress, whale.chain)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1"
              style={{ fontSize: isMobile ? '11px' : '14px' }}
              aria-label={`View wallet ${whale.fullAddress} on blockchain explorer`}
            >
              <code>{whale.address}</code>
              <ExternalLink 
                style={{ width: '12px', height: '12px' }}
                aria-hidden="true" 
              />
            </a>
          </div>
        </div>
        
        {/* Inline provenance badges - always visible */}
        <div 
          className="flex items-center gap-1"
          style={{
            flexWrap: 'wrap',
            gap: isMobile ? '4px' : '8px'
          }}
        >
          <Badge 
            variant="outline" 
            style={{ 
              fontSize: isMobile ? '9px' : '11px',
              padding: isMobile ? '2px 4px' : '4px 8px'
            }}
          >
            <Database 
              style={{ 
                width: isMobile ? '10px' : '12px', 
                height: isMobile ? '10px' : '12px',
                marginRight: '2px'
              }}
              aria-hidden="true" 
            />
            {whale.provider}
          </Badge>
          <Badge 
            variant="outline" 
            style={{ 
              fontSize: isMobile ? '9px' : '11px',
              padding: isMobile ? '2px 4px' : '4px 8px'
            }}
          >
            <Shield 
              style={{ 
                width: isMobile ? '10px' : '12px', 
                height: isMobile ? '10px' : '12px',
                marginRight: '2px'
              }}
              aria-hidden="true" 
            />
            {Math.round(whale.confidence * 100)}%
          </Badge>
          <Badge 
            variant={riskBadge.variant} 
            className="font-medium"
            style={{ 
              fontSize: isMobile ? '9px' : '11px',
              padding: isMobile ? '2px 4px' : '4px 8px'
            }}
          >
            {isMobile ? riskBadge.label.split(' ')[0] : riskBadge.label}
          </Badge>
        </div>
      </div>

      {/* Metrics grid */}
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
          gap: isMobile ? '8px' : '16px',
          marginBottom: isMobile ? '8px' : '16px'
        }}
      >
        <div>
          <p 
            className="text-muted-foreground"
            style={{ fontSize: isMobile ? '10px' : '14px' }}
          >
            Balance
          </p>
          <p 
            className="font-medium"
            style={{ fontSize: isMobile ? '12px' : '14px' }}
          >
            {whale.balance.toLocaleString('en-US', { 
              minimumFractionDigits: isMobile ? 0 : 2, 
              maximumFractionDigits: 2 
            })} ETH
          </p>
        </div>
        <div>
          <p 
            className="text-muted-foreground"
            style={{ fontSize: isMobile ? '10px' : '14px' }}
          >
            Activity
          </p>
          <p 
            className="font-medium flex items-center gap-1"
            style={{ fontSize: isMobile ? '12px' : '14px' }}
          >
            <Activity 
              style={{ width: '12px', height: '12px' }}
              aria-hidden="true" 
            />
            {whale.recentActivity}
          </p>
        </div>
        {!isMobile && (
          <div className="relative">
            <p 
              className="text-muted-foreground"
              style={{ fontSize: '14px' }}
            >
              Risk Score
            </p>
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
        )}
      </div>

      {/* Mobile Risk Score Row */}
      {isMobile && (
        <div 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '8px',
            padding: '4px 8px',
            backgroundColor: 'rgba(0,0,0,0.02)',
            borderRadius: '4px'
          }}
        >
          <span style={{ fontSize: '10px' }} className="text-muted-foreground">
            Risk Score
          </span>
          <span 
            className={`font-bold ${getRiskColor(whale.riskScore)}`}
            style={{ fontSize: '12px' }}
          >
            {whale.riskScore}/100
          </span>
        </div>
      )}

      {/* Collapsible risk factors panel */}
      {whale.reasons.length > 0 && whale.reasons[0] !== 'No risk analysis available' && (
        <div style={{ marginBottom: isMobile ? '8px' : '16px' }}>
          <button
            onClick={() => setShowRiskFactors(!showRiskFactors)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setShowRiskFactors(!showRiskFactors);
              }
            }}
            className="w-full text-left bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-950/30 transition-colors"
            style={{ padding: isMobile ? '8px' : '12px' }}
            aria-expanded={showRiskFactors}
            aria-controls={`risk-factors-${whale.id}`}
          >
            <div className="flex items-center justify-between">
              <h4 
                className="font-medium flex items-center gap-2"
                style={{ fontSize: isMobile ? '12px' : '14px' }}
              >
                <AlertTriangle 
                  className="text-orange-600" 
                  style={{ width: isMobile ? '12px' : '16px', height: isMobile ? '12px' : '16px' }}
                  aria-hidden="true" 
                />
                Risk Factors ({whale.reasons.length})
              </h4>
              <span 
                className="text-orange-600 transform transition-transform" 
                style={{
                  transform: showRiskFactors ? 'rotate(180deg)' : 'rotate(0deg)',
                  fontSize: isMobile ? '12px' : '14px'
                }}
              >
                ▼
              </span>
            </div>
          </button>
          {showRiskFactors && (
            <div 
              id={`risk-factors-${whale.id}`}
              className="mt-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800"
              style={{ padding: isMobile ? '8px' : '12px' }}
              role="region"
              aria-labelledby={`risk-factors-header-${whale.id}`}
            >
              <ul className="space-y-1" role="list">
                {whale.reasons.map((reason, idx) => (
                  <li 
                    key={idx} 
                    className="flex items-start gap-2" 
                    style={{ fontSize: isMobile ? '11px' : '14px' }}
                    role="listitem"
                  >
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
        <div 
          className="bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800"
          style={{ padding: isMobile ? '8px' : '12px' }}
        >
          <h4 
            className="font-medium flex items-center gap-2"
            style={{ 
              fontSize: isMobile ? '12px' : '14px',
              marginBottom: isMobile ? '4px' : '8px'
            }}
          >
            <ExternalLink 
              className="text-blue-600" 
              style={{ width: isMobile ? '12px' : '16px', height: isMobile ? '12px' : '16px' }}
              aria-hidden="true" 
            />
            Supporting Evidence
          </h4>
          <div 
            className="flex flex-wrap gap-1" 
            style={{ gap: isMobile ? '4px' : '8px' }}
            role="list"
          >
            {whale.supporting_events.slice(0, isMobile ? 2 : 4).map((txHash, idx) => (
              <a
                key={idx}
                href={getExplorerUrl(txHash, whale.chain)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                style={{ 
                  padding: isMobile ? '2px 4px' : '4px 8px',
                  fontSize: isMobile ? '9px' : '12px'
                }}
                role="listitem"
                aria-label={`View transaction ${txHash} on blockchain explorer`}
              >
                <code>{txHash.slice(0, 4)}...{txHash.slice(-2)}</code>
                <ExternalLink 
                  style={{ width: '10px', height: '10px' }}
                  aria-hidden="true" 
                />
              </a>
            ))}
            {whale.supporting_events.length > (isMobile ? 2 : 4) && (
              <span 
                className="inline-flex items-center bg-muted text-muted-foreground rounded"
                style={{ 
                  padding: isMobile ? '2px 4px' : '4px 8px',
                  fontSize: isMobile ? '9px' : '12px'
                }}
              >
                +{whale.supporting_events.length - (isMobile ? 2 : 4)} more
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
};

// Simple header component without market metrics
const SimpleHeader = () => {
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth < 640;

  return (
    <div style={{ marginBottom: isMobile ? '16px' : '24px' }}>
      {/* Main header */}
      <div className="flex items-center gap-3">
        <div 
          className="bg-primary/20 rounded-xl"
          style={{ padding: isMobile ? '6px' : '8px' }}
        >
          <Fish 
            className="text-primary" 
            style={{ width: isMobile ? '20px' : '24px', height: isMobile ? '20px' : '24px' }}
            aria-hidden="true" 
          />
        </div>
        <div>
          <h1 
            className="font-bold"
            style={{ fontSize: isMobile ? '18px' : '24px' }}
          >
            Whale Analytics
          </h1>
          <p 
            className="text-muted-foreground"
            style={{ fontSize: isMobile ? '12px' : '14px' }}
          >
            AI-powered whale risk assessment and detailed analysis
          </p>
        </div>
      </div>
    </div>
  );
};

// Main WhaleAnalytics component
export default function WhaleAnalytics() {
  const [whales, setWhales] = useState<WhaleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { width: windowWidth } = useWindowSize();
  const isMobile = windowWidth < 640;

  // Fetch whale data directly from database
  const fetchWhaleData = async () => {
    try {
      setLoading(true);
      setError(null);

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
    <div 
      className="container mx-auto"
      style={{
        padding: isMobile ? '8px' : '24px',
        gap: isMobile ? '12px' : '24px',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Simple Header */}
      <SimpleHeader />

      {/* Loading state */}
      {loading && (
        <div style={{ gap: isMobile ? '8px' : '16px', display: 'flex', flexDirection: 'column' }} aria-label="Loading whale data">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card 
              key={i} 
              className="animate-pulse"
              style={{ padding: isMobile ? '8px' : '16px' }}
            >
              <div className="h-4 bg-muted rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </Card>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card style={{ padding: isMobile ? '16px' : '24px', textAlign: 'center' }}>
          <AlertTriangle className="mx-auto mb-4 text-red-500" style={{ width: '48px', height: '48px' }} />
          <h3 
            className="font-medium mb-2"
            style={{ fontSize: isMobile ? '16px' : '18px' }}
          >
            No Whale Data Available
          </h3>
          <p 
            className="text-red-600 mb-4"
            style={{ fontSize: isMobile ? '12px' : '14px' }}
          >
            {error}
          </p>
          <div style={{ gap: '12px', display: 'flex', flexDirection: 'column' }}>
            <button 
              onClick={fetchWhaleData}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              style={{ fontSize: isMobile ? '12px' : '14px' }}
            >
              Retry
            </button>
            <div 
              className="text-muted-foreground"
              style={{ fontSize: isMobile ? '11px' : '14px', marginTop: '16px' }}
            >
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
                style={{ fontSize: isMobile ? '12px' : '14px' }}
              >
                {loading ? 'Ingesting...' : 'Ingest Live Data'}
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Whale list */}
      {!loading && !error && (
        <div style={{ gap: isMobile ? '8px' : '16px', display: 'flex', flexDirection: 'column' }} role="main" aria-label="Whale analytics results">
          {sortedWhales.length > 0 ? (
            <>
              <div 
                className="text-muted-foreground"
                style={{ 
                  fontSize: isMobile ? '11px' : '14px',
                  marginBottom: isMobile ? '8px' : '16px'
                }}
              >
                Showing {sortedWhales.length} whales from live database
              </div>
              {sortedWhales.map(whale => (
                <WhaleCard key={whale.id} whale={whale} />
              ))}
            </>
          ) : (
            !loading && !error && (
              <Card style={{ padding: isMobile ? '24px' : '32px', textAlign: 'center' }}>
                <Fish className="mx-auto mb-4 text-muted-foreground" style={{ width: '48px', height: '48px' }} aria-hidden="true" />
                <h3 
                  className="font-medium mb-2"
                  style={{ fontSize: isMobile ? '16px' : '18px' }}
                >
                  No Whales Found
                </h3>
                <p 
                  className="text-muted-foreground mb-4"
                  style={{ fontSize: isMobile ? '12px' : '14px' }}
                >
                  No whale data available in the database.
                </p>
                <div 
                  className="text-muted-foreground"
                  style={{ fontSize: isMobile ? '11px' : '14px' }}
                >
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
        <Card style={{ padding: isMobile ? '12px' : '16px' }}>
          <div className="flex justify-between items-start mb-4">
            <h3 
              className="font-semibold"
              style={{ fontSize: isMobile ? '14px' : '16px' }}
            >
              Risk Summary
            </h3>
            <Badge 
              variant="outline" 
              style={{ fontSize: isMobile ? '9px' : '11px' }}
            >
              <Database 
                style={{ 
                  width: isMobile ? '10px' : '12px', 
                  height: isMobile ? '10px' : '12px',
                  marginRight: '4px'
                }}
              />
              Live Data
            </Badge>
          </div>
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: isMobile ? '8px' : '16px',
              fontSize: isMobile ? '12px' : '14px'
            }}
          >
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