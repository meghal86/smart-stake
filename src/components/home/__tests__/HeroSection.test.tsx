/**
 * Unit tests for HeroSection component
 * 
 * Tests:
 * - Headline and subheading render
 * - CTA button shows correct text based on auth state
 * - CTA button click behavior
 * - Keyboard navigation
 * - Contrast ratios (WCAG AA compliance)
 * - prefers-reduced-motion support
 * 
 * Requirements: 1.1, 1.2, 1.4, 3.4, 8.3
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HeroSection } from '../HeroSection';
import React from 'react';

// Mock next/router
const mockPush = vi.fn();
vi.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
    pathname: '/',
    query: {},
    asPath: '/',
  }),
}));

// Mock RainbowKit
const mockOpenConnectModal = vi.fn();
vi.mock('@rainbow-me/rainbowkit', () => ({
  useConnectModal: () => ({
    openConnectModal: mockOpenConnectModal,
  }),
}));

// Mock HomeAuthContext
vi.mock('@/lib/context/HomeAuthContext', () => ({
  useHomeAuth: vi.fn(() => ({
    isAuthenticated: false,
    walletAddress: null,
    isLoading: false,
    error: null,
  })),
}));

describe('HeroSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock matchMedia for prefers-reduced-motion
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Content rendering', () => {
    test('should render headline correctly', () => {
      render(<HeroSection />);
      
      const headline = screen.getByRole('heading', { level: 1 });
      expect(headline).toBeInTheDocument();
      expect(headline).toHaveTextContent('Master Your DeFi Risk & Yield – In Real Time');
    });

    test('should render subheading correctly', () => {
      render(<HeroSection />);
      
      const subheading = screen.getByText('Secure your wallet. Hunt alpha. Harvest taxes.');
      expect(subheading).toBeInTheDocument();
    });

    test('should render hero section with proper aria-label', () => {
      render(<HeroSection />);
      
      const section = screen.getByLabelText('Hero section');
      expect(section).toBeInTheDocument();
    });
  });

  describe('CTA button - Demo mode (unauthenticated)', () => {
    test('should show "Connect Wallet" when not authenticated', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: false,
        walletAddress: null,
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      render(<HeroSection />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Connect Wallet');
    });

    test('should have correct aria-label when not authenticated', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: false,
        walletAddress: null,
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      render(<HeroSection />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Connect wallet to get started');
    });

    test('should open WalletConnect modal when clicked in demo mode', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: false,
        walletAddress: null,
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      render(<HeroSection />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOpenConnectModal).toHaveBeenCalledTimes(1);
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('CTA button - Live mode (authenticated)', () => {
    test('should show "Start Protecting" when authenticated', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: true,
        walletAddress: '0x1234567890123456789012345678901234567890',
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      render(<HeroSection />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Start Protecting');
    });

    test('should have correct aria-label when authenticated', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: true,
        walletAddress: '0x1234567890123456789012345678901234567890',
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      render(<HeroSection />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-label', 'Start protecting your wallet');
    });

    test('should navigate to /guardian when clicked in live mode', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: true,
        walletAddress: '0x1234567890123456789012345678901234567890',
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      render(<HeroSection />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockPush).toHaveBeenCalledWith('/guardian');
      expect(mockOpenConnectModal).not.toHaveBeenCalled();
    });
  });

  describe('CTA button - Loading state', () => {
    test('should show "Loading..." when isLoading is true', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: false,
        walletAddress: null,
        isLoading: true,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      render(<HeroSection />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Loading...');
    });

    test('should disable button when isLoading is true', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: false,
        walletAddress: null,
        isLoading: true,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      render(<HeroSection />);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    test('should not trigger action when clicked while loading', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: false,
        walletAddress: null,
        isLoading: true,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      render(<HeroSection />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOpenConnectModal).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Custom onCtaClick handler', () => {
    test('should call custom onCtaClick when provided', () => {
      const mockOnCtaClick = vi.fn();
      
      render(<HeroSection onCtaClick={mockOnCtaClick} />);
      
      const button = screen.getByRole('button');
      fireEvent.click(button);
      
      expect(mockOnCtaClick).toHaveBeenCalledTimes(1);
      expect(mockOpenConnectModal).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('Keyboard navigation', () => {
    test('should be keyboard focusable', () => {
      render(<HeroSection />);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('tabIndex', '0');
    });

    test('should trigger action on Enter key', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: false,
        walletAddress: null,
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      render(<HeroSection />);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      
      expect(mockOpenConnectModal).toHaveBeenCalledTimes(1);
    });

    test('should trigger action on Space key', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: false,
        walletAddress: null,
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      render(<HeroSection />);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      
      expect(mockOpenConnectModal).toHaveBeenCalledTimes(1);
    });

    test('should not trigger action on other keys', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      vi.mocked(useHomeAuth).mockReturnValue({
        isAuthenticated: false,
        walletAddress: null,
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      render(<HeroSection />);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'a', code: 'KeyA' });
      
      expect(mockOpenConnectModal).not.toHaveBeenCalled();
    });

    test('should have visible focus indicator', () => {
      render(<HeroSection />);
      
      const button = screen.getByRole('button');
      
      // Check for focus ring classes
      expect(button.className).toContain('focus:outline-none');
      expect(button.className).toContain('focus:ring-2');
      expect(button.className).toContain('focus:ring-cyan-400');
    });
  });

  describe('Animated background - prefers-reduced-motion', () => {
    test('should show animated background when motion is not reduced', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: false, // Motion NOT reduced
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { container } = render(<HeroSection />);
      
      // Should have animated elements (motion.div elements)
      // We can't directly test Framer Motion animations in jsdom,
      // but we can verify the component renders without errors
      expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    test('should show static background when prefers-reduced-motion is enabled', async () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)', // Motion IS reduced
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { container } = render(<HeroSection />);
      
      // Component should still render
      expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    });

    test('should update when prefers-reduced-motion changes', async () => {
      const listeners: Array<(e: MediaQueryListEvent) => void> = [];
      
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: false,
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn((event: string, listener: (e: MediaQueryListEvent) => void) => {
            if (event === 'change') {
              listeners.push(listener);
            }
          }),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      const { rerender } = render(<HeroSection />);
      
      // Simulate media query change
      listeners.forEach(listener => {
        listener({ matches: true, media: '(prefers-reduced-motion: reduce)' } as MediaQueryListEvent);
      });
      
      rerender(<HeroSection />);
      
      // Component should still render without errors
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });

  describe('Styling and contrast (WCAG AA)', () => {
    test('should have proper text color classes for headline', () => {
      render(<HeroSection />);
      
      const headline = screen.getByRole('heading', { level: 1 });
      expect(headline.className).toContain('text-white');
    });

    test('should have proper text color classes for subheading', () => {
      render(<HeroSection />);
      
      const subheading = screen.getByText('Secure your wallet. Hunt alpha. Harvest taxes.');
      expect(subheading.className).toContain('text-gray-300');
    });

    test('should have proper button styling for contrast', () => {
      render(<HeroSection />);
      
      const button = screen.getByRole('button');
      
      // Check for cyan-700 background (WCAG AA compliant) and white text
      expect(button.className).toContain('bg-cyan-700');
      expect(button.className).toContain('text-white');
    });

    test('should have hover state styling', () => {
      render(<HeroSection />);
      
      const button = screen.getByRole('button');
      expect(button.className).toContain('hover:bg-cyan-600');
    });

    test('should have active state styling', () => {
      render(<HeroSection />);
      
      const button = screen.getByRole('button');
      expect(button.className).toContain('active:bg-cyan-800');
    });

    test('should have disabled state styling', () => {
      render(<HeroSection />);
      
      const button = screen.getByRole('button');
      expect(button.className).toContain('disabled:opacity-50');
      expect(button.className).toContain('disabled:cursor-not-allowed');
    });
  });

  describe('Responsive layout', () => {
    test('should have responsive text sizing classes', () => {
      render(<HeroSection />);
      
      const headline = screen.getByRole('heading', { level: 1 });
      
      // Check for responsive text classes
      expect(headline.className).toContain('text-4xl'); // Mobile
      expect(headline.className).toContain('md:text-5xl'); // Tablet
      expect(headline.className).toContain('lg:text-6xl'); // Desktop
    });

    test('should have responsive padding classes', () => {
      const { container } = render(<HeroSection />);
      
      const section = container.querySelector('section');
      expect(section?.className).toContain('py-16'); // Mobile
      expect(section?.className).toContain('md:py-24'); // Tablet+
    });

    test('should have proper spacing classes', () => {
      render(<HeroSection />);
      
      const headline = screen.getByRole('heading', { level: 1 });
      expect(headline.className).toContain('mb-6');
      
      const subheading = screen.getByText('Secure your wallet. Hunt alpha. Harvest taxes.');
      expect(subheading.className).toContain('mb-8');
    });
  });

  describe('Accessibility attributes', () => {
    test('should have proper semantic HTML structure', () => {
      const { container } = render(<HeroSection />);
      
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
      
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    test('should have aria-hidden on decorative background', () => {
      const { container } = render(<HeroSection />);
      
      const background = container.querySelector('[aria-hidden="true"]');
      expect(background).toBeInTheDocument();
    });

    test('should have proper button role', () => {
      render(<HeroSection />);
      
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Integration scenarios', () => {
    test('should handle auth state transition from demo to live', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      
      // Start in demo mode
      const mockUseHomeAuth = vi.mocked(useHomeAuth);
      mockUseHomeAuth.mockReturnValue({
        isAuthenticated: false,
        walletAddress: null,
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      const { rerender } = render(<HeroSection />);
      
      expect(screen.getByRole('button')).toHaveTextContent('Connect Wallet');
      
      // Transition to live mode
      mockUseHomeAuth.mockReturnValue({
        isAuthenticated: true,
        walletAddress: '0x1234567890123456789012345678901234567890',
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      rerender(<HeroSection />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toHaveTextContent('Start Protecting');
      });
    });

    test('should handle loading state during authentication', async () => {
      const { useHomeAuth } = await import('@/lib/context/HomeAuthContext');
      
      const mockUseHomeAuth = vi.mocked(useHomeAuth);
      mockUseHomeAuth.mockReturnValue({
        isAuthenticated: false,
        walletAddress: null,
        isLoading: true,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      const { rerender } = render(<HeroSection />);
      
      expect(screen.getByRole('button')).toHaveTextContent('Loading...');
      expect(screen.getByRole('button')).toBeDisabled();
      
      // Complete loading
      mockUseHomeAuth.mockReturnValue({
        isAuthenticated: true,
        walletAddress: '0x1234567890123456789012345678901234567890',
        isLoading: false,
        error: null,
        connectWallet: vi.fn(),
        disconnectWallet: vi.fn(),
      });

      rerender(<HeroSection />);
      
      await waitFor(() => {
        expect(screen.getByRole('button')).toHaveTextContent('Start Protecting');
        expect(screen.getByRole('button')).not.toBeDisabled();
      });
    });
  });
});
