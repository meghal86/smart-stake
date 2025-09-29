import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PercentileBadge from '../PercentileBadge';

describe('PercentileBadge', () => {
  it('renders high percentile correctly', () => {
    render(<PercentileBadge percentile={95} type="inflow" />);
    
    expect(screen.getByText('Extreme')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveClass('bg-red-100');
  });

  it('renders medium percentile correctly', () => {
    render(<PercentileBadge percentile={60} type="risk" />);
    
    expect(screen.getByText('Above Avg')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveClass('bg-yellow-100');
  });

  it('renders low percentile correctly', () => {
    render(<PercentileBadge percentile={20} type="inflow" />);
    
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveClass('bg-green-100');
  });

  it('shows correct tooltip for inflow type', () => {
    render(<PercentileBadge percentile={75} type="inflow" />);
    
    expect(screen.getByText(/Whale inflow is in the 75th percentile/)).toBeInTheDocument();
  });

  it('shows correct tooltip for risk type', () => {
    render(<PercentileBadge percentile={80} type="risk" />);
    
    expect(screen.getByText(/Risk level is in the 80th percentile/)).toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<PercentileBadge percentile={50} type="inflow" size="sm" />);
    expect(screen.getByRole('button')).toHaveClass('px-2 py-0.5 text-xs');

    rerender(<PercentileBadge percentile={50} type="inflow" size="md" />);
    expect(screen.getByRole('button')).toHaveClass('px-2.5 py-1 text-sm');
  });
});
