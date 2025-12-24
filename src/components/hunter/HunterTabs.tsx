import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';

export type TabType = 'All' | 'Airdrops' | 'Quests' | 'Staking' | 'NFT' | 'Points';

interface HunterTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  isDarkTheme?: boolean;
}

const TABS: TabType[] = ['All', 'Airdrops', 'Quests', 'Staking', 'NFT', 'Points'];

export function HunterTabs({ activeTab, onTabChange, isDarkTheme = true }: HunterTabsProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Sync active tab with URL on mount
  useEffect(() => {
    const tabParam = searchParams.get('tab') as TabType | null;
    if (tabParam && TABS.includes(tabParam) && tabParam !== activeTab) {
      onTabChange(tabParam);
    }
  }, [searchParams, activeTab, onTabChange]);

  const handleTabClick = (tab: TabType) => {
    // Update local state
    onTabChange(tab);

    // Update URL query parameter
    const params = new URLSearchParams(searchParams.toString());
    if (tab === 'All') {
      params.delete('tab');
    } else {
      params.set('tab', tab);
    }

    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    navigate(newUrl, { replace: true });
  };

  return (
    <nav
      className={`relative flex items-center gap-6 overflow-x-auto scrollbar-none text-sm transition-colors duration-300 ${
        isDarkTheme ? 'text-gray-300' : 'text-[#444C56]'
      }`}
      role="tablist"
      aria-label="Opportunity categories"
    >
      {TABS.map((tab) => (
        <button
          key={tab}
          onClick={() => handleTabClick(tab)}
          role="tab"
          aria-selected={activeTab === tab}
          aria-controls={`${tab.toLowerCase()}-panel`}
          className={`relative px-2 py-1 transition-all duration-200 whitespace-nowrap after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:transition-all after:duration-200 ${
            activeTab === tab
              ? 'after:bg-gradient-to-r after:from-[#00F5A0] after:to-[#7B61FF] font-medium'
              : 'after:bg-transparent hover:after:bg-gradient-to-r hover:after:from-[#00F5A0] hover:after:to-[#7B61FF] hover:after:opacity-50'
          }`}
        >
          {tab}
        </button>
      ))}
      
      {/* Scroll indicator gradient */}
      <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0A0E1A] to-transparent pointer-events-none" />
    </nav>
  );
}
