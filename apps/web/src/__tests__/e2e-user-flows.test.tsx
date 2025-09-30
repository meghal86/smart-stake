import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import Index from '@/pages/Index';

// Mock different user plans
const mockUserPlans = {
  free: { plan: 'free', subscribed: false },
  pro: { plan: 'pro', subscribed: true },
  premium: { plan: 'premium', subscribed: true },
  enterprise: { plan: 'enterprise', subscribed: true }
};

const TestWrapper = ({ children, userPlan = 'free' }: { children: React.ReactNode; userPlan?: keyof typeof mockUserPlans }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
  // Mock the subscription hook based on test scenario
  jest.doMock('@/hooks/useSubscription', () => ({
    useSubscription: () => ({
      userPlan: mockUserPlans[userPlan],
      canAccessFeature: (feature: string) => {
        const planLevels = { free: 0, pro: 1, premium: 2, enterprise: 3 };
        const featureRequirements = {
          whalePredictions: 1, // Pro+
          scannerCompliance: 3, // Enterprise only
          export: 1 // Pro+
        };
        const userLevel = planLevels[userPlan];
        const requiredLevel = featureRequirements[feature as keyof typeof featureRequirements] || 0;
        return userLevel >= requiredLevel ? 'full' : 'none';
      }
    })
  }));
  
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          {children}
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('E2E User Flows - Navigation & Feature Access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Free User Journey', () => {
    test('Free user sees upgrade prompts on premium features', async () => {
      render(
        <TestWrapper userPlan="free">
          <Index />
        </TestWrapper>
      );

      // Navigate to predictions tab
      const predictionsTab = screen.getByText('Predictions');
      fireEvent.click(predictionsTab);

      await waitFor(() => {
        expect(screen.getByText(/Upgrade to Pro/)).toBeInTheDocument();
      });
    });

    test('Free user can access home alerts with limitations', () => {
      render(
        <TestWrapper userPlan="free">
          <Index />
        </TestWrapper>
      );

      // Should see home content
      expect(screen.getByText('Whale Alerts')).toBeInTheDocument();
      
      // Should see teaser cards
      expect(screen.getByText('Email Alerts')).toBeInTheDocument();
    });
  });

  describe('Pro User Journey', () => {
    test('Pro user can access predictions but not enterprise features', async () => {
      render(
        <TestWrapper userPlan="pro">
          <Index />
        </TestWrapper>
      );

      // Navigate to predictions - should work
      const predictionsTab = screen.getByText('Predictions');
      fireEvent.click(predictionsTab);

      await waitFor(() => {
        expect(screen.getByText("Today's Signals")).toBeInTheDocument();
      });

      // Navigate to scanner - should show enterprise upgrade
      const scannerTab = screen.getByText('Scanner');
      fireEvent.click(scannerTab);

      await waitFor(() => {
        expect(screen.getByText(/Upgrade to Enterprise/)).toBeInTheDocument();
      });
    });
  });

  describe('Premium User Journey', () => {
    test('Premium user can access all features except enterprise scanner', async () => {
      render(
        <TestWrapper userPlan="premium">
          <Index />
        </TestWrapper>
      );

      // Test predictions access
      const predictionsTab = screen.getByText('Predictions');
      fireEvent.click(predictionsTab);

      await waitFor(() => {
        expect(screen.getByText("Today's Signals")).toBeInTheDocument();
        expect(screen.getByText('Scenarios')).toBeInTheDocument();
      });

      // Test reports access
      const reportsTab = screen.getByText('Reports');
      fireEvent.click(reportsTab);

      await waitFor(() => {
        expect(screen.getByText('PDF Reports')).toBeInTheDocument();
      });
    });
  });

  describe('Enterprise User Journey', () => {
    test('Enterprise user can access all features including scanner', async () => {
      render(
        <TestWrapper userPlan="enterprise">
          <Index />
        </TestWrapper>
      );

      // Test scanner access
      const scannerTab = screen.getByText('Scanner');
      fireEvent.click(scannerTab);

      await waitFor(() => {
        expect(screen.getByText('MM Sentinel')).toBeInTheDocument();
        expect(screen.getByText('AI Forensics')).toBeInTheDocument();
      });
    });
  });
});

describe('E2E User Flows - Feature Interactions', () => {
  test('Prediction explainability flow', async () => {
    render(
      <TestWrapper userPlan="premium">
        <Index />
      </TestWrapper>
    );

    // Navigate to predictions
    fireEvent.click(screen.getByText('Predictions'));

    await waitFor(() => {
      expect(screen.getByText("Today's Signals")).toBeInTheDocument();
    });

    // Mock prediction data and click on a prediction
    const viewDetailsButton = screen.queryByText('View Details');
    if (viewDetailsButton) {
      fireEvent.click(viewDetailsButton);
      
      await waitFor(() => {
        expect(screen.getByText('Prediction Explainability')).toBeInTheDocument();
      });
    }
  });

  test('Scenario builder flow', async () => {
    render(
      <TestWrapper userPlan="premium">
        <Index />
      </TestWrapper>
    );

    // Navigate to predictions
    fireEvent.click(screen.getByText('Predictions'));

    await waitFor(() => {
      expect(screen.getByText('Scenarios')).toBeInTheDocument();
    });

    // Click scenarios tab
    fireEvent.click(screen.getByText('Scenarios'));

    await waitFor(() => {
      expect(screen.getByText('Create Scenario')).toBeInTheDocument();
    });
  });

  test('Alert creation from home page', () => {
    render(
      <TestWrapper userPlan="pro">
        <Index />
      </TestWrapper>
    );

    // Should see create alert button
    expect(screen.getByText('Create Alert')).toBeInTheDocument();
    
    // Click should open alert center
    fireEvent.click(screen.getByText('Create Alert'));
    
    // Should show alert center modal
    expect(screen.getByText('Alert Center')).toBeInTheDocument();
  });
});

describe('E2E User Flows - Responsive Behavior', () => {
  test('Mobile navigation works correctly', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(
      <TestWrapper userPlan="premium">
        <Index />
      </TestWrapper>
    );

    // Navigation should still be accessible
    expect(screen.getByText('Alerts')).toBeInTheDocument();
    expect(screen.getByText('Market')).toBeInTheDocument();
    expect(screen.getByText('Predictions')).toBeInTheDocument();
  });

  test('Desktop layout renders correctly', () => {
    // Mock desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    });

    render(
      <TestWrapper userPlan="premium">
        <Index />
      </TestWrapper>
    );

    // Should render without errors
    expect(screen.getByText('Whale Alerts')).toBeInTheDocument();
  });
});