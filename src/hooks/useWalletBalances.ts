import { useState, useEffect } from 'react';
import { useAccount, useBalance } from 'wagmi';

interface WalletBalance {
  address: string;
  balance: number;
  formattedBalance: string;
  usdValue: string;
  loading: boolean;
  error?: string;
}

interface UseWalletBalancesReturn {
  balances: Record<string, WalletBalance>;
  loading: boolean;
  error?: string;
  refetch: () => void;
}

export function useWalletBalances(addresses: string[]): UseWalletBalancesReturn {
  const [balances, setBalances] = useState<Record<string, WalletBalance>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [ethPrice, setEthPrice] = useState<number>(3500);

  const fetchBalances = async () => {
    if (addresses.length === 0) return;

    setLoading(true);
    setError(undefined);

    try {
      // Get current ETH price
      const price = await fetchEthPrice();
      setEthPrice(price);
      
      // Initialize balances with loading state
      const initialBalances: Record<string, WalletBalance> = {};
      addresses.forEach(address => {
        initialBalances[address] = {
          address,
          balance: 0,
          formattedBalance: '0.0000',
          usdValue: '$0.00',
          loading: true
        };
      });
      setBalances(initialBalances);

      // For now, we'll use a simple approach since wagmi useBalance hook
      // can only be used at component level, not in a loop
      // This will be updated to use wagmi properly in the component
      const updatedBalances: Record<string, WalletBalance> = {};
      
      for (const address of addresses) {
        // Placeholder - this will be replaced by wagmi balance data
        updatedBalances[address] = {
          address,
          balance: 0,
          formattedBalance: '0.0000',
          usdValue: '$0.00',
          loading: false,
          error: 'Balance will be fetched from wallet provider'
        };
      }

      setBalances(updatedBalances);
    } catch (err) {
      setError('Failed to fetch wallet balances');
      console.error('Error fetching wallet balances:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalances();
  }, [addresses.join(',')]);

  return {
    balances,
    loading,
    error,
    refetch: fetchBalances
  };
}

// Helper function to fetch ETH price
async function fetchEthPrice(): Promise<number> {
  try {
    console.log('Fetching ETH price from CoinGecko...');
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd'
    );
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }
    
    const data = await response.json();
    const ethPrice = data.ethereum?.usd || 3500;
    
    console.log('ETH price fetched:', ethPrice);
    return ethPrice;
  } catch (error) {
    console.error('Error fetching ETH price:', error);
    console.log('Using fallback ETH price: $3500');
    return 3500; // Fallback price
  }
}

// Helper function to format USD values
function formatUsdValue(value: number): string {
  if (value < 0.01) return '$0.00';
  if (value < 1) return `$${value.toFixed(3)}`;
  if (value < 1000) return `$${value.toFixed(2)}`;
  if (value < 1000000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${(value / 1000000).toFixed(1)}M`;
}