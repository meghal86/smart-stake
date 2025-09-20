import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import OutcomeBadge from '@/components/predictions/OutcomeBadge';

describe('OutcomeBadge', () => {
  it('renders correct prediction with green styling', () => {
    render(<OutcomeBadge wasCorrect={true} pct={0.032} />);
    
    const badge = screen.getByText('✓ +3.2%');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-emerald-400', 'bg-emerald-400/10');
  });

  it('renders incorrect prediction with red styling', () => {
    render(<OutcomeBadge wasCorrect={false} pct={-0.015} />);
    
    const badge = screen.getByText('✗ -1.5%');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('text-rose-400', 'bg-rose-400/10');
  });

  it('shows tooltip with measurement info', () => {
    render(<OutcomeBadge wasCorrect={true} pct={0.032} realizedTs="2025-01-21T16:00:00Z" />);
    
    const badge = screen.getByText('✓ +3.2%');
    expect(badge).toHaveClass('cursor-help');
  });

  it('formats percentage correctly', () => {
    render(<OutcomeBadge wasCorrect={true} pct={0.1234} />);
    
    expect(screen.getByText('✓ +12.3%')).toBeInTheDocument();
  });
});