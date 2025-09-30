import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import HealthPill from '../HealthPill';

// Mock fetch for health checks
global.fetch = vi.fn();

describe('HealthPill', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders health pill with loading state initially', () => {
    render(<HealthPill />);
    
    // Should show loading spinner initially
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows correct status colors', async () => {
    // Mock successful health response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'ok',
        providers: {
          whaleAlerts: { status: 'ok', latency: 100, errorRate: 0 },
          marketSummary: { status: 'ok', latency: 150, errorRate: 0 },
          assetSentiment: { status: 'ok', latency: 80, errorRate: 0 }
        }
      })
    });

    render(<HealthPill />);
    
    // Fast-forward timers to trigger health check
    vi.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.getByText('OK')).toBeInTheDocument();
    });
  });

  it('shows degraded status correctly', async () => {
    // Mock degraded health response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'degraded',
        providers: {
          whaleAlerts: { status: 'degraded', latency: 500, errorRate: 5 },
          marketSummary: { status: 'ok', latency: 200, errorRate: 1 },
          assetSentiment: { status: 'ok', latency: 100, errorRate: 0 }
        }
      })
    });

    render(<HealthPill />);
    
    vi.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.getByText('DEGRADED')).toBeInTheDocument();
    });
  });

  it('shows down status correctly', async () => {
    // Mock down health response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: 'down',
        providers: {
          whaleAlerts: { status: 'down', latency: 0, errorRate: 100 },
          marketSummary: { status: 'down', latency: 0, errorRate: 100 },
          assetSentiment: { status: 'down', latency: 0, errorRate: 100 }
        }
      })
    });

    render(<HealthPill />);
    
    vi.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.getByText('DOWN')).toBeInTheDocument();
    });
  });

  it('handles fetch errors gracefully', async () => {
    // Mock fetch error
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<HealthPill />);
    
    vi.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.getByText('DOWN')).toBeInTheDocument();
    });
  });

  it('polls health every 10 seconds', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        providers: {
          whaleAlerts: { status: 'ok', latency: 100, errorRate: 0 },
          marketSummary: { status: 'ok', latency: 150, errorRate: 0 },
          assetSentiment: { status: 'ok', latency: 80, errorRate: 0 }
        }
      })
    });

    render(<HealthPill />);
    
    // Initial call
    vi.advanceTimersByTime(1000);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    // Should poll again after 10 seconds
    vi.advanceTimersByTime(10000);
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  it('shows tooltip with provider details', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        providers: {
          whaleAlerts: { status: 'ok', latency: 100, errorRate: 0 },
          marketSummary: { status: 'ok', latency: 150, errorRate: 0 },
          assetSentiment: { status: 'ok', latency: 80, errorRate: 0 }
        }
      })
    });

    render(<HealthPill />);
    
    vi.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(screen.getByText('OK')).toBeInTheDocument();
    });
    
    // Hover to show tooltip
    const healthButton = screen.getByRole('button');
    fireEvent.mouseEnter(healthButton);
    
    await waitFor(() => {
      expect(screen.getByText('System Health')).toBeInTheDocument();
    });
  });

  it('allows manual refresh', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
        providers: {
          whaleAlerts: { status: 'ok', latency: 100, errorRate: 0 },
          marketSummary: { status: 'ok', latency: 150, errorRate: 0 },
          assetSentiment: { status: 'ok', latency: 80, errorRate: 0 }
        }
      })
    });

    render(<HealthPill />);
    
    vi.advanceTimersByTime(1000);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
    
    // Click to refresh
    const healthButton = screen.getByRole('button');
    fireEvent.click(healthButton);
    
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
