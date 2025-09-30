import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AlertQuickActions } from '../AlertQuickActions';

// Integration tests with real component behavior
describe('AlertQuickActions Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    expect(() => render(<AlertQuickActions />)).not.toThrow();
  });

  it('should display all required UI elements', () => {
    render(<AlertQuickActions />);
    
    // Check main elements
    expect(screen.getByText('Alert Center')).toBeInTheDocument();
    expect(screen.getByText('Active Rules')).toBeInTheDocument();
    expect(screen.getByText('Triggered Today')).toBeInTheDocument();
    expect(screen.getByText('Create Custom Alert')).toBeInTheDocument();
    expect(screen.getByText('Templates')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /manage/i })).toBeInTheDocument();
  });

  it('should handle button clicks without errors', () => {
    render(<AlertQuickActions />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(() => fireEvent.click(button)).not.toThrow();
    });
  });

  it('should maintain proper component structure', () => {
    const { container } = render(<AlertQuickActions />);
    
    // Check for proper card structure
    expect(container.querySelector('.p-4')).toBeInTheDocument();
    
    // Check for proper button structure
    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should handle rapid successive clicks', async () => {
    render(<AlertQuickActions />);
    
    const createButton = screen.getByText('Create Custom Alert');
    
    // Rapid clicks should not cause errors
    fireEvent.click(createButton);
    fireEvent.click(createButton);
    fireEvent.click(createButton);
    
    // Should still be functional
    expect(createButton).toBeInTheDocument();
  });

  it('should properly clean up on unmount', () => {
    const { unmount } = render(<AlertQuickActions />);
    
    expect(() => unmount()).not.toThrow();
  });
});