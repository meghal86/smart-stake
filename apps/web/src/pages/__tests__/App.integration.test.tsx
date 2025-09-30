import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../App';

jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: '1' } } })),
    },
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn(() => Promise.resolve({ data: { onboarding_completed: true }, error: null })),
    })),
  },
}));

describe('App Integration', () => {
  it('renders main tabs and navigates', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText(/Whale Alerts/i)).toBeInTheDocument();
      expect(screen.getByText(/Yields/i)).toBeInTheDocument();
      expect(screen.getByText(/Scanner/i)).toBeInTheDocument();
      expect(screen.getByText(/Premium/i)).toBeInTheDocument();
      expect(screen.getByText(/Profile/i)).toBeInTheDocument();
    });
  });
});
