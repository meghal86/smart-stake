/**
 * Cockpit Example Component
 * 
 * Demonstrates how to use the cockpit components together.
 * This serves as both documentation and a working example.
 */

import React, { useState, useRef } from 'react';
import { 
  TodayCard, 
  ActionPreview, 
  PeekDrawer, 
  InsightsSheet,
  createDefaultSections 
} from './index';
import { useCockpitData } from '@/hooks/useCockpitData';

// ============================================================================
// Example Component
// ============================================================================

export const CockpitExample: React.FC<{ isDemo?: boolean }> = ({ isDemo = false }) => {
  const [isPeekDrawerOpen, setIsPeekDrawerOpen] = useState(false);
  const [isInsightsSheetOpen, setIsInsightsSheetOpen] = useState(false);
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  
  // Refs for focus restoration
  const seeAllButtonRef = useRef<HTMLButtonElement>(null);
  const insightsButtonRef = useRef<HTMLButtonElement>(null);
  
  // Fetch cockpit data
  const {
    summary,
    preferences,
    isLoading,
    error,
    walletScope,
    refetch,
    changeWalletScope,
    updatePreferences,
  } = useCockpitData({ isDemo });
  
  // Handle preference updates with loading state
  const handlePreferencesChange = async (updates: Parameters<typeof updatePreferences>[0]) => {
    setIsSavingPreferences(true);
    try {
      await updatePreferences(updates);
    } finally {
      setIsSavingPreferences(false);
    }
  };
  
  // Create peek drawer sections (in a real app, this would come from API)
  const peekDrawerSections = createDefaultSections();
  
  // Mock coverage info (in a real app, this would come from API)
  const coverageInfo = {
    wallets: 3,
    chains: ['Ethereum', 'Arbitrum', 'Base'],
    lastRefresh: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    scanStatus: 'fresh' as const,
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Authenticated Decision Cockpit
          </h1>
          <p className="text-slate-300">
            {isDemo ? 'Demo Mode' : 'Live Mode'} - Three Block Layout
          </p>
        </div>
        
        {/* Three Block Layout */}
        <div className="space-y-6">
          {/* Block 1: Today Card */}
          <TodayCard
            todayCard={summary?.today_card || {
              kind: 'portfolio_anchor',
              anchor_metric: 'Loading...',
              context_line: 'Please wait',
              primary_cta: { label: 'Loading', href: '#' },
            }}
            isDemo={isDemo}
            isLoading={isLoading}
            error={error}
            onInsightsClick={() => setIsInsightsSheetOpen(true)}
            showInsightsLauncher={true}
          />
          
          {/* Block 2: Action Preview */}
          <ActionPreview
            actions={summary?.action_preview || []}
            isDemo={isDemo}
            isLoading={isLoading}
            error={error}
            onSeeAllClick={() => {
              setIsPeekDrawerOpen(true);
            }}
          />
        </div>
        
        {/* Debug Info */}
        {!isDemo && (
          <div className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-white font-medium mb-2">Debug Info</h3>
            <div className="text-sm text-slate-300 space-y-1">
              <div>Wallet Scope: {walletScope}</div>
              <div>Loading: {isLoading ? 'Yes' : 'No'}</div>
              <div>Error: {error || 'None'}</div>
              <div>Actions Count: {summary?.action_preview?.length || 0}</div>
            </div>
            <div className="mt-3 space-x-2">
              <button
                onClick={refetch}
                className="px-3 py-1 bg-cyan-600 text-white rounded text-sm hover:bg-cyan-700"
              >
                Refetch
              </button>
              <button
                onClick={() => changeWalletScope(walletScope === 'active' ? 'all' : 'active')}
                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
              >
                Toggle Scope
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Peek Drawer */}
      <PeekDrawer
        isOpen={isPeekDrawerOpen}
        onClose={() => setIsPeekDrawerOpen(false)}
        sections={peekDrawerSections}
        triggerRef={seeAllButtonRef}
      />
      
      {/* Insights Sheet */}
      {preferences && (
        <InsightsSheet
          isOpen={isInsightsSheetOpen}
          onClose={() => setIsInsightsSheetOpen(false)}
          providerStatus={summary?.provider_status || { state: 'online', detail: null }}
          coverageInfo={coverageInfo}
          preferences={preferences}
          onPreferencesChange={handlePreferencesChange}
          isSaving={isSavingPreferences}
          triggerRef={insightsButtonRef}
        />
      )}
    </div>
  );
};

export default CockpitExample;