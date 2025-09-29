import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import PulsePage from '../Pulse';
import { usePulse } from '@/hooks/hub2';
import { useUIMode } from '@/store/uiMode';

// Mock the hooks
vi.mock('@/hooks/hub2');
vi.mock('@/store/uiMode');
vi.mock('@/store/hub2');

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockPulseData = {
  kpis: {
    marketSentiment: 75,
    whalePressure: 1200,
    risk: 6.5
  },
  topSignals: [
    {
      id: 'btc-1',
      kind: 'asset',
      symbol: 'BTC',
      name: 'Bitcoin',
      badges: ['real'],
      gauges: {
        sentiment: 80,
        whalePressure: 15,
        risk: 4
      },
      priceUsd: 45000,
      change24h: 2.5,
      lastEvents: []
    }
  ],
  ts: '2024-01-15T14:30:00.000Z'
};

describe('Pulse Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock usePulse hook
    (usePulse as any).mockReturnValue({
      data: mockPulseData,
      isLoading: false,
      error: null,
      isFetching: false
    });

    // Mock useUIMode hook
    (useUIMode as any).mockReturnValue({
      mode: 'novice',
      setMode: vi.fn()
    });
  });

  it('renders pulse page with health banner', () => {
    render(
      <BrowserRouter>
        <PulsePage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Market Pulse')).toBeInTheDocument();
    expect(screen.getByText('Real-time market signals and whale activity')).toBeInTheDocument();
  });

  it('shows mode toggle and time window controls', () => {
    render(
      <BrowserRouter>
        <PulsePage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Novice')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('24h')).toBeInTheDocument();
  });

  it('displays AI digest with novice mode content', () => {
    render(
      <BrowserRouter>
        <PulsePage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('AI Market Digest')).toBeInTheDocument();
    expect(screen.getByText(/Market activity is/)).toBeInTheDocument();
  });

  it('shows action CTAs in AI digest', () => {
    render(
      <BrowserRouter>
        <PulsePage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Watch all')).toBeInTheDocument();
    expect(screen.getByText('Create alert')).toBeInTheDocument();
    expect(screen.getByText('Show transactions')).toBeInTheDocument();
  });

  it('displays top signals', () => {
    render(
      <BrowserRouter>
        <PulsePage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Top Signals')).toBeInTheDocument();
    expect(screen.getByText('Bitcoin')).toBeInTheDocument();
  });

  it('shows signal stack when signals are available', () => {
    render(
      <BrowserRouter>
        <PulsePage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Signal Stack')).toBeInTheDocument();
  });

  it('handles mode toggle correctly', async () => {
    const mockSetMode = vi.fn();
    (useUIMode as any).mockReturnValue({
      mode: 'novice',
      setMode: mockSetMode
    });

    render(
      <BrowserRouter>
        <PulsePage />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByText('Pro'));
    expect(mockSetMode).toHaveBeenCalledWith('pro');
  });

  it('navigates to correct routes on CTA clicks', () => {
    render(
      <BrowserRouter>
        <PulsePage />
      </BrowserRouter>
    );
    
    fireEvent.click(screen.getByText('Watch all'));
    expect(mockNavigate).toHaveBeenCalledWith('/hub2/watchlist');
    
    fireEvent.click(screen.getByText('Create alert'));
    expect(mockNavigate).toHaveBeenCalledWith('/hub2/alerts');
  });

  it('shows loading state when data is loading', () => {
    (usePulse as any).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      isFetching: false
    });

    render(
      <BrowserRouter>
        <PulsePage />
      </BrowserRouter>
    );
    
    // Should show skeleton loaders
    expect(screen.getAllByTestId('skeleton')).toHaveLength(6);
  });

  it('shows error state when there is an error', () => {
    (usePulse as any).mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch data'),
      isFetching: false
    });

    render(
      <BrowserRouter>
        <PulsePage />
      </BrowserRouter>
    );
    
    expect(screen.getByText('Failed to load pulse data')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });
});
