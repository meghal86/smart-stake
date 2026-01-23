import { useState, useCallback } from 'react';
import { PortfolioHub } from './PortfolioHub';
import { OverviewTab } from './tabs/OverviewTab';
import { PositionsTab } from './tabs/PositionsTab';
import { AuditTab } from './tabs/AuditTab';
import { CopilotChatDrawer } from './CopilotChatDrawer';
import { useUserAddresses } from '@/hooks/useUserAddresses';
import { useWalletSwitching } from '@/hooks/useWalletSwitching';
import { WalletScope, FreshnessConfidence } from '@/types/portfolio';
import { 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Bell, 
  MessageCircle,
  Wallet,
  RefreshCw,
  AlertTriangle 
} from 'lucide-react';

export function PortfolioRouteShell() {
  const [activeTab, setActiveTab] = useState<'overview' | 'positions' | 'audit'>('overview');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [walletScope, setWalletScope] = useState<WalletScope>({ mode: 'all_wallets' });

  // Use existing hooks
  const { addresses, loading: addressesLoading } = useUserAddresses();
  const { 
    activeWallet, 
    switchWallet, 
    getCurrentWalletScope,
    isLoading: walletSwitchLoading 
  } = useWalletSwitching();

  // Mock data - will be replaced with real API integration
  const [mockData] = useState({
    netWorth: 2450000,
    delta24h: 125000,
    freshness: {
      freshnessSec: 45,
      confidence: 0.85,
      confidenceThreshold: 0.70,
      degraded: false
    } as FreshnessConfidence,
    trustRiskSummary: {
      trustScore: 89,
      riskScore: 0.23,
      criticalIssues: 0,
      highRiskApprovals: 2
    },
    alertsCount: 3
  });

  const handleWalletScopeChange = useCallback((scope: WalletScope) => {
    setWalletScope(scope);
  }, []);

  const handleWalletSwitch = useCallback((walletId: string) => {
    switchWallet(walletId);
    const newScope = getCurrentWalletScope();
    setWalletScope(newScope);
  }, [switchWallet, getCurrentWalletScope]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(2)}%`;
  };

  // Tab configuration
  const tabs = [
    { 
      id: 'overview' as const, 
      label: 'Overview', 
      component: OverviewTab,
      icon: DollarSign 
    },
    { 
      id: 'positions' as const, 
      label: 'Positions', 
      component: PositionsTab,
      icon: TrendingUp 
    },
    { 
      id: 'audit' as const, 
      label: 'Audit', 
      component: AuditTab,
      icon: Shield 
    },
  ];

  const CurrentTabComponent = tabs.find(tab => tab.id === activeTab)?.component || OverviewTab;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      {/* Persistent AI Hub & Header */}
      <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50">
        {/* Always-visible elements */}
        <div className="px-4 py-3">
          {/* Top row: Wallet selector and AI Hub */}
          <div className="flex items-center justify-between mb-4">
            {/* Wallet Switching */}
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-blue-400" />
              <select
                value={activeWallet || ''}
                onChange={(e) => handleWalletSwitch(e.target.value)}
                disabled={addressesLoading || walletSwitchLoading}
                className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1 text-white text-sm min-w-[120px]"
              >
                <option value="">All Wallets</option>
                {addresses.map((addr) => (
                  <option key={addr.id} value={addr.id}>
                    {addr.label || `${addr.address.slice(0, 6)}...${addr.address.slice(-4)}`}
                  </option>
                ))}
              </select>
            </div>

            {/* AI Hub Button */}
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span className="hidden sm:inline">AI Hub</span>
            </button>
          </div>

          {/* Always-visible metrics row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            {/* Net Worth */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">Net Worth</span>
              </div>
              <div className="text-lg font-semibold text-white">
                {formatCurrency(mockData.netWorth)}
              </div>
            </div>

            {/* 24h Delta */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">24h Change</span>
              </div>
              <div className={`text-lg font-semibold ${
                mockData.delta24h >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {formatCurrency(mockData.delta24h)}
              </div>
            </div>

            {/* Freshness */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <RefreshCw className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-400">Freshness</span>
              </div>
              <div className="text-lg font-semibold text-white">
                {mockData.freshness.freshnessSec}s
              </div>
            </div>

            {/* Trust/Risk Summary */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-gray-400">Trust Score</span>
              </div>
              <div className="text-lg font-semibold text-cyan-400">
                {mockData.trustRiskSummary.trustScore}
              </div>
            </div>

            {/* Risk Score */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-gray-400">Risk Score</span>
              </div>
              <div className="text-lg font-semibold text-yellow-400">
                {Math.round(mockData.trustRiskSummary.riskScore * 100)}%
              </div>
            </div>

            {/* Alerts Count */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <Bell className="w-4 h-4 text-red-400" />
                <span className="text-xs text-gray-400">Alerts</span>
              </div>
              <div className="text-lg font-semibold text-red-400">
                {mockData.alertsCount}
              </div>
            </div>
          </div>

          {/* Degraded Mode Banner */}
          {mockData.freshness.degraded && (
            <div className="bg-yellow-900/50 border-l-4 border-yellow-400 p-3 mb-4 rounded-r-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-yellow-200 font-medium">Limited Preview Mode</p>
                  <p className="text-yellow-300 text-sm">
                    Confidence below threshold. Some actions may be restricted.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 3-Tab Spine */}
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors mr-2 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Mobile-first responsive layout */}
      <div className="px-4 py-6">
        <div className={`${
          // Single-column for <480px, optional split view for >768px
          'w-full max-w-none'
        }`}>
          <CurrentTabComponent 
            walletScope={walletScope}
            freshness={mockData.freshness}
            onWalletScopeChange={handleWalletScopeChange}
          />
        </div>
      </div>

      {/* Copilot Chat Drawer */}
      <CopilotChatDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        walletScope={walletScope}
      />
    </div>
  );
}