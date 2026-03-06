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
import { InsightsSheet } from '@/components/cockpit/InsightsSheet';
import { PulseSheet } from '@/components/cockpit/PulseSheet';
import { FooterNav } from '@/components/layout/FooterNav';
import { useCockpitData } from '@/hooks/useCockpitData';

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
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-[#f6f2ea]">Loading...</div>
      </div>
    );
  }

  // If not authenticated and not demo mode, don't render anything (redirect will happen)
  if (!isAuthenticated && !isDemo) {
    return null;
  }

  // Data is provided by the hook based on demo mode
  const data = summary;
  const actionCount = data?.action_preview?.length ?? 0;
  const providerState = data?.provider_status?.state ?? 'offline';
  const todayKind = data?.today_card?.kind?.replace(/_/g, ' ') ?? 'waiting';

  return (
    <div className="min-h-screen bg-[#050505] text-[#f6f2ea]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(126,163,242,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_35%)]" />
      <GlobalHeader className="border-white/8 bg-[#050505]/94" />

      <div className="relative mx-auto max-w-[1600px] px-4 pb-28 pt-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-[#a7c0ff]">
              Daily cockpit
            </div>
            <h1 className="text-3xl tracking-tight text-[#f6f2ea] sm:text-4xl">Good morning, Meghal</h1>
            <p className="mt-2 max-w-3xl text-sm text-[#9c978f] sm:text-base">
              The clearest read on what needs attention right now across portfolio, Guardian, and daily signal flow.
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-6">
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

            <ActionPreview 
              actions={data?.action_preview || []}
              isLoading={isLoading}
              error={error}
              isDemo={isDemo}
              onSeeAllClick={() => navigate('/signals')}
            />
          </div>

          <aside className="space-y-6">
            <section className="rounded-[30px] border border-white/8 bg-[#0b0b0c] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.28)]">
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8a82]">System read</p>
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between border-b border-white/8 pb-4">
                  <span className="text-sm text-[#9c978f]">Provider state</span>
                  <span className="text-sm text-[#f6f2ea] capitalize">{providerState}</span>
                </div>
                <div className="flex items-center justify-between border-b border-white/8 pb-4">
                  <span className="text-sm text-[#9c978f]">Action count</span>
                  <span className="text-sm text-[#f6f2ea]">{actionCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#9c978f]">Today card</span>
                  <span className="text-sm capitalize text-[#f6f2ea]">{todayKind}</span>
                </div>
              </div>
            </section>

            <section className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(126,163,242,0.16),rgba(255,255,255,0.02))] p-5 shadow-[0_22px_80px_rgba(0,0,0,0.28)]">
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#b7c8f0]">Mode</p>
              <p
                className="mt-4 text-3xl text-[#f6f2ea]"
                style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
              >
                {isDemo ? 'Demo' : 'Live'}
              </p>
              <p className="mt-3 text-sm leading-6 text-[#b8b2a7]">
                {isDemo
                  ? 'This cockpit is using sample data for walkthrough purposes.'
                  : 'This cockpit is reading the live authenticated experience.'}
              </p>
            </section>
          </aside>
        </div>
      </div>

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
      
      <FooterNav currentRoute="/cockpit" />
    </div>
  );
};

export default Cockpit;
