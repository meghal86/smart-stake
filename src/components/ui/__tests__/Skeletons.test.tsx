import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, test, expect } from 'vitest';
import { 
  Skeleton, 
  FeatureCardSkeleton, 
  TrustStatsSkeleton, 
  OnboardingStepsSkeleton 
} from '../Skeletons';

// Mock window.matchMedia for prefers-reduced-motion tests
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

describe('Skeleton', () => {
  test('renders with default aria-label', () => {
    render(<Skeleton />);
    
    const skeleton = screen.getByLabelText('Loading...');
    expect(skeleton).toBeInTheDocument();
  });

  test('renders with custom aria-label', () => {
    const customLabel = 'Loading custom content';
    render(<Skeleton aria-label={customLabel} />);
    
    const skeleton = screen.getByLabelText(customLabel);
    expect(skeleton).toBeInTheDocument();
  });

  test('applies custom className', () => {
    render(<Skeleton className="custom-class" />);
    
    const skeleton = screen.getByLabelText('Loading...');
    expect(skeleton).toHaveClass('custom-class');
  });
});

describe('FeatureCardSkeleton', () => {
  test('renders with default loading message', () => {
    render(<FeatureCardSkeleton />);
    
    expect(screen.getByText('Loading feature data...')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading feature data...');
  });

  test('renders with custom loading message', () => {
    const customMessage = 'Loading Guardian data...';
    render(<FeatureCardSkeleton loadingMessage={customMessage} />);
    
    expect(screen.getByText(customMessage)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', customMessage);
  });

  test('renders all skeleton elements', () => {
    render(<FeatureCardSkeleton />);
    
    // Check for specific skeleton elements by aria-label
    expect(screen.getByLabelText('Loading icon')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading title')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading tagline')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading metric label')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading metric value')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading primary button')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading secondary button')).toBeInTheDocument();
  });
});

describe('TrustStatsSkeleton', () => {
  test('renders with default loading message', () => {
    render(<TrustStatsSkeleton />);
    
    expect(screen.getByText('Loading platform statistics...')).toBeInTheDocument();
  });

  test('renders with custom loading message', () => {
    const customMessage = 'Loading trust metrics...';
    render(<TrustStatsSkeleton loadingMessage={customMessage} />);
    
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  test('renders three stat placeholders', () => {
    render(<TrustStatsSkeleton />);
    
    // Should have 3 stat value skeletons and 3 stat label skeletons
    const statValues = screen.getAllByLabelText('Loading stat value');
    const statLabels = screen.getAllByLabelText('Loading stat label');
    
    expect(statValues).toHaveLength(3);
    expect(statLabels).toHaveLength(3);
  });
});

describe('OnboardingStepsSkeleton', () => {
  test('renders with default loading message', () => {
    render(<OnboardingStepsSkeleton />);
    
    expect(screen.getByText('Loading onboarding steps...')).toBeInTheDocument();
  });

  test('renders with custom loading message', () => {
    const customMessage = 'Loading setup guide...';
    render(<OnboardingStepsSkeleton loadingMessage={customMessage} />);
    
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  test('renders three step placeholders', () => {
    render(<OnboardingStepsSkeleton />);
    
    // Should have 3 step number skeletons, 3 titles, and 6 description lines (2 per step)
    const stepNumbers = screen.getAllByLabelText('Loading step number');
    const stepTitles = screen.getAllByLabelText('Loading step title');
    const stepDescriptions = screen.getAllByLabelText(/Loading step description/);
    
    expect(stepNumbers).toHaveLength(3);
    expect(stepTitles).toHaveLength(3);
    expect(stepDescriptions).toHaveLength(6); // 2 lines per step
  });
});

describe('Skeleton Consistency', () => {
  test('skeleton dimensions match expected layout', () => {
    render(<FeatureCardSkeleton />);
    
    // Icon should be 12x12 (w-12 h-12)
    const icon = screen.getByLabelText('Loading icon');
    expect(icon).toHaveClass('w-12', 'h-12');
    
    // Buttons should have proper height
    const primaryButton = screen.getByLabelText('Loading primary button');
    const secondaryButton = screen.getByLabelText('Loading secondary button');
    expect(primaryButton).toHaveClass('h-10');
    expect(secondaryButton).toHaveClass('h-10');
  });
});