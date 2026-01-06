/**
 * Tests for WalletQuotaSection Component
 * 
 * Tests the component that displays wallet quota usage information.
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode } from 'react'
import { WalletQuotaSection } from '../WalletQuotaSection'

// Mock the useWalletQuota hook
vi.mock('@/hooks/useWalletQuota', () => ({
  useWalletQuota: vi.fn(),
}))

// Import the mocked hook
import { useWalletQuota } from '@/hooks/useWalletQuota'

// Create a wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('WalletQuotaSection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders loading skeleton while fetching', () => {
    ;(useWalletQuota as any).mockReturnValue({
      quota: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })

    const { container } = render(<WalletQuotaSection />, { wrapper: createWrapper() })

    // Check for skeleton elements
    const skeleton = container.querySelector('.quota-display-skeleton')
    expect(skeleton).toBeInTheDocument()
  })

  test('renders quota display when data is loaded', async () => {
    ;(useWalletQuota as any).mockReturnValue({
      quota: {
        used_addresses: 2,
        used_rows: 4,
        total: 5,
        plan: 'free',
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<WalletQuotaSection />, { wrapper: createWrapper() })

    // Check for quota display elements
    await waitFor(() => {
      expect(screen.getByText('Wallet Quota')).toBeInTheDocument()
      expect(screen.getByText('Unique Addresses')).toBeInTheDocument()
      expect(screen.getByText('Wallet Rows')).toBeInTheDocument()
      expect(screen.getByText('Remaining')).toBeInTheDocument()
    })
  })

  test('displays correct quota values', async () => {
    ;(useWalletQuota as any).mockReturnValue({
      quota: {
        used_addresses: 3,
        used_rows: 6,
        total: 20,
        plan: 'pro',
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<WalletQuotaSection />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('3 / 20')).toBeInTheDocument()
      expect(screen.getByText('6')).toBeInTheDocument()
      expect(screen.getByText('17')).toBeInTheDocument() // remaining = 20 - 3
    })
  })

  test('displays plan badge', async () => {
    ;(useWalletQuota as any).mockReturnValue({
      quota: {
        used_addresses: 1,
        used_rows: 2,
        total: 5,
        plan: 'free',
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<WalletQuotaSection />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText('free')).toBeInTheDocument()
    })
  })

  test('shows warning when quota is nearly full', async () => {
    ;(useWalletQuota as any).mockReturnValue({
      quota: {
        used_addresses: 4,
        used_rows: 8,
        total: 5,
        plan: 'free',
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<WalletQuotaSection />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/approaching your wallet quota limit/i)).toBeInTheDocument()
    })
  })

  test('shows error when quota is reached', async () => {
    ;(useWalletQuota as any).mockReturnValue({
      quota: {
        used_addresses: 5,
        used_rows: 10,
        total: 5,
        plan: 'free',
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<WalletQuotaSection />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(screen.getByText(/reached your wallet quota limit/i)).toBeInTheDocument()
    })
  })

  test('renders error state when fetch fails', () => {
    const mockError = new Error('Failed to fetch quota')
    ;(useWalletQuota as any).mockReturnValue({
      quota: null,
      isLoading: false,
      error: mockError,
      refetch: vi.fn(),
    })

    render(<WalletQuotaSection />, { wrapper: createWrapper() })

    expect(screen.getByText('Failed to Load Quota')).toBeInTheDocument()
    expect(screen.getByText('Failed to fetch quota')).toBeInTheDocument()
  })

  test('does not render skeleton when showSkeleton is false', () => {
    ;(useWalletQuota as any).mockReturnValue({
      quota: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })

    render(<WalletQuotaSection showSkeleton={false} />, { wrapper: createWrapper() })

    // Should render nothing when loading and showSkeleton is false
    expect(screen.queryByText(/quota-display-skeleton/i)).not.toBeInTheDocument()
  })

  test('calls onQuotaReached callback when quota is reached', async () => {
    const onQuotaReached = vi.fn()

    ;(useWalletQuota as any).mockReturnValue({
      quota: {
        used_addresses: 5,
        used_rows: 10,
        total: 5,
        plan: 'free',
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    render(<WalletQuotaSection onQuotaReached={onQuotaReached} />, { wrapper: createWrapper() })

    await waitFor(() => {
      expect(onQuotaReached).toHaveBeenCalled()
    })
  })

  test('applies custom className', () => {
    ;(useWalletQuota as any).mockReturnValue({
      quota: {
        used_addresses: 1,
        used_rows: 2,
        total: 5,
        plan: 'free',
      },
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    const { container } = render(
      <WalletQuotaSection className="custom-class" />,
      { wrapper: createWrapper() }
    )

    const quotaDisplay = container.querySelector('.quota-display')
    expect(quotaDisplay).toHaveClass('custom-class')
  })

  test('returns null when no data and no error', () => {
    ;(useWalletQuota as any).mockReturnValue({
      quota: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    const { container } = render(<WalletQuotaSection />, { wrapper: createWrapper() })

    // Should render nothing
    expect(container.firstChild).toBeNull()
  })
})

