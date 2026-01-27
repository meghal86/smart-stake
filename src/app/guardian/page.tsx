'use client';

import { useState } from 'react';
import { Shield, Scan, Plus } from 'lucide-react';
import { SimpleAddWalletButton } from '@/components/guardian/SimpleAddWalletButton';
import { WorkingAddWalletButton } from '@/components/guardian/WorkingAddWalletButton';
import MultiWalletDashboard from '@/components/guardian/MultiWalletDashboard';
import { WalletProvider, useWallet as useWalletContext } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/ui/PullToRefreshIndicator';

function GuardianContent() {
  const { wallets, isLoading, refetch } = useWalletContext();
  const [isScanning, setIsScanning] = useState(false);

  const handlePullRefresh = async () => {
    await refetch?.();
  };

  const { isPulling, isRefreshing, pullDistance, threshold } = usePullToRefresh({
    onRefresh: handlePullRefresh,
    threshold: 80,
  });

  const handleScanWallet = async (address: string) => {
    setIsScanning(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsScanning(false);
  };

  const handleScanAll = async () => {
    setIsScanning(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsScanning(false);
  };

  return (
    <div className="min-h-screen bg-black dark:bg-black bg-white text-white dark:text-white text-slate-900">
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        threshold={threshold}
      />
      <div className="max-w-7xl mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Shield className="w-8 h-8 text-[#00C9A7]" />
              Guardian
              <span className="text-gray-400 font-normal">Multi-Wallet Security</span>
            </h1>
            <p className="text-gray-400 mt-2">
              Monitor and secure all your wallets from one dashboard
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <WorkingAddWalletButton 
              variant="outline"
              className="border-[#00C9A7] text-[#00C9A7] hover:bg-[#00C9A7]/10"
              onWalletAdded={(wallet) => console.log('New wallet added:', wallet)}
            />
            {wallets.length > 0 && (
              <Button
                onClick={handleScanAll}
                disabled={isScanning}
                className="bg-[#7B61FF] hover:bg-[#7B61FF]/80"
              >
                <Scan className="w-4 h-4 mr-2" />
                {isScanning ? 'Scanning...' : 'Scan All'}
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        {wallets.length === 0 ? (
          <div className="text-center py-16">
            <Shield className="w-24 h-24 mx-auto mb-6 text-gray-600" />
            <h2 className="text-2xl font-semibold mb-4">No Wallets Added Yet</h2>
            <p className="text-gray-400 mb-8 max-w-md mx-auto">
              Add your first wallet to start monitoring security risks and protecting your assets
            </p>
            <WorkingAddWalletButton 
              size="lg"
              className="bg-gradient-to-r from-[#00C9A7] to-[#7B61FF] hover:opacity-90"
              onWalletAdded={(wallet) => console.log('New wallet added:', wallet)}
            />
          </div>
        ) : (
          <MultiWalletDashboard
            onScanWallet={handleScanWallet}
            onScanAll={handleScanAll}
            isScanning={isScanning}
          />
        )}

        {/* Quick Actions */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#00C9A7]" />
              Add Wallet
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Connect or monitor any Ethereum wallet address
            </p>
            <WorkingAddWalletButton 
              variant="ghost"
              size="sm"
              className="text-[#00C9A7] hover:bg-[#00C9A7]/10"
              onWalletAdded={(wallet) => console.log('New wallet added:', wallet)}
            />
          </div>

          <div className="bg-white/5 border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Scan className="w-5 h-5 text-[#7B61FF]" />
              Security Scan
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Comprehensive security analysis for all wallets
            </p>
            <Button 
              variant="ghost"
              size="sm"
              onClick={handleScanAll}
              disabled={isScanning || wallets.length === 0}
              className="text-[#7B61FF] hover:bg-[#7B61FF]/10"
            >
              {isScanning ? 'Scanning...' : 'Scan Now'}
            </Button>
          </div>

          <div className="bg-white/5 border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
              <Shield className="w-5 h-5 text-yellow-400" />
              Risk Alerts
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Get notified about security risks and threats
            </p>
            <Button 
              variant="ghost"
              size="sm"
              className="text-yellow-400 hover:bg-yellow-400/10"
            >
              Configure
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function GuardianPage() {
  return (
    <WalletProvider>
      <GuardianContent />
    </WalletProvider>
  );
}