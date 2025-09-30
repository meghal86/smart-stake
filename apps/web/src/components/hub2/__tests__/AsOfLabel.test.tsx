import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import AsOfLabel from '../AsOfLabel';

describe('AsOfLabel', () => {
  it('renders relative time correctly for recent timestamps', () => {
    const recentTime = new Date(Date.now() - 5 * 60 * 1000).toISOString(); // 5 minutes ago
    render(<AsOfLabel asOf={recentTime} />);
    
    expect(screen.getByText(/5m ago/)).toBeInTheDocument();
  });

  it('renders relative time correctly for older timestamps', () => {
    const oldTime = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(); // 2 hours ago
    render(<AsOfLabel asOf={oldTime} />);
    
    expect(screen.getByText(/2h ago/)).toBeInTheDocument();
  });

  it('renders "Just now" for very recent timestamps', () => {
    const justNow = new Date(Date.now() - 30 * 1000).toISOString(); // 30 seconds ago
    render(<AsOfLabel asOf={justNow} />);
    
    expect(screen.getByText('Just now')).toBeInTheDocument();
  });

  it('shows exact time in tooltip', () => {
    const testTime = '2024-01-15T14:30:00.000Z';
    render(<AsOfLabel asOf={testTime} />);
    
    // Should show the exact UTC time in tooltip
    expect(screen.getByText(/01\/15\/2024/)).toBeInTheDocument();
  });

  it('hides icon when showIcon is false', () => {
    render(<AsOfLabel asOf={new Date().toISOString()} showIcon={false} />);
    
    // Clock icon should not be present
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });
});
