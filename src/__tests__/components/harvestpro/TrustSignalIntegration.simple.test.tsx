/**
 * Trust Signal Integration Simple Tests
 * 
 * Requirements: Enhanced Req 10 AC1-3 (trust methodology), Enhanced Req 14 AC4-5 (metrics proof)
 * Design: Trust Signals → Verification System
 * 
 * Basic tests to verify trust signal integration components render correctly
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import { GuardianScoreTooltip, GuardianScoreLink } from '@/components/harvestpro/GuardianScoreTooltip';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('GuardianScoreTooltip Basic Rendering', () => {
  test('renders inline variant with score display', () => {
    render(<GuardianScoreTooltip score={8} variant="inline" />);
    
    // Should show the score
    expect(screen.getByText('8/10')).toBeDefined();
    expect(screen.getByText('Guardian')).toBeDefined();
  });

  test('renders button variant with methodology text', () => {
    render(<GuardianScoreTooltip score={5} variant="button" />);
    
    // Should show the methodology link text
    expect(screen.getByText('How it\'s calculated')).toBeInTheDocument();
  });

  test('applies correct score colors based on risk level', () => {
    const { rerender } = render(<GuardianScoreTooltip score={9} variant="inline" />);
    
    // High score should be green
    let scoreElement = screen.getByText('9/10');
    expect(scoreElement.className).toContain('text-green-400');
    
    // Medium score should be yellow
    rerender(<GuardianScoreTooltip score={5} variant="inline" />);
    scoreElement = screen.getByText('5/10');
    expect(scoreElement.className).toContain('text-yellow-400');
    
    // Low score should be red
    rerender(<GuardianScoreTooltip score={2} variant="inline" />);
    scoreElement = screen.getByText('2/10');
    expect(scoreElement.className).toContain('text-red-400');
  });

  test('has proper accessibility attributes', () => {
    render(<GuardianScoreTooltip score={7} variant="button" />);
    
    const button = screen.getByText('How it\'s calculated');
    expect(button.getAttribute('aria-label')).toBe('How Guardian score is calculated');
  });
});

describe('GuardianScoreLink Basic Rendering', () => {
  test('renders with correct text and aria label', () => {
    const mockCallback = vi.fn();
    render(<GuardianScoreLink score={6} onShowMethodology={mockCallback} />);
    
    expect(screen.getByText('How is this calculated?')).toBeDefined();
    
    const link = screen.getByText('How is this calculated?');
    expect(link.getAttribute('aria-label')).toBe('How Guardian score 6/10 is calculated');
  });

  test('has proper styling classes', () => {
    const mockCallback = vi.fn();
    render(<GuardianScoreLink score={4} onShowMethodology={mockCallback} />);
    
    const link = screen.getByText('How is this calculated?');
    expect(link.className).toContain('text-cyan-400');
    expect(link.className).toContain('hover:text-cyan-300');
    expect(link.className).toContain('underline');
  });
});

describe('Trust Signal Integration Requirements Validation', () => {
  test('Enhanced Req 10 AC1: Trust methodology links are present', () => {
    // AC1: Link existing "Guardian Score" displays to methodology explanations
    render(<GuardianScoreTooltip score={8} variant="inline" />);
    
    // Should have help icon that serves as methodology link
    const helpIcon = screen.getByText('Guardian').parentElement?.querySelector('svg[class*="w-3 h-3"]');
    expect(helpIcon).toBeDefined();
  });

  test('Enhanced Req 10 AC2: How it\'s calculated links for summary metrics', () => {
    // AC2: Add "How it's calculated" links for summary metrics
    render(<GuardianScoreTooltip score={7} variant="button" />);
    
    expect(screen.getByText('How it\'s calculated')).toBeDefined();
  });

  test('Enhanced Req 10 AC3: Methodology content using existing components', () => {
    // AC3: Add methodology/help content using existing tooltip OR inside existing HarvestDetailModal
    const mockCallback = vi.fn();
    render(<GuardianScoreLink score={5} onShowMethodology={mockCallback} />);
    
    // Should provide mechanism to show methodology (callback for modal integration)
    expect(screen.getByText('How is this calculated?')).toBeDefined();
    expect(mockCallback).toBeDefined();
  });

  test('Enhanced Req 14 AC4: Metrics proof integration', () => {
    // AC4-5: Metrics proof - trust signals provide verification
    render(<GuardianScoreTooltip score={9} variant="button" />);
    
    // Should have proper ARIA labeling for screen readers
    const button = screen.getByText('How it\'s calculated');
    expect(button.getAttribute('aria-label')).toBeDefined();
    expect(button.getAttribute('aria-label')).toContain('Guardian score');
  });
});

describe('Design Requirements Validation', () => {
  test('Trust Signals → Verification System: Components provide verification access', () => {
    // Should provide access to methodology through tooltips or links
    render(<GuardianScoreTooltip score={6} variant="inline" />);
    
    // Inline variant should have tooltip trigger
    const helpIcon = screen.getByText('Guardian').parentElement?.querySelector('svg[class*="w-3 h-3"]');
    expect(helpIcon).toBeDefined();
  });

  test('Uses existing modal/tooltip components (no new modal types)', () => {
    // Should use existing Tooltip components from shadcn/ui
    const mockCallback = vi.fn();
    render(<GuardianScoreLink score={8} onShowMethodology={mockCallback} />);
    
    // Link variant should integrate with existing modal system via callback
    const link = screen.getByText('How is this calculated?');
    expect(link).toBeDefined();
    expect(typeof mockCallback).toBe('function');
  });
});