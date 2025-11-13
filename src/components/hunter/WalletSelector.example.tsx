/**
 * WalletSelector Component - Usage Examples
 * 
 * This file demonstrates various ways to use the WalletSelector component.
 */

import React from 'react';
import { WalletSelector } from './WalletSelector';
import { WalletProvider } from '@/contexts/WalletContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

// ============================================================================
// Example 1: Basic Usage in Header
// ============================================================================

export function HeaderExample() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">AlphaWhale</h1>
          </div>
          
          {/* Basic wallet selector */}
          <WalletSelector />
        </header>
      </WalletProvider>
    </QueryClientProvider>
  );
}

// ============================================================================
// Example 2: Compact Variant for Mobile
// ============================================================================

export function MobileHeaderExample() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <header className="flex items-center justify-between p-3 bg-white dark:bg-gray-900">
          <button className="p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Compact variant - icon only on mobile */}
          <WalletSelector 
            showLabel={false}
            variant="compact"
          />
        </header>
      </WalletProvider>
    </QueryClientProvider>
  );
}

// ============================================================================
// Example 3: Responsive Header
// ============================================================================

export function ResponsiveHeaderExample() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold">AlphaWhale</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Search on desktop */}
            <div className="hidden md:block">
              <input 
                type="search" 
                placeholder="Search opportunities..."
                className="px-4 py-2 border rounded-lg"
              />
            </div>
            
            {/* Wallet selector - responsive */}
            <div className="hidden sm:block">
              <WalletSelector showLabel={true} />
            </div>
            <div className="sm:hidden">
              <WalletSelector showLabel={false} variant="compact" />
            </div>
          </div>
        </header>
      </WalletProvider>
    </QueryClientProvider>
  );
}

// ============================================================================
// Example 4: With Custom Styling
// ============================================================================

export function CustomStyledExample() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <header className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-purple-600">
          <h1 className="text-xl font-bold text-white">AlphaWhale</h1>
          
          {/* Custom styled wallet selector */}
          <WalletSelector 
            className="shadow-lg ring-2 ring-white/20"
          />
        </header>
      </WalletProvider>
    </QueryClientProvider>
  );
}

// ============================================================================
// Example 5: In Navigation Bar
// ============================================================================

export function NavigationExample() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <nav className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold">AlphaWhale</h1>
            
            <div className="hidden md:flex items-center gap-6">
              <a href="/hunter" className="text-gray-700 dark:text-gray-300 hover:text-blue-600">
                Hunter
              </a>
              <a href="/guardian" className="text-gray-700 dark:text-gray-300 hover:text-blue-600">
                Guardian
              </a>
              <a href="/portfolio" className="text-gray-700 dark:text-gray-300 hover:text-blue-600">
                Portfolio
              </a>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Notifications */}
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            
            {/* Wallet selector */}
            <WalletSelector />
          </div>
        </nav>
      </WalletProvider>
    </QueryClientProvider>
  );
}

// ============================================================================
// Example 6: With Event Listeners
// ============================================================================

export function EventListenerExample() {
  React.useEffect(() => {
    // Listen for wallet connection events
    const handleWalletConnected = (event: CustomEvent) => {
      console.log('Wallet connected:', event.detail.address);
      console.log('Timestamp:', event.detail.timestamp);
      
      // Trigger custom actions
      // - Refresh user data
      // - Update analytics
      // - Show welcome message
    };
    
    window.addEventListener('walletConnected', handleWalletConnected as EventListener);
    
    return () => {
      window.removeEventListener('walletConnected', handleWalletConnected as EventListener);
    };
  }, []);
  
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b">
          <h1 className="text-xl font-bold">AlphaWhale</h1>
          <WalletSelector />
        </header>
      </WalletProvider>
    </QueryClientProvider>
  );
}

// ============================================================================
// Example 7: With Loading State
// ============================================================================

export function LoadingStateExample() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b">
          <h1 className="text-xl font-bold">AlphaWhale</h1>
          
          <div className="flex items-center gap-4">
            {/* Loading indicator */}
            <div className="text-sm text-gray-500">
              Connecting...
            </div>
            
            {/* Wallet selector (disabled during loading) */}
            <WalletSelector />
          </div>
        </header>
      </WalletProvider>
    </QueryClientProvider>
  );
}

// ============================================================================
// Example 8: Full Hunter Screen Header
// ============================================================================

export function HunterScreenHeaderExample() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-4">
                <img src="/logo.png" alt="AlphaWhale" className="h-8 w-8" />
                <h1 className="text-xl font-bold hidden sm:block">Hunter</h1>
              </div>
              
              {/* Search Bar (Desktop) */}
              <div className="hidden md:block flex-1 max-w-2xl mx-8">
                <input
                  type="search"
                  placeholder="Search opportunities..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800"
                />
              </div>
              
              {/* Actions */}
              <div className="flex items-center gap-3">
                {/* Filter Button (Mobile) */}
                <button className="md:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                </button>
                
                {/* Wallet Selector */}
                <div className="hidden sm:block">
                  <WalletSelector showLabel={true} />
                </div>
                <div className="sm:hidden">
                  <WalletSelector showLabel={false} variant="compact" />
                </div>
              </div>
            </div>
          </div>
        </header>
      </WalletProvider>
    </QueryClientProvider>
  );
}

// ============================================================================
// Example 9: With Theme Toggle
// ============================================================================

export function ThemeToggleExample() {
  const [isDark, setIsDark] = React.useState(false);
  
  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);
  
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <header className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b">
          <h1 className="text-xl font-bold">AlphaWhale</h1>
          
          <div className="flex items-center gap-4">
            {/* Theme toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isDark ? '🌞' : '🌙'}
            </button>
            
            {/* Wallet selector (theme-aware) */}
            <WalletSelector />
          </div>
        </header>
      </WalletProvider>
    </QueryClientProvider>
  );
}

// ============================================================================
// Example 10: Programmatic Wallet Selection
// ============================================================================

export function ProgrammaticExample() {
  const { setActiveWallet, connectedWallets } = useWallet();
  
  const handleSelectFirstWallet = () => {
    if (connectedWallets.length > 0) {
      setActiveWallet(connectedWallets[0].address);
    }
  };
  
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <div className="p-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={handleSelectFirstWallet}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Select First Wallet
            </button>
            
            <WalletSelector />
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Connected Wallets: {connectedWallets.length}
          </div>
        </div>
      </WalletProvider>
    </QueryClientProvider>
  );
}

// Import useWallet for the last example
import { useWallet } from '@/contexts/WalletContext';
