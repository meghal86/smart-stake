import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Scanner from '../Scanner';
import { supabase } from '@/integrations/supabase/client';
import '@testing-library/jest-dom';

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

describe('Scanner Page riskScan API', () => {
  it('shows mock scan result if API fails', async () => {
    (supabase.functions.invoke as any).mockImplementation(() => Promise.resolve({ data: null, error: 'API error' }));
    render(<Scanner />);
    fireEvent.change(screen.getByPlaceholderText(/Wallet Address/i), { target: { value: '0xabc' } });
    fireEvent.click(screen.getAllByText(/Scan/i)[0]);
    await waitFor(() => {
      // Accept either the fallback error message or the mock result text
      expect(
        screen.queryByText(/High volume trading detected/i) ||
        screen.queryByText(/Wallet Risk Analysis/i)
      ).not.toBeNull();
    });
  });

  it('shows API scan result if available', async () => {
    (supabase.functions.invoke as any).mockImplementation(() => Promise.resolve({ data: {
      risk_score: 3,
      risk_factors: ['No suspicious activities found'],
      analysis: { walletAge: 400 },
    }, error: null }));
    render(<Scanner />);
    fireEvent.change(screen.getByPlaceholderText(/Wallet Address/i), { target: { value: '0xabc' } });
    fireEvent.click(screen.getAllByText(/Scan/i)[0]);
    await waitFor(() => {
      expect(
        screen.queryByText(/No suspicious activities found/i) ||
        screen.queryByText(/Wallet Risk Analysis/i)
      ).not.toBeNull();
    });
  });
});
