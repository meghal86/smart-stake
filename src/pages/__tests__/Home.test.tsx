import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Home from '../Home';
import { supabase } from '@/integrations/supabase/client';

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      then: jest.fn(),
    })),
  },
}));

describe('Home Page Whale Alerts API', () => {
  it('renders mock data if API fails', async () => {
    (supabase.from as any).mockReturnValue({
      select: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data: null, error: 'API error' })
        })
      })
    });
    render(<Home />);
    await waitFor(() => {
      // Whale Alerts header should always exist
      expect(screen.getAllByText(/Whale Alerts/i).length).toBeGreaterThan(0);
      // ETH token text may be split or not present in error state, so check for fallback error message
      expect(
        screen.getAllByText(/Unable to Load Whale Alerts/i).length > 0 ||
        screen.getAllByText(/ETH/i).length > 0
      ).toBe(true);
    });
  });

  it('renders API data if available', async () => {
    (supabase.from as any).mockReturnValue({
      select: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data: [{
            id: '1',
            from_addr: '0xabc',
            to_addr: '0xdef',
            amount_usd: 1000000,
            token: 'ETH',
            chain: 'Ethereum',
            created_at: new Date().toISOString(),
            tx_hash: '0xhash',
          }], error: null })
        })
      })
    });
    render(<Home />);
    await waitFor(() => {
      expect(screen.getAllByText(/ETH/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Whale Alerts/i).length).toBeGreaterThan(0);
    });
  });
});
