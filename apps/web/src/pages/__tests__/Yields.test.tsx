import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Yields from '../Yields';
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

describe('Yields Page API', () => {
  it('renders mock protocols if API fails', async () => {
    (supabase.from as any).mockReturnValue({
      select: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data: null, error: 'API error' })
        })
      })
    });
    render(<Yields />);
    await waitFor(() => {
      expect(screen.getByText(/Compound V3/i)).toBeInTheDocument();
      expect(screen.getByText(/Yields/i)).toBeInTheDocument();
    });
  });

  it('renders API protocols if available', async () => {
    (supabase.from as any).mockReturnValue({
      select: () => ({
        order: () => ({
          limit: () => Promise.resolve({ data: [{
            id: '1',
            protocol: 'Compound V3',
            apy: 10,
            chain: 'Ethereum',
            tvl_usd: 1000000,
            risk_score: 5,
            updated_at: new Date().toISOString(),
          }], error: null })
        })
      })
    });
    render(<Yields />);
    await waitFor(() => {
      expect(screen.getByText(/Compound V3/i)).toBeInTheDocument();
      expect(screen.getByText(/Yields/i)).toBeInTheDocument();
    });
  });
});
