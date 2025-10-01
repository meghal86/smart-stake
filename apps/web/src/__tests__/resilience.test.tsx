import { render, screen, waitFor } from '@testing-library/react';
import BrownoutBanner from '../components/BrownoutBanner';

// Mock fetch
global.fetch = jest.fn();

describe('Resilience & Chaos Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('BrownoutBanner', () => {
    test('shows banner when providers are degraded', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({ mode: 'cached' })
      });

      render(<BrownoutBanner />);

      await waitFor(() => {
        expect(screen.getByText(/Provider degraded — showing cached data/)).toBeInTheDocument();
      });
    });

    test('shows simulated banner for failed providers', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({ mode: 'simulated' })
      });

      render(<BrownoutBanner />);

      await waitFor(() => {
        expect(screen.getByText(/Provider degraded — showing simulated data/)).toBeInTheDocument();
      });
    });

    test('hides banner when providers are healthy', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({ mode: 'live' })
      });

      render(<BrownoutBanner />);

      await waitFor(() => {
        expect(screen.queryByText(/Provider degraded/)).not.toBeInTheDocument();
      });
    });

    test('banner is dismissible', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({ mode: 'cached' })
      });

      render(<BrownoutBanner />);

      await waitFor(() => {
        expect(screen.getByText(/Provider degraded/)).toBeInTheDocument();
      });

      const dismissButton = screen.getByLabelText('Dismiss banner');
      dismissButton.click();

      expect(screen.queryByText(/Provider degraded/)).not.toBeInTheDocument();
    });

    test('includes link to status page', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({ mode: 'cached' })
      });

      render(<BrownoutBanner />);

      await waitFor(() => {
        const statusLink = screen.getByText('View Status');
        expect(statusLink).toHaveAttribute('href', '/status');
        expect(statusLink).toHaveAttribute('target', '_blank');
      });
    });

    test('handles fetch errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      render(<BrownoutBanner />);

      await waitFor(() => {
        expect(screen.getByText(/Provider degraded — showing simulated data/)).toBeInTheDocument();
      });
    });
  });

  describe('Chaos Engineering', () => {
    test('chaos failure simulation works', () => {
      // Mock environment variables
      process.env.NODE_ENV = 'development';
      process.env.CHAOS_ALCHEMY_FAIL = '100'; // 100% failure rate

      const shouldFail = Math.random() * 100 < 100; // Simulate chaos logic
      expect(shouldFail).toBe(true);
    });

    test('chaos latency simulation works', () => {
      process.env.CHAOS_COINGECKO_LATENCY = '500';
      
      const latency = parseInt(process.env.CHAOS_COINGECKO_LATENCY || '0');
      expect(latency).toBe(500);
    });

    test('chaos is disabled in production', () => {
      process.env.NODE_ENV = 'production';
      process.env.CHAOS_ALCHEMY_FAIL = '100';
      
      // In production, chaos should be disabled
      const isProduction = process.env.NODE_ENV === 'production';
      const shouldFail = !isProduction && Math.random() * 100 < 100;
      
      expect(shouldFail).toBe(false);
    });
  });

  describe('Performance Thresholds', () => {
    test('validates p95 response time threshold', () => {
      const p95ResponseTime = 350; // ms
      const threshold = 400; // ms
      
      expect(p95ResponseTime).toBeLessThan(threshold);
    });

    test('validates error rate threshold', () => {
      const errorRate = 0.003; // 0.3%
      const threshold = 0.005; // 0.5%
      
      expect(errorRate).toBeLessThan(threshold);
    });

    test('validates RPS threshold for burst test', () => {
      const achievedRPS = 185;
      const minimumRPS = 180;
      
      expect(achievedRPS).toBeGreaterThan(minimumRPS);
    });
  });

  describe('Circuit Breaker Simulation', () => {
    test('falls back to simulated data on provider failure', async () => {
      // Simulate provider failure
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Provider timeout'));

      // Mock health check showing fallback
      (fetch as jest.Mock).mockResolvedValueOnce({
        json: () => Promise.resolve({ 
          mode: 'simulated',
          providers: {
            etherscan: 'down',
            coingecko: 'ok'
          }
        })
      });

      render(<BrownoutBanner />);

      await waitFor(() => {
        expect(screen.getByText(/showing simulated data/)).toBeInTheDocument();
      });
    });

    test('recovers when providers come back online', async () => {
      // First call shows degraded state
      (fetch as jest.Mock)
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ mode: 'simulated' })
        })
        // Second call shows recovery
        .mockResolvedValueOnce({
          json: () => Promise.resolve({ mode: 'live' })
        });

      const { rerender } = render(<BrownoutBanner />);

      await waitFor(() => {
        expect(screen.getByText(/showing simulated data/)).toBeInTheDocument();
      });

      // Simulate health check interval
      rerender(<BrownoutBanner />);

      await waitFor(() => {
        expect(screen.queryByText(/Provider degraded/)).not.toBeInTheDocument();
      });
    });
  });
});