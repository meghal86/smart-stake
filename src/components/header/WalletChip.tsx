/**
 * WalletChip - Header Wallet Context Switcher
 * 
 * Enterprise-grade wallet chip that ONLY handles context switching.
 * NO add wallet, settings, or admin actions - those belong in dedicated flows.
 * 
 * Follows strict UX principles:
 * - Header = context switching only
 * - Calm, predictable, reversible actions only
 * - Mobile-first, one-handed operation
 */

import React from 'react';
import { ChevronDown, Wallet, TestTube2 } from 'lucide-react';
import { useWallet, truncateAddress } from '@/contexts/WalletContext';
import { useDemoMode } from '@/lib/ux/DemoModeManager';
import { cn } from '@/lib/utils';

interface WalletChipProps {
  onClick: () => void;
  className?: string;
}

// Demo wallet data
const DEMO_WALLET = {
  address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
  label: 'Demo Wallet',
  provider: 'Demo'
};

export const WalletChip: React.FC<WalletChipProps> = ({ onClick, className }) => {
  const { connectedWallets, activeWallet } = useWallet();
  const { isDemo } = useDemoMode();
  
  // In demo mode, use demo wallet data instead of real wallet
  const activeWalletData = isDemo 
    ? DEMO_WALLET 
    : connectedWallets.find(w => w.address === activeWallet)
      // Fallback: if activeWallet is set but not in connectedWallets yet (loading state)
      || (activeWallet ? { 
          address: activeWallet, 
          label: 'Loading...', 
          provider: 'Wallet' 
        } : null);
  
  // Debug logging
  React.useEffect(() => {
    console.log('🔍 WalletChip - State:', {
      isDemo,
      activeWallet,
      connectedWalletsCount: connectedWallets.length,
      activeWalletData: activeWalletData ? {
        address: activeWalletData.address,
        label: activeWalletData.label
      } : null
    });
  }, [isDemo, activeWallet, connectedWallets.length, activeWalletData]);
  
  // Get wallet label (prioritize user label, fallback to provider + truncated address)
  const getWalletLabel = () => {
    if (!activeWalletData) return 'No Wallet';
    
    // In demo mode, always show "Demo Wallet"
    if (isDemo) {
      return 'Demo Wallet';
    }
    
    if (activeWalletData.label && activeWalletData.label !== 'Connected Wallet') {
      return activeWalletData.label;
    }
    
    // Fallback to provider + address
    const provider = getWalletProvider(activeWalletData);
    return `${provider} ${truncateAddress(activeWalletData.address, 4)}`;
  };
  
  // Simple provider detection
  const getWalletProvider = (wallet: any): string => {
    if (wallet.label?.toLowerCase().includes('metamask')) return 'MetaMask';
    if (wallet.label?.toLowerCase().includes('rainbow')) return 'Rainbow';
    if (wallet.label?.toLowerCase().includes('base')) return 'Base';
    if (wallet.label?.toLowerCase().includes('coinbase')) return 'Coinbase';
    return 'Wallet';
  };

  // Don't render if no wallets (unless in demo mode)
  if (!isDemo && connectedWallets.length === 0) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        // Base styles
        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150",
        // Background and borders - highlight demo mode
        isDemo 
          ? "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800"
          : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700",
        "border",
        // Touch target (minimum 44px height for mobile)
        "min-h-[44px]",
        // Focus states
        "focus:outline-none focus:ring-2 focus:ring-cyan-500/50",
        // Active state
        "active:scale-[0.97]",
        className
      )}
      aria-label={isDemo ? "Demo wallet (simulated data)" : "Switch active wallet"}
    >
      {/* Wallet Icon - show demo icon in demo mode */}
      {isDemo ? (
        <TestTube2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
      ) : (
        <Wallet className="w-4 h-4 text-slate-600 dark:text-slate-400" />
      )}
      
      {/* Wallet Info */}
      <div className="flex flex-col items-start min-w-0">
        <span className={cn(
          "text-sm font-medium truncate",
          isDemo 
            ? "text-blue-900 dark:text-blue-100"
            : "text-slate-900 dark:text-white"
        )}>
          {getWalletLabel()}
        </span>
        {activeWalletData && (
          <span className={cn(
            "text-xs font-mono",
            isDemo
              ? "text-blue-600 dark:text-blue-400"
              : "text-slate-500 dark:text-slate-400"
          )}>
            {truncateAddress(activeWalletData.address, 4)}
          </span>
        )}
      </div>
      
      {/* Chevron (only show if multiple wallets and not in demo mode) */}
      {!isDemo && connectedWallets.length > 1 && (
        <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
      )}
      
      {/* Demo badge */}
      {isDemo && (
        <span className="ml-1 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-blue-600 text-white rounded">
          Demo
        </span>
      )}
    </button>
  );
};