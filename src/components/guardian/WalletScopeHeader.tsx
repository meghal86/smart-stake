/**
 * WalletScopeHeader Component
 * 
 * Displays the wallet scope clarity header for Guardian screens
 * Requirements: R10-AC3, R10-AC4 - Wallet scope explicit everywhere in Guardian
 */

import { Shield, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WalletScopeHeaderProps {
  walletAddress?: string;
  walletLabel?: string;
  className?: string;
}

export function WalletScopeHeader({ 
  walletAddress, 
  walletLabel, 
  className 
}: WalletScopeHeaderProps) {
  // Always show the header, but with different states for better UX
  const isConnected = !!walletAddress;
  const isDemoMode = walletLabel === 'Demo Wallet';
  
  const displayContent = walletAddress 
    ? (walletLabel || `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`)
    : "Connect wallet to see analysis scope";

  return (
    <div className={cn(
      "flex items-center gap-2 px-4 py-3 backdrop-blur-sm border rounded-lg mb-4",
      isConnected 
        ? isDemoMode 
          ? "wallet-scope-header demo-mode" 
          : "bg-slate-800/30 border-slate-700/50"
        : "bg-amber-900/20 border-amber-700/50",
      className
    )}>
      <Shield className={cn(
        "w-4 h-4",
        isConnected ? (isDemoMode ? "text-amber-400" : "text-emerald-400") : "text-amber-400"
      )} />
      <span className="text-sm text-slate-300">
        Analyzing:
      </span>
      <div className="flex items-center gap-2">
        <Wallet className={cn(
          "w-3 h-3",
          isConnected ? (isDemoMode ? "text-amber-400" : "text-slate-400") : "text-amber-400"
        )} />
        <span className={cn(
          "text-sm font-medium",
          isConnected ? (isDemoMode ? "text-amber-200" : "text-white") : "text-amber-200"
        )}>
          {displayContent}
        </span>
        {walletLabel && walletAddress && (
          <span className="text-xs text-slate-400 font-mono">
            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </span>
        )}
      </div>
    </div>
  );
}