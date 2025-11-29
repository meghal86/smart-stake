import { useQuery } from '@tanstack/react-query';

interface NetworkStatus {
  gasPrice: number; // in gwei
  status: 'optimal' | 'normal' | 'congested';
  blockNumber: number;
}

/**
 * Hook to fetch live Ethereum network status
 * Uses public RPC endpoint to get current gas price
 */
export const useNetworkStatus = () => {
  return useQuery<NetworkStatus>({
    queryKey: ['networkStatus'],
    queryFn: async () => {
      try {
        // Fetch current gas price from Ethereum mainnet with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const response = await fetch('https://eth.llamarpc.com', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_gasPrice',
            params: [],
            id: 1,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error('RPC request failed');
        }

        const data = await response.json();
        
        if (!data.result) {
          throw new Error('Invalid RPC response');
        }

        const gasPriceWei = parseInt(data.result, 16);
        const gasPriceGwei = Math.round(gasPriceWei / 1e9);

        // Determine network status based on gas price
        let status: 'optimal' | 'normal' | 'congested';
        if (gasPriceGwei < 20) {
          status = 'optimal';
        } else if (gasPriceGwei < 50) {
          status = 'normal';
        } else {
          status = 'congested';
        }

        return {
          gasPrice: gasPriceGwei,
          status,
          blockNumber: 0, // Not critical for display
        };
      } catch (error) {
        console.warn('Network status fetch failed, using fallback:', error);
        // Return fallback data instead of throwing
        return {
          gasPrice: 25,
          status: 'normal' as const,
          blockNumber: 0,
        };
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 20000, // Consider stale after 20 seconds
    retry: 1, // Only retry once
    retryDelay: 1000, // Wait 1s between retries
    // Provide initial data to avoid loading state
    placeholderData: {
      gasPrice: 25,
      status: 'normal',
      blockNumber: 0,
    },
  });
};
