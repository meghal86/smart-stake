import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ConfidenceBar } from '@/components/predictions/ConfidenceBar';

describe('ConfidenceBar', () => {
  it('renders confidence percentage', () => {
    render(<ConfidenceBar value={0.75} />);
    
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('displays confidence interval band', () => {
    render(<ConfidenceBar value={0.75} band={0.1} />);
    
    const container = document.querySelector('.w-40.h-2.rounded');
    expect(container).toBeInTheDocument();
    
    const band = container?.querySelector('.bg-white\\/20');
    expect(band).toBeInTheDocument();
  });

  it('shows tooltip on hover', () => {
    render(<ConfidenceBar value={0.75} band={0.08} />);
    
    const wrapper = screen.getByText('75%').closest('.cursor-help');
    expect(wrapper).toBeInTheDocument();
  });

  it('calculates bar width correctly', () => {
    render(<ConfidenceBar value={0.85} />);
    
    const bar = document.querySelector('.bg-cyan-400');
    expect(bar).toHaveStyle({ width: '85%' });
  });
});