import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ModeToggle from '../ModeToggle';

describe('ModeToggle', () => {
  it('renders both mode buttons', () => {
    render(<ModeToggle mode="novice" onModeChange={vi.fn()} />);
    
    expect(screen.getByText('Novice')).toBeInTheDocument();
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('highlights current mode', () => {
    const { rerender } = render(<ModeToggle mode="novice" onModeChange={vi.fn()} />);
    expect(screen.getByText('Novice')).toHaveClass('bg-primary');
    expect(screen.getByText('Pro')).toHaveClass('bg-transparent');

    rerender(<ModeToggle mode="pro" onModeChange={vi.fn()} />);
    expect(screen.getByText('Novice')).toHaveClass('bg-transparent');
    expect(screen.getByText('Pro')).toHaveClass('bg-primary');
  });

  it('calls onModeChange when clicking different mode', () => {
    const mockOnModeChange = vi.fn();
    render(<ModeToggle mode="novice" onModeChange={mockOnModeChange} />);
    
    fireEvent.click(screen.getByText('Pro'));
    expect(mockOnModeChange).toHaveBeenCalledWith('pro');
  });

  it('shows tooltips for both modes', () => {
    render(<ModeToggle mode="novice" onModeChange={vi.fn()} />);
    
    expect(screen.getByText('Simplified view with plain language explanations')).toBeInTheDocument();
    expect(screen.getByText('Full metrics with percentiles, venues, and raw data')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<ModeToggle mode="novice" onModeChange={vi.fn()} className="custom-class" />);
    
    expect(screen.getByRole('button', { name: /novice/i }).closest('div')).toHaveClass('custom-class');
  });
});
