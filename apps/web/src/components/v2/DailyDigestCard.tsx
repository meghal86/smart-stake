'use client';

import { useState, useEffect } from 'react';

interface DigestItem {
  id: string;
  text: string;
  direction: 'buy' | 'sell';
  timestamp: Date;
}

interface DigestData {
  items: DigestItem[];
  provenance: 'Real' | 'Simulated';
}

export function DailyDigestCard() {
  const [data, setData] = useState<DigestData | null>(null);

  useEffect(() => {
    // Simulate data loading - reuse existing adapter
    setData({
      items: [
        { id: 'd1', text: 'Whales bought $200M BTC', direction: 'buy', timestamp: new Date() },
        { id: 'd2', text: 'ETH CEX inflows up 15%', direction: 'sell', timestamp: new Date() },
        { id: 'd3', text: 'USDT mints spiked to $500M', direction: 'buy', timestamp: new Date() },
        { id: 'd4', text: 'Large SOL accumulation detected', direction: 'buy', timestamp: new Date() }
      ],
      provenance: 'Simulated'
    });
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') {
        handleSetAlert();
      } else if (e.key === 'f' || e.key === 'F') {
        handleFollow();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const handleSetAlert = () => {
    console.log('Set alert triggered');
  };

  const handleFollow = () => {
    console.log('Follow triggered');
  };

  const handleAddToWatchlist = () => {
    console.log('Add to watchlist triggered');
  };

  const handleRowClick = (item: DigestItem) => {
    console.log('Navigate to details:', item.id);
  };

  if (!data) return null;

  return (
    <div className="card-padding bg-slate-800 rounded-2xl border border-slate-700 section-gap">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">📩 Daily Whale Digest</h3>
        <span 
          className={`text-xs px-2 py-1 rounded cursor-help ${
            data.provenance === 'Real' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-yellow-100 text-yellow-700'
          }`}
          title={data.provenance === 'Simulated' 
            ? "This is simulated until live sources are connected. Connect a wallet or upgrade to Pro to see verified data."
            : "Live data from connected sources"
          }
        >
          {data.provenance}
        </span>
      </div>

      <div className="space-y-2">
        {data.items.map(item => (
          <div 
            key={item.id}
            className="group flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition-colors"
            onClick={() => handleRowClick(item)}
          >
            <div className="flex items-center gap-3">
              <span className={item.direction === 'buy' ? 'text-green-400' : 'text-red-400'}>
                {item.direction === 'buy' ? '🟢' : '🔴'}
              </span>
              <span className="text-sm text-slate-200">{item.text}</span>
            </div>
            
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button 
                onClick={(e) => { e.stopPropagation(); handleSetAlert(); }}
                className="cta-primary text-xs px-2 py-1"
                title="Set Alert (A)"
              >
                Set Alert
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleFollow(); }}
                className="cta-secondary text-xs px-2 py-1"
                title="Follow (F)"
              >
                Follow
              </button>
              <button 
                onClick={(e) => { e.stopPropagation(); handleAddToWatchlist(); }}
                className="cta-tertiary text-xs px-2 py-1"
                title="Add to Watchlist"
              >
                +Watchlist
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 text-center">
        <a href="/upgrade" className="text-sm text-blue-400 hover:text-blue-300">
          Unlock Pro for full digest →
        </a>
      </div>
    </div>
  );
}