import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ProvenanceChip from '../ProvenanceChip';

describe('ProvenanceChip', () => {
  it('renders real provenance correctly', () => {
    render(<ProvenanceChip provenance="real" />);
    
    expect(screen.getByText('Real')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveClass('bg-green-100');
  });

  it('renders sim provenance correctly', () => {
    render(<ProvenanceChip provenance="sim" />);
    
    expect(screen.getByText('Sim')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveClass('bg-blue-100');
  });

  it('applies correct size classes', () => {
    const { rerender } = render(<ProvenanceChip provenance="real" size="sm" />);
    expect(screen.getByRole('button')).toHaveClass('px-2 py-0.5 text-xs');

    rerender(<ProvenanceChip provenance="real" size="md" />);
    expect(screen.getByRole('button')).toHaveClass('px-2.5 py-1 text-sm');
  });

  it('shows tooltip on hover', () => {
    render(<ProvenanceChip provenance="real" />);
    
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    
    // Tooltip content should be available
    expect(screen.getByText('Data from live blockchain transactions and verified sources')).toBeInTheDocument();
  });
});
