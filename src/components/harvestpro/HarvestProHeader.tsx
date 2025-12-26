/**
 * HarvestPro Header Component
 * Matches Hunter header styling with HarvestPro branding
 * 
 * Requirements: Enhanced Req 3 AC4-5 (gas nonzero, fallback)
 * Design: Data Integrity → Gas Oracle Rules
 */

import { motion } from 'framer-motion';
import { Activity, RefreshCw, Zap, RotateCcw } from 'lucide-react';
import WalletSelector from '@/components/hunter/WalletSelector';
import { formatUpdatedTime } from '@/lib/ux/timestampUtils';
import { useLoadingState } from '@/hooks/useLoadingState';
import { LoadingIndicator } from '@/components/ux/LoadingSystem';
import { useDemoMode } from '@/lib/ux/DemoModeManager';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

interface HarvestProHeaderProps {
  lastUpdated?: Date;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

// Gas Price Display Component
function GasPriceDisplay() {
  const { data: networkStatus, isLoading, error, refetch } = useNetworkStatus();
  
  const handleRetry = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5">
        <Zap className="w-4 h-4 text-gray-400" />
        <LoadingIndicator size="sm" variant="spinner" className="text-gray-400" />
        <span className="text-xs text-gray-400">Loading...</span>
      </div>
    );
  }

  if (error || !networkStatus) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
        <Zap className="w-4 h-4 text-red-400" />
        <span className="text-xs text-red-400">Gas unavailable</span>
        <button
          onClick={handleRetry}
          className="p-1 rounded hover:bg-red-500/20 transition-colors"
          title="Retry gas price fetch"
        >
          <RotateCcw className="w-3 h-3 text-red-400" />
        </button>
      </div>
    );
  }

  // Use the formatted gas price and color class from useNetworkStatus
  const { formattedGasPrice, gasColorClass } = networkStatus;
  
  // Handle "Gas unavailable" state with retry option
  if (formattedGasPrice === 'Gas unavailable') {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
        <Zap className="w-4 h-4 text-red-400" />
        <span className="text-xs text-red-400">Gas unavailable</span>
        <button
          onClick={handleRetry}
          className="p-1 rounded hover:bg-red-500/20 transition-colors"
          title="Retry gas price fetch"
        >
          <RotateCcw className="w-3 h-3 text-red-400" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5">
      <Zap className="w-4 h-4 text-gray-400" />
      <span className={`text-xs font-medium ${gasColorClass}`}>
        {formattedGasPrice}
      </span>
    </div>
  );
}

export function HarvestProHeader({
  lastUpdated,
  onRefresh,
  isRefreshing = false,
}: HarvestProHeaderProps) {
  // Demo mode management - use centralized demo mode manager
  const { isDemo, setDemoMode } = useDemoMode();
  
  // Loading state management
  const { getLoadingState } = useLoadingState();
  const refreshState = getLoadingState('harvest-refresh');
  const isRefreshLoading = refreshState?.isLoading || isRefreshing;
  
  return (
    <motion.header
      className="sticky top-0 z-50 backdrop-blur-md border-b bg-[rgba(16,18,30,0.75)] border-[rgba(255,255,255,0.08)]"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="max-w-screen-xl mx-auto px-4 py-3">
        {/* Top Row */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <img src="/header.png" alt="AlphaWhale Logo" className="w-8 h-8" />
              Harvest
            </h1>
            <p className="text-gray-400 text-sm mt-1">Optimize your tax strategy for maximum savings</p>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <div className="flex items-center gap-2">
                <p className="text-xs text-gray-400">
                  {formatUpdatedTime(lastUpdated)}
                </p>
                {isRefreshLoading && (
                  <LoadingIndicator
                    size="sm"
                    variant="spinner"
                    className="text-gray-400"
                  />
                )}
              </div>
            )}

            {/* Gas Price Display */}
            <GasPriceDisplay />

            <div className="flex items-center gap-3">
              {/* WalletSelector */}
              <WalletSelector
                showLabel={true}
                variant="default"
                className="hidden sm:flex"
              />

              {/* Refresh Button */}
              <PrimaryButton
                onClick={onRefresh}
                disabled={isRefreshLoading}
                isLoading={isRefreshLoading}
                loadingText="Refreshing..."
                disabledTooltip={refreshState?.message || 'Refresh opportunities'}
                variant="ghost"
                className="p-2 rounded-lg"
              >
                <RefreshCw className="w-4 h-4" />
              </PrimaryButton>

              {/* Demo/Live Toggle */}
              <div className="flex gap-2 text-sm">
                <button
                  onClick={() => setDemoMode(true)}
                  className={`px-3 py-1 rounded-lg border transition-all duration-300 ${
                    isDemo
                      ? 'bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] text-white font-medium shadow-sm'
                      : 'border-[rgba(255,255,255,0.1)] text-gray-300 hover:bg-[rgba(255,255,255,0.05)]'
                  }`}
                >
                  Demo
                </button>
                <button
                  onClick={() => setDemoMode(false)}
                  className={`px-3 py-1 rounded-lg border transition-all duration-300 flex items-center gap-1 ${
                    !isDemo
                      ? 'bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] text-white font-medium shadow-sm'
                      : 'border-[rgba(255,255,255,0.1)] text-gray-300 hover:bg-[rgba(255,255,255,0.05)]'
                  }`}
                >
                  Live
                  {!isDemo && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Activity className="w-3 h-3" />
                    </motion.div>
                  )}
                </button>
              </div>

              {/* AI Digest Button */}
              <PrimaryButton
                className="px-3 py-1 text-sm"
                variant="primary"
              >
                AI Digest
              </PrimaryButton>
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
