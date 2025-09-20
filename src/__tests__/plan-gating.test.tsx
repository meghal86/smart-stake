import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { PlanGate } from '@/components/PlanGate';
import { SoftLockCard } from '@/components/SoftLockCard';

// Mock useSubscription hook with different plan scenarios
const mockUseSubscription = (plan: string) => ({
  useSubscription: () => ({
    userPlan: { plan, subscribed: plan !== 'free' }
  })
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Plan Gating System Validation', () => {
  describe('PlanGate Component', () => {
    test('Free user blocked from Pro features', () => {
      jest.doMock('@/hooks/useSubscription', () => mockUseSubscription('free'));
      
      render(
        <TestWrapper>
          <PlanGate min="pro" feature="Advanced Analytics">
            <div data-testid="pro-content">Pro Content</div>
          </PlanGate>
        </TestWrapper>
      );

      expect(screen.queryByTestId('pro-content')).not.toBeInTheDocument();
      expect(screen.getByText('Advanced Analytics')).toBeInTheDocument();
      expect(screen.getByText('Upgrade Now')).toBeInTheDocument();
    });

    test('Pro user can access Pro features', () => {
      jest.doMock('@/hooks/useSubscription', () => mockUseSubscription('pro'));
      
      render(
        <TestWrapper>
          <PlanGate min="pro" feature="Advanced Analytics">
            <div data-testid="pro-content">Pro Content</div>
          </PlanGate>
        </TestWrapper>
      );

      expect(screen.getByTestId('pro-content')).toBeInTheDocument();
      expect(screen.queryByText('Upgrade Now')).not.toBeInTheDocument();
    });

    test('Pro user blocked from Premium features', () => {
      jest.doMock('@/hooks/useSubscription', () => mockUseSubscription('pro'));
      
      render(
        <TestWrapper>
          <PlanGate min="premium" feature="AI Predictions">
            <div data-testid="premium-content">Premium Content</div>
          </PlanGate>
        </TestWrapper>
      );

      expect(screen.queryByTestId('premium-content')).not.toBeInTheDocument();
      expect(screen.getByText('AI Predictions')).toBeInTheDocument();
    });

    test('Premium user can access Premium features', () => {
      jest.doMock('@/hooks/useSubscription', () => mockUseSubscription('premium'));
      
      render(
        <TestWrapper>
          <PlanGate min="premium" feature="AI Predictions">
            <div data-testid="premium-content">Premium Content</div>
          </PlanGate>
        </TestWrapper>
      );

      expect(screen.getByTestId('premium-content')).toBeInTheDocument();
    });

    test('Premium user blocked from Enterprise features', () => {
      jest.doMock('@/hooks/useSubscription', () => mockUseSubscription('premium'));
      
      render(
        <TestWrapper>
          <PlanGate min="enterprise" feature="Compliance Suite">
            <div data-testid="enterprise-content">Enterprise Content</div>
          </PlanGate>
        </TestWrapper>
      );

      expect(screen.queryByTestId('enterprise-content')).not.toBeInTheDocument();
      expect(screen.getByText('Compliance Suite')).toBeInTheDocument();
    });

    test('Enterprise user can access all features', () => {
      jest.doMock('@/hooks/useSubscription', () => mockUseSubscription('enterprise'));
      
      render(
        <TestWrapper>
          <PlanGate min="enterprise" feature="Compliance Suite">
            <div data-testid="enterprise-content">Enterprise Content</div>
          </PlanGate>
        </TestWrapper>
      );

      expect(screen.getByTestId('enterprise-content')).toBeInTheDocument();
    });
  });

  describe('SoftLockCard Component', () => {
    test('Displays correct upgrade message for Pro plan', () => {
      render(
        <TestWrapper>
          <SoftLockCard feature="Advanced Filtering" planHint="pro" />
        </TestWrapper>
      );

      expect(screen.getByText('Advanced Filtering')).toBeInTheDocument();
      expect(screen.getByText(/Upgrade to Pro/)).toBeInTheDocument();
      expect(screen.getByText('PRO')).toBeInTheDocument();
    });

    test('Displays correct upgrade message for Premium plan', () => {
      render(
        <TestWrapper>
          <SoftLockCard feature="AI Predictions" planHint="premium" />
        </TestWrapper>
      );

      expect(screen.getByText('AI Predictions')).toBeInTheDocument();
      expect(screen.getByText(/Upgrade to Premium/)).toBeInTheDocument();
      expect(screen.getByText('PREMIUM')).toBeInTheDocument();
    });

    test('Displays correct upgrade message for Enterprise plan', () => {
      render(
        <TestWrapper>
          <SoftLockCard feature="Compliance Tools" planHint="enterprise" />
        </TestWrapper>
      );

      expect(screen.getByText('Compliance Tools')).toBeInTheDocument();
      expect(screen.getByText(/Upgrade to Enterprise/)).toBeInTheDocument();
      expect(screen.getByText('ENTERPRISE')).toBeInTheDocument();
    });

    test('Has correct styling classes', () => {
      render(
        <TestWrapper>
          <SoftLockCard feature="Test Feature" planHint="premium" />
        </TestWrapper>
      );

      const card = screen.getByText('Test Feature').closest('div');
      expect(card).toHaveClass('p-6', 'text-center', 'relative', 'overflow-hidden');
    });
  });

  describe('Plan Hierarchy Validation', () => {
    const planHierarchy = [
      { plan: 'free', level: 0 },
      { plan: 'pro', level: 1 },
      { plan: 'premium', level: 2 },
      { plan: 'enterprise', level: 3 }
    ];

    planHierarchy.forEach(({ plan, level }) => {
      test(`${plan} user has correct access level ${level}`, () => {
        jest.doMock('@/hooks/useSubscription', () => mockUseSubscription(plan));
        
        // Test access to each tier
        const tiers = ['pro', 'premium', 'enterprise'];
        const tierLevels = { pro: 1, premium: 2, enterprise: 3 };
        
        tiers.forEach(tier => {
          const shouldHaveAccess = level >= tierLevels[tier as keyof typeof tierLevels];
          
          render(
            <TestWrapper>
              <PlanGate min={tier as any} feature={`${tier} Feature`}>
                <div data-testid={`${tier}-content`}>{tier} Content</div>
              </PlanGate>
            </TestWrapper>
          );

          if (shouldHaveAccess) {
            expect(screen.getByTestId(`${tier}-content`)).toBeInTheDocument();
          } else {
            expect(screen.queryByTestId(`${tier}-content`)).not.toBeInTheDocument();
            expect(screen.getByText('Upgrade Now')).toBeInTheDocument();
          }
        });
      });
    });
  });
});