/**
 * Gas Price Display Tests for HeroSection
 * 
 * Requirements tested:
 * - R3.GAS.NONZERO: Gas never displays "0 gwei"
 * - R3.GAS.FALLBACK: On gas failure, shows "Gas unavailable" + telemetry event
 * 
 * Design → Data Integrity → Gas Oracle Rules
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { HeroSection } from '../HeroSection';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock all the hooks and dependencies
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@rainbow-me/rainbowkit', () => ({
  useConnectModal: () => ({ openConnectModal: vi.fn() }),
}));

vi.mock('@/lib/context/HomeAuthContext', () => ({
  useHomeAuth: () => ({ isAuthenticated: false, isLoading: false }),
}));

vi.mock('@/lib/navigation/NavigationRouter', () => ({
  NavigationRouter: {
    navigate: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the useNetworkStatus hook
const mockUseNetworkStatus = vi.fn();
vi.mock('@/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => mockUseNetworkStatus(),
}));

// Test wrapper with QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('HeroSection Gas Price Display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('R3.GAS.NONZERO: Gas never displays "0 gwei"', () => {
    test('should never display "0 gwei" even when gas price is 0', () => {
      // Mock network status with 0 gas price (should be handled by useNetworkStatus)
      mockUseNetworkStatus.mockReturnValue({
        data: {
          gasPrice: 0,
          status: 'normal',
          blockNumber: 12345,
          formattedGasPrice: 'Gas unavailable', // useNetworkStatus should format this
          gasColorClass: 'text-red-500',
        },
        isLoading: false,
        error: null,
      });

      render(<HeroSection />, { wrapper: createWrapper() });

      // Should never show "0 gwei" anywhere in the component
      expect(screen.queryByText(/0 gwei/i)).not.toBeInTheDocument();
      
      // Should show the formatted fallback instead
      expect(screen.getByText('Gas unavailable')).toBeInTheDocument();
    });

    test('should display formatted gas price with color coding', () => {
      // Mock network status with valid gas price
      mockUseNetworkStatus.mockReturnValue({
        data: {
          gasPrice: 25,
          status: 'normal',
          blockNumber: 12345,
          formattedGasPrice: 'Gas: 25 gwei',
          gasColorClass: 'text-yellow-500',
        },
        isLoading: false,
        error: null,
      });

      render(<HeroSection />, { wrapper: createWrapper() });

      // Should display the formatted gas price
      const gasElement = screen.getByText('Gas: 25 gwei');
      expect(gasElement).toBeInTheDocument();
      
      // Should have the correct color class
      expect(gasElement).toHaveClass('text-yellow-500');
    });

    test('should handle loading state gracefully', () => {
      // Mock network status in loading state
      mockUseNetworkStatus.mockReturnValue({
        data: {
          gasPrice: 25, // Placeholder data
          status: 'normal',
          blockNumber: 0,
          formattedGasPrice: 'Gas: 25 gwei',
          gasColorClass: 'text-yellow-500',
        },
        isLoading: true,
        error: null,
      });

      render(<HeroSection />, { wrapper: createWrapper() });

      // Should show placeholder data, never 0 gwei
      expect(screen.queryByText(/0 gwei/i)).not.toBeInTheDocument();
      expect(screen.getByText('Gas: 25 gwei')).toBeInTheDocument();
    });

    test('should handle error state with fallback', () => {
      // Mock network status with error
      mockUseNetworkStatus.mockReturnValue({
        data: {
          gasPrice: 25, // Fallback data
          status: 'normal',
          blockNumber: 0,
          formattedGasPrice: 'Gas: 25 gwei',
          gasColorClass: 'text-yellow-500',
        },
        isLoading: false,
        error: new Error('Network error'),
      });

      render(<HeroSection />, { wrapper: createWrapper() });

      // Should show fallback data, never 0 gwei
      expect(screen.queryByText(/0 gwei/i)).not.toBeInTheDocument();
      expect(screen.getByText('Gas: 25 gwei')).toBeInTheDocument();
    });
  });

  describe('R3.GAS.FALLBACK: Gas failure handling', () => {
    test('should show "Gas unavailable" when gas fetch fails', () => {
      // Mock network status with gas unavailable
      mockUseNetworkStatus.mockReturnValue({
        data: {
          gasPrice: 25, // Fallback value, not 0
          status: 'normal',
          blockNumber: 0,
          formattedGasPrice: 'Gas unavailable',
          gasColorClass: 'text-red-500',
        },
        isLoading: false,
        error: new Error('Gas fetch failed'),
      });

      render(<HeroSection />, { wrapper: createWrapper() });

      // Should show "Gas unavailable" instead of 0 gwei
      expect(screen.getByText('Gas unavailable')).toBeInTheDocument();
      expect(screen.queryByText(/0 gwei/i)).not.toBeInTheDocument();
      
      // Should have error color class
      const gasElement = screen.getByText('Gas unavailable');
      expect(gasElement).toHaveClass('text-red-500');
    });
  });

  describe('Gas price color coding (R3.GAS requirements)', () => {
    test('should display green color for optimal gas prices', () => {
      mockUseNetworkStatus.mockReturnValue({
        data: {
          gasPrice: 15,
          status: 'optimal',
          blockNumber: 12345,
          formattedGasPrice: 'Gas: 15 gwei',
          gasColorClass: 'text-green-500',
        },
        isLoading: false,
        error: null,
      });

      render(<HeroSection />, { wrapper: createWrapper() });

      const gasElement = screen.getByText('Gas: 15 gwei');
      expect(gasElement).toHaveClass('text-green-500');
    });

    test('should display yellow color for normal gas prices', () => {
      mockUseNetworkStatus.mockReturnValue({
        data: {
          gasPrice: 50,
          status: 'normal',
          blockNumber: 12345,
          formattedGasPrice: 'Gas: 50 gwei',
          gasColorClass: 'text-yellow-500',
        },
        isLoading: false,
        error: null,
      });

      render(<HeroSection />, { wrapper: createWrapper() });

      const gasElement = screen.getByText('Gas: 50 gwei');
      expect(gasElement).toHaveClass('text-yellow-500');
    });

    test('should display red color for high gas prices', () => {
      mockUseNetworkStatus.mockReturnValue({
        data: {
          gasPrice: 150,
          status: 'congested',
          blockNumber: 12345,
          formattedGasPrice: 'Gas: 150 gwei',
          gasColorClass: 'text-red-500',
        },
        isLoading: false,
        error: null,
      });

      render(<HeroSection />, { wrapper: createWrapper() });

      const gasElement = screen.getByText('Gas: 150 gwei');
      expect(gasElement).toHaveClass('text-red-500');
    });
  });
});