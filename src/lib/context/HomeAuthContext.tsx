'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAccount, useSignMessage, useDisconnect } from 'wagmi';

interface HomeAuthContextType {
  isAuthenticated: boolean;
  walletAddress: string | null;
  isLoading: boolean;
  error: string | null;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const HomeAuthContext = createContext<HomeAuthContextType | undefined>(undefined);

export const HomeAuthProvider = ({ children }: { children: ReactNode }) => {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if JWT exists in cookie on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsAuthenticated(true);
        } else {
          // JWT expired or missing, clear auth
          setIsAuthenticated(false);
          document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  // Update auth state when wallet connection changes
  useEffect(() => {
    if (isConnected && address) {
      // Wallet is connected, now we need to sign message and get JWT
      handleWalletConnected();
    } else {
      // Wallet disconnected
      setIsAuthenticated(false);
    }
  }, [isConnected, address]);

  const handleWalletConnected = async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      // Create EIP-191 message for signing
      const timestamp = Date.now();
      const message = `Sign this message to authenticate with AlphaWhale.\n\nWallet: ${address}\nTimestamp: ${timestamp}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;

      // Request signature from user (EIP-191)
      const signature = await signMessageAsync({ message });

      // Send signature to backend for verification
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include httpOnly cookies
        body: JSON.stringify({
          walletAddress: address,
          message,
          signature,
          timestamp,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Failed to verify signature');
      }

      const data = await response.json();
      
      if (data.success) {
        setIsAuthenticated(true);
        setError(null);
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (err: unknown) {
      console.error('Wallet connection error:', err);
      
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // Handle specific error cases per System Req 13.7
      if (errorMessage.includes('User rejected') || errorMessage.includes('denied')) {
        setError('You declined the signature request.');
      } else if (errorMessage.includes('timeout') || errorMessage.includes('took too long')) {
        setError('Connection took too long. Please try again.');
      } else if (errorMessage.includes('network')) {
        setError('Network error. Please check your connection and try again.');
      } else if (errorMessage.includes('unsupported chain')) {
        setError('Please switch to Ethereum Mainnet or Sepolia testnet.');
      } else {
        setError(`Failed to connect: ${errorMessage || 'Unknown error'}. Please try again.`);
      }
      
      setIsAuthenticated(false);
      
      // Disconnect wallet on error
      disconnect();
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    // This function is called when user clicks "Connect Wallet"
    // The actual wallet connection is handled by wagmi/RainbowKit modal
    // After connection, useEffect will trigger handleWalletConnected
    setIsLoading(true);
    setError(null);
  };

  const disconnectWallet = () => {
    // Clear JWT cookie
    document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
    
    // Disconnect wallet
    disconnect();
    
    // Update state
    setIsAuthenticated(false);
    setError(null);
  };

  return (
    <HomeAuthContext.Provider
      value={{
        isAuthenticated: isAuthenticated && isConnected && !!address,
        walletAddress: address || null,
        isLoading,
        error,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </HomeAuthContext.Provider>
  );
};

export const useHomeAuth = () => {
  const context = useContext(HomeAuthContext);
  if (!context) {
    throw new Error('useHomeAuth must be used within HomeAuthProvider');
  }
  return context;
};
