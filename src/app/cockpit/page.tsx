'use client';

import { useEffect, useState, Suspense, lazy, memo, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { TodayCard } from '@/components/cockpit/TodayCard';
import { ActionPreview } from '@/components/cockpit/ActionPreview';
import { ThreeBlockLayout } from '@/components/cockpit/ThreeBlockLayout';
import { StalenessIndicatorBanner } from '@/components/cockpit/StalenessIndicator';
import { 
  TodayCardErrorBoundary, 
  ActionPreviewErrorBoundary,
  PeekDrawerErrorBoundary,
  InsightsSheetErrorBoundary 
} from '@/components/cockpit/ErrorBoundary';
import { CockpitQueryProvider } from '@/components/cockpit/CockpitQueryProvider';
import { useCockpitData } from '@/hooks/useCockpitData';
import { usePulseData } from '@/hooks/usePulseData';
import { useHashNavigation } from '@/hooks/useHashNavigation';
import { createDefaultSections } from '@/components/cockpit/PeekDrawer';
import { 
  preloadCriticalResources, 
  useFirstMeaningfulPaint,
  getDevicePerformanceTier,
  applyDeviceOptimizations
} from '@/lib/cockpit/performance';

// ============================================================================
// Lazy Loaded Components for Performance
// ============================================================================

const PeekDrawer = lazy(() => import('@/components/cockpit/PeekDrawer'));
const InsightsSheet = lazy(() => import('@/components/cockpit/InsightsSheet'));
const PulseSheet = lazy(() => import('@/components/cockpit/PulseSheet'));
const PerformanceMonitor = lazy(() => import('@/components/cockpit/PerformanceMonitor'));

// ============================================================================
// Optimized Demo Data Helpers
// ============================================================================

const getDemoDrawerSections = memo(() => {
  const sections = createDefaultSections();
  
  // Add some demo items to sections
  sections[0].items = [
    {
      id: 'demo-pulse-1',
      title: 'Arbitrum quest ends in 8h',
      subtitle: 'High reward opportunity',
      timestamp: '2 hours ago',
      badge: { text: '8h left', variant: 'destructive' },
      href: '#demo'
    }
  ];
  
  sections[1].items = [
    {
      id: 'demo-exp-1',
      title: 'Uniswap V3 position expires',
      subtitle: 'ETH/USDC pool',
      timestamp: '1 day ago',
      badge: { text: '2d left', variant: 'outline' },
      href: '#demo'
    }
  ];
  
  return sections;
});

const getDemoCoverageInfo = () => ({
  wallets: 3,
  chains: ['Ethereum', 'Arbitrum', 'Base'],
  lastRefresh: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  scanStatus: 'fresh' as const
});

const getDemoPreferences = () => ({
  wallet_scope_default: 'active' as const,
  dnd_start_local: '22:00',
  dnd_end_local: '08:00',
  notif_cap_per_day: 3
});

const getDrawerSections = memo(() => {
  // In a real implementation, this would extract sections from the data
  return createDefaultSections();
});

const getCoverageInfo = () => ({
  wallets: 0,
  chains: [],
  lastRefresh: new Date().toISOString(),
  scanStatus: 'missing' as const
});

const getPreferences = () => ({
  wallet_scope_default: 'active' as const,
  dnd_start_local: '22:00',
  dnd_end_local: '08:00',
  notif_cap_per_day: 3
});

// ============================================================================
// Default Today Card for Error States
// ============================================================================

const getDefaultTodayCard = () => ({
  kind: 'portfolio_anchor' as const,
  anchor_metric: 'All Clear',
  context_line: 'Your portfolio is healthy',
  primary_cta: { label: 'View Portfolio', href: '/portfolio' },
  secondary_cta: { label: 'Explore Opportunities', href: '/hunter' },
});

// ============================================================================
// Main Component
// ============================================================================

export default function CockpitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading, sessionEstablished } = useAuth();
  const [isDemo, setIsDemo] = useState(false);
  const [peekDrawerOpen, setPeekDrawerOpen] = useState(false);
  const [insightsSheetOpen, setInsightsSheetOpen] = useState(false);

  // Check for demo mode
  useEffect(() => {
    const demoParam = searchParams?.get('demo');
    setIsDemo(demoParam === '1');
  }, [searchParams]);

  // Handle authentication redirect
  useEffect(() => {
    // Wait for session to be established before making redirect decisions
    if (!sessionEstablished || loading) {
      return;
    }

    // If not authenticated and not in demo mode, redirect to /
    if (!isAuthenticated && !isDemo) {
      router.push('/');
      return;
    }
  }, [isAuthenticated, isDemo, loading, sessionEstablished, router]);

  // Use cockpit data hook
  const { 
    summary, 
    preferences,
    isLoading, 
    error,
    refetch,
    updatePreferences
  } = useCockpitData({ 
    isDemo,
    initialWalletScope: 'active'
  });

  // Use pulse data hook
  const {
    pulseData,
    isLoading: pulseLoading,
    error: pulseError,
    refetch: refetchPulse
  } = usePulseData({
    walletScope: preferences?.wallet_scope_default || 'active',
    isDemo,
    enabled: !isDemo, // Only fetch if not in demo mode
  });

  // Hash navigation for pulse sheet
  const {
    isOpen: pulseSheetOpen,
    openSheet: openPulseSheet,
    closeSheet: closePulseSheet,
  } = useHashNavigation({
    targetHash: 'pulse',
  });

  // Show loading state while checking authentication
  if (!sessionEstablished || loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // If not authenticated and not demo mode, don't render anything (redirect will happen)
  if (!isAuthenticated && !isDemo) {
    return null;
  }

  // Handle preferences change
  const handlePreferencesChange = (updates: any) => {
    if (isDemo) return;
    updatePreferences(updates);
  };

  // Prepare Today Card data with fallback
  const todayCardData = summary?.today_card || getDefaultTodayCard();

  // Prepare Action Preview data
  const actionPreviewData = summary?.action_preview || [];

  // Three-block layout with error boundaries
  return (
    <div className="min-h-screen bg-slate-950">
      {/* Staleness Indicator Banner */}
      {summary?.provider_status && (
        <StalenessIndicatorBanner
          providerStatus={summary.provider_status}
          onRetry={refetch}
        />
      )}
      
      <ThreeBlockLayout
      todayCard={
        <TodayCardErrorBoundary onRetry={refetch}>
          <TodayCard 
            todayCard={todayCardData}
            isLoading={isLoading}
            error={error}
            isDemo={isDemo}
            onInsightsClick={() => setInsightsSheetOpen(true)}
            showInsightsLauncher={true}
          />
        </TodayCardErrorBoundary>
      }
      actionPreview={
        <ActionPreviewErrorBoundary onRetry={refetch}>
          <ActionPreview 
            actions={actionPreviewData}
            isLoading={isLoading}
            error={error}
            isDemo={isDemo}
            onSeeAllClick={() => setPeekDrawerOpen(true)}
          />
        </ActionPreviewErrorBoundary>
      }
      additionalContent={
        <>
          {/* Peek Drawer - NOT counted as a block */}
          <PeekDrawerErrorBoundary>
            <PeekDrawer 
              isOpen={peekDrawerOpen}
              onClose={() => setPeekDrawerOpen(false)}
              sections={isDemo ? getDemoDrawerSections() : getDrawerSections()}
              isLoading={isLoading}
              error={error}
            />
          </PeekDrawerErrorBoundary>

          {/* Insights Sheet - NOT counted as a block */}
          <InsightsSheetErrorBoundary>
            <InsightsSheet 
              isOpen={insightsSheetOpen}
              onClose={() => setInsightsSheetOpen(false)}
              providerStatus={summary?.provider_status || { state: 'online', detail: null }}
              coverageInfo={isDemo ? getDemoCoverageInfo() : getCoverageInfo()}
              preferences={isDemo ? getDemoPreferences() : (preferences || getPreferences())}
              onPreferencesChange={handlePreferencesChange}
              isSaving={false}
              error={error}
            />
          </InsightsSheetErrorBoundary>

          {/* Pulse Sheet - Hash-based navigation */}
          <PulseSheet
            isOpen={pulseSheetOpen}
            onClose={closePulseSheet}
            pulseData={pulseData}
            isLoading={pulseLoading}
            error={pulseError}
            isDemo={isDemo}
          />
        </>
      }
    />
    </div>
  );
}