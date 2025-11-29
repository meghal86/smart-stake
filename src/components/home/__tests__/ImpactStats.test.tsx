import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { ImpactStats } from '../ImpactStats';

// Wrapper for router context
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ImpactStats', () => {
  test('renders section heading', () => {
    renderWithRouter(<ImpactStats />);
    
    expect(screen.getByText('Real Impact, Real Numbers')).toBeInTheDocument();
    expect(screen.getByText(/See how AlphaWhale protects/i)).toBeInTheDocument();
  });

  test('renders all three stat cards', () => {
    renderWithRouter(<ImpactStats />);
    
    // Check for stat values
    expect(screen.getByText('$142M')).toBeInTheDocument();
    expect(screen.getByText('10,000+')).toBeInTheDocument();
    expect(screen.getByText('$12.4K')).toBeInTheDocument();
    
    // Check for stat labels
    expect(screen.getByText('Losses Prevented')).toBeInTheDocument();
    expect(screen.getByText('Wallets Protected')).toBeInTheDocument();
    expect(screen.getByText('Avg Tax Savings/Year')).toBeInTheDocument();
  });

  test('expands stat card on click', async () => {
    renderWithRouter(<ImpactStats />);
    
    const firstCard = screen.getByLabelText(/Losses Prevented/i);
    
    // Initially, breakdown should not be visible
    expect(screen.queryByText('Flash loan attacks')).not.toBeVisible();
    
    // Click to expand
    fireEvent.click(firstCard);
    
    // Breakdown should now be visible
    await waitFor(() => {
      expect(screen.getByText('Flash loan attacks')).toBeVisible();
      expect(screen.getByText('$89M')).toBeVisible();
    });
  });

  test('collapses stat card on second click', async () => {
    renderWithRouter(<ImpactStats />);
    
    const firstCard = screen.getByLabelText(/Losses Prevented/i);
    
    // Expand
    fireEvent.click(firstCard);
    await waitFor(() => {
      expect(screen.getByText('Flash loan attacks')).toBeVisible();
    });
    
    // Collapse
    fireEvent.click(firstCard);
    await waitFor(() => {
      expect(screen.queryByText('Flash loan attacks')).not.toBeVisible();
    });
  });

  test('only one stat card expanded at a time', async () => {
    renderWithRouter(<ImpactStats />);
    
    const firstCard = screen.getByLabelText(/Losses Prevented/i);
    const secondCard = screen.getByLabelText(/Wallets Protected/i);
    
    // Expand first card
    fireEvent.click(firstCard);
    await waitFor(() => {
      expect(screen.getByText('Flash loan attacks')).toBeVisible();
    });
    
    // Expand second card
    fireEvent.click(secondCard);
    await waitFor(() => {
      expect(screen.getByText('Active daily users')).toBeVisible();
      // First card should now be collapsed
      expect(screen.queryByText('Flash loan attacks')).not.toBeVisible();
    });
  });

  test('renders testimonial section', () => {
    renderWithRouter(<ImpactStats />);
    
    expect(screen.getByText(/I was about to lose \$240K/i)).toBeInTheDocument();
    expect(screen.getByText('John D.')).toBeInTheDocument();
    expect(screen.getByText('DeFi Trader')).toBeInTheDocument();
    expect(screen.getByText('Verified on-chain')).toBeInTheDocument();
  });

  test('stat cards have proper ARIA attributes', () => {
    renderWithRouter(<ImpactStats />);
    
    const firstCard = screen.getByLabelText(/Losses Prevented/i);
    
    expect(firstCard).toHaveAttribute('role', 'button');
    expect(firstCard).toHaveAttribute('aria-expanded', 'false');
    
    fireEvent.click(firstCard);
    
    expect(firstCard).toHaveAttribute('aria-expanded', 'true');
  });

  test('displays all breakdown items when expanded', async () => {
    renderWithRouter(<ImpactStats />);
    
    const firstCard = screen.getByLabelText(/Losses Prevented/i);
    fireEvent.click(firstCard);
    
    await waitFor(() => {
      expect(screen.getByText('Flash loan attacks')).toBeVisible();
      expect(screen.getByText('Rug pulls detected')).toBeVisible();
      expect(screen.getByText('Bad APY avoided')).toBeVisible();
    });
  });

  test('keyboard navigation works for stat cards', async () => {
    renderWithRouter(<ImpactStats />);
    
    const firstCard = screen.getByLabelText(/Losses Prevented/i);
    
    // Press Enter to expand
    fireEvent.keyDown(firstCard, { key: 'Enter' });
    
    await waitFor(() => {
      expect(screen.getByText('Flash loan attacks')).toBeVisible();
    });
    
    // Press Space to collapse
    fireEvent.keyDown(firstCard, { key: ' ' });
    
    await waitFor(() => {
      expect(screen.queryByText('Flash loan attacks')).not.toBeVisible();
    });
  });
});
