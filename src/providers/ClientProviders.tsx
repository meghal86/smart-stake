'use client';

import { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { config as wagmiConfig } from '@/config/wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RainbowKitProvider, darkTheme, lightTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { CompactViewProvider } from '@/contexts/CompactViewContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { UserModeProvider } from '@/contexts/UserModeContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { DemoModeProvider } from '@/contexts/DemoModeContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { WalletProvider as GuardianWalletProvider } from '@/contexts/WalletContext';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { DevInfo } from '@/components/DevInfo';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 15000),
      staleTime: 2 * 60 * 1000,
      refetchOnWindowFocus: false,
    },
  },
});

const RainbowKitThemeWrapper = ({ children }: { children: ReactNode }) => {
  const { actualTheme } = useTheme();

  return (
    <RainbowKitProvider
      theme={actualTheme === 'dark' ? darkTheme() : lightTheme()}
      modalSize="compact"
    >
      {children}
    </RainbowKitProvider>
  );
};

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <RainbowKitThemeWrapper>
            <CompactViewProvider>
              <AuthProvider>
                <GuardianWalletProvider>
                  <SubscriptionProvider>
                    <UserModeProvider>
                      <NotificationProvider>
                        <DemoModeProvider>
                          <TooltipProvider>
                            <Toaster />
                            <Sonner />
                            <DevInfo />
                            {children}
                          </TooltipProvider>
                        </DemoModeProvider>
                      </NotificationProvider>
                    </UserModeProvider>
                  </SubscriptionProvider>
                </GuardianWalletProvider>
              </AuthProvider>
            </CompactViewProvider>
          </RainbowKitThemeWrapper>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
