/**
 * Unit tests for OnboardingSection component
 * 
 * Tests:
 * - 3 steps render correctly
 * - Primary CTA navigates to /guardian (first step of onboarding)
 * - Secondary CTA navigates to /hunter
 * - Keyboard navigation
 * - Responsive layout
 * - Accessibility attributes
 * 
 * Requirements: 5.1, 5.2, 5.3
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { OnboardingSection } from '../OnboardingSection';
import React from 'react';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

describe('OnboardingSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Content rendering', () => {
    test('should render section header', () => {
      render(<OnboardingSection />);
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      expect(heading).toHaveTextContent('Get Started in 3 Simple Steps');
    });

    test('should render section description', () => {
      render(<OnboardingSection />);
      
      const description = screen.getByText(/Join thousands of users protecting their assets/i);
      expect(description).toBeInTheDocument();
    });

    test('should render section with proper aria-labelledby', () => {
      render(<OnboardingSection />);
      
      const section = screen.getByRole('region');
      expect(section).toHaveAttribute('aria-labelledby', 'onboarding-heading');
      
      const heading = screen.getByText('Get Started in 3 Simple Steps');
      expect(heading).toHaveAttribute('id', 'onboarding-heading');
    });
  });

  describe('Onboarding steps', () => {
    test('should render all 3 steps', () => {
      render(<OnboardingSection />);
      
      // Check for step articles
      const steps = screen.getAllByRole('article');
      expect(steps).toHaveLength(3);
    });

    test('should render Step 1: Connect Wallet', () => {
      render(<OnboardingSection />);
      
      const step1 = screen.getByLabelText('Step 1: Connect Wallet');
      expect(step1).toBeInTheDocument();
      
      const title = screen.getByText('Connect Wallet');
      expect(title).toBeInTheDocument();
      
      const description = screen.getByText('Link your wallet to get personalized insights');
      expect(description).toBeInTheDocument();
    });

    test('should render Step 2: Run Guardian Scan', () => {
      render(<OnboardingSection />);
      
      const step2 = screen.getByLabelText('Step 2: Run Guardian Scan');
      expect(step2).toBeInTheDocument();
      
      const title = screen.getByText('Run Guardian Scan');
      expect(title).toBeInTheDocument();
      
      const description = screen.getByText('Get your security score and risk assessment');
      expect(description).toBeInTheDocument();
    });

    test('should render Step 3: Explore Opportunities', () => {
      render(<OnboardingSection />);
      
      const step3 = screen.getByLabelText('Step 3: Explore Opportunities');
      expect(step3).toBeInTheDocument();
      
      const title = screen.getByText('Explore Opportunities');
      expect(title).toBeInTheDocument();
      
      const description = screen.getByText('Discover alpha and optimize your portfolio');
      expect(description).toBeInTheDocument();
    });

    test('should render step numbers', () => {
      render(<OnboardingSection />);
      
      const step1Badge = screen.getByLabelText('Step 1');
      expect(step1Badge).toBeInTheDocument();
      expect(step1Badge).toHaveTextContent('1');
      
      const step2Badge = screen.getByLabelText('Step 2');
      expect(step2Badge).toBeInTheDocument();
      expect(step2Badge).toHaveTextContent('2');
      
      const step3Badge = screen.getByLabelText('Step 3');
      expect(step3Badge).toBeInTheDocument();
      expect(step3Badge).toHaveTextContent('3');
    });

    test('should render step icons', () => {
      const { container } = render(<OnboardingSection />);
      
      // Check for icon containers (3 steps with icons)
      const iconContainers = container.querySelectorAll('.w-16.h-16.rounded-full');
      expect(iconContainers).toHaveLength(3);
    });
  });

  describe('Primary CTA - Start Onboarding', () => {
    test('should render primary CTA button', () => {
      render(<OnboardingSection />);
      
      const button = screen.getByRole('button', { name: /start onboarding/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Start Onboarding');
    });

    test('should have correct aria-label', () => {
      render(<OnboardingSection />);
      
      const button = screen.getByRole('button', { name: /start onboarding/i });
      expect(button).toHaveAttribute('aria-label', 'Start onboarding process');
    });

    test('should navigate to /guardian when clicked', () => {
      render(<OnboardingSection />);
      
      const button = screen.getByRole('button', { name: /start onboarding/i });
      fireEvent.click(button);
      
      expect(mockNavigate).toHaveBeenCalledWith('/guardian');
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    test('should call custom onStartOnboarding handler when provided', () => {
      const mockOnStartOnboarding = vi.fn();
      
      render(<OnboardingSection onStartOnboarding={mockOnStartOnboarding} />);
      
      const button = screen.getByRole('button', { name: /start onboarding/i });
      fireEvent.click(button);
      
      expect(mockOnStartOnboarding).toHaveBeenCalledTimes(1);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('should be keyboard focusable', () => {
      render(<OnboardingSection />);
      
      const button = screen.getByRole('button', { name: /start onboarding/i });
      expect(button).toHaveAttribute('tabIndex', '0');
    });

    test('should trigger action on Enter key', () => {
      render(<OnboardingSection />);
      
      const button = screen.getByRole('button', { name: /start onboarding/i });
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      
      expect(mockNavigate).toHaveBeenCalledWith('/guardian');
    });

    test('should trigger action on Space key', () => {
      render(<OnboardingSection />);
      
      const button = screen.getByRole('button', { name: /start onboarding/i });
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      
      expect(mockNavigate).toHaveBeenCalledWith('/guardian');
    });

    test('should have proper styling classes', () => {
      render(<OnboardingSection />);
      
      const button = screen.getByRole('button', { name: /start onboarding/i });
      
      // Check for cyan-700 background (WCAG AA compliant) and white text
      expect(button.className).toContain('bg-cyan-700');
      expect(button.className).toContain('text-white');
      expect(button.className).toContain('hover:bg-cyan-600');
      expect(button.className).toContain('active:bg-cyan-800');
    });

    test('should have focus indicator', () => {
      render(<OnboardingSection />);
      
      const button = screen.getByRole('button', { name: /start onboarding/i });
      
      expect(button.className).toContain('focus:outline-none');
      expect(button.className).toContain('focus:ring-2');
      expect(button.className).toContain('focus:ring-cyan-400');
    });
  });

  describe('Secondary CTA - Skip', () => {
    test('should render secondary CTA button', () => {
      render(<OnboardingSection />);
      
      const button = screen.getByRole('button', { name: /skip/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Skip');
    });

    test('should have correct aria-label', () => {
      render(<OnboardingSection />);
      
      const button = screen.getByRole('button', { name: /skip/i });
      expect(button).toHaveAttribute('aria-label', 'Skip onboarding and browse Hunter');
    });

    test('should navigate to /hunter when clicked', () => {
      render(<OnboardingSection />);
      
      const button = screen.getByRole('button', { name: /skip/i });
      fireEvent.click(button);
      
      expect(mockNavigate).toHaveBeenCalledWith('/hunter');
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    test('should call custom onSkip handler when provided', () => {
      const mockOnSkip = vi.fn();
      
      render(<OnboardingSection onSkip={mockOnSkip} />);
      
      const button = screen.getByRole('button', { name: /skip/i });
      fireEvent.click(button);
      
      expect(mockOnSkip).toHaveBeenCalledTimes(1);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('should be keyboard focusable', () => {
      render(<OnboardingSection />);
      
      const button = screen.getByRole('button', { name: /skip/i });
      expect(button).toHaveAttribute('tabIndex', '0');
    });

    test('should trigger action on Enter key', () => {
      render(<OnboardingSection />);
      
      const button = screen.getByRole('button', { name: /skip/i });
      fireEvent.keyDown(button, { key: 'Enter', code: 'Enter' });
      
      expect(mockNavigate).toHaveBeenCalledWith('/hunter');
    });

    test('should trigger action on Space key', () => {
      render(<OnboardingSection />);
      
      const button = screen.getByRole('button', { name: /skip/i });
      fireEvent.keyDown(button, { key: ' ', code: 'Space' });
      
      expect(mockNavigate).toHaveBeenCalledWith('/hunter');
    });

    test('should have proper styling classes', () => {
      render(<OnboardingSection />);
      
      const button = screen.getByRole('button', { name: /skip/i });
      
      // Check for outline style
      expect(button.className).toContain('bg-transparent');
      expect(button.className).toContain('border');
      expect(button.className).toContain('border-white/20');
      expect(button.className).toContain('text-gray-300');
      expect(button.className).toContain('hover:text-white');
    });

    test('should have focus indicator', () => {
      render(<OnboardingSection />);
      
      const button = screen.getByRole('button', { name: /skip/i });
      
      expect(button.className).toContain('focus:outline-none');
      expect(button.className).toContain('focus:ring-2');
    });
  });

  describe('Responsive layout', () => {
    test('should have responsive grid classes for steps', () => {
      const { container } = render(<OnboardingSection />);
      
      const grid = container.querySelector('.grid');
      expect(grid?.className).toContain('grid-cols-1'); // Mobile: stacked
      expect(grid?.className).toContain('md:grid-cols-3'); // Desktop: 3 columns
    });

    test('should have responsive flex classes for CTAs', () => {
      const { container } = render(<OnboardingSection />);
      
      // Find the CTA container
      const ctaContainer = container.querySelector('.flex.flex-col.sm\\:flex-row');
      expect(ctaContainer).toBeInTheDocument();
    });

    test('should have responsive button width classes', () => {
      render(<OnboardingSection />);
      
      const primaryButton = screen.getByRole('button', { name: /start onboarding/i });
      expect(primaryButton.className).toContain('w-full'); // Mobile: full width
      expect(primaryButton.className).toContain('sm:w-auto'); // Desktop: auto width
      
      const secondaryButton = screen.getByRole('button', { name: /skip/i });
      expect(secondaryButton.className).toContain('w-full');
      expect(secondaryButton.className).toContain('sm:w-auto');
    });

    test('should have responsive padding classes', () => {
      const { container } = render(<OnboardingSection />);
      
      const section = container.querySelector('section');
      expect(section?.className).toContain('py-16'); // Mobile
      expect(section?.className).toContain('md:py-24'); // Desktop
    });
  });

  describe('Step card styling', () => {
    test('should have glassmorphism styling', () => {
      const { container } = render(<OnboardingSection />);
      
      const steps = container.querySelectorAll('[role="article"]');
      steps.forEach(step => {
        expect(step.className).toContain('bg-white/5');
        expect(step.className).toContain('backdrop-blur-md');
        expect(step.className).toContain('border');
        expect(step.className).toContain('border-white/10');
        expect(step.className).toContain('rounded-lg');
      });
    });

    test('should have hover animation', () => {
      const { container } = render(<OnboardingSection />);
      
      const steps = container.querySelectorAll('[role="article"]');
      steps.forEach(step => {
        expect(step.className).toContain('hover:scale-105');
        expect(step.className).toContain('transition-transform');
      });
    });

    test('should have step number badge styling', () => {
      const { container } = render(<OnboardingSection />);
      
      const badges = container.querySelectorAll('.bg-cyan-500.rounded-full');
      expect(badges.length).toBeGreaterThanOrEqual(3);
      
      badges.forEach(badge => {
        expect(badge.className).toContain('w-8');
        expect(badge.className).toContain('h-8');
        expect(badge.className).toContain('text-white');
      });
    });

    test('should have icon container styling', () => {
      const { container } = render(<OnboardingSection />);
      
      const iconContainers = container.querySelectorAll('.w-16.h-16.rounded-full.bg-cyan-500\\/10');
      expect(iconContainers).toHaveLength(3);
    });
  });

  describe('Accessibility attributes', () => {
    test('should have proper semantic HTML structure', () => {
      const { container } = render(<OnboardingSection />);
      
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
      
      const heading = screen.getByRole('heading', { level: 2 });
      expect(heading).toBeInTheDocument();
      
      const articles = screen.getAllByRole('article');
      expect(articles).toHaveLength(3);
    });

    test('should have aria-hidden on decorative icons', () => {
      const { container } = render(<OnboardingSection />);
      
      const icons = container.querySelectorAll('[aria-hidden="true"]');
      expect(icons.length).toBeGreaterThanOrEqual(3); // At least 3 step icons
    });

    test('should have proper button roles', () => {
      render(<OnboardingSection />);
      
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2); // Primary and secondary CTAs
    });

    test('should have descriptive aria-labels for all interactive elements', () => {
      render(<OnboardingSection />);
      
      const primaryButton = screen.getByRole('button', { name: /start onboarding process/i });
      expect(primaryButton).toHaveAttribute('aria-label');
      
      const secondaryButton = screen.getByRole('button', { name: /skip onboarding and browse hunter/i });
      expect(secondaryButton).toHaveAttribute('aria-label');
    });

    test('should have proper heading hierarchy', () => {
      render(<OnboardingSection />);
      
      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toBeInTheDocument();
      
      const h3s = screen.getAllByRole('heading', { level: 3 });
      expect(h3s).toHaveLength(3); // One for each step
    });
  });

  describe('Integration scenarios', () => {
    test('should handle both custom handlers together', () => {
      const mockOnStartOnboarding = vi.fn();
      const mockOnSkip = vi.fn();
      
      render(
        <OnboardingSection
          onStartOnboarding={mockOnStartOnboarding}
          onSkip={mockOnSkip}
        />
      );
      
      const primaryButton = screen.getByRole('button', { name: /start onboarding/i });
      const secondaryButton = screen.getByRole('button', { name: /skip/i });
      
      fireEvent.click(primaryButton);
      expect(mockOnStartOnboarding).toHaveBeenCalledTimes(1);
      expect(mockNavigate).not.toHaveBeenCalled();
      
      fireEvent.click(secondaryButton);
      expect(mockOnSkip).toHaveBeenCalledTimes(1);
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('should handle keyboard navigation between buttons', () => {
      render(<OnboardingSection />);
      
      const primaryButton = screen.getByRole('button', { name: /start onboarding/i });
      const secondaryButton = screen.getByRole('button', { name: /skip/i });
      
      // Both should be focusable
      expect(primaryButton).toHaveAttribute('tabIndex', '0');
      expect(secondaryButton).toHaveAttribute('tabIndex', '0');
      
      // Simulate tab navigation
      primaryButton.focus();
      expect(document.activeElement).toBe(primaryButton);
      
      secondaryButton.focus();
      expect(document.activeElement).toBe(secondaryButton);
    });

    test('should not trigger navigation on invalid keys', () => {
      render(<OnboardingSection />);
      
      const primaryButton = screen.getByRole('button', { name: /start onboarding/i });
      
      fireEvent.keyDown(primaryButton, { key: 'a', code: 'KeyA' });
      fireEvent.keyDown(primaryButton, { key: 'Escape', code: 'Escape' });
      fireEvent.keyDown(primaryButton, { key: 'Tab', code: 'Tab' });
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Text content and copy', () => {
    test('should have correct section heading', () => {
      render(<OnboardingSection />);
      
      expect(screen.getByText('Get Started in 3 Simple Steps')).toBeInTheDocument();
    });

    test('should have correct section description', () => {
      render(<OnboardingSection />);
      
      expect(screen.getByText('Join thousands of users protecting their assets and maximizing returns')).toBeInTheDocument();
    });

    test('should have correct step titles', () => {
      render(<OnboardingSection />);
      
      expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
      expect(screen.getByText('Run Guardian Scan')).toBeInTheDocument();
      expect(screen.getByText('Explore Opportunities')).toBeInTheDocument();
    });

    test('should have correct step descriptions', () => {
      render(<OnboardingSection />);
      
      expect(screen.getByText('Link your wallet to get personalized insights')).toBeInTheDocument();
      expect(screen.getByText('Get your security score and risk assessment')).toBeInTheDocument();
      expect(screen.getByText('Discover alpha and optimize your portfolio')).toBeInTheDocument();
    });

    test('should have correct button text', () => {
      render(<OnboardingSection />);
      
      expect(screen.getByText('Start Onboarding')).toBeInTheDocument();
      expect(screen.getByText('Skip')).toBeInTheDocument();
    });
  });
});
