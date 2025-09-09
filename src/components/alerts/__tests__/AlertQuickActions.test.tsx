import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { AlertQuickActions } from '../AlertQuickActions';

// Mock the custom hooks and components
vi.mock('@/hooks/useCustomAlerts', () => ({
  useCustomAlerts: vi.fn()
}));

vi.mock('../AlertsManager', () => ({
  AlertsManager: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => (
    isOpen ? (
      <div data-testid="alerts-manager-modal">
        <button onClick={onClose}>Close Modal</button>
      </div>
    ) : null
  )
}));

import { useCustomAlerts } from '@/hooks/useCustomAlerts';

const mockUseCustomAlerts = useCustomAlerts as vi.MockedFunction<typeof useCustomAlerts>;

describe('AlertQuickActions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty State', () => {
    beforeEach(() => {
      mockUseCustomAlerts.mockReturnValue({
        rules: [],
        history: [],
        loading: false,
        error: null,
        createRule: vi.fn(),
        updateRule: vi.fn(),
        deleteRule: vi.fn(),
        toggleRuleStatus: vi.fn(),
        testRule: vi.fn(),
        fetchRules: vi.fn(),
        fetchHistory: vi.fn()
      });
    });

    it('renders alert center title', () => {
      render(<AlertQuickActions />);
      expect(screen.getByText('Alert Center')).toBeInTheDocument();
    });

    it('shows zero counts for empty state', () => {
      render(<AlertQuickActions />);
      expect(screen.getByText('Active Rules')).toBeInTheDocument();
      expect(screen.getByText('Triggered Today')).toBeInTheDocument();
      expect(screen.getAllByText('0')).toHaveLength(2);
    });

    it('displays empty state message', () => {
      render(<AlertQuickActions />);
      expect(screen.getByText('No custom rules yet')).toBeInTheDocument();
      expect(screen.getByText('Create your first custom alert rule')).toBeInTheDocument();
    });

    it('shows helpful tip for new users', () => {
      render(<AlertQuickActions />);
      expect(screen.getByText('💡 Tip: Start with templates for common scenarios')).toBeInTheDocument();
    });

    it('does not show Save as Template button when no rules exist', () => {
      render(<AlertQuickActions />);
      expect(screen.queryByText('Save as Template')).not.toBeInTheDocument();
    });
  });

  describe('Active State', () => {
    const mockActiveRules = [
      {
        id: '1',
        name: 'Large ETH Movements',
        isActive: true,
        timesTriggered: 5,
        lastTriggeredAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        createdAt: new Date().toISOString()
      },
      {
        id: '2', 
        name: 'USDC Whale Alerts',
        isActive: true,
        timesTriggered: 3,
        lastTriggeredAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
        createdAt: new Date().toISOString()
      }
    ];

    beforeEach(() => {
      mockUseCustomAlerts.mockReturnValue({
        rules: mockActiveRules,
        history: [],
        loading: false,
        error: null,
        createRule: vi.fn(),
        updateRule: vi.fn(),
        deleteRule: vi.fn(),
        toggleRuleStatus: vi.fn(),
        testRule: vi.fn(),
        fetchRules: vi.fn(),
        fetchHistory: vi.fn()
      });
    });

    it('shows correct active rules count', () => {
      render(<AlertQuickActions />);
      const badges = screen.getAllByText('2');
      expect(badges.length).toBeGreaterThan(0);
    });

    it('displays Save as Template button when rules exist', () => {
      render(<AlertQuickActions />);
      expect(screen.getByText('Save as Template')).toBeInTheDocument();
    });

    it('shows recent rules section', () => {
      render(<AlertQuickActions />);
      expect(screen.getByText('Recent Rules:')).toBeInTheDocument();
      expect(screen.getByText('Large ETH Movements')).toBeInTheDocument();
      expect(screen.getByText('USDC Whale Alerts')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    beforeEach(() => {
      mockUseCustomAlerts.mockReturnValue({
        rules: [],
        history: [],
        loading: false,
        error: null,
        createRule: vi.fn(),
        updateRule: vi.fn(),
        deleteRule: vi.fn(),
        toggleRuleStatus: vi.fn(),
        testRule: vi.fn(),
        fetchRules: vi.fn(),
        fetchHistory: vi.fn()
      });
    });

    it('opens AlertsManager when Create Custom Alert is clicked', async () => {
      render(<AlertQuickActions />);
      
      const createButton = screen.getByText('Create Custom Alert');
      fireEvent.click(createButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('alerts-manager-modal')).toBeInTheDocument();
      });
    });

    it('opens AlertsManager when Manage button is clicked', async () => {
      render(<AlertQuickActions />);
      
      const manageButton = screen.getByRole('button', { name: /manage/i });
      fireEvent.click(manageButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('alerts-manager-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('handles undefined rules gracefully', () => {
      mockUseCustomAlerts.mockReturnValue({
        rules: undefined as any,
        history: [],
        loading: false,
        error: null,
        createRule: vi.fn(),
        updateRule: vi.fn(),
        deleteRule: vi.fn(),
        toggleRuleStatus: vi.fn(),
        testRule: vi.fn(),
        fetchRules: vi.fn(),
        fetchHistory: vi.fn()
      });

      expect(() => render(<AlertQuickActions />)).not.toThrow();
      expect(screen.getByText('Alert Center')).toBeInTheDocument();
    });
  });
});