'use client';

import { useState, useEffect } from 'react';
import { useGate } from '../hooks/useGate';
import { useTelemetry } from '../hooks/useTelemetry';

interface ForYouItem {
  id: string;
  type: 'whale' | 'watchlist';
  address: string;
  label: string;
  activity: string;
  isFollowed?: boolean;
}

export function ForYouRow() {
  const { hasFlag } = useGate();
  const { track } = useTelemetry();
  const [items, setItems] = useState<ForYouItem[]>([]);

  useEffect(() => {
    // Simulate loading from watchlist and followed whales
    const mockItems: ForYouItem[] = [
      { id: '1', type: 'whale', address: '0xabcd...1234', label: 'Whale #1234', activity: 'Bought 500 ETH', isFollowed: true },
      { id: '2', type: 'watchlist', address: '0xefgh...5678', label: 'DeFi Whale', activity: 'Staked 1M USDC' },
      { id: '3', type: 'whale', address: '0xijkl...9012', label: 'BTC Maxi', activity: 'Moved 50 BTC', isFollowed: true }
    ];
    setItems(mockItems);
  }, []);

  if (!hasFlag('forYou.enabled') || items.length === 0) return null;

  const handleSetAlert = (item: ForYouItem) => {
    track({ event: 'create_alert_open', properties: { source: 'for_you', address: item.address } });
  };

  const handleFollow = (item: ForYouItem) => {
    const newFollowState = !item.isFollowed;
    track({ 
      event: newFollowState ? 'follow_whale' : 'unfollow_whale', 
      properties: { address: item.address, source: 'for_you' } 
    });
    setItems(prev => prev.map(i => 
      i.id === item.id ? { ...i, isFollowed: newFollowState } : i
    ));
  };

  const handleShare = (item: ForYouItem) => {
    track({ event: 'share_spotlight', properties: { source: 'for_you', address: item.address } });
    navigator.clipboard.writeText(`${item.activity} - ${window.location.href}`);
  };

  return (
    <section className="mb-6">
      <h2 className="text-lg font-semibold text-white mb-4">🎯 For You</h2>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map(item => (
          <div key={item.id} className="flex-shrink-0 w-80 bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">{item.label}</span>
              <span className={`text-xs px-2 py-1 rounded ${
                item.type === 'whale' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              }`}>
                {item.type}
              </span>
            </div>
            <p className="text-white text-sm mb-3">{item.activity}</p>
            <div className="flex gap-2">
              <button 
                onClick={() => handleSetAlert(item)}
                className="px-2 py-1 text-xs bg-teal-600 text-white rounded hover:bg-teal-700"
              >
                Set Alert
              </button>
              <button 
                onClick={() => handleFollow(item)}
                className={`px-2 py-1 text-xs rounded ${
                  item.isFollowed 
                    ? 'bg-gray-600 text-white hover:bg-gray-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {item.isFollowed ? 'Unfollow' : 'Follow'}
              </button>
              <button 
                onClick={() => handleShare(item)}
                className="px-2 py-1 text-xs bg-slate-600 text-white rounded hover:bg-slate-700"
              >
                Share
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}