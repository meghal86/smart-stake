import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ContextualTooltip, useContextualTooltips } from '@/components/ui/ContextualTooltip';

// Type definitions for whale data
interface WhaleData {
  id: string;
  address: string;
  fullAddress: string;
  label: string;
  balance: number;
  balanceUsd: number;
  riskScore: number;
  recentActivity: number;
  chain: string;
  reasons: string[];
  supporting_events: string[];
  provider: string;
  method: string;
  confidence: number;
}

interface MarketMetrics {
  volume24h: number;
  activeWhales: number;
  riskAlerts: number;
  topSignals: Array<{
    signal_type: string;
    confidence: number;
    value: string;
  }>;
}

// Helper functions
const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).toLocaleString();
};

const formatCurrency = (num: number): string => {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(1)}K`;
  return `$${num.toFixed(2)}`;
};

const getRiskColor = (score: number): string => {
  if (score >= 70) return '#dc2626';
  if (score >= 40) return '#d97706';
  return '#16a34a';
};

const getRiskBadge = (score: number): { color: string; bgColor: string; label: string } => {
  if (score >= 70) return { color: '#dc2626', bgColor: '#fef2f2', label: 'High Risk' };
  if (score >= 40) return { color: '#d97706', bgColor: '#fffbeb', label: 'Medium Risk' };
  return { color: '#16a34a', bgColor: '#f0fdf4', label: 'Low Risk' };
};

const getExplorerUrl = (address: string, chain: string = 'ethereum'): string => {
  const explorers = {
    ethereum: 'https://etherscan.io/address/',
    polygon: 'https://polygonscan.com/address/',
    bsc: 'https://bscscan.com/address/'
  };
  return (explorers[chain as keyof typeof explorers] || explorers.ethereum) + address;
};

const getTxExplorerUrl = (txHash: string, chain: string = 'ethereum'): string => {
  const explorers = {
    ethereum: 'https://etherscan.io/tx/',
    polygon: 'https://polygonscan.com/tx/',
    bsc: 'https://bscscan.com/tx/'
  };
  return (explorers[chain as keyof typeof explorers] || explorers.ethereum) + txHash;
};

// Data fetching functions
const fetchWhaleData = async (): Promise<WhaleData[]> => {
  try {
    const { data: balances } = await supabase
      .from('whale_balances')
      .select('address, balance, balance_usd, chain, provider, method')
      .order('balance_usd', { ascending: false })
      .limit(50);

    const { data: signals } = await supabase
      .from('whale_signals')
      .select('address, chain, risk_score, confidence, reasons, supporting_events, provider, method');

    const { data: transfers } = await supabase
      .from('whale_transfers')
      .select('from_address, to_address')
      .gte('ts', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (!balances) return [];

    return balances.map((whale, index) => {
      const signal = signals?.find(s => s.address === whale.address && s.chain === whale.chain);
      const recentActivity = transfers?.filter(t => 
        t.from_address === whale.address || t.to_address === whale.address
      ).length || 0;

      return {
        id: `whale-${index}`,
        address: whale.address.slice(0, 10) + '...' + whale.address.slice(-6),
        fullAddress: whale.address,
        label: `Whale ${index + 1}`,
        balance: parseFloat(String(whale.balance)) || 0,
        balanceUsd: whale.balance_usd || 0,
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
  } catch (error) {
    console.error('Failed to fetch whale data:', error);
    return [];
  }
};

const fetchMetrics = async (): Promise<MarketMetrics> => {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: transferData } = await supabase
      .from('whale_transfers')
      .select('value_usd')
      .gte('ts', yesterday)
      .not('value_usd', 'is', null);
    
    const volume24h = transferData?.reduce((sum, t) => sum + parseFloat(String(t.value_usd)), 0) / 1000000 || 0;
    
    const { count: activeWhales } = await supabase
      .from('whale_balances')
      .select('address', { count: 'exact', head: true })
      .gte('ts', yesterday);
    
    const { data: signalsData } = await supabase
      .from('whale_signals')
      .select('signal_type, confidence, value')
      .gte('ts', yesterday)
      .order('confidence', { ascending: false })
      .limit(5);
    
    return {
      volume24h: Math.round(volume24h),
      activeWhales: activeWhales || 0,
      riskAlerts: signalsData?.filter(s => s.value && parseFloat(String(s.value)) >= 70).length || 0,
      topSignals: (signalsData || []).map(s => ({
        signal_type: s.signal_type,
        confidence: s.confidence,
        value: String(s.value || 0)
      }))
    };
  } catch (error) {
    console.error('Failed to fetch metrics:', error);
    return { volume24h: 0, activeWhales: 0, riskAlerts: 0, topSignals: [] };
  }
};

// Inline styles
const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  card: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    marginBottom: '16px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    transition: 'box-shadow 0.2s'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '24px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '0 0 4px 0',
    color: '#111827'
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  metricCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  metricIcon: {
    width: '20px',
    height: '20px'
  },
  metricLabel: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '0 0 4px 0'
  },
  metricValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: 0,
    color: '#111827'
  },
  loading: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#6b7280'
  },
  error: {
    textAlign: 'center' as const,
    padding: '40px',
    color: '#dc2626',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px'
  }
};

// Individual whale card component
const WhaleCard: React.FC<{ whale: WhaleData }> = ({ whale }) => {
  const [showRiskFactors, setShowRiskFactors] = useState(false);
  const riskBadge = getRiskBadge(whale.riskScore);

  return (
    <div style={styles.card} data-tooltip="whale-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg style={{ width: '20px', height: '20px', color: '#3b82f6' }} fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
          </svg>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: '0 0 4px 0', color: '#111827' }}>{whale.label}</h3>
            <a
              href={getExplorerUrl(whale.fullAddress, whale.chain)}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '12px', color: '#3b82f6', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <code>{whale.address}</code>
              <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
              </svg>
            </a>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', backgroundColor: '#f9fafb', whiteSpace: 'nowrap', color: '#6b7280' }}>
            {whale.provider}
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', backgroundColor: '#f9fafb', whiteSpace: 'nowrap', color: '#6b7280' }}>
            {Math.round(whale.confidence * 100)}%
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', backgroundColor: riskBadge.bgColor, whiteSpace: 'nowrap', color: riskBadge.color }}>
            {riskBadge.label}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '16px', marginBottom: '16px' }}>
        <div>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Balance</p>
          <p style={{ fontSize: '14px', fontWeight: '500', margin: 0, color: '#111827' }}>{formatNumber(whale.balance)} ETH</p>
        </div>
        <div>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>USD Value</p>
          <p style={{ fontSize: '14px', fontWeight: '500', margin: 0, color: '#111827' }}>{formatCurrency(whale.balanceUsd)}</p>
        </div>
        <div>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Activity</p>
          <p style={{ fontSize: '14px', fontWeight: '500', margin: 0, color: '#111827' }}>{whale.recentActivity}</p>
        </div>
        <div>
          <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Risk Score</p>
          <p style={{ fontSize: '14px', fontWeight: '500', margin: 0, color: getRiskColor(whale.riskScore) }}>
            {whale.riskScore}/100
          </p>
        </div>
      </div>

      {whale.reasons.length > 0 && whale.reasons[0] !== 'No risk analysis available' && (
        <div>
          <button
            onClick={() => setShowRiskFactors(!showRiskFactors)}
            style={{
              width: '100%',
              textAlign: 'left' as const,
              padding: '12px',
              backgroundColor: showRiskFactors ? '#fde68a' : '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
              marginBottom: '8px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#92400e', margin: 0 }}>
                ⚠️ Risk Factors ({whale.reasons.length})
              </h4>
              <span style={{ color: '#f59e0b', transform: showRiskFactors ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                ▼
              </span>
            </div>
          </button>
          {showRiskFactors && (
            <div style={{ padding: '12px', backgroundColor: '#fef3c7', border: '1px solid #f59e0b', borderRadius: '6px', marginBottom: '16px' }}>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {whale.reasons.map((reason, idx) => (
                  <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '4px', fontSize: '14px', color: '#92400e' }}>
                    <span>•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {whale.supporting_events.length > 0 && (
        <div style={{ padding: '12px', backgroundColor: '#dbeafe', border: '1px solid #3b82f6', borderRadius: '6px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: '500', color: '#1e40af', margin: '0 0 8px 0' }}>
            🔗 Supporting Evidence
          </h4>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {whale.supporting_events.slice(0, 4).map((txHash, idx) => (
              <a
                key={idx}
                href={getTxExplorerUrl(txHash, whale.chain)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', backgroundColor: '#bfdbfe', color: '#1e40af', textDecoration: 'none', borderRadius: '4px', fontSize: '12px', transition: 'background-color 0.2s' }}
              >
                <code>{txHash.slice(0, 6)}...{txHash.slice(-4)}</code>
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                </svg>
              </a>
            ))}
            {whale.supporting_events.length > 4 && (
              <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 8px', fontSize: '12px', backgroundColor: '#f3f4f6', borderRadius: '4px' }}>
                +{whale.supporting_events.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Main dashboard component
const WhaleAnalyticsDashboard: React.FC = () => {
  const [whales, setWhales] = useState<WhaleData[]>([]);
  const [metrics, setMetrics] = useState<MarketMetrics>({ volume24h: 0, activeWhales: 0, riskAlerts: 0, topSignals: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { activeTooltip, startTooltip, completeTooltip } = useContextualTooltips();

  const tooltipSteps = [
    {
      id: 'metrics',
      target: '[data-tooltip="metrics"]',
      title: 'Market Metrics',
      content: 'These cards show real-time whale activity metrics including 24h volume, active whales, and risk alerts.',
      position: 'bottom' as const
    },
    {
      id: 'whale-card',
      target: '[data-tooltip="whale-card"]',
      title: 'Whale Analysis',
      content: 'Each card shows a whale address with balance, risk score, and recent activity. Click risk factors to see detailed analysis.',
      position: 'top' as const
    },
    {
      id: 'risk-summary',
      target: '[data-tooltip="risk-summary"]',
      title: 'Risk Summary',
      content: 'Overview of risk distribution across all tracked whales. High risk whales require immediate attention.',
      position: 'top' as const
    }
  ];

  useEffect(() => {
    if (!loading && whales.length > 0) {
      setTimeout(() => startTooltip('whale-analytics'), 1000);
    }
  }, [loading, whales.length, startTooltip]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [whaleData, metricsData] = await Promise.all([
          fetchWhaleData(),
          fetchMetrics()
        ]);
        setWhales(whaleData);
        setMetrics(metricsData);
        if (whaleData.length === 0) {
          setError('No whale data found in database');
        }
      } catch (err: any) {
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const sortedWhales = useMemo(() => 
    [...whales].sort((a, b) => b.riskScore - a.riskScore),
    [whales]
  );

  const riskCounts = useMemo(() => ({
    high: sortedWhales.filter(w => w.riskScore >= 70).length,
    medium: sortedWhales.filter(w => w.riskScore >= 40 && w.riskScore < 70).length,
    low: sortedWhales.filter(w => w.riskScore < 40).length
  }), [sortedWhales]);

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>
          <p>Loading whale analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.error}>
          <h3>Error Loading Data</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <ContextualTooltip
        steps={tooltipSteps}
        isActive={activeTooltip === 'whale-analytics'}
        onComplete={() => completeTooltip('whale-analytics')}
      />
      <div style={styles.container}>
      <div style={styles.header}>
        <svg style={{width: '32px', height: '32px', color: '#3b82f6'}} fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
        </svg>
        <div>
          <h1 style={styles.title}>Whale Analytics</h1>
          <p style={styles.subtitle}>AI-powered whale risk assessment - Live Data</p>
        </div>
      </div>

      <div style={styles.metricsGrid} data-tooltip="metrics">
        <div style={styles.metricCard}>
          <svg style={{...styles.metricIcon, color: '#16a34a'}} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
          </svg>
          <div>
            <p style={styles.metricLabel}>24h Volume</p>
            <p style={styles.metricValue}>${metrics.volume24h.toLocaleString()}M</p>
          </div>
        </div>
        
        <div style={styles.metricCard}>
          <svg style={{...styles.metricIcon, color: '#3b82f6'}} fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          <div>
            <p style={styles.metricLabel}>Active Whales</p>
            <p style={styles.metricValue}>{metrics.activeWhales}</p>
          </div>
        </div>
        
        <div style={styles.metricCard}>
          <svg style={{...styles.metricIcon, color: '#f59e0b'}} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <p style={styles.metricLabel}>Risk Alerts</p>
            <p style={styles.metricValue}>{metrics.riskAlerts}</p>
          </div>
        </div>
      </div>

      {metrics.topSignals.length > 0 && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px', marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', color: '#111827' }}>
            ⚠️ Current Market Signals
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {metrics.topSignals.map((signal, idx) => (
              <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', backgroundColor: '#f9fafb', whiteSpace: 'nowrap' }}>
                <span style={{textTransform: 'capitalize'}}>
                  {signal.signal_type.replace('_', ' ')}
                </span>
                <span style={{opacity: 0.7, fontSize: '11px'}}>
                  ({Math.round((signal.confidence || 0) * 100)}%)
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        {sortedWhales.length > 0 ? (
          <>
            <div style={{marginBottom: '16px', fontSize: '14px', color: '#6b7280'}}>
              Showing {sortedWhales.length} whales from live database
            </div>
            {sortedWhales.map(whale => (
              <WhaleCard key={whale.id} whale={whale} />
            ))}
          </>
        ) : (
          <div style={styles.card}>
            <div style={{textAlign: 'center', padding: '40px'}}>
              <svg style={{width: '48px', height: '48px', color: '#9ca3af', margin: '0 auto 16px'}} fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              </svg>
              <h3 style={{margin: '0 0 8px 0', color: '#111827'}}>No Whales Found</h3>
              <p style={{margin: 0, color: '#6b7280'}}>No whale data available in database.</p>
            </div>
          </div>
        )}
      </div>

      {sortedWhales.length > 0 && (
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }} data-tooltip="risk-summary">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#111827' }}>Risk Summary</h3>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '4px 8px', fontSize: '12px', border: '1px solid #e5e7eb', borderRadius: '4px', backgroundColor: '#f9fafb', whiteSpace: 'nowrap', color: '#6b7280' }}>
              Live Data
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>High Risk</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#dc2626' }}>
                {riskCounts.high}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Medium Risk</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#d97706' }}>
                {riskCounts.medium}
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '12px', color: '#6b7280', margin: '0 0 4px 0' }}>Low Risk</p>
              <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, color: '#16a34a' }}>
                {riskCounts.low}
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
};

export default WhaleAnalyticsDashboard;