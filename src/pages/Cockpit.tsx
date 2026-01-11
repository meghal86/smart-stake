/**
 * Cockpit Page Component
 * 
 * Authenticated Decision Cockpit - serves as the primary authenticated dashboard
 * for AlphaWhale users. Implements authentication flow with demo mode support.
 * 
 * Route: /cockpit
 * Demo Mode: /cockpit?demo=1
 */

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { TodayCard } from '@/components/cockpit/TodayCard';
import { ActionPreview } from '@/components/cockpit/ActionPreview';
import { PeekDrawer, createDefaultSections } from '@/components/cockpit/PeekDrawer';
import { InsightsSheet } from '@/components/cockpit/InsightsSheet';
import { useCockpitData } from '@/hooks/useCockpitData';

// Demo data helpers
const getDemoDrawerSections = () => {
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
};

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

const getDrawerSections = (data: any) => {
  // In a real implementation, this would extract sections from the data
  return createDefaultSections();
};

const getCoverageInfo = (data: any) => ({
  wallets: 0,
  chains: [],
  lastRefresh: new Date().toISOString(),
  scanStatus: 'missing' as const
});

const getPreferences = (data: any) => ({
  wallet_scope_default: 'active' as const,
  dnd_start_local: '22:00',
  dnd_end_local: '08:00',
  notif_cap_per_day: 3
});

const handlePreferencesChange = (preferences: any) => {
  // In a real implementation, this would update preferences
  console.log('Preferences changed:', preferences);
};

const Cockpit: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, loading, sessionEstablished } = useAuth();
  const [isDemo, setIsDemo] = useState(false);
  const [peekDrawerOpen, setPeekDrawerOpen] = useState(false);
  const [insightsSheetOpen, setInsightsSheetOpen] = useState(false);

  // Check for demo mode
  useEffect(() => {
    const demoParam = searchParams.get('demo');
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
      navigate('/');
      return;
    }
  }, [isAuthenticated, isDemo, loading, sessionEstablished, navigate]);

  // Use cockpit data hook
  const { 
    summary, 
    isLoading, 
    error 
  } = useCockpitData({ 
    isDemo,
    initialWalletScope: 'active'
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

  // Data is provided by the hook based on demo mode
  const data = summary;

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Three-block layout as per requirements */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Today Card */}
        <TodayCard 
          todayCard={data?.today_card || {
            kind: 'portfolio_anchor',
            anchor_metric: 'Loading...',
            context_line: 'Please wait',
            primary_cta: { label: 'Loading', href: '#' }
          }}
          isLoading={isLoading}
          error={error}
          isDemo={isDemo}
          onInsightsClick={() => setInsightsSheetOpen(true)}
          showInsightsLauncher={true}
        />

        {/* Action Preview */}
        <ActionPreview 
          actions={data?.action_preview || []}
          isLoading={isLoading}
          error={error}
          isDemo={isDemo}
          onSeeAllClick={() => setPeekDrawerOpen(true)}
        />
      </div>

      {/* Peek Drawer */}
      <PeekDrawer 
        isOpen={peekDrawerOpen}
        onClose={() => setPeekDrawerOpen(false)}
        sections={isDemo ? getDemoDrawerSections() : getDrawerSections(data)}
        isLoading={isLoading}
        error={error}
      />

      {/* Insights Sheet */}
      <InsightsSheet 
        isOpen={insightsSheetOpen}
        onClose={() => setInsightsSheetOpen(false)}
        providerStatus={data?.provider_status || { state: 'online', detail: null }}
        coverageInfo={isDemo ? getDemoCoverageInfo() : getCoverageInfo(data)}
        preferences={isDemo ? getDemoPreferences() : getPreferences(data)}
        onPreferencesChange={isDemo ? () => {} : handlePreferencesChange}
        isSaving={false}
        error={error}
      />
    </div>
  );
};

export default Cockpit;