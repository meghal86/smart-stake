/**
 * WalletNetworkGuard Component Tests
 * 
 * Tests the component that displays "Not added on this network" UI.
 * 
 * Validates: Requirements 6.2, 6.3, 15.7
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { WalletNetworkGuard } from '../WalletNetworkGuard';
import { useWalletNetworkAvailability } from '@/hooks/useWalletNetworkAvailability';

// Mock the hook
vi.mock('@/hooks/useWalletNetworkAvailability', () => ({
  useWalletNetworkAvailability: vi.fn(),
}));

describe('WalletNetworkGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('does not render when wallet is available on network', () => {
    vi.mocked(useWalletNetworkAvailability).mockReturnValue({
      isAvailable: true,
      activeWallet: '0x1234567890123456789012345678901234567890',
      activeNetwork: 'eip155:1',
      networkName: 'Ethereum',
      isMissing: false,
    });

    const { container } = render(<WalletNetworkGuard />);

    expect(container.firstChild).toBeNull();
  });

  test('does not render when no active wallet', () => {
    vi.mocked(useWalletNetworkAvailability).mockReturnValue({
      isAvailable: false,
      activeWallet: null,
      activeNetwork: 'eip155:1',
      networkName: 'Ethereum',
      isMissing: false,
    });

    const { container } = render(<WalletNetworkGuard />);

    expect(container.firstChild).toBeNull();
  });

  test('renders NotAddedOnNetwork when wallet is missing on network', () => {
    vi.mocked(useWalletNetworkAvailability).mockReturnValue({
      isAvailable: false,
      activeWallet: '0x1234567890123456789012345678901234567890',
      activeNetwork: 'eip155:137',
      networkName: 'Polygon',
      isMissing: true,
    });

    render(<WalletNetworkGuard />);

    expect(screen.getByText(/Not added on Polygon/i)).toBeInTheDocument();
    expect(screen.getByText(/0x1234567890123456789012345678901234567890/i)).toBeInTheDocument();
  });

  test('calls onAddNetwork callback when button clicked', () => {
    const onAddNetwork = vi.fn();

    vi.mocked(useWalletNetworkAvailability).mockReturnValue({
      isAvailable: false,
      activeWallet: '0x1234567890123456789012345678901234567890',
      activeNetwork: 'eip155:137',
      networkName: 'Polygon',
      isMissing: true,
    });

    render(<WalletNetworkGuard onAddNetwork={onAddNetwork} />);

    const button = screen.getByRole('button', { name: /Add.*Polygon/i });
    fireEvent.click(button);

    expect(onAddNetwork).toHaveBeenCalledOnce();
  });

  test('navigates to settings when no onAddNetwork callback provided', () => {
    const originalLocation = window.location;
    delete (window as any).location;
    window.location = { href: '' } as any;

    vi.mocked(useWalletNetworkAvailability).mockReturnValue({
      isAvailable: false,
      activeWallet: '0x1234567890123456789012345678901234567890',
      activeNetwork: 'eip155:137',
      networkName: 'Polygon',
      isMissing: true,
    });

    render(<WalletNetworkGuard />);

    const button = screen.getByRole('button', { name: /Add.*Polygon/i });
    fireEvent.click(button);

    expect(window.location.href).toBe('/settings?tab=wallets&action=add');

    window.location = originalLocation;
  });

  test('applies custom className', () => {
    vi.mocked(useWalletNetworkAvailability).mockReturnValue({
      isAvailable: false,
      activeWallet: '0x1234567890123456789012345678901234567890',
      activeNetwork: 'eip155:137',
      networkName: 'Polygon',
      isMissing: true,
    });

    const { container } = render(
      <WalletNetworkGuard className="custom-class" />
    );

    const guardElement = container.querySelector('.custom-class');
    expect(guardElement).toBeInTheDocument();
  });

  test('respects onlyShowWhenMissing prop', () => {
    vi.mocked(useWalletNetworkAvailability).mockReturnValue({
      isAvailable: false,
      activeWallet: '0x1234567890123456789012345678901234567890',
      activeNetwork: 'eip155:137',
      networkName: 'Polygon',
      isMissing: false, // Not actually missing
    });

    const { container } = render(
      <WalletNetworkGuard onlyShowWhenMissing={true} />
    );

    expect(container.firstChild).toBeNull();
  });

  test('displays correct network name in button', () => {
    vi.mocked(useWalletNetworkAvailability).mockReturnValue({
      isAvailable: false,
      activeWallet: '0x1234567890123456789012345678901234567890',
      activeNetwork: 'eip155:42161',
      networkName: 'Arbitrum',
      isMissing: true,
    });

    render(<WalletNetworkGuard />);

    expect(screen.getByRole('button', { name: /Add.*Arbitrum/i })).toBeInTheDocument();
  });

  test('displays wallet address in component', () => {
    const walletAddress = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';

    vi.mocked(useWalletNetworkAvailability).mockReturnValue({
      isAvailable: false,
      activeWallet: walletAddress,
      activeNetwork: 'eip155:137',
      networkName: 'Polygon',
      isMissing: true,
    });

    render(<WalletNetworkGuard />);

    expect(screen.getByText(new RegExp(walletAddress, 'i'))).toBeInTheDocument();
  });
});
