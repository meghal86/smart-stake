import { render, screen, fireEvent } from '@testing-library/react';
import { FearIndexCard } from '../components/v2/FearIndexCard';
import { DailyDigestCard } from '../components/v2/DailyDigestCard';
import { ForYouCarousel } from '../components/v2/ForYouCarousel';
import { PortfolioDemo } from '../components/v2/PortfolioDemo';

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  );
});

describe('V2 Components', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('FearIndexCard renders with score on marker', () => {
    render(<FearIndexCard />);
    expect(screen.getByText('🧭 Fear & Whale Index')).toBeInTheDocument();
    expect(screen.getByText('62')).toBeInTheDocument();
    expect(screen.getByText('Methodology')).toBeInTheDocument();
  });

  test('FearIndexCard shows simulated tooltip', () => {
    render(<FearIndexCard />);
    const simulatedBadge = screen.getByText('Simulated');
    expect(simulatedBadge).toHaveAttribute('title', expect.stringContaining('This is simulated until live sources'));
  });

  test('DailyDigestCard renders clickable rows with CTAs', () => {
    render(<DailyDigestCard />);
    expect(screen.getByText('📩 Daily Whale Digest')).toBeInTheDocument();
    expect(screen.getByText('Whales bought $200M BTC')).toBeInTheDocument();
    
    // Hover to show CTAs
    const firstRow = screen.getByText('Whales bought $200M BTC').closest('div');
    fireEvent.mouseEnter(firstRow!);
    expect(screen.getByText('Set Alert')).toBeInTheDocument();
    expect(screen.getByText('Follow')).toBeInTheDocument();
  });

  test('DailyDigestCard handles keyboard shortcuts', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    render(<DailyDigestCard />);
    
    fireEvent.keyDown(document, { key: 'a' });
    expect(consoleSpy).toHaveBeenCalledWith('Set alert triggered');
    
    fireEvent.keyDown(document, { key: 'f' });
    expect(consoleSpy).toHaveBeenCalledWith('Follow triggered');
    
    consoleSpy.mockRestore();
  });

  test('ForYouCarousel shows New dots for recent items', () => {
    render(<ForYouCarousel />);
    expect(screen.getByText('🎯 For You')).toBeInTheDocument();
    
    // Should have New dots for items < 1h old
    const newDots = document.querySelectorAll('.new-dot');
    expect(newDots.length).toBeGreaterThan(0);
  });

  test('ForYouCarousel has scroll arrows', () => {
    render(<ForYouCarousel />);
    expect(screen.getByText('←')).toBeInTheDocument();
    expect(screen.getByText('→')).toBeInTheDocument();
  });

  test('ForYouCarousel shows context menu', () => {
    render(<ForYouCarousel />);
    const contextButton = screen.getAllByText('⋯')[0];
    fireEvent.click(contextButton);
    
    expect(screen.getByText('Follow')).toBeInTheDocument();
    expect(screen.getByText('Set Alert')).toBeInTheDocument();
    expect(screen.getByText('Share')).toBeInTheDocument();
  });

  test('PortfolioDemo seeds and resets demo data', () => {
    render(<PortfolioDemo />);
    
    // Initially shows Try Demo button
    expect(screen.getByText('Try Demo')).toBeInTheDocument();
    
    // Click Try Demo
    fireEvent.click(screen.getByText('Try Demo'));
    
    // Should show demo positions
    expect(screen.getByText('Demo')).toBeInTheDocument();
    expect(screen.getByText('BTC')).toBeInTheDocument();
    expect(screen.getByText('ETH')).toBeInTheDocument();
    expect(screen.getByText('Reset')).toBeInTheDocument();
    
    // Click Reset
    fireEvent.click(screen.getByText('Reset'));
    
    // Should return to initial state
    expect(screen.getByText('Try Demo')).toBeInTheDocument();
  });

  test('PortfolioDemo calculates P&L correctly', () => {
    render(<PortfolioDemo />);
    
    fireEvent.click(screen.getByText('Try Demo'));
    
    // Should show total value and 24h change
    expect(screen.getByText('$33,750')).toBeInTheDocument(); // Total value
    expect(screen.getByText(/24h/)).toBeInTheDocument(); // 24h change indicator
  });

  test('CTA hierarchy classes are applied correctly', () => {
    render(<DailyDigestCard />);
    
    const firstRow = screen.getByText('Whales bought $200M BTC').closest('div');
    fireEvent.mouseEnter(firstRow!);
    
    const setAlertBtn = screen.getByText('Set Alert');
    const followBtn = screen.getByText('Follow');
    const watchlistBtn = screen.getByText('+Watchlist');
    
    expect(setAlertBtn).toHaveClass('cta-primary');
    expect(followBtn).toHaveClass('cta-secondary');
    expect(watchlistBtn).toHaveClass('cta-tertiary');
  });
});