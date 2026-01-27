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
import { GlobalHeader } from '@/components/header/GlobalHeader';
import { TodayCard } from '@/components/cockpit/TodayCard';
import { ActionPreview } from '@/components/cockpit/ActionPreview';
import { PeekDrawer, createDefaultSections } from '@/components/cockpit/PeekDrawer';
import { InsightsSheet } from '@/components/cockpit/InsightsSheet';
import { PulseSheet } from '@/components/cockpit/PulseSheet';
import { FooterNav } from '@/components/layout/FooterNav';
import { useCockpitData } from '@/hooks/useCockpitData';

// Demo data helpers
const getDemoDrawerSections = () => {
  const sections = createDefaultSections();
  
  // Add demo items to Daily Pulse section
  sections[0].items = [
    {
      id: 'demo-pulse-1',
      title: 'Arbitrum quest ends in 8h',
      subtitle: 'High reward opportunity',
      timestamp: '2 hours ago',
      badge: { text: '8h left', variant: 'destructive' },
      href: '#demo'
    },
    {
      id: 'demo-pulse-2',
      title: 'New DeFi yield opportunity detected',
      subtitle: 'Compound V3 USDC pool',
      timestamp: '1 hour ago',
      badge: { text: 'New', variant: 'default' },
      href: '#demo'
    },
    {
      id: 'demo-pulse-3',
      title: 'ETH position increased by 15%',
      subtitle: 'Portfolio update',
      timestamp: '30 minutes ago',
      badge: { text: '+15%', variant: 'default' },
      href: '#demo'
    }
  ];
  
  // Add demo items to Expiring Opportunities section
  sections[1].items = [
    {
      id: 'demo-exp-1',
      title: 'Uniswap V3 position expires',
      subtitle: 'ETH/USDC pool',
      timestamp: '1 day ago',
      badge: { text: '2d left', variant: 'outline' },
      href: '#demo'
    },
    {
      id: 'demo-exp-2',
      title: 'Airdrop claim window closing',
      subtitle: 'Optimism governance tokens',
      timestamp: '3 hours ago',
      badge: { text: '5d left', variant: 'outline' },
      href: '#demo'
    }
  ];
  
  // Add demo items to Guardian Deltas section
  sections[2].items = [
    {
      id: 'demo-guardian-1',
      title: 'New approval detected: Uniswap V3',
      subtitle: 'Router contract',
      timestamp: '45 minutes ago',
      badge: { text: 'High', variant: 'destructive' },
      href: '#demo'
    },
    {
      id: 'demo-guardian-2',
      title: 'Unused approval: 1inch Router',
      subtitle: 'Last used 6 months ago',
      timestamp: '2 days ago',
      badge: { text: 'Medium', variant: 'outline' },
      href: '#demo'
    }
  ];
  
  // Add demo items to Portfolio Pulse section
  sections[3].items = [
    {
      id: 'demo-portfolio-1',
      title: 'Portfolio rebalancing opportunity',
      subtitle: 'Optimize asset allocation',
      timestamp: '4 hours ago',
      badge: { text: 'Review', variant: 'outline' },
      href: '#demo'
    }
  ];
  
  // Add demo items to Proof/Receipts section
  sections[4].items = [
    {
      id: 'demo-proof-1',
      title: 'Tax loss harvest executed',
      subtitle: 'ETH → WETH swap',
      timestamp: '1 week ago',
      badge: { text: 'Complete', variant: 'default' },
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
  // For now, return empty sections (will fall back to demo data)
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
  const [pulseSheetOpen, setPulseSheetOpen] = useState(false);

  // Check for demo mode
  useEffect(() => {
    const demoParam = searchParams.get('demo');
    setIsDemo(demoParam === '1');
  }, [searchParams]);

  // Handle hash navigation for pulse sheet
  useEffect(() => {
    const handleHashChange = () => {
      const fullHash = window.location.hash; // Keep the full hash with #
      const hash = fullHash.substring(1); // Remove the '#'
      console.log('[Cockpit] Hash changed - Full hash:', fullHash, 'Parsed hash:', hash);
      
      if (hash === 'pulse') {
        console.log('[Cockpit] Opening pulse sheet');
        setPulseSheetOpen(true);
      } else if (hash !== 'pulse') {
        // If hash is not pulse, ensure sheet is closed
        console.log('[Cockpit] Ensuring pulse sheet is closed (hash is not pulse)');
        setPulseSheetOpen(false);
      }
    };

    // Check initial hash
    console.log('[Cockpit] Setting up hash change listener, initial hash:', window.location.hash);
    handleHashChange();

    // Listen for hash changes
    window.addEventListener('hashchange', handleHashChange);

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []); // Remove pulseSheetOpen from dependencies to prevent re-running

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
      <div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center">
        <div className="text-slate-900 dark:text-white">Loading...</div>
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
    <div className="min-h-screen bg-white dark:bg-slate-950">
      <GlobalHeader />
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
          onInsightsClick={() => {
            console.log('[Cockpit] Insights button clicked, opening sheet');
            setInsightsSheetOpen(true);
          }}
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
        sections={(() => {
          // Get sections based on demo mode
          const sections = isDemo ? getDemoDrawerSections() : getDrawerSections(data);
          
          // If sections are empty (no items in any section), fall back to demo data
          const hasAnyItems = sections.some(section => section.items.length > 0);
          return hasAnyItems ? sections : getDemoDrawerSections();
        })()}
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

      {/* Pulse Sheet */}
      <PulseSheet 
        isOpen={pulseSheetOpen}
        onClose={() => {
          setPulseSheetOpen(false);
          // Remove hash when closing
          if (window.location.hash === '#pulse') {
            window.history.replaceState(null, '', window.location.pathname + window.location.search);
          }
        }}
        pulseData={null} // TODO: Fetch pulse data from API
        isLoading={false}
        error={null}
        isDemo={isDemo || !isAuthenticated} // Use demo mode if not authenticated or explicitly in demo mode
      />
      
      <FooterNav />
    </div>
  );
};

export default Cockpit;