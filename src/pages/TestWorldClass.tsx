/**
 * Test World-Class Components - Quick integration test
 */

import { useState } from 'react';
import { WorldClassSignalCard } from '@/components/signals/WorldClassSignalCard';
import { WorldClassNarrativeHeader } from '@/components/signals/WorldClassNarrativeHeader';
import { WorldClassFiltersBar } from '@/components/signals/WorldClassFiltersBar';
import { WorldClassNewItemsBadge } from '@/components/signals/WorldClassNewItemsBadge';

export default function TestWorldClass() {
  const [newItemsCount, setNewItemsCount] = useState(3);
  const [activeFilter, setActiveFilter] = useState('all');

  const mockGroup = {
    signals: [],
    asset: 'BTC',
    destination: 'cold storage',
    count: 5,
    totalUsd: 47500000,
    avgUsd: 9500000,
    multiplier: 2.3,
    aiConfidence: 87,
    latencyMs: 850,
    history: [45, 52, 48, 61, 58, 67, 72, 69]
  };

  const mockBias = { side: 'buy' as const, deltaPct: 93 };
  const mockStats = { signals: 50, inflowsUsd: 479000000, outflowsUsd: 17000000 };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-2xl font-bold text-center">World-Class Components Test</h1>
        
        <WorldClassNewItemsBadge 
          count={newItemsCount} 
          onViewNew={() => setNewItemsCount(0)} 
        />
        
        <WorldClassNarrativeHeader
          bias={mockBias}
          stats={mockStats}
          refreshedAt={new Date()}
          onRefresh={() => console.log('Refresh clicked')}
        />
        
        <WorldClassFiltersBar
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          counts={{ all: 50, BTC: 12, USDT: 8, XRP: 5, exchanges: 15, large: 7 }}
        />
        
        <div className="space-y-4">
          <WorldClassSignalCard
            group={mockGroup}
            rank={1}
            onExpand={() => console.log('Expanded')}
            onExplain={() => console.log('Explain')}
            onCreateAlert={() => console.log('Create Alert')}
          />
          
          <WorldClassSignalCard
            group={{...mockGroup, asset: 'ETH', aiConfidence: 72}}
            rank={2}
            onExpand={() => console.log('Expanded')}
            onExplain={() => console.log('Explain')}
            onCreateAlert={() => console.log('Create Alert')}
          />
        </div>
        
        <div className="text-center space-x-4">
          <button 
            onClick={() => setNewItemsCount(5)}
            className="px-4 py-2 bg-blue-500 text-white rounded"
          >
            Trigger New Items
          </button>
          <button 
            onClick={() => document.documentElement.classList.toggle('dark')}
            className="px-4 py-2 bg-gray-500 text-white rounded"
          >
            Toggle Dark Mode
          </button>
        </div>
      </div>
    </div>
  );
}