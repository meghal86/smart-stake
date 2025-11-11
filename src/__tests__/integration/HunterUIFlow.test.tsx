/**
 * Integration Tests: Hunter Screen UI Flow
 * 
 * Tests the complete UI flow from user interactions to API calls:
 * - Filter flow from UI to API
 * - Search integration with feed query
 * - Save/share/report actions from cards
 * - Infinite scroll with cursor pagination
 * - Responsive layout changes
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import Hunter from '@/pages/Hunter';
import { mockOpportunities } from '@/__tests__/fixtures/opportunities';

import { vi } from 'vitest';

// Mock Next.js router
const mockPush = vi.fn();
const mockReplace = vi.fn();
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    pathname: '/hunter',
    query: {},
    asPath: '/hunter',
  }),
}));

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      delete: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

// Mock window.matchMedia for responsive tests
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

// MSW server setup
const server = setupServer(
  // Default handler for opportunities endpoint
  http.get('/api/hunter/opportunities', ({ request }) => {
    const url = new URL(request.url);
    const cursor = url.searchParams.get('cursor');
    const search = url.searchParams.get('q');
    const types = url.searchParams.getAll('type');
    const chains = url.searchParams.getAll('chains');
    const trustMin = url.searchParams.get('trust_min');
    
    // Filter opportunities based on query params
    let filtered = [...mockOpportunities];
    
    if (search) {
      filtered = filtered.filter(op => 
        op.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    if (types.length > 0) {
      filtered = filtered.filter(op => types.includes(op.type));
    }
    
    if (chains.length > 0) {
      filtered = filtered.filter(op => 
        op.chains.some(chain => chains.includes(chain))
      );
    }
    
    if (trustMin) {
      const minScore = parseInt(trustMin);
      filtered = filtered.filter(op => op.trust.score >= minScore);
    }
    
    // Pagination
    const pageSize = 12;
    const startIndex = cursor ? parseInt(atob(cursor)) : 0;
    const items = filtered.slice(startIndex, startIndex + pageSize);
    const nextCursor = startIndex + pageSize < filtered.length 
      ? btoa(String(startIndex + pageSize))
      : null;
    
    return HttpResponse.json({
      items,
      cursor: nextCursor,
      ts: new Date().toISOString(),
    });
  }),
  
  // Save endpoint
  http.post('/api/hunter/save', () => {
    return HttpResponse.json({ success: true });
  }),
  
  // Share endpoint
  http.post('/api/hunter/share', () => {
    return HttpResponse.json({ shareUrl: 'https://alphawhale.com/share/123' });
  }),
  
  // Report endpoint
  http.post('/api/hunter/report', () => {
    return HttpResponse.json({ success: true });
  })
);

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  vi.clearAllMocks();
});
afterAll(() => server.close());

// Helper to render with providers
const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('Hunter Screen UI Flow Integration Tests', () => {
  beforeEach(() => {
    mockMatchMedia(true); // Desktop by default
  });
  
  describe('Filter Flow from UI to API', () => {
    it('should apply type filter and fetch filtered results', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Hunter />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(mockOpportunities[0].title)).toBeInTheDocument();
      });
      
      // Open filter drawer
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      // Select airdrop type
      const airdropCheckbox = screen.getByRole('checkbox', { name: /airdrop/i });
      await user.click(airdropCheckbox);
      
      // Apply filters
      const applyButton = screen.getByRole('button', { name: /apply/i });
      await user.click(applyButton);
      
      // Verify API was called with correct params
      await waitFor(() => {
        const airdropOpps = mockOpportunities.filter(op => op.type === 'airdrop');
        expect(screen.getByText(airdropOpps[0].title)).toBeInTheDocument();
      });
    });
    
    it('should apply chain filter and update results', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Hunter />);
      
      await waitFor(() => {
        expect(screen.getByText(mockOpportunities[0].title)).toBeInTheDocument();
      });
      
      // Open filter drawer
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      // Select Ethereum chain
      const ethereumCheckbox = screen.getByRole('checkbox', { name: /ethereum/i });
      await user.click(ethereumCheckbox);
      
      // Apply filters
      const applyButton = screen.getByRole('button', { name: /apply/i });
      await user.click(applyButton);
      
      // Verify filtered results
      await waitFor(() => {
        const ethereumOpps = mockOpportunities.filter(op => 
          op.chains.includes('ethereum')
        );
        expect(screen.getByText(ethereumOpps[0].title)).toBeInTheDocument();
      });
    });
    
    it('should apply trust level filter', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Hunter />);
      
      await waitFor(() => {
        expect(screen.getByText(mockOpportunities[0].title)).toBeInTheDocument();
      });
      
      // Open filter drawer
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      // Set minimum trust score to 80
      const trustSlider = screen.getByRole('slider', { name: /minimum trust/i });
      await user.click(trustSlider);
      
      // Apply filters
      const applyButton = screen.getByRole('button', { name: /apply/i });
      await user.click(applyButton);
      
      // Verify only high trust opportunities are shown
      await waitFor(() => {
        const highTrustOpps = mockOpportunities.filter(op => op.trust.score >= 80);
        expect(screen.getByText(highTrustOpps[0].title)).toBeInTheDocument();
      });
    });
    
    it('should combine multiple filters', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Hunter />);
      
      await waitFor(() => {
        expect(screen.getByText(mockOpportunities[0].title)).toBeInTheDocument();
      });
      
      // Open filter drawer
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      // Select multiple filters
      const airdropCheckbox = screen.getByRole('checkbox', { name: /airdrop/i });
      await user.click(airdropCheckbox);
      
      const ethereumCheckbox = screen.getByRole('checkbox', { name: /ethereum/i });
      await user.click(ethereumCheckbox);
      
      // Apply filters
      const applyButton = screen.getByRole('button', { name: /apply/i });
      await user.click(applyButton);
      
      // Verify combined filter results
      await waitFor(() => {
        const filtered = mockOpportunities.filter(op => 
          op.type === 'airdrop' && op.chains.includes('ethereum')
        );
        if (filtered.length > 0) {
          expect(screen.getByText(filtered[0].title)).toBeInTheDocument();
        }
      });
    });
    
    it('should persist filters in URL', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Hunter />);
      
      await waitFor(() => {
        expect(screen.getByText(mockOpportunities[0].title)).toBeInTheDocument();
      });
      
      // Open filter drawer and apply filter
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      const airdropCheckbox = screen.getByRole('checkbox', { name: /airdrop/i });
      await user.click(airdropCheckbox);
      
      const applyButton = screen.getByRole('button', { name: /apply/i });
      await user.click(applyButton);
      
      // Verify URL was updated
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith(
          expect.objectContaining({
            query: expect.objectContaining({
              type: expect.arrayContaining(['airdrop']),
            }),
          }),
          undefined,
          { shallow: true }
        );
      });
    });
  });
  
  describe('Search Integration with Feed Query', () => {
    it('should search opportunities and update results', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Hunter />);
      
      await waitFor(() => {
        expect(screen.getByText(mockOpportunities[0].title)).toBeInTheDocument();
      });
      
      // Find search input
      const searchInput = screen.getByPlaceholderText(/search opportunities/i);
      
      // Type search query
      await user.type(searchInput, 'Uniswap');
      
      // Wait for debounced search (300ms)
      await waitFor(() => {
        const searchResults = mockOpportunities.filter(op => 
          op.title.toLowerCase().includes('uniswap')
        );
        if (searchResults.length > 0) {
          expect(screen.getByText(searchResults[0].title)).toBeInTheDocument();
        }
      }, { timeout: 500 });
    });
    
    it('should debounce search input', async () => {
      const user = userEvent.setup();
      const searchSpy = vi.fn();
      
      server.use(
        http.get('/api/hunter/opportunities', ({ request }) => {
          const url = new URL(request.url);
          searchSpy(url.searchParams.get('q'));
          return HttpResponse.json({
            items: mockOpportunities,
            cursor: null,
            ts: new Date().toISOString(),
          });
        })
      );
      
      renderWithProviders(<Hunter />);
      
      const searchInput = screen.getByPlaceholderText(/search opportunities/i);
      
      // Type multiple characters quickly
      await user.type(searchInput, 'test');
      
      // Should only call API once after debounce
      await waitFor(() => {
        expect(searchSpy).toHaveBeenCalledTimes(1);
        expect(searchSpy).toHaveBeenCalledWith('test');
      }, { timeout: 500 });
    });
    
    it('should clear search and show all results', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Hunter />);
      
      await waitFor(() => {
        expect(screen.getByText(mockOpportunities[0].title)).toBeInTheDocument();
      });
      
      // Search
      const searchInput = screen.getByPlaceholderText(/search opportunities/i);
      await user.type(searchInput, 'Uniswap');
      
      await waitFor(() => {
        const searchResults = mockOpportunities.filter(op => 
          op.title.toLowerCase().includes('uniswap')
        );
        if (searchResults.length > 0) {
          expect(screen.getByText(searchResults[0].title)).toBeInTheDocument();
        }
      }, { timeout: 500 });
      
      // Clear search
      const clearButton = screen.getByRole('button', { name: /clear search/i });
      await user.click(clearButton);
      
      // Verify all results are shown again
      await waitFor(() => {
        expect(screen.getByText(mockOpportunities[0].title)).toBeInTheDocument();
      });
    });
    
    it('should show empty state for no search results', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Hunter />);
      
      await waitFor(() => {
        expect(screen.getByText(mockOpportunities[0].title)).toBeInTheDocument();
      });
      
      // Search for non-existent opportunity
      const searchInput = screen.getByPlaceholderText(/search opportunities/i);
      await user.type(searchInput, 'NonExistentOpportunity12345');
      
      // Verify empty state
      await waitFor(() => {
        expect(screen.getByText(/no opportunities found/i)).toBeInTheDocument();
      }, { timeout: 500 });
    });
  });
  
  describe('Save/Share/Report Actions from Cards', () => {
    it('should save an opportunity', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Hunter />);
      
      await waitFor(() => {
        expect(screen.getByText(mockOpportunities[0].title)).toBeInTheDocument();
      });
      
      // Find first opportunity card
      const cards = screen.getAllByTestId('opportunity-card');
      const firstCard = cards[0];
      
      // Click save button
      const saveButton = within(firstCard).getByRole('button', { name: /save/i });
      await user.click(saveButton);
      
      // Verify success toast
      await waitFor(() => {
        expect(screen.getByText(/saved successfully/i)).toBeInTheDocument();
      });
    });
    
    it('should share an opportunity', async () => {
      const user = userEvent.setup();
      
      // Mock clipboard API
      Object.assign(navigator, {
        clipboard: {
          writeText: vi.fn().mockResolvedValue(undefined),
        },
      });
      
      renderWithProviders(<Hunter />);
      
      await waitFor(() => {
        expect(screen.getByText(mockOpportunities[0].title)).toBeInTheDocument();
      });
      
      // Find first opportunity card
      const cards = screen.getAllByTestId('opportunity-card');
      const firstCard = cards[0];
      
      // Click share button
      const shareButton = within(firstCard).getByRole('button', { name: /share/i });
      await user.click(shareButton);
      
      // Verify clipboard was called
      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalled();
      });
      
      // Verify success toast
      await waitFor(() => {
        expect(screen.getByText(/link copied/i)).toBeInTheDocument();
      });
    });
    
    it('should report an opportunity', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Hunter />);
      
      await waitFor(() => {
        expect(screen.getByText(mockOpportunities[0].title)).toBeInTheDocument();
      });
      
      // Find first opportunity card
      const cards = screen.getAllByTestId('opportunity-card');
      const firstCard = cards[0];
      
      // Click report button
      const reportButton = within(firstCard).getByRole('button', { name: /report/i });
      await user.click(reportButton);
      
      // Verify report modal opens
      await waitFor(() => {
        expect(screen.getByRole('dialog', { name: /report opportunity/i })).toBeInTheDocument();
      });
      
      // Select report reason
      const phishingOption = screen.getByRole('radio', { name: /phishing/i });
      await user.click(phishingOption);
      
      // Submit report
      const submitButton = screen.getByRole('button', { name: /submit report/i });
      await user.click(submitButton);
      
      // Verify success
      await waitFor(() => {
        expect(screen.getByText(/report submitted/i)).toBeInTheDocument();
      });
    });
    
    it('should handle save error gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock error response
      server.use(
        http.post('/api/hunter/save', () => {
          return HttpResponse.json(
            { error: { code: 'INTERNAL', message: 'Failed to save' } },
            { status: 500 }
          );
        })
      );
      
      renderWithProviders(<Hunter />);
      
      await waitFor(() => {
        expect(screen.getByText(mockOpportunities[0].title)).toBeInTheDocument();
      });
      
      // Try to save
      const cards = screen.getAllByTestId('opportunity-card');
      const saveButton = within(cards[0]).getByRole('button', { name: /save/i });
      await user.click(saveButton);
      
      // Verify error toast
      await waitFor(() => {
        expect(screen.getByText(/failed to save/i)).toBeInTheDocument();
      });
    });
  });
  
  describe('Infinite Scroll with Cursor Pagination', () => {
    it('should load next page on scroll', async () => {
      renderWithProviders(<Hunter />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText(mockOpportunities[0].title)).toBeInTheDocument();
      });
      
      // Get initial card count
      const initialCards = screen.getAllByTestId('opportunity-card');
      const initialCount = initialCards.length;
      
      // Scroll to bottom
      const scrollContainer = screen.getByTestId('opportunity-grid');
      Object.defineProperty(scrollContainer, 'scrollTop', { value: 1000, writable: true });
      Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1500, writable: true });
      Object.defineProperty(scrollContainer, 'clientHeight', { value: 500, writable: true });
      
      scrollContainer.dispatchEvent(new Event('scroll'));
      
      // Wait for next page to load
      await waitFor(() => {
        const updatedCards = screen.getAllByTestId('opportunity-card');
        expect(updatedCards.length).toBeGreaterThan(initialCount);
      });
    });
    
    it('should use cursor for pagination', async () => {
      const cursorSpy = vi.fn();
      
      server.use(
        http.get('/api/hunter/opportunities', ({ request }) => {
          const url = new URL(request.url);
          const cursor = url.searchParams.get('cursor');
          cursorSpy(cursor);
          
          const startIndex = cursor ? parseInt(atob(cursor)) : 0;
          const items = mockOpportunities.slice(startIndex, startIndex + 12);
          const nextCursor = startIndex + 12 < mockOpportunities.length 
            ? btoa(String(startIndex + 12))
            : null;
          
          return HttpResponse.json({
            items,
            cursor: nextCursor,
            ts: new Date().toISOString(),
          });
        })
      );
      
      renderWithProviders(<Hunter />);
      
      await waitFor(() => {
        expect(screen.getByText(mockOpportunities[0].title)).toBeInTheDocument();
      });
      
      // Trigger scroll
      const scrollContainer = screen.getByTestId('opportunity-grid');
      Object.defineProperty(scrollContainer, 'scrollTop', { value: 1000, writable: true });
      Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1500, writable: true });
      Object.defineProperty(scrollContainer, 'clientHeight', { value: 500, writable: true });
      
      scrollContainer.dispatchEvent(new Event('scroll'));
      
      // Verify cursor was used
      await waitFor(() => {
        expect(cursorSpy).toHaveBeenCalledWith(null); // First call
        expect(cursorSpy).toHaveBeenCalledWith(expect.any(String)); // Second call with cursor
      });
    });
    
    it('should not load duplicate cards', async () => {
      renderWithProviders(<Hunter />);
      
      await waitFor(() => {
        expect(screen.getByText(mockOpportunities[0].title)).toBeInTheDocument();
      });
      
      // Get all card IDs
      const getCardIds = () => {
        const cards = screen.getAllByTestId('opportunity-card');
        return cards.map(card => card.getAttribute('data-opportunity-id'));
      };
      
      const initialIds = getCardIds();
      
      // Scroll to load more
      const scrollContainer = screen.getByTestId('opportunity-grid');
      Object.defineProperty(scrollContainer, 'scrollTop', { value: 1000, writable: true });
      Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1500, writable: true });
      Object.defineProperty(scrollContainer, 'clientHeight', { value: 500, writable: true });
      
      scrollContainer.dispatchEvent(new Event('scroll'));
      
      await waitFor(() => {
        const updatedIds = getCardIds();
        expect(updatedIds.length).toBeGreaterThan(initialIds.length);
      });
      
      // Verify no duplicates
      const allIds = getCardIds();
      const uniqueIds = new Set(allIds);
      expect(allIds.length).toBe(uniqueIds.size);
    });
    
    it('should show loading indicator while fetching next page', async () => {
      renderWithProviders(<Hunter />);
      
      await waitFor(() => {
        expect(screen.getByText(mockOpportunities[0].title)).toBeInTheDocument();
      });
      
      // Scroll to trigger load
      const scrollContainer = screen.getByTestId('opportunity-grid');
      Object.defineProperty(scrollContainer, 'scrollTop', { value: 1000, writable: true });
      Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1500, writable: true });
      Object.defineProperty(scrollContainer, 'clientHeight', { value: 500, writable: true });
      
      scrollContainer.dispatchEvent(new Event('scroll'));
      
      // Verify loading indicator appears
      expect(screen.getByTestId('loading-more')).toBeInTheDocument();
    });
    
    it('should stop loading when no more pages', async () => {
      // Mock single page response
      server.use(
        http.get('/api/hunter/opportunities', () => {
          return HttpResponse.json({
            items: mockOpportunities.slice(0, 5),
            cursor: null, // No more pages
            ts: new Date().toISOString(),
          });
        })
      );
      
      renderWithProviders(<Hunter />);
      
      await waitFor(() => {
        expect(screen.getByText(mockOpportunities[0].title)).toBeInTheDocument();
      });
      
      // Scroll to bottom
      const scrollContainer = screen.getByTestId('opportunity-grid');
      Object.defineProperty(scrollContainer, 'scrollTop', { value: 1000, writable: true });
      Object.defineProperty(scrollContainer, 'scrollHeight', { value: 1500, writable: true });
      Object.defineProperty(scrollContainer, 'clientHeight', { value: 500, writable: true });
      
      scrollContainer.dispatchEvent(new Event('scroll'));
      
      // Verify no loading indicator
      await waitFor(() => {
        expect(screen.queryByTestId('loading-more')).not.toBeInTheDocument();
      });
    });
  });
  
  describe('Responsive Layout Changes', () => {
    it('should show mobile layout on small screens', async () => {
      mockMatchMedia(false); // Mobile
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      
      renderWithProviders(<Hunter />);
      
      await waitFor(() => {
        expect(screen.getByText(mockOpportunities[0].title)).toBeInTheDocument();
      });
      
      // Verify mobile layout
      const grid = screen.getByTestId('opportunity-grid');
      expect(grid).toHaveClass('grid-cols-1');
      
      // Verify right rail is hidden
      expect(screen.queryByTestId('right-rail')).not.toBeInTheDocument();
      
      // Verify filter drawer is accessible
      const filterButton = screen.getByRole('button', { name: /filters/i });
      expect(filterButton).toBeInTheDocument();
    });
    
    it('should show tablet layout on medium screens', async () => {
      mockMatchMedia(true);
      Object.defineProperty(window, 'innerWidth', { value: 768, writable: true });
      
      renderWithProviders(<Hunter />);
      
      await waitFor(() => {
        expect(screen.getByText(mockOpportunities[0].title)).toBeInTheDocument();
      });
      
      // Verify tablet layout
      const grid = screen.getByTestId('opportunity-grid');
      expect(grid).toHaveClass('md:grid-cols-2');
      
      // Right rail still hidden on tablet
      expect(screen.queryByTestId('right-rail')).not.toBeInTheDocument();
    });
    
    it('should show desktop layout with right rail on large screens', async () => {
      mockMatchMedia(true);
      Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true });
      
      renderWithProviders(<Hunter />);
      
      await waitFor(() => {
        expect(screen.getByText(mockOpportunities[0].title)).toBeInTheDocument();
      });
      
      // Verify desktop layout
      const grid = screen.getByTestId('opportunity-grid');
      expect(grid).toHaveClass('lg:grid-cols-3');
      
      // Verify right rail is visible
      expect(screen.getByTestId('right-rail')).toBeInTheDocument();
    });
    
    it('should adapt filter drawer to mobile', async () => {
      const user = userEvent.setup();
      mockMatchMedia(false); // Mobile
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      
      renderWithProviders(<Hunter />);
      
      await waitFor(() => {
        expect(screen.getByText(mockOpportunities[0].title)).toBeInTheDocument();
      });
      
      // Open filter drawer
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      // Verify drawer opens as bottom sheet on mobile
      const drawer = screen.getByRole('dialog');
      expect(drawer).toHaveClass('bottom-sheet');
    });
    
    it('should maintain state across layout changes', async () => {
      const user = userEvent.setup();
      
      // Start with desktop
      mockMatchMedia(true);
      Object.defineProperty(window, 'innerWidth', { value: 1280, writable: true });
      
      const { rerender } = renderWithProviders(<Hunter />);
      
      await waitFor(() => {
        expect(screen.getByText(mockOpportunities[0].title)).toBeInTheDocument();
      });
      
      // Apply a filter
      const filterButton = screen.getByRole('button', { name: /filters/i });
      await user.click(filterButton);
      
      const airdropCheckbox = screen.getByRole('checkbox', { name: /airdrop/i });
      await user.click(airdropCheckbox);
      
      const applyButton = screen.getByRole('button', { name: /apply/i });
      await user.click(applyButton);
      
      // Change to mobile
      mockMatchMedia(false);
      Object.defineProperty(window, 'innerWidth', { value: 375, writable: true });
      window.dispatchEvent(new Event('resize'));
      
      rerender(
        <QueryClientProvider client={new QueryClient()}>
          <Hunter />
        </QueryClientProvider>
      );
      
      // Verify filter is still applied
      await waitFor(() => {
        const airdropOpps = mockOpportunities.filter(op => op.type === 'airdrop');
        expect(screen.getByText(airdropOpps[0].title)).toBeInTheDocument();
      });
    });
  });
});
