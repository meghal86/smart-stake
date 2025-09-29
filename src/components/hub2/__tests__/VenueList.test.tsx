import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import VenueList from '../VenueList';
import { VenueData } from '@/types/hub2';

describe('VenueList', () => {
  const mockVenues: VenueData[] = [
    { venue: 'Binance', inflow: 1000000, outflow: 500000 },
    { venue: 'Coinbase', inflow: 800000, outflow: 600000 },
    { venue: 'Kraken', inflow: 300000, outflow: 400000 }
  ];

  it('renders venues correctly', () => {
    render(<VenueList venues={mockVenues} />);
    
    expect(screen.getByText('Binance')).toBeInTheDocument();
    expect(screen.getByText('Coinbase')).toBeInTheDocument();
    expect(screen.getByText('Kraken')).toBeInTheDocument();
  });

  it('limits venues to maxItems', () => {
    render(<VenueList venues={mockVenues} maxItems={2} />);
    
    expect(screen.getByText('Binance')).toBeInTheDocument();
    expect(screen.getByText('Coinbase')).toBeInTheDocument();
    expect(screen.queryByText('Kraken')).not.toBeInTheDocument();
    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });

  it('shows "No venue data available" for empty venues', () => {
    render(<VenueList venues={[]} />);
    
    expect(screen.getByText('No venue data available')).toBeInTheDocument();
  });

  it('shows "No venue data available" for null venues', () => {
    render(<VenueList venues={null as any} />);
    
    expect(screen.getByText('No venue data available')).toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<VenueList venues={mockVenues} size="sm" />);
    expect(screen.getByText('Binance')).toHaveClass('px-2 py-0.5 text-xs');

    rerender(<VenueList venues={mockVenues} size="md" />);
    expect(screen.getByText('Binance')).toHaveClass('px-2.5 py-1 text-sm');
  });

  it('shows tooltip with venue details', () => {
    render(<VenueList venues={mockVenues} />);
    
    // Tooltip should contain venue name and financial data
    expect(screen.getByText('Binance')).toBeInTheDocument();
    expect(screen.getByText(/Inflow: \$1.0M/)).toBeInTheDocument();
    expect(screen.getByText(/Outflow: \$500.0K/)).toBeInTheDocument();
  });
});
