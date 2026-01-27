import { HeroSection } from '@/components/home/HeroSection';
import { GuardianFeatureCard } from '@/components/home/GuardianFeatureCard';
import { HunterFeatureCard } from '@/components/home/HunterFeatureCard';
import { HarvestProFeatureCard } from '@/components/home/HarvestProFeatureCard';
import { TrustBuilders } from '@/components/home/TrustBuilders';
import { OnboardingSection } from '@/components/home/OnboardingSection';
import { FooterNav } from '@/components/home/FooterNav';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useHomeMetrics } from '@/hooks/useHomeMetrics';
import { useNavigate } from 'react-router-dom';
import { NavigationRouter } from '@/lib/navigation/NavigationRouter';

/**
 * AlphaWhale Home Page
 * 
 * Main landing page that introduces users to the three core features:
 * - Guardian: Wallet security
 * - Hunter: Alpha opportunities
 * - HarvestPro: Tax loss harvesting
 * 
 * Features:
 * - Hero section with value proposition
 * - Live feature previews with metrics
 * - Trust indicators and statistics
 * - Onboarding guidance
 * - Persistent footer navigation
 * 
 * Requirements: 1.1-1.5, 2.1-2.5, 4.1-4.5, 5.1-5.5, 6.1-6.5, 9.1-9.5
 */

// Note: This file is not actually used in the React Router setup
// The actual home page is served by AlphaWhaleHome.tsx via the "/" route in App.tsx
// This file exists for compatibility but metadata should be set in index.html

function HomePageContent() {
  const navigate = useNavigate();
  const { metrics, isLoading, error } = useHomeMetrics();

  const handleHeroCtaClick = () => {
    // Navigate to Guardian if authenticated, otherwise trigger wallet connect
    if (metrics && !metrics.isDemo) {
      NavigationRouter.navigateToCanonical('guardian', navigate);
    } else {
      // Wallet connect will be triggered by HeroSection component
    }
  };

  const handleStartOnboarding = () => {
    // Navigate to Guardian as the first step of onboarding
    NavigationRouter.navigateToCanonical('guardian', navigate);
  };

  const handleSkipOnboarding = () => {
    NavigationRouter.navigateToCanonical('hunter', navigate);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      {/* Main content wrapper for semantic HTML */}
      <main role="main" aria-label="AlphaWhale home page">
        {/* Hero Section */}
        <ErrorBoundary>
          <HeroSection onCtaClick={handleHeroCtaClick} />
        </ErrorBoundary>

        {/* Feature Cards Section */}
        <ErrorBoundary>
          <section 
            className="container mx-auto px-4 py-12 md:py-16"
            aria-labelledby="features-heading"
          >
            <h2 id="features-heading" className="sr-only">
              Core Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <GuardianFeatureCard
                isLoading={isLoading}
                isDemo={metrics?.isDemo ?? true}
                guardianScore={metrics?.guardianScore}
                error={error?.message}
              />
              <HunterFeatureCard
                isLoading={isLoading}
                isDemo={metrics?.isDemo ?? true}
                hunterOpportunities={metrics?.hunterOpportunities}
                hunterAvgApy={metrics?.hunterAvgApy}
                hunterConfidence={metrics?.hunterConfidence}
                error={error?.message}
              />
              <HarvestProFeatureCard
                isLoading={isLoading}
                isDemo={metrics?.isDemo ?? true}
                harvestEstimateUsd={metrics?.harvestEstimateUsd}
                harvestEligibleTokens={metrics?.harvestEligibleTokens}
                harvestGasEfficiency={metrics?.harvestGasEfficiency}
                error={error?.message}
              />
            </div>
          </section>
        </ErrorBoundary>

        {/* Trust Builders Section */}
        <ErrorBoundary>
          <TrustBuilders
            metrics={{
              totalWalletsProtected: metrics?.totalWalletsProtected ?? 0,
              totalYieldOptimizedUsd: metrics?.totalYieldOptimizedUsd ?? 0,
              averageGuardianScore: metrics?.averageGuardianScore ?? 0,
            }}
            isLoading={isLoading}
          />
        </ErrorBoundary>

        {/* Onboarding Section */}
        <ErrorBoundary>
          <OnboardingSection
            onStartOnboarding={handleStartOnboarding}
            onSkip={handleSkipOnboarding}
            isLoading={isLoading}
          />
        </ErrorBoundary>
      </main>

      {/* Footer Navigation */}
      <FooterNav currentRoute="/" />
    </div>
  );
}

export default function HomePage() {
  return <HomePageContent />;
}