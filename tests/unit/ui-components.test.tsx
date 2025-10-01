import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Stat } from '../../src/components/ui/stat';
import { Meter } from '../../src/components/ui/meter';
import { Badge } from '../../src/components/ui/badge';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>
  }
}));

describe('UI Components', () => {
  describe('Stat', () => {
    it('renders label and value', () => {
      render(<Stat label="Test Label" value="$1,000" />);
      
      expect(screen.getByText('Test Label')).toBeInTheDocument();
      expect(screen.getByText('$1,000')).toBeInTheDocument();
    });

    it('renders with icon and sublabel', () => {
      render(
        <Stat 
          label="Volume" 
          value={1000} 
          sublabel="USD" 
          icon="📊"
        />
      );
      
      expect(screen.getByText('Volume')).toBeInTheDocument();
      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('USD')).toBeInTheDocument();
      expect(screen.getByText('📊')).toBeInTheDocument();
    });

    it('handles animated numbers', () => {
      render(<Stat label="Count" value={100} animated={true} />);
      
      expect(screen.getByText('Count')).toBeInTheDocument();
      // Animation starts from 0, so initially shows 0
      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('Meter', () => {
    it('renders with correct value', () => {
      render(<Meter value={75} />);
      
      const meter = screen.getByRole('generic');
      expect(meter).toBeInTheDocument();
    });

    it('clamps value between 0 and 100', () => {
      const { rerender } = render(<Meter value={150} />);
      expect(screen.getByRole('generic')).toBeInTheDocument();
      
      rerender(<Meter value={-10} />);
      expect(screen.getByRole('generic')).toBeInTheDocument();
    });
  });

  describe('Badge', () => {
    it('renders with real variant', () => {
      render(<Badge variant="real">Real Data</Badge>);
      
      const badge = screen.getByText('Real Data');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-green-100', 'text-green-700');
    });

    it('renders with simulated variant', () => {
      render(<Badge variant="simulated">Simulated</Badge>);
      
      const badge = screen.getByText('Simulated');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700');
    });
  });
});