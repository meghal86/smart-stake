/**
 * StickySubFilters Usage Example
 * 
 * This file demonstrates how to integrate the StickySubFilters component
 * into the Hunter Screen page.
 */

import React, { useState } from 'react';
import { StickySubFilters } from './StickySubFilters';
import { HunterTabs, TabType } from './HunterTabs';
import { FilterState } from '@/types/hunter';

export function HunterScreenExample() {
  const [activeTab, setActiveTab] = useState<TabType>('All');
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    types: [],
    chains: [],
    trustMin: 80,
    rewardMin: 0,
    rewardMax: 1000000,
    urgency: [],
    eligibleOnly: false,
    difficulty: [],
    sort: 'recommended',
    showRisky: false,
  });

  const handleFilterChange = (updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0E1A] to-[#111827]">
      {/* Header with search and other controls */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-[#0A0E1A]/95 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-white">Hunter Screen</h1>
        </div>
      </header>

      {/* Main content area */}
      <main className="pt-20">
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <HunterTabs
            activeTab={activeTab}
            onTabChange={setActiveTab}
            isDarkTheme={true}
          />
        </div>

        {/* Sticky Sub Filters - becomes sticky on scroll */}
        <StickySubFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          isDarkTheme={true}
        />

        {/* Opportunity Grid */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Opportunity cards would go here */}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
              <h3 className="text-white font-semibold mb-2">Sample Opportunity</h3>
              <p className="text-gray-400 text-sm">
                This is where opportunity cards would be displayed
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

/**
 * Example: Integrating with existing Hunter page
 */
export function IntegrationExample() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    types: [],
    chains: [],
    trustMin: 80,
    rewardMin: 0,
    rewardMax: 1000000,
    urgency: [],
    eligibleOnly: false,
    difficulty: [],
    sort: 'recommended',
    showRisky: false,
  });

  const handleFilterChange = (updates: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...updates }));
    
    // Trigger feed refetch with new filters
    console.log('Filters updated:', { ...filters, ...updates });
  };

  return (
    <>
      {/* Add after HunterTabs component */}
      <StickySubFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        isDarkTheme={true}
      />
    </>
  );
}

/**
 * Example: With light theme
 */
export function LightThemeExample() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    types: [],
    chains: [],
    trustMin: 80,
    rewardMin: 0,
    rewardMax: 1000000,
    urgency: [],
    eligibleOnly: false,
    difficulty: [],
    sort: 'recommended',
    showRisky: false,
  });

  return (
    <div className="min-h-screen bg-white">
      <StickySubFilters
        filters={filters}
        onFilterChange={(updates) => setFilters(prev => ({ ...prev, ...updates }))}
        isDarkTheme={false}
      />
    </div>
  );
}

/**
 * Example: Monitoring filter changes
 */
export function MonitoringExample() {
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    types: [],
    chains: [],
    trustMin: 80,
    rewardMin: 0,
    rewardMax: 1000000,
    urgency: [],
    eligibleOnly: false,
    difficulty: [],
    sort: 'recommended',
    showRisky: false,
  });

  const handleFilterChange = (updates: Partial<FilterState>) => {
    const newFilters = { ...filters, ...updates };
    setFilters(newFilters);
    
    // Log filter changes for analytics
    console.log('Filter changed:', {
      type: 'quick_filter_change',
      updates,
      activeFilters: {
        chains: newFilters.chains.length,
        trustMin: newFilters.trustMin,
        rewardMin: newFilters.rewardMin,
        urgency: newFilters.urgency.length,
      },
    });
  };

  return (
    <StickySubFilters
      filters={filters}
      onFilterChange={handleFilterChange}
      isDarkTheme={true}
    />
  );
}
