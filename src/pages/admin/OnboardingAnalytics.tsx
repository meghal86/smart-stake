/**
 * Admin Onboarding Analytics Page
 * Dashboard for monitoring user onboarding funnel and success metrics
 */

import { OnboardingAnalyticsDashboard } from '@/components/admin/OnboardingAnalyticsDashboard';
import { AppLayout } from '@/components/layout/AppLayout';

export default function OnboardingAnalytics() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6 max-w-7xl">
        <OnboardingAnalyticsDashboard />
      </div>
    </AppLayout>
  );
}

