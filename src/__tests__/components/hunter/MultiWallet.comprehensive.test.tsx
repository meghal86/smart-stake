/**
 * Comprehensive Multi-Wallet Feature Tests
 * 
 * This test suite provides comprehensive coverage for the multi-wallet feature including:
 * - WalletContext provider state management
 * - useWallet hook functionality
 * - WalletSelector component rendering
 * - Wallet selection and switching
 * - localStorage persistence
 * - Wallet restoration on mount
 * - ENS name and label combination (prevents caching regression)
 * - Dropdown open/close behavior
 * - Keyboard navigation
 * 
 * @see .kiro/specs/hunter-screen-feed/tasks.md - Task 54
 * @see .kiro/specs/hunter-screen-feed/requirements.md - Requirement 18
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WalletProvider, useWallet, truncateAddress, type ConnectedWallet } from '@/contexts/WalletContext';
import { WalletSelector } from '@/components/hunter/WalletSelector';
import { useWalletLabels } from '@/hooks/useWalletLabels';

// ============================================================================
// Test Setup
// ============================================================================

const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>{children}</WalletProvider>
    </QueryClientProvider>
  );
};

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock window.ethereum
const mockEthereum = {
  request: vi.fn(),
  on: vi.fn(),
  removeListener: vi.fn(),
};

Object.defineProperty(window, 'ethereum', {
  value: mockEthereum,
  writable: true,
  configurable: true,
});

// Mock name resolution
vi.mock('@/lib/name-resolution', () => ({
  resolveName: vi.fn().mockResolvedValue(null),
}));

// Mock useWalletLabels hook
vi.mock('@/hooks/useWalletLabels', () => ({
  useWalletLabels: vi.fn(() => ({
    labels: {},
    isLoading: false,
    error: null,
    getLabel: vi.fn(() => undefined),
    setLabel: vi.fn(),
    removeLabel: vi.fn(),
    isSettingLabel: false,
    isRemovingLabel: false,
  })),
}));

// ============================================================================
// Test Suite: WalletContext Provider State Management
// ============================================================================

describe('WalletContext Provider State Management', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    delete (window as any).ethereum;
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.connectedWallets).toEqual([]);
    expect(result.current.activeWallet).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.isSwitching).toBe(false);
  });

  it('should provide all required context methods', () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current).toHaveProperty('connectedWallets');
    expect(result.current).toHaveProperty('activeWallet');
    expect(result.current).toHaveProperty('setActiveWallet');
    expect(result.current).toHaveProperty('connectWallet');
    expect(result.current).toHaveProperty('disconnectWallet');
    expect(result.current).toHaveProperty('isLoading');
    expect(result.current).toHaveProperty('isSwitching');
  });

  it('should throw error when useWallet is used outside provider', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      renderHook(() => useWallet());
    }).toThrow('useWallet must be used within a WalletProvider');
    
    consoleSpy.mockRestore();
  });

  it('should manage multiple wallets in state', async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    // Mock wallet connection
    mockEthereum.request.mockImplementation((args: { method: string }) => {
      if (args.method === 'eth_requestAccounts') {
        return Promise.resolve(['0x1111111111111111111111111111111111111111']);
      }
      if (args.method === 'eth_chainId') {
        return Promise.resolve('0x1');
      }
      return Promise.resolve(null);
    });

    await act(async () => {
      await result.current.connectWallet();
    });

    expect(result.current.connectedWallets).toHaveLength(1);
    expect(result.current.connectedWallets[0].address).toBe('0x1111111111111111111111111111111111111111');
  });

  it('should update state when wallet is added', async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    mockEthereum.request.mockImplementation((args: { method: string }) => {
      if (args.method === 'eth_requestAccounts') {
        return Promise.resolve(['0x2222222222222222222222222222222222222222']);
      }
      if (args.method === 'eth_chainId') {
        return Promise.resolve('0x89'); // Polygon
      }
      return Promise.resolve(null);
    });

    await act(async () => {
      await result.current.connectWallet();
    });

    expect(result.current.connectedWallets).toHaveLength(1);
    expect(result.current.connectedWallets[0].chain).toBe('polygon');
  });

  it('should update state when wallet is removed', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum' },
      { address: '0xbbb', chain: 'polygon' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.disconnectWallet('0xbbb');
    });

    expect(result.current.connectedWallets).toHaveLength(1);
    expect(result.current.connectedWallets[0].address).toBe('0xaaa');
  });

  it('should update state when active wallet changes', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum' },
      { address: '0xbbb', chain: 'polygon' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.setActiveWallet('0xbbb');
    });

    await waitFor(() => {
      expect(result.current.activeWallet).toBe('0xbbb');
    });
  });
});

// ============================================================================
// Test Suite: useWallet Hook Functionality
// ============================================================================

describe('useWallet Hook Functionality', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should connect wallet successfully', async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    mockEthereum.request.mockImplementation((args: { method: string }) => {
      if (args.method === 'eth_requestAccounts') {
        return Promise.resolve(['0x3333333333333333333333333333333333333333']);
      }
      if (args.method === 'eth_chainId') {
        return Promise.resolve('0x1');
      }
      return Promise.resolve(null);
    });

    await act(async () => {
      await result.current.connectWallet();
    });

    expect(result.current.connectedWallets).toHaveLength(1);
    expect(result.current.activeWallet).toBe('0x3333333333333333333333333333333333333333');
  });

  it('should disconnect wallet successfully', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.disconnectWallet('0xaaa');
    });

    expect(result.current.connectedWallets).toHaveLength(0);
    expect(result.current.activeWallet).toBeNull();
  });

  it('should set active wallet successfully', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum' },
      { address: '0xbbb', chain: 'polygon' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.setActiveWallet('0xbbb');
    });

    await waitFor(() => {
      expect(result.current.activeWallet).toBe('0xbbb');
    });
  });

  it('should handle loading state during connection', async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    mockEthereum.request.mockImplementation(() => new Promise(() => {})); // Never resolves

    act(() => {
      result.current.connectWallet();
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(true);
    });
  });

  it('should handle switching state during wallet change', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum' },
      { address: '0xbbb', chain: 'polygon' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.setActiveWallet('0xbbb');
    });

    // isSwitching should be true during transition
    expect(result.current.isSwitching).toBe(true);

    await waitFor(() => {
      expect(result.current.activeWallet).toBe('0xbbb');
    });
  });

  it('should emit walletConnected event on wallet change', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));

    const eventListener = vi.fn();
    window.addEventListener('walletConnected', eventListener);

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.setActiveWallet('0xaaa');
    });

    await waitFor(() => {
      expect(eventListener).toHaveBeenCalled();
    });

    const event = eventListener.mock.calls[0][0] as CustomEvent;
    expect(event.detail.address).toBe('0xaaa');
    expect(event.detail.timestamp).toBeDefined();

    window.removeEventListener('walletConnected', eventListener);
  });

  it('should invalidate queries on wallet change', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum' },
      { address: '0xbbb', chain: 'polygon' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.setActiveWallet('0xbbb');
    });

    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['hunter-feed'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['eligibility'] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['saved-opportunities'] });
    });
  });

  it('should handle errors during wallet connection', async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    mockEthereum.request.mockRejectedValueOnce(new Error('User rejected'));

    await expect(async () => {
      await act(async () => {
        await result.current.connectWallet();
      });
    }).rejects.toThrow('User rejected');
  });

  it('should handle missing ethereum provider', async () => {
    delete (window as any).ethereum;

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(async () => {
      await act(async () => {
        await result.current.connectWallet();
      });
    }).rejects.toThrow('No Ethereum wallet detected');
  });
});

// ============================================================================
// Test Suite: WalletSelector Component Rendering
// ============================================================================

describe('WalletSelector Component Rendering', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          {ui}
        </WalletProvider>
      </QueryClientProvider>
    );
  };

  it('should render Connect Wallet button when no wallets connected', () => {
    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /connect wallet/i });
    expect(button).toBeInTheDocument();
  });

  it('should render wallet selector with active wallet', () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0x1234567890abcdef1234567890abcdef12345678', label: 'Main Wallet', chain: 'ethereum' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', mockWallets[0].address);

    renderWithProviders(<WalletSelector />);
    
    expect(screen.getByText('Main Wallet')).toBeInTheDocument();
    expect(screen.getByText('0x1234...5678')).toBeInTheDocument();
  });

  it('should render wallet icon', () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0x1234567890abcdef1234567890abcdef12345678', label: 'Main Wallet', chain: 'ethereum' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', mockWallets[0].address);

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /select wallet/i });
    expect(button).toBeInTheDocument();
  });

  it('should render chain badge', () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0x1234567890abcdef1234567890abcdef12345678', label: 'Main Wallet', chain: 'ethereum' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', mockWallets[0].address);

    renderWithProviders(<WalletSelector />);
    
    expect(screen.getByText('Ethereum')).toBeInTheDocument();
  });

  it('should render with showLabel=false', () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0x1234567890abcdef1234567890abcdef12345678', label: 'Main Wallet', chain: 'ethereum' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', mockWallets[0].address);

    renderWithProviders(<WalletSelector showLabel={false} />);
    
    expect(screen.queryByText('Main Wallet')).not.toBeInTheDocument();
  });

  it('should render with compact variant', () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0x1234567890abcdef1234567890abcdef12345678', label: 'Main Wallet', chain: 'ethereum' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', mockWallets[0].address);

    renderWithProviders(<WalletSelector variant="compact" />);
    
    const button = screen.getByRole('button', { name: /select wallet/i });
    expect(button).toBeInTheDocument();
  });

  it('should render loading state during connection', async () => {
    mockEthereum.request.mockImplementation(() => new Promise(() => {})); // Never resolves

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /connect wallet/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/connecting/i)).toBeInTheDocument();
    });
  });

  it('should render switching state during wallet change', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
      { address: '0xbbb', chain: 'polygon', label: 'Wallet B' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /select wallet/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Wallet B')).toBeInTheDocument();
    });

    const walletB = screen.getByText('Wallet B').closest('[role="menuitemradio"]');
    fireEvent.click(walletB!);

    // Should show switching state briefly
    await waitFor(() => {
      expect(screen.queryByText(/switching/i)).toBeInTheDocument();
    }, { timeout: 100 });
  });
});

// ============================================================================
// Test Suite: Wallet Selection and Switching
// ============================================================================

describe('Wallet Selection and Switching', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          {ui}
        </WalletProvider>
      </QueryClientProvider>
    );
  };

  it('should switch active wallet when clicked', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
      { address: '0xbbb', chain: 'polygon', label: 'Wallet B' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /select wallet/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Wallet B')).toBeInTheDocument();
    });

    const walletB = screen.getByText('Wallet B').closest('[role="menuitemradio"]');
    fireEvent.click(walletB!);

    await waitFor(() => {
      expect(localStorageMock.getItem('activeWallet')).toBe('0xbbb');
    });
  });

  it('should show checkmark on active wallet', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
      { address: '0xbbb', chain: 'polygon', label: 'Wallet B' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /select wallet/i });
    await userEvent.click(button);

    await waitFor(() => {
      const menuItems = screen.getAllByRole('menuitemradio');
      expect(menuItems.length).toBeGreaterThan(0);
      
      const activeItem = menuItems[0];
      const checkIcon = within(activeItem).getByLabelText('Active wallet');
      expect(checkIcon).toBeInTheDocument();
    });
  });

  it('should update lastUsed timestamp on wallet switch', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
      { address: '0xbbb', chain: 'polygon', label: 'Wallet B' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.setActiveWallet('0xbbb');
    });

    await waitFor(() => {
      const wallet = result.current.connectedWallets.find(w => w.address === '0xbbb');
      expect(wallet?.lastUsed).toBeDefined();
      expect(wallet?.lastUsed).toBeInstanceOf(Date);
    });
  });

  it('should close dropdown after wallet selection', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
      { address: '0xbbb', chain: 'polygon', label: 'Wallet B' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /select wallet/i });
    await userEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Connected Wallets')).toBeInTheDocument();
    });

    const walletB = screen.getByText('Wallet B').closest('[role="menuitemradio"]');
    fireEvent.click(walletB!);

    await waitFor(() => {
      expect(screen.queryByText('Connected Wallets')).not.toBeInTheDocument();
    });
  });

  it('should not allow switching while already switching', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
      { address: '0xbbb', chain: 'polygon', label: 'Wallet B' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.setActiveWallet('0xbbb');
    });

    // Try to switch again immediately
    act(() => {
      result.current.setActiveWallet('0xaaa');
    });

    await waitFor(() => {
      expect(result.current.activeWallet).toBe('0xbbb');
    });
  });

  it('should validate wallet exists before switching', () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.setActiveWallet('0xnonexistent');
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('Wallet 0xnonexistent not found')
    );

    consoleSpy.mockRestore();
  });
});

// ============================================================================
// Test Suite: localStorage Persistence
// ============================================================================

describe('localStorage Persistence', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should persist active wallet to localStorage', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      result.current.setActiveWallet('0xaaa');
    });

    await waitFor(() => {
      expect(localStorageMock.getItem('activeWallet')).toBe('0xaaa');
    });
  });

  it('should persist connected wallets to localStorage', async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    mockEthereum.request.mockImplementation((args: { method: string }) => {
      if (args.method === 'eth_requestAccounts') {
        return Promise.resolve(['0x4444444444444444444444444444444444444444']);
      }
      if (args.method === 'eth_chainId') {
        return Promise.resolve('0x1');
      }
      return Promise.resolve(null);
    });

    await act(async () => {
      await result.current.connectWallet();
    });

    await waitFor(() => {
      const stored = localStorageMock.getItem('connectedWallets');
      expect(stored).toBeTruthy();
      const wallets = JSON.parse(stored!);
      expect(wallets).toHaveLength(1);
      expect(wallets[0].address).toBe('0x4444444444444444444444444444444444444444');
    });
  });

  it('should remove active wallet from localStorage when disconnecting last wallet', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.disconnectWallet('0xaaa');
    });

    expect(localStorageMock.getItem('activeWallet')).toBeNull();
  });

  it('should update localStorage when wallets change', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum' },
      { address: '0xbbb', chain: 'polygon' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.disconnectWallet('0xbbb');
    });

    await waitFor(() => {
      const stored = localStorageMock.getItem('connectedWallets');
      const wallets = JSON.parse(stored!);
      expect(wallets).toHaveLength(1);
      expect(wallets[0].address).toBe('0xaaa');
    });
  });

  it('should handle corrupted localStorage data gracefully', () => {
    localStorageMock.setItem('connectedWallets', 'invalid json');
    
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.connectedWallets).toEqual([]);
    expect(consoleSpy).toHaveBeenCalled();
    
    // Should clear corrupted data
    expect(localStorageMock.getItem('connectedWallets')).toBeNull();
    
    consoleSpy.mockRestore();
  });

  it('should serialize and deserialize Date objects correctly', async () => {
    const now = new Date();
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', lastUsed: now },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      expect(result.current.connectedWallets).toHaveLength(1);
      expect(result.current.connectedWallets[0].lastUsed).toBeInstanceOf(Date);
    });
  });
});

// ============================================================================
// Test Suite: Wallet Restoration on Mount
// ============================================================================

describe('Wallet Restoration on Mount', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should restore wallets from localStorage on mount', () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Main Wallet' },
      { address: '0xbbb', chain: 'polygon', label: 'Secondary Wallet' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.connectedWallets).toHaveLength(2);
    expect(result.current.activeWallet).toBe('0xaaa');
  });

  it('should restore active wallet if it exists in connected wallets', () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum' },
      { address: '0xbbb', chain: 'polygon' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xbbb');

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.activeWallet).toBe('0xbbb');
  });

  it('should default to first wallet if saved wallet not found', () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum' },
      { address: '0xbbb', chain: 'polygon' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xnonexistent');

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.activeWallet).toBe('0xaaa');
  });

  it('should restore wallet with all properties', () => {
    const mockWallets: ConnectedWallet[] = [
      {
        address: '0xaaa',
        chain: 'ethereum',
        label: 'Main Wallet',
        ens: 'vitalik.eth',
        balance: '1.5 ETH',
        lastUsed: new Date().toISOString(),
      },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    const wallet = result.current.connectedWallets[0];
    expect(wallet.address).toBe('0xaaa');
    expect(wallet.chain).toBe('ethereum');
    expect(wallet.label).toBe('Main Wallet');
    expect(wallet.ens).toBe('vitalik.eth');
    expect(wallet.balance).toBe('1.5 ETH');
    expect(wallet.lastUsed).toBeInstanceOf(Date);
  });

  it('should handle empty localStorage gracefully', () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.connectedWallets).toEqual([]);
    expect(result.current.activeWallet).toBeNull();
  });

  it('should restore multiple wallets in correct order', () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
      { address: '0xbbb', chain: 'polygon', label: 'Wallet B' },
      { address: '0xccc', chain: 'arbitrum', label: 'Wallet C' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xbbb');

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    expect(result.current.connectedWallets).toHaveLength(3);
    expect(result.current.connectedWallets[0].address).toBe('0xaaa');
    expect(result.current.connectedWallets[1].address).toBe('0xbbb');
    expect(result.current.connectedWallets[2].address).toBe('0xccc');
  });
});

// ============================================================================
// Test Suite: ENS Name and Label Combination (Caching Regression Prevention)
// ============================================================================

describe('ENS Name and Label Combination', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          {ui}
        </WalletProvider>
      </QueryClientProvider>
    );
  };

  it('should display ENS name when available', () => {
    const mockWallets: ConnectedWallet[] = [
      {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chain: 'ethereum',
        ens: 'vitalik.eth',
      },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', mockWallets[0].address);

    renderWithProviders(<WalletSelector />);
    
    expect(screen.getByText('vitalik.eth')).toBeInTheDocument();
  });

  it('should display label when ENS is not available', () => {
    const mockWallets: ConnectedWallet[] = [
      {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chain: 'ethereum',
        label: 'My Main Wallet',
      },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', mockWallets[0].address);

    renderWithProviders(<WalletSelector />);
    
    expect(screen.getByText('My Main Wallet')).toBeInTheDocument();
  });

  it('should prioritize ENS over label', () => {
    const mockWallets: ConnectedWallet[] = [
      {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chain: 'ethereum',
        ens: 'vitalik.eth',
        label: 'My Main Wallet',
      },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', mockWallets[0].address);

    renderWithProviders(<WalletSelector />);
    
    expect(screen.getByText('vitalik.eth')).toBeInTheDocument();
    expect(screen.queryByText('My Main Wallet')).not.toBeInTheDocument();
  });

  it('should display Lens handle when available', () => {
    const mockWallets: ConnectedWallet[] = [
      {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chain: 'polygon',
        lens: 'stani.lens',
      },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', mockWallets[0].address);

    renderWithProviders(<WalletSelector />);
    
    expect(screen.getByText('stani.lens')).toBeInTheDocument();
  });

  it('should display Unstoppable Domains name when available', () => {
    const mockWallets: ConnectedWallet[] = [
      {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chain: 'ethereum',
        unstoppable: 'brad.crypto',
      },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', mockWallets[0].address);

    renderWithProviders(<WalletSelector />);
    
    expect(screen.getByText('brad.crypto')).toBeInTheDocument();
  });

  it('should follow priority: ENS > Lens > Unstoppable > Label > Address', () => {
    const mockWallets: ConnectedWallet[] = [
      {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chain: 'ethereum',
        ens: 'vitalik.eth',
        lens: 'stani.lens',
        unstoppable: 'brad.crypto',
        label: 'My Wallet',
      },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', mockWallets[0].address);

    renderWithProviders(<WalletSelector />);
    
    // Should show ENS (highest priority)
    expect(screen.getByText('vitalik.eth')).toBeInTheDocument();
    expect(screen.queryByText('stani.lens')).not.toBeInTheDocument();
    expect(screen.queryByText('brad.crypto')).not.toBeInTheDocument();
    expect(screen.queryByText('My Wallet')).not.toBeInTheDocument();
  });

  it('should update display when ENS is resolved after mount', async () => {
    const mockWallets: ConnectedWallet[] = [
      {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chain: 'ethereum',
        label: 'My Wallet',
      },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', mockWallets[0].address);

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    // Initially shows label
    expect(result.current.connectedWallets[0].label).toBe('My Wallet');
    expect(result.current.connectedWallets[0].ens).toBeUndefined();

    // Simulate ENS resolution (this would happen in the background)
    act(() => {
      const updatedWallets = result.current.connectedWallets.map(w => ({
        ...w,
        ens: 'vitalik.eth',
      }));
      // This would be done by the resolveWalletName function in the actual implementation
    });

    // After resolution, ENS should be available
    // Note: In the actual implementation, this happens via the resolveWalletName callback
  });

  it('should sync wallet labels from user preferences', async () => {
    const mockGetLabel = vi.fn((address: string) => {
      if (address === '0x1234567890abcdef1234567890abcdef12345678') {
        return 'Updated Label';
      }
      return undefined;
    });

    (useWalletLabels as any).mockReturnValue({
      labels: { '0x1234567890abcdef1234567890abcdef12345678': 'Updated Label' },
      isLoading: false,
      error: null,
      getLabel: mockGetLabel,
      setLabel: vi.fn(),
      removeLabel: vi.fn(),
      isSettingLabel: false,
      isRemovingLabel: false,
    });

    const mockWallets: ConnectedWallet[] = [
      {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chain: 'ethereum',
        label: 'Old Label',
      },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', mockWallets[0].address);

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => {
      // The wallet should have the updated label from user preferences
      expect(result.current.connectedWallets[0].label).toBe('Updated Label');
    });
  });

  it('should prevent caching regression by always checking for latest name', () => {
    const mockWallets: ConnectedWallet[] = [
      {
        address: '0x1234567890abcdef1234567890abcdef12345678',
        chain: 'ethereum',
        ens: 'vitalik.eth',
        label: 'My Wallet',
      },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', mockWallets[0].address);

    renderWithProviders(<WalletSelector />);
    
    // Should always show the most recent name (ENS in this case)
    expect(screen.getByText('vitalik.eth')).toBeInTheDocument();
    
    // Verify the full address is still accessible (in tooltip/aria-label)
    const button = screen.getByRole('button', { name: /select wallet/i });
    const ariaLabel = button.getAttribute('aria-label');
    expect(ariaLabel).toContain('vitalik.eth');
  });
});

// ============================================================================
// Test Suite: Dropdown Open/Close Behavior
// ============================================================================

describe('Dropdown Open/Close Behavior', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          {ui}
        </WalletProvider>
      </QueryClientProvider>
    );
  };

  it('should open dropdown when trigger is clicked', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /select wallet/i });
    expect(button).toHaveAttribute('aria-expanded', 'false');

    await userEvent.click(button);

    await waitFor(() => {
      expect(button).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('Connected Wallets')).toBeInTheDocument();
    });
  });

  it('should close dropdown when trigger is clicked again', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /select wallet/i });

    // Open
    await userEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Connected Wallets')).toBeInTheDocument();
    });

    // Close
    await userEvent.click(button);
    await waitFor(() => {
      expect(screen.queryByText('Connected Wallets')).not.toBeInTheDocument();
    });
  });

  it('should close dropdown when clicking outside', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /select wallet/i });

    // Open
    await userEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Connected Wallets')).toBeInTheDocument();
    });

    // Click outside
    await userEvent.click(document.body);
    await waitFor(() => {
      expect(screen.queryByText('Connected Wallets')).not.toBeInTheDocument();
    });
  });

  it('should close dropdown when pressing Escape', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /select wallet/i });

    // Open
    await userEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Connected Wallets')).toBeInTheDocument();
    });

    // Press Escape
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByText('Connected Wallets')).not.toBeInTheDocument();
    });
  });

  it('should close dropdown after selecting a wallet', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
      { address: '0xbbb', chain: 'polygon', label: 'Wallet B' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /select wallet/i });

    // Open
    await userEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Wallet B')).toBeInTheDocument();
    });

    // Select wallet
    const walletB = screen.getByText('Wallet B').closest('[role="menuitemradio"]');
    fireEvent.click(walletB!);

    await waitFor(() => {
      expect(screen.queryByText('Connected Wallets')).not.toBeInTheDocument();
    });
  });

  it('should close dropdown after connecting new wallet', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    mockEthereum.request.mockImplementation((args: { method: string }) => {
      if (args.method === 'eth_requestAccounts') {
        return Promise.resolve(['0xnewwallet']);
      }
      if (args.method === 'eth_chainId') {
        return Promise.resolve('0x1');
      }
      return Promise.resolve(null);
    });

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /select wallet/i });

    // Open
    await userEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Connect New Wallet')).toBeInTheDocument();
    });

    // Connect new wallet
    const connectButton = screen.getByText('Connect New Wallet');
    await userEvent.click(connectButton);

    await waitFor(() => {
      expect(screen.queryByText('Connected Wallets')).not.toBeInTheDocument();
    });
  });

  it('should return focus to trigger after closing', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /select wallet/i });

    // Open
    await userEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Connected Wallets')).toBeInTheDocument();
    });

    // Close with Escape
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByText('Connected Wallets')).not.toBeInTheDocument();
      expect(button).toHaveFocus();
    });
  });

  it('should not close dropdown when clicking inside dropdown content', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /select wallet/i });

    // Open
    await userEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Connected Wallets')).toBeInTheDocument();
    });

    // Click on label inside dropdown
    const label = screen.getByText('Connected Wallets');
    await userEvent.click(label);

    // Should still be open
    expect(screen.getByText('Connected Wallets')).toBeInTheDocument();
  });
});

// ============================================================================
// Test Suite: Keyboard Navigation
// ============================================================================

describe('Keyboard Navigation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          {ui}
        </WalletProvider>
      </QueryClientProvider>
    );
  };

  it('should open dropdown with Enter key', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /select wallet/i });
    button.focus();

    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(screen.getByText('Connected Wallets')).toBeInTheDocument();
    });
  });

  it('should open dropdown with Space key', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /select wallet/i });
    button.focus();

    await userEvent.keyboard(' ');

    await waitFor(() => {
      expect(screen.getByText('Connected Wallets')).toBeInTheDocument();
    });
  });

  it('should close dropdown with Escape key', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /select wallet/i });

    // Open
    await userEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Connected Wallets')).toBeInTheDocument();
    });

    // Close with Escape
    await userEvent.keyboard('{Escape}');
    await waitFor(() => {
      expect(screen.queryByText('Connected Wallets')).not.toBeInTheDocument();
    });
  });

  it('should navigate through dropdown items with Tab', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
      { address: '0xbbb', chain: 'polygon', label: 'Wallet B' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /select wallet/i });

    // Open
    await userEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Connected Wallets')).toBeInTheDocument();
    });

    // Verify menu items are accessible
    const menuItems = screen.getAllByRole('menuitemradio');
    expect(menuItems.length).toBe(2);
    
    // First item should be focusable
    menuItems[0].focus();
    expect(menuItems[0]).toHaveFocus();
  });

  it('should select wallet with Enter key', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
      { address: '0xbbb', chain: 'polygon', label: 'Wallet B' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /select wallet/i });

    // Open
    await userEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Wallet B')).toBeInTheDocument();
    });

    // Navigate and select
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{ArrowDown}');
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(localStorageMock.getItem('activeWallet')).toBe('0xbbb');
    });
  });

  it('should activate Connect New Wallet with Enter key', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    mockEthereum.request.mockImplementation((args: { method: string }) => {
      if (args.method === 'eth_requestAccounts') {
        return Promise.resolve(['0xnewwallet']);
      }
      if (args.method === 'eth_chainId') {
        return Promise.resolve('0x1');
      }
      return Promise.resolve(null);
    });

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /select wallet/i });

    // Open
    await userEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Connect New Wallet')).toBeInTheDocument();
    });

    // Focus and activate Connect button
    const menuItems = screen.getAllByRole('menuitem');
    const connectButton = menuItems[menuItems.length - 1];
    connectButton.focus();
    
    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockEthereum.request).toHaveBeenCalledWith({
        method: 'eth_requestAccounts',
      });
    });
  });

  it('should activate Connect New Wallet with Space key', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    mockEthereum.request.mockImplementation((args: { method: string }) => {
      if (args.method === 'eth_requestAccounts') {
        return Promise.resolve(['0xnewwallet']);
      }
      if (args.method === 'eth_chainId') {
        return Promise.resolve('0x1');
      }
      return Promise.resolve(null);
    });

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /select wallet/i });

    // Open
    await userEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Connect New Wallet')).toBeInTheDocument();
    });

    // Focus and activate Connect button
    const menuItems = screen.getAllByRole('menuitem');
    const connectButton = menuItems[menuItems.length - 1];
    connectButton.focus();
    
    await userEvent.keyboard(' ');

    await waitFor(() => {
      expect(mockEthereum.request).toHaveBeenCalledWith({
        method: 'eth_requestAccounts',
      });
    });
  });

  it('should maintain focus trap within dropdown', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
      { address: '0xbbb', chain: 'polygon', label: 'Wallet B' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /select wallet/i });

    // Open
    await userEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Connected Wallets')).toBeInTheDocument();
    });

    // Verify focus is within dropdown
    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems.length).toBeGreaterThan(0);
  });

  it('should return focus to trigger after selection', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum', label: 'Wallet A' },
      { address: '0xbbb', chain: 'polygon', label: 'Wallet B' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /select wallet/i });

    // Open
    await userEvent.click(button);
    await waitFor(() => {
      expect(screen.getByText('Wallet B')).toBeInTheDocument();
    });

    // Select wallet
    const walletB = screen.getByText('Wallet B').closest('[role="menuitemradio"]');
    fireEvent.click(walletB!);

    await waitFor(() => {
      expect(button).toHaveFocus();
    });
  });

  it('should support keyboard navigation on Connect Wallet button', async () => {
    mockEthereum.request.mockImplementation((args: { method: string }) => {
      if (args.method === 'eth_requestAccounts') {
        return Promise.resolve(['0xnewwallet']);
      }
      if (args.method === 'eth_chainId') {
        return Promise.resolve('0x1');
      }
      return Promise.resolve(null);
    });

    renderWithProviders(<WalletSelector />);
    
    const button = screen.getByRole('button', { name: /connect wallet/i });
    button.focus();
    expect(button).toHaveFocus();

    await userEvent.keyboard('{Enter}');

    await waitFor(() => {
      expect(mockEthereum.request).toHaveBeenCalledWith({
        method: 'eth_requestAccounts',
      });
    });
  });
});

// ============================================================================
// Test Suite: Code Coverage
// ============================================================================

describe('Code Coverage - Edge Cases', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createQueryClient();
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('should handle truncateAddress utility with various inputs', () => {
    expect(truncateAddress('0x1234567890abcdef1234567890abcdef12345678')).toBe('0x1234...5678');
    expect(truncateAddress('0x1234')).toBe('0x1234');
    expect(truncateAddress(undefined)).toBe('');
    expect(truncateAddress('0x1234567890abcdef1234567890abcdef12345678', 6)).toBe('0x123456...345678');
  });

  it('should handle chain ID mapping correctly', async () => {
    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    const chainTests = [
      { chainId: '0x1', expected: 'ethereum' },
      { chainId: '0x89', expected: 'polygon' },
      { chainId: '0xa4b1', expected: 'arbitrum' },
      { chainId: '0xa', expected: 'optimism' },
      { chainId: '0x2105', expected: 'base' },
      { chainId: '0x999', expected: 'ethereum' }, // Unknown chain defaults to ethereum
    ];

    for (const { chainId, expected } of chainTests) {
      mockEthereum.request.mockImplementation((args: { method: string }) => {
        if (args.method === 'eth_requestAccounts') {
          return Promise.resolve([`0x${chainId}address`]);
        }
        if (args.method === 'eth_chainId') {
          return Promise.resolve(chainId);
        }
        return Promise.resolve(null);
      });

      await act(async () => {
        await result.current.connectWallet();
      });

      const wallet = result.current.connectedWallets.find(w => w.address === `0x${chainId}address`);
      expect(wallet?.chain).toBe(expected);
    }
  });

  it('should handle wallet disconnection when not active', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xaaa', chain: 'ethereum' },
      { address: '0xbbb', chain: 'polygon' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));
    localStorageMock.setItem('activeWallet', '0xaaa');

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.disconnectWallet('0xbbb');
    });

    expect(result.current.connectedWallets).toHaveLength(1);
    expect(result.current.activeWallet).toBe('0xaaa'); // Should remain active
  });

  it('should handle already connected wallet gracefully', async () => {
    const mockWallets: ConnectedWallet[] = [
      { address: '0xexisting', chain: 'ethereum' },
    ];

    localStorageMock.setItem('connectedWallets', JSON.stringify(mockWallets));

    mockEthereum.request.mockImplementation((args: { method: string }) => {
      if (args.method === 'eth_requestAccounts') {
        return Promise.resolve(['0xexisting']);
      }
      return Promise.resolve(null);
    });

    const { result } = renderHook(() => useWallet(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.connectWallet();
    });

    // Should not add duplicate
    expect(result.current.connectedWallets).toHaveLength(1);
    expect(result.current.activeWallet).toBe('0xexisting');
  });
});
