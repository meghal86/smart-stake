import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import Hunter from '@/pages/Hunter';

// Mock the API response
global.fetch = vi.fn();

const mockQuests = [
  {
    id: 'test-quest',
    protocol: 'Test Protocol',
    network: 'Base',
    rewardUSD: 1000,
    confidence: 0.9,
    guardianScore: 98,
    steps: 3,
    estimatedTime: '5 min',
    category: 'Airdrop',
    isNew: true,
    completionPercent: 0
  }
];

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Hunter Page', () => {
  beforeEach(() => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => mockQuests,
    } as Response);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders Hunter page with title and subtitle', async () => {
    render(
      <TestWrapper>
        <Hunter />
      </TestWrapper>
    );

    expect(screen.getByText('Hunter')).toBeInTheDocument();
    expect(screen.getByText('Opportunity Feed')).toBeInTheDocument();
    expect(screen.getByText(/Safe, verified crypto opportunities/)).toBeInTheDocument();
  });

  it('displays quest cards when data is loaded', async () => {
    render(
      <TestWrapper>
        <Hunter />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Quest FOUND: Test Protocol')).toBeInTheDocument();
      expect(screen.getByText('Guardian Safe Score: ✅ 98%')).toBeInTheDocument();
      expect(screen.getByText('$1,000 potential')).toBeInTheDocument();
      expect(screen.getByText('90%')).toBeInTheDocument();
    });
  });

  it('shows filter options', () => {
    render(
      <TestWrapper>
        <Hunter />
      </TestWrapper>
    );

    // Check if filter selects are present
    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(3); // Network, Category, Safety
  });

  it('displays AI copilot orb', () => {
    render(
      <TestWrapper>
        <Hunter />
      </TestWrapper>
    );

    const orbButton = screen.getByRole('button');
    expect(orbButton).toBeInTheDocument();
  });
});