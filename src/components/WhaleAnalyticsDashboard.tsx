import React, { useState, useMemo } from 'react';

// Types
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

// Utility functions
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toFixed(2);
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getRiskColor = (score: number): string => {
  if (score >= 70) return '#dc2626';
  if (score >= 40) return '#f59e0b';
  return '#16a34a';
};

const getRiskBadge = (score: number) => {
  if (score >= 70) return { label: 'High Risk', color: '#dc2626', bgColor: '#fef2f2' };
  if (score >= 40) return { label: 'Medium Risk', color: '#f59e0b', bgColor: '#fef3c7' };
  return { label: 'Low Risk', color: '#16a34a', bgColor: '#f0fdf4' };
};

const getExplorerUrl = (address: string, chain: string): string => {
  const baseUrls: Record<string, string> = {
    ethereum: 'https://etherscan.io/address/',
    polygon: 'https://polygonscan.com/address/',
    bsc: 'https://bscscan.com/address/',
  };
  return `${baseUrls[chain] || baseUrls.ethereum}${address}`;
};

const getTxExplorerUrl = (txHash: string, chain: string): string => {
  const baseUrls: Record<string, string> = {
    ethereum: 'https://etherscan.io/tx/',
    polygon: 'https://polygonscan.com/tx/',
    bsc: 'https://bscscan.com/tx/',
  };
  return `${baseUrls[chain] || baseUrls.ethereum}${txHash}`;
};

// Sample mock data
const mockWhales: WhaleData[] = [
  {
    id: 'whale-1',
    address: '0xBE0eB53F...404d33E8',
    fullAddress: '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8',
    label: 'Whale 1',
    balance: 1996008.37,
    balanceUsd: 6826348626.27,
    riskScore: 85,
    recentActivity: 12,
    chain: 'ethereum',
    reasons: ['Extremely large balance: $6.8B', 'High liquidity whale: 2.0M ETH'],
    supporting_events: ['0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456'],
    provider: 'whale-analytics',
    method: 'balance_risk_analysis',
    confidence: 0.85
  },
  {
    id: 'whale-2',
    address: '0x40B38765...8E418E489',
    fullAddress: '0x40B38765696e3d5d8d9d834D8AaD4bB6e418E489',
    label: 'Whale 2',
    balance: 1177794.80,
    balanceUsd: 4028058230.23,
    riskScore: 75,
    recentActivity: 8,
    chain: 'ethereum',
    reasons: ['Large balance: $4.0B', 'High liquidity whale: 1.2M ETH'],
    supporting_events: ['0xb2c3d4e5f6789012345678901234567890abcdef1234567890abcdef1234567'],
    provider: 'whale-analytics',
    method: 'balance_risk_analysis',
    confidence: 0.78
  }
];

const mockMetrics: MarketMetrics = {
  volume24h: 2847,
  activeWhales: 8,
  riskAlerts: 3,
  topSignals: [
    { signal_type: 'risk_score', confidence: 0.85, value: '85' },
    { signal_type: 'large_transfer', confidence: 0.78, value: '1200' },
    { signal_type: 'balance_change', confidence: 0.72, value: '15' }
  ]
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

// Main dashboard component
const WhaleAnalyticsDashboard: React.FC<{
  whales?: WhaleData[];
  metrics?: MarketMetrics;
  loading?: boolean;
  error?: string;
}> = ({ 
  whales = mockWhales, 
  metrics = mockMetrics, 
  loading = false, 
  error = null 
}) => {
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
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <svg style={{width: '32px', height: '32px', color: '#3b82f6'}} fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
        </svg>
        <div>
          <h1 style={styles.title}>Whale Analytics</h1>
          <p style={styles.subtitle}>AI-powered whale risk assessment</p>
        </div>
      </div>

      {/* Simple whale list */}
      <div role="main" aria-label="Whale analytics results">
        {whales.length > 0 ? (
          whales.map(whale => (
            <div key={whale.id} style={styles.card}>
              <h3>{whale.label}</h3>
              <p>Balance: {formatNumber(whale.balance)} ETH ({formatCurrency(whale.balanceUsd)})</p>
              <p>Risk Score: <span style={{color: getRiskColor(whale.riskScore)}}>{whale.riskScore}/100</span></p>
            </div>
          ))
        ) : (
          <div style={styles.card}>
            <div style={{textAlign: 'center', padding: '40px'}}>
              <h3 style={{margin: '0 0 8px 0', color: '#111827'}}>No Whales Found</h3>
              <p style={{margin: 0, color: '#6b7280'}}>No whale data available at this time.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WhaleAnalyticsDashboard;