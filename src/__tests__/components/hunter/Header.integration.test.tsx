/**
 * Header Integration Tests
 * 
 * Tests for WalletSelector integration with Hunter Header
 * 
 * @see .kiro/specs/hunter-screen-feed/tasks.md - Task 44
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Header } from '@/components/hunter/Header';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    header: ({ children, ...props }: unknown) => <header {...props}>{children}</header>,
    button: ({ children, ...props }: unknown) => <button {...props}>{children}</button>,
    div: ({ children, ...props }: unknown) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: unknown) => <>{children}</>,
}));

// Mock WalletSelector
vi.mock('@/components/hunter/WalletSelector', () => ({
  WalletSelector: ({ className }: { className?: string }) => (
    <div data-testid="wallet-selector" className={className}>
      Wallet Selector
    </div>
  ),
}));

// Mock HunterTabs
vi.mock('@/components/hunter/HunterTabs', () => ({
  HunterTabs: () => <div data-testid="hunter-tabs">Tabs</div>,
}));

describe('Header - WalletSelector Integration', () => {
  const defaultProps = {
    isDemo: true,
    setIsDemo: vi.fn(),
    copilotEnabled: false,
    setCopilotEnabled: vi.fn(),
    lastUpdated: new Date(),
    onRefresh: vi.fn(),
    isDarkTheme: true,
    setIsDarkTheme: vi.fn(),
    activeFilter: 'All' as const,
    setActiveFilter: vi.fn(),
  };

  it('renders WalletSelector in header', () => {
    render(<Header {...defaultProps} />);

    const walletSelector = screen.getByTestId('wallet-selector');
    expect(walletSelector).toBeDefined();
  });

  it('positions WalletSelector with correct spacing', () => {
    render(<Header {...defaultProps} />);

    const walletSelector = screen.getByTestId('wallet-selector');
    
    // Should be hidden on mobile (sm:flex)
    expect(walletSelector.className).toContain('hidden');
    expect(walletSelector.className).toContain('sm:flex');
  });

  it('maintains proper z-index layering', () => {
    const { container } = render(<Header {...defaultProps} />);

    const header = container.querySelector('header');
    expect(header?.className).toContain('z-50');
  });

  it('renders all header elements in correct order', () => {
    render(<Header {...defaultProps} />);

    // Check that all elements are present
    expect(screen.getByText('Hunter')).toBeDefined();
    expect(screen.getByTestId('wallet-selector')).toBeDefined();
    expect(screen.getByText('Demo')).toBeDefined();
    expect(screen.getByText('Live')).toBeDefined();
    expect(screen.getByText('AI Digest')).toBeDefined();
  });

  it('applies correct theme classes to header', () => {
    const { container, rerender } = render(<Header {...defaultProps} isDarkTheme={true} />);

    let header = container.querySelector('header');
    expect(header?.className).toContain('bg-[rgba(16,18,30,0.75)]');

    rerender(<Header {...defaultProps} isDarkTheme={false} />);

    header = container.querySelector('header');
    expect(header?.className).toContain('bg-[rgba(255,255,255,0.85)]');
  });

  it('maintains sticky positioning', () => {
    const { container } = render(<Header {...defaultProps} />);

    const header = container.querySelector('header');
    expect(header?.className).toContain('sticky');
    expect(header?.className).toContain('top-0');
  });

  it('renders with proper backdrop blur', () => {
    const { container } = render(<Header {...defaultProps} />);

    const header = container.querySelector('header');
    expect(header?.className).toContain('backdrop-blur-md');
  });
});
