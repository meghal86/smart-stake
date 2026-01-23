import { useState, useCallback } from 'react';
import { useUserAddresses } from '@/hooks/useUserAddresses';
import { useWalletSwitching } from '@/hooks/useWalletSwitching';
import { BottomNav } from './shared/BottomNav';
import { PortfolioOverview } from './PortfolioOverview';
import { RiskAnalysis } from './RiskAnalysis';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/ui/PullToRefreshIndicator';
import { WalletScope, FreshnessConfidence } from '@/types/portfolio';
import { Wallet, RefreshCw, AlertTriangle } from 'lucide-react';

interface PortfolioHubProps {
  initialMode?: 'novice' | 'pro' | 'institutional';
  walletScope?: WalletScope;
  onWalletScopeChange?: (scope: WalletScope) => void;
}

export function PortfolioHub({ 
  initialMode = 'pro',
  walletScope,
  onWalletScopeChange
}: PortfolioHubProps) {
  const [activeSection, setActiveSection] = useState('portfolio');
  const [activeTab, setActiveTab] = useState('overview');
  const [mode, setMode] = useState(initialMode);
  const [refreshKey, setRefreshKey] = useState(0);

  // Use existing hooks
  const { addresses, loading: addressesLoading } = useUserAddresses();
  const { 
    activeWallet, 
    switchWallet, 
    validateWalletScope,
    isLoading: walletSwitchLoading 
  } = useWalletSwitching();

  // Mock freshness data - will be replaced with real API integration
  const [freshness] = useState<FreshnessConfidence>({
    freshnessSec: 45,
    confidence: 0.85,
    confidenceThreshold: 0.70,
    degraded: false
  });

  const handlePullRefresh = useCallback(async () => {
    setRefreshKey(prev => prev + 1);
    // Trigger data refresh for all components
  }, []);

  const { isPulling, isRefreshing, pullDistance, threshold } = usePullToRefresh({
    onRefresh: handlePullRefresh,
    threshold: 80,
  });

  const handleWalletSwitch = useCallback((walletId: string) => {
    const wallet = addresses.find(addr => addr.id === walletId);
    if (wallet && validateWalletScope({ mode: 'active_wallet', address: wallet.address as `0x${string}` })) {
      switchWallet(walletId);
      if (onWalletScopeChange) {
        onWalletScopeChange({ mode: 'active_wallet', address: wallet.address as `0x${string}` });
      }
    }
  }, [addresses, switchWallet, validateWalletScope, onWalletScopeChange]);

  // Portfolio tabs configuration
  const portfolioTabs = [
    { id: 'overview', label: 'Overview', component: PortfolioOverview },
    { id: 'positions', label: 'Positions', component: PortfolioOverview }, // Will be replaced with PositionsTab
    { id: 'audit', label: 'Audit', component: RiskAnalysis }, // Will be replaced with AuditTab
  ];

  const CurrentTabComponent = portfolioTabs.find(tab => tab.id === activeTab)?.component || PortfolioOverview;

  // Handle non-portfolio sections
  if (activeSection !== 'portfolio') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 pb-20">
        <div className="p-6 text-center text-gray-400">
          {activeSection.charAt(0).toUpperCase() + activeSection.slice(1)} section
        </div>
        <BottomNav 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        threshold={threshold}
      />

      {/* Always-visible elements */}
      <div className="sticky top-0 z-50 bg-gray-900/95 backdrop-blur-xl border-b border-gray-700/50">
        {/* Wallet Switching Header */}
        <div className="flex items-center justify-between p-4">
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

          {/* Freshness & Confidence Display */}
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1">
              <RefreshCw className="w-4 h-4 text-gray-400" />
              <span className="text-gray-300">{freshness.freshnessSec}s</span>
            </div>
            <div className={`flex items-center gap-1 ${
              freshness.degraded ? 'text-yellow-400' : 'text-green-400'
            }`}>
              {freshness.degraded && <AlertTriangle className="w-4 h-4" />}
              <span>{Math.round(freshness.confidence * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Portfolio Tabs */}
        <div className="flex overflow-x-auto px-4 pb-2">
          {portfolioTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors mr-2 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Degraded Mode Banner */}
      {freshness.degraded && (
        <div className="bg-yellow-900/50 border-l-4 border-yellow-400 p-4 mx-4 mt-4 rounded-r-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div>
              <p className="text-yellow-200 font-medium">Limited Preview Mode</p>
              <p className="text-yellow-300 text-sm">
                Confidence below threshold ({Math.round(freshness.confidence * 100)}% &lt; {Math.round(freshness.confidenceThreshold * 100)}%). 
                Some actions may be restricted.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Mode Toggle (for testing) */}
      <div className="absolute top-4 right-4 z-40">
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as typeof mode)}
          className="px-3 py-1 text-sm bg-gray-800 border border-gray-600 rounded-lg text-white"
        >
          <option value="novice">Novice</option>
          <option value="pro">Pro</option>
          <option value="institutional">Institutional</option>
        </select>
      </div>

      {/* Tab Content */}
      <div className="pb-20">
        <CurrentTabComponent 
          mode={mode} 
          walletScope={walletScope}
          freshness={freshness}
          key={`${refreshKey}-${activeTab}-${activeWallet}`} 
        />
      </div>
      
      <BottomNav 
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
    </div>
  );
}

// Export as PortfolioContainer for backward compatibility
export { PortfolioHub as PortfolioContainer };