/**
 * WalletProvider (Task 1 – Auth Flow Integration)
 * - Auth-aware
 * - Clears wallet state on logout
 * - Hydrates wallets after login
 * - Wraps wagmi + RainbowKit (does NOT replace them)
 */

import { ReactNode, useEffect, useRef, useState } from 'react';
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import { wagmiConfig } from '@/config/wagmi';
import { useAuth } from '@/contexts/AuthProvider'; // 🔑 REQUIRED
import '@rainbow-me/rainbowkit/styles.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

interface WalletProviderProps {
  children: ReactNode;
}

type WalletListItem = Record<string, unknown>;

export function WalletProvider({ children }: WalletProviderProps) {
  const { session } = useAuth(); // 🔑 auth session
  const hydratedForUserRef = useRef<string | null>(null);

  // ---- Wallet registry state (Task 1 minimal) ----
  const [wallets, setWallets] = useState<WalletListItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // ---- Clear wallet state (on logout / session loss) ----
  const clearWalletState = () => {
    setWallets([]);
    setIsHydrated(false);
    hydratedForUserRef.current = null;
  };

  // ---- Hydrate wallets from server ----
  const hydrateFromServer = async (userId: string) => {
    try {
      setIsHydrated(false);

      const res = await fetch('/functions/v1/wallets-list', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch wallets');
      }

      const data = await res.json();
      setWallets(data.wallets ?? []);
      setIsHydrated(true);
    } catch (err) {
      console.error('[WalletProvider] Hydration failed:', err);
      clearWalletState();
    }
  };

  // ---- AUTH ↔ WALLET BINDING (CORE OF TASK 1) ----
  useEffect(() => {
    const userId = session?.user?.id ?? null;

    // 🔴 No session → no wallets
    if (!userId) {
      clearWalletState();
      return;
    }

    // 🟢 New user session → hydrate once
    if (hydratedForUserRef.current !== userId) {
      hydratedForUserRef.current = userId;
      hydrateFromServer(userId);
    }
  }, [session]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#14b8a6',
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
