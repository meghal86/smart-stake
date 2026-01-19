import React, { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { balanceService } from '@/lib/balance/balanceService';
import { RefreshCw } from 'lucide-react';

interface WalletBalanceDisplayProps {
  address: string;
  chainId?: number;
  className?: string;
}

export const WalletBalanceDisplay: React.FC<WalletBalanceDisplayProps> = ({ 
  address, 
  chainId = 1, // Default to Ethereum mainnet
  className = '' 
}) => {
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get wallet connection status (for signer, not balance)
  const { isConnected } = useAccount();

  useEffect(() => {
    fetchBalance();
  }, [address, chainId]);

  const fetchBalance = async () => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`🔍 Fetching balance via AlphaWhale RPC for ${address.slice(0, 6)}...${address.slice(-4)}`);
      
      // Use AlphaWhale's RPC providers, not wallet RPC
      const balanceData = await balanceService.getNativeBalance(address, chainId);
      
      if (balanceData) {
        // Enrich with USD value
        const enrichedBalances = await balanceService.enrichWithUSDValues([balanceData]);
        setBalance(enrichedBalances[0]);
        console.log(`✅ Balance loaded: ${enrichedBalances[0].formattedBalance} ${enrichedBalances[0].symbol} = $${enrichedBalances[0].usdValue?.toFixed(2)}`);
      } else {
        setError('Unable to fetch balance');
      }
    } catch (err) {
      console.error('Balance fetch error:', err);
      setError('Failed to load balance');
    } finally {
      setLoading(false);
    }
  };

  // Format USD value
  const formatUsdValue = (value: number): string => {
    if (value < 0.01) return '$0.00';
    if (value < 1) return `$${value.toFixed(3)}`;
    if (value < 1000) return `$${value.toFixed(2)}`;
    if (value < 1000000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${(value / 1000000).toFixed(1)}M`;
  };

  if (loading) {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span className="text-slate-400">Loading via RPC...</span>
      </div>
    );
  }

  if (error || !balance) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-slate-500">{error || 'Balance unavailable'}</span>
        <button
          onClick={fetchBalance}
          className="text-blue-500 hover:text-blue-600 text-xs"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="font-medium">
        {balance.usdValue ? formatUsdValue(balance.usdValue) : '$0.00'}
      </span>
      <span>•</span>
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {parseFloat(balance.formattedBalance).toFixed(4)} {balance.symbol}
      </span>
      {chainId !== 1 && (
        <>
          <span>•</span>
          <span className="text-xs text-slate-400">
            Chain {chainId}
          </span>
        </>
      )}
    </div>
  );
};