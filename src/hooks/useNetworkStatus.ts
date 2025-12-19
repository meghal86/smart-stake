import { useQuery } from '@tanstack/react-query';

// TypeScript declaration for gtag (Google Analytics)
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
  }
}

interface NetworkStatus {
  gasPrice: number; // in gwei
  status: 'optimal' | 'normal' | 'congested';
  blockNumber: number;
  formattedGasPrice: string; // Formatted display string
  gasColorClass: string; // CSS class for color coding
}

/**
 * Format gas price according to R3.GAS requirements
 * Format: "Gas: [XX] gwei" with color coding (green <30, yellow 30-100, red >100)
 */
const formatGasPrice = (gasPrice: number): { formatted: string; colorClass: string } => {
  // Never display 0 gwei (R3.GAS.NONZERO)
  if (gasPrice === 0) {
    return {
      formatted: 'Gas unavailable',
      colorClass: 'text-red-500',
    };
  }

  const formatted = `Gas: ${gasPrice} gwei`;
  
  // Color coding based on gas price (R3.GAS requirements)
  let colorClass: string;
  if (gasPrice < 30) {
    colorClass = 'text-green-500'; // Optimal
  } else if (gasPrice <= 100) {
    colorClass = 'text-yellow-500'; // Normal
  } else {
    colorClass = 'text-red-500'; // Congested
  }

  return { formatted, colorClass };
};

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

        // Validate gas price according to R3.GAS.NONZERO and R3.GAS.FALLBACK
        // Reject null/0/>1000 gwei → display "Gas unavailable" and emit telemetry
        if (!gasPriceGwei || gasPriceGwei === 0 || gasPriceGwei > 1000) {
          console.warn('Invalid gas price detected:', gasPriceGwei, 'gwei - showing Gas unavailable');
          // Emit telemetry event for gas validation failure
          if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'gas_validation_failure', {
              event_category: 'data_integrity',
              event_label: 'invalid_gas_price',
              value: gasPriceGwei,
            });
          }
          
          // Return "Gas unavailable" state instead of throwing
          return {
            gasPrice: 0, // Internal value, but formattedGasPrice will show "Gas unavailable"
            status: 'normal' as const,
            blockNumber: 0,
            formattedGasPrice: 'Gas unavailable',
            gasColorClass: 'text-red-500',
          };
        }

        // Determine network status based on gas price
        let status: 'optimal' | 'normal' | 'congested';
        if (gasPriceGwei < 20) {
          status = 'optimal';
        } else if (gasPriceGwei < 50) {
          status = 'normal';
        } else {
          status = 'congested';
        }

        // Format gas price for display (R3.GAS requirements)
        const { formatted, colorClass } = formatGasPrice(gasPriceGwei);

        return {
          gasPrice: gasPriceGwei,
          status,
          blockNumber: 0, // Not critical for display
          formattedGasPrice: formatted,
          gasColorClass: colorClass,
        };
      } catch (error) {
        console.warn('Network status fetch failed, showing Gas unavailable:', error);
        
        // Emit telemetry event for gas fetch failure (R3.GAS.FALLBACK)
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'gas_fetch_failure', {
            event_category: 'data_integrity',
            event_label: 'api_failure',
            error_message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
        
        // Return "Gas unavailable" state when API fails (R3.GAS.FALLBACK)
        return {
          gasPrice: 0, // Internal value, but formattedGasPrice will show "Gas unavailable"
          status: 'normal' as const,
          blockNumber: 0,
          formattedGasPrice: 'Gas unavailable',
          gasColorClass: 'text-red-500',
        };
      }
    },
    refetchInterval: 30000, // Refresh every 30 seconds
    staleTime: 20000, // Consider stale after 20 seconds
    retry: 1, // Only retry once
    retryDelay: 1000, // Wait 1s between retries
    // Provide initial data to avoid loading state
    placeholderData: (() => {
      const placeholderGasPrice = 25;
      const { formatted, colorClass } = formatGasPrice(placeholderGasPrice);
      return {
        gasPrice: placeholderGasPrice,
        status: 'normal' as const,
        blockNumber: 0,
        formattedGasPrice: formatted,
        gasColorClass: colorClass,
      };
    })(),
  });
};
