import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, test, expect } from 'vitest';
import { ProgressiveLoader, ProgressiveSectionLoader, HeaderFirstLoader } from '../ProgressiveLoader';

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('ProgressiveLoader', () => {
  const mockSkeleton = <div data-testid="skeleton">Loading skeleton</div>;
  const mockContent = <div data-testid="content">Actual content</div>;

  test('shows skeleton when loading', () => {
    render(
      <ProgressiveLoader
        isLoading={true}
        skeleton={mockSkeleton}
        loadingMessage="Loading test content..."
      >
        {mockContent}
      </ProgressiveLoader>
    );

    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
  });

  test('shows content when not loading', async () => {
    render(
      <ProgressiveLoader
        isLoading={false}
        skeleton={mockSkeleton}
        loadingMessage="Loading test content..."
      >
        {mockContent}
      </ProgressiveLoader>
    );

    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
  });

  test('transitions from loading to content', async () => {
    const { rerender } = render(
      <ProgressiveLoader
        isLoading={true}
        skeleton={mockSkeleton}
        loadingMessage="Loading test content..."
      >
        {mockContent}
      </ProgressiveLoader>
    );

    // Initially shows skeleton
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();

    // Switch to not loading
    rerender(
      <ProgressiveLoader
        isLoading={false}
        skeleton={mockSkeleton}
        loadingMessage="Loading test content..."
      >
        {mockContent}
      </ProgressiveLoader>
    );

    // Should show content after transition
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
  });

  test('applies custom loading message', () => {
    const customMessage = "Loading custom content...";
    render(
      <ProgressiveLoader
        isLoading={true}
        skeleton={mockSkeleton}
        loadingMessage={customMessage}
      >
        {mockContent}
      </ProgressiveLoader>
    );

    const container = screen.getByRole('status');
    expect(container).toHaveAttribute('aria-label', customMessage);
  });
});

describe('ProgressiveSectionLoader', () => {
  const mockSections = [
    {
      id: 'section1',
      content: <div data-testid="content1">Section 1</div>,
      skeleton: <div data-testid="skeleton1">Loading section 1</div>,
      loadingMessage: "Loading section 1...",
    },
    {
      id: 'section2',
      content: <div data-testid="content2">Section 2</div>,
      skeleton: <div data-testid="skeleton2">Loading section 2</div>,
      loadingMessage: "Loading section 2...",
    },
  ];

  test('shows all skeletons when loading', () => {
    render(
      <ProgressiveSectionLoader
        sections={mockSections}
        isLoading={true}
      />
    );

    expect(screen.getByTestId('skeleton1')).toBeInTheDocument();
    expect(screen.getByTestId('skeleton2')).toBeInTheDocument();
    expect(screen.queryByTestId('content1')).not.toBeInTheDocument();
    expect(screen.queryByTestId('content2')).not.toBeInTheDocument();
  });

  test('shows all content when not loading', async () => {
    render(
      <ProgressiveSectionLoader
        sections={mockSections}
        isLoading={false}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('content1')).toBeInTheDocument();
      expect(screen.getByTestId('content2')).toBeInTheDocument();
    });
  });
});

describe('HeaderFirstLoader', () => {
  const mockHeader = <div data-testid="header">Header content</div>;
  const mockContent = <div data-testid="content">Body content</div>;
  const mockSkeleton = <div data-testid="skeleton">Loading body</div>;

  test('always shows header immediately', () => {
    render(
      <HeaderFirstLoader
        header={mockHeader}
        isLoading={true}
        skeleton={mockSkeleton}
        loadingMessage="Loading body content..."
      >
        {mockContent}
      </HeaderFirstLoader>
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(screen.queryByTestId('content')).not.toBeInTheDocument();
  });

  test('shows header and content when not loading', async () => {
    render(
      <HeaderFirstLoader
        header={mockHeader}
        isLoading={false}
        skeleton={mockSkeleton}
        loadingMessage="Loading body content..."
      >
        {mockContent}
      </HeaderFirstLoader>
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
  });
});