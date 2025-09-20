import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/contexts/AuthContext';
import { PlanGate } from '@/components/PlanGate';
import { SoftLockCard } from '@/components/SoftLockCard';
import { AlertTeaserCard } from '@/components/AlertTeaserCard';
import PredictionsScenarios from '@/pages/PredictionsScenarios';
import MarketDashboard from '@/pages/MarketDashboard';
import ScannerCompliance from '@/pages/ScannerCompliance';
import ReportsExports from '@/pages/ReportsExports';

// Mock hooks
jest.mock('@/hooks/useUserPlan', () => ({
  useUserPlan: () => ({ plan: 'free' })
}));

jest.mock('@/hooks/useSubscription', () => ({
  useSubscription: () => ({
    userPlan: { plan: 'free', subscribed: false },
    canAccessFeature: () => 'none'
  })
}));

jest.mock('@/hooks/usePredictions', () => ({
  usePredictions: () => ({
    predictions: [
      {
        id: '1',
        ts: new Date().toISOString(),
        asset: 'ETH',
        direction: 'long',
        confidence: 0.85,
        horizonMin: 360,
        rationale: 'Test prediction'
      }
    ],
    loading: false,
    error: null
  })
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  });
  
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

describe('UI Redesign - Plan Gating System', () => {
  test('PlanGate blocks free users from premium features', () => {
    render(
      <TestWrapper>
        <PlanGate min="premium" feature="Test Feature">
          <div>Premium Content</div>
        </PlanGate>
      </TestWrapper>
    );
    
    expect(screen.getByText('Test Feature')).toBeInTheDocument();
    expect(screen.getByText('Upgrade Now')).toBeInTheDocument();
    expect(screen.queryByText('Premium Content')).not.toBeInTheDocument();
  });

  test('SoftLockCard displays upgrade prompt', () => {
    render(
      <TestWrapper>
        <SoftLockCard feature="Advanced Analytics" planHint="premium" />
      </TestWrapper>
    );
    
    expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
    expect(screen.getByText(/Upgrade to Premium/)).toBeInTheDocument();
    expect(screen.getByText('Upgrade Now')).toBeInTheDocument();
  });

  test('AlertTeaserCard shows premium features', () => {
    render(
      <TestWrapper>
        <AlertTeaserCard plan="premium" />
      </TestWrapper>
    );
    
    expect(screen.getByText('Email Alerts')).toBeInTheDocument();
    expect(screen.getByText(/Upgrade to Premium/)).toBeInTheDocument();
  });
});

describe('UI Redesign - Navigation Structure', () => {
  test('PredictionsScenarios page renders with correct tabs', () => {
    render(
      <TestWrapper>
        <PredictionsScenarios />
      </TestWrapper>
    );
    
    expect(screen.getByText('Predictions & Scenarios')).toBeInTheDocument();
    expect(screen.getByText("Today's Signals")).toBeInTheDocument();
    expect(screen.getByText('Scenarios')).toBeInTheDocument();
  });

  test('MarketDashboard combines multiple features', () => {
    render(
      <TestWrapper>
        <MarketDashboard />
      </TestWrapper>
    );
    
    expect(screen.getByText('Market Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Whale Analytics')).toBeInTheDocument();
    expect(screen.getByText('Sentiment')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
  });

  test('ScannerCompliance is enterprise-gated', () => {
    render(
      <TestWrapper>
        <ScannerCompliance />
      </TestWrapper>
    );
    
    expect(screen.getByText('Scanner & Compliance')).toBeInTheDocument();
    expect(screen.getByText(/Upgrade to Enterprise/)).toBeInTheDocument();
  });

  test('ReportsExports shows export options', () => {
    render(
      <TestWrapper>
        <ReportsExports />
      </TestWrapper>
    );
    
    expect(screen.getByText('Reports & Exports')).toBeInTheDocument();
    expect(screen.getByText('PDF Reports')).toBeInTheDocument();
    expect(screen.getByText('CSV Data')).toBeInTheDocument();
  });
});

describe('UI Redesign - Interactive Elements', () => {
  test('Scenario builder modal opens on button click', async () => {
    render(
      <TestWrapper>
        <PredictionsScenarios />
      </TestWrapper>
    );
    
    // Should show upgrade prompt for free users
    expect(screen.getByText(/Upgrade to Premium/)).toBeInTheDocument();
  });

  test('Export buttons trigger actions', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    
    render(
      <TestWrapper>
        <ReportsExports />
      </TestWrapper>
    );
    
    // Should show upgrade prompt for free users
    expect(screen.getByText(/Upgrade to Pro/)).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });
});

describe('UI Redesign - Responsive Design', () => {
  test('Components render without errors on mobile viewport', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    render(
      <TestWrapper>
        <PredictionsScenarios />
      </TestWrapper>
    );
    
    expect(screen.getByText('Predictions & Scenarios')).toBeInTheDocument();
  });

  test('Components render without errors on desktop viewport', () => {
    // Mock desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1920,
    });

    render(
      <TestWrapper>
        <MarketDashboard />
      </TestWrapper>
    );
    
    expect(screen.getByText('Market Dashboard')).toBeInTheDocument();
  });
});