'use client';

import { useState, useEffect, useRef } from 'react';

interface ForYouItem {
  id: string;
  type: 'whale' | 'watchlist';
  address: string;
  label: string;
  activity: string;
  timestamp: Date;
  isFollowed?: boolean;
}

export function ForYouCarousel() {
  const [items, setItems] = useState<ForYouItem[]>([]);
  const [showContextMenu, setShowContextMenu] = useState<string | null>(null);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Simulate loading from watchlist and followed whales
    const mockItems: ForYouItem[] = [
      { 
        id: '1', 
        type: 'whale', 
        address: '0xabcd...1234', 
        label: 'Whale #1234', 
        activity: 'Bought 500 ETH',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
        isFollowed: true 
      },
      { 
        id: '2', 
        type: 'watchlist', 
        address: '0xefgh...5678', 
        label: 'DeFi Whale', 
        activity: 'Staked 1M USDC',
        timestamp: new Date(Date.now() - 1000 * 60 * 90) // 90 min ago
      },
      { 
        id: '3', 
        type: 'whale', 
        address: '0xijkl...9012', 
        label: 'BTC Maxi', 
        activity: 'Moved 50 BTC',
        timestamp: new Date(Date.now() - 1000 * 60 * 20), // 20 min ago
        isFollowed: true 
      }
    ];
    setItems(mockItems);
  }, []);

  const isNew = (timestamp: Date) => {
    return Date.now() - timestamp.getTime() < 60 * 60 * 1000; // < 1 hour
  };

  const scrollLeft = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const handleSetAlert = (item: ForYouItem) => {
    console.log('Set alert for:', item.address);
    setShowContextMenu(null);
  };

  const handleFollow = (item: ForYouItem) => {
    setItems(prev => prev.map(i => 
      i.id === item.id ? { ...i, isFollowed: !i.isFollowed } : i
    ));
    setShowContextMenu(null);
  };

  const handleShare = (item: ForYouItem) => {
    navigator.clipboard.writeText(`${item.activity} - ${window.location.href}`);
    setShowContextMenu(null);
  };

  return (
    <section className="section-gap">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">🎯 For You</h2>
        <div className="flex gap-2">
          <button 
            onClick={scrollLeft}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white"
          >
            ←
          </button>
          <button 
            onClick={scrollRight}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white"
          >
            →
          </button>
        </div>
      </div>

      <div 
        ref={carouselRef}
        className="carousel-container"
      >
        {items.map(item => (
          <div key={item.id} className="carousel-item relative">
            {isNew(item.timestamp) && <div className="new-dot"></div>}
            
            <div className="w-80 bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    item.type === 'whale' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {item.type}
                  </span>
                  <button 
                    onClick={() => setShowContextMenu(showContextMenu === item.id ? null : item.id)}
                    className="text-slate-400 hover:text-white"
                  >
                    ⋯
                  </button>
                </div>
              </div>
              
              <p className="text-white text-sm mb-3">{item.activity}</p>
              
              <div className="flex gap-2">
                <button 
                  onClick={() => handleSetAlert(item)}
                  className="cta-primary"
                >
                  Set Alert
                </button>
                <button 
                  onClick={() => handleFollow(item)}
                  className={item.isFollowed ? 'cta-secondary' : 'cta-secondary'}
                >
                  {item.isFollowed ? 'Unfollow' : 'Follow'}
                </button>
                <button 
                  onClick={() => handleShare(item)}
                  className="cta-tertiary"
                >
                  Share
                </button>
              </div>

              {/* Context Menu */}
              {showContextMenu === item.id && (
                <div className="absolute top-12 right-4 bg-slate-700 border border-slate-600 rounded-lg shadow-lg z-10">
                  <button 
                    onClick={() => handleFollow(item)}
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600"
                  >
                    {item.isFollowed ? 'Unfollow' : 'Follow'}
                  </button>
                  <button 
                    onClick={() => handleSetAlert(item)}
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600"
                  >
                    Set Alert
                  </button>
                  <button 
                    onClick={() => handleShare(item)}
                    className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-slate-600"
                  >
                    Share
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}