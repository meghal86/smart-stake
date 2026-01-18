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
import { ChevronDown, Wallet } from 'lucide-react';
import { useWallet, truncateAddress } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';

interface WalletChipProps {
  onClick: () => void;
  className?: string;
}

export const WalletChip: React.FC<WalletChipProps> = ({ onClick, className }) => {
  const { connectedWallets, activeWallet } = useWallet();
  
  // Find active wallet data
  const activeWalletData = connectedWallets.find(w => w.address === activeWallet);
  
  // Get wallet label (prioritize user label, fallback to provider + truncated address)
  const getWalletLabel = () => {
    if (!activeWalletData) return 'No Wallet';
    
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

  // Don't render if no wallets
  if (connectedWallets.length === 0) {
    return null;
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        // Base styles
        "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-150",
        // Background and borders
        "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700",
        "border border-slate-200 dark:border-slate-700",
        // Touch target (minimum 44px height for mobile)
        "min-h-[44px]",
        // Focus states
        "focus:outline-none focus:ring-2 focus:ring-cyan-500/50",
        // Active state
        "active:scale-[0.97]",
        className
      )}
      aria-label="Switch active wallet"
    >
      {/* Wallet Icon */}
      <Wallet className="w-4 h-4 text-slate-600 dark:text-slate-400" />
      
      {/* Wallet Info */}
      <div className="flex flex-col items-start min-w-0">
        <span className="text-sm font-medium text-slate-900 dark:text-white truncate">
          {getWalletLabel()}
        </span>
        {activeWalletData && (
          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            {truncateAddress(activeWalletData.address, 4)}
          </span>
        )}
      </div>
      
      {/* Chevron (only show if multiple wallets) */}
      {connectedWallets.length > 1 && (
        <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
      )}
    </button>
  );
};