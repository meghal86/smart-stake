'use client';

import { useState, useEffect, useRef } from 'react';
import SimpleEnhanced from '../../components/SimpleEnhanced';
import { Button } from '../../components/ui/Button';
import { ExternalLink } from '../../components/ui/ExternalLink';
import { RefreshButton } from '../../components/ui/RefreshButton';
import { Tooltip } from '../../components/ui/Tooltip';
import { copy } from '../../lib/copy';
import { SkeletonCard, SkeletonRow } from '../../components/ui/SkeletonCard';
import MobileDock from '../../components/MobileDock';

function EnhancedLiteV2() {
  const [showBottomSheet, setShowBottomSheet] = useState<any>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [demoPortfolio, setDemoPortfolio] = useState<any>(null);
  const [forYouItems, setForYouItems] = useState<any[]>([]);
  const [digestItems, setDigestItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const maxCarouselIndex = Math.max(0, forYouItems.length - 1);
  
  const handleDigestRowClick = (item: any) => {
    if (isMobile) {
      setShowBottomSheet(item);
    } else {
      console.log('Navigate to details:', item);
    }
  };
  
  const seedDemoPortfolio = () => {
    const portfolio = {
      positions: [
        { symbol: 'BTC', amount: 0.5, price: 45000, change24h: 2.3 },
        { symbol: 'ETH', amount: 5, price: 2250, change24h: -1.2 }
      ]
    };
    const totalValue = portfolio.positions.reduce((sum: number, pos: any) => sum + (pos.amount * pos.price), 0);
    const totalChange = portfolio.positions.reduce((sum: number, pos: any) => sum + (pos.amount * pos.price * pos.change24h / 100), 0);
    
    setDemoPortfolio({ ...portfolio, totalValue, totalChange, changePercent: (totalChange / totalValue) * 100 });
    localStorage.setItem('alpha/demo-portfolio', JSON.stringify(portfolio));
  };
  
  const resetDemoPortfolio = () => {
    setDemoPortfolio(null);
    localStorage.removeItem('alpha/demo-portfolio');
  };
  
  const scrollCarousel = (direction: string) => {
    if (carouselRef.current) {
      const scrollAmount = 320;
      const newIndex = direction === 'left' ? Math.max(0, carouselIndex - 1) : Math.min(2, carouselIndex + 1);
      setCarouselIndex(newIndex);
      carouselRef.current.scrollTo({ left: newIndex * scrollAmount, behavior: 'smooth' });
    }
  };
  
  useEffect(() => {
    // Load demo portfolio
    const saved = localStorage.getItem('alpha/demo-portfolio');
    if (saved) {
      const portfolio = JSON.parse(saved);
      const totalValue = portfolio.positions.reduce((sum: number, pos: any) => sum + (pos.amount * pos.price), 0);
      const totalChange = portfolio.positions.reduce((sum: number, pos: any) => sum + (pos.amount * pos.price * pos.change24h / 100), 0);
      setDemoPortfolio({ ...portfolio, totalValue, totalChange, changePercent: (totalChange / totalValue) * 100 });
    }
    
    // Simulate loading data
    setTimeout(() => {
      setForYouItems([
        { id: 1, whale: 'Whale #1234', activity: 'Bought 500 ETH', timestamp: new Date(Date.now() - 1000 * 60 * 30) },
        { id: 2, whale: 'DeFi Whale', activity: 'Staked 1M USDC', timestamp: new Date(Date.now() - 1000 * 60 * 90) },
        { id: 3, whale: 'BTC Maxi', activity: 'Moved 50 BTC', timestamp: new Date(Date.now() - 1000 * 60 * 20) }
      ]);
      
      setDigestItems([
        { id: 1, text: 'Whales bought $200M BTC', icon: '🟢', color: 'text-green-400' },
        { id: 2, text: 'ETH CEX inflows up 15%', icon: '🔴', color: 'text-red-400' },
        { id: 3, text: 'USDT mints spiked to $500M', icon: '🟢', color: 'text-green-400' }
      ]);
      
      setIsLoading(false);
    }, 1500);
  }, []);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') scrollCarousel('left');
      if (e.key === 'ArrowRight') scrollCarousel('right');
      if (e.key === 'Home') { setCarouselIndex(0); carouselRef.current?.scrollTo({ left: 0, behavior: 'smooth' }); }
      if (e.key === 'End') { 
        const newIndex = maxCarouselIndex;
        setCarouselIndex(newIndex); 
        carouselRef.current?.scrollTo({ left: newIndex * 320, behavior: 'smooth' }); 
      }
      if (e.key === 'a' || e.key === 'A') console.log('Set alert shortcut');
      if (e.key === 'f' || e.key === 'F') console.log('Follow shortcut');
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [carouselIndex, maxCarouselIndex]);
  
  // Track active section changes for analytics
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).track) {
      (window as any).track('dock_active_section_changed', { section: 'spotlight' });
    }
  }, []);
  
  return (
    <div className="min-h-screen bg-slate-900">
      <style jsx>{`
        .cta-primary { background: #0d9488; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; border: none; font-weight: 500; min-width: 44px; min-height: 44px; }
        .cta-secondary { border: 1px solid #64748b; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; background: transparent; font-weight: 500; min-width: 44px; min-height: 44px; }
        .cta-tertiary { color: #94a3b8; padding: 0.5rem 1rem; border-radius: 0.5rem; background: transparent; border: none; font-weight: 500; min-width: 44px; min-height: 44px; }
        .section-gap { margin-bottom: 0.5rem; }
        .card-padding { padding: 1rem; }
        .card-header { height: 2.5rem; display: flex; align-items: center; justify-content: space-between; }
        .status-chip { margin-left: auto; }
        .footer-baseline { display: flex; align-items: baseline; gap: 0.5rem; }
        .carousel-container { display: flex; overflow-x: auto; gap: 1rem; padding-bottom: 0.5rem; scroll-behavior: smooth; }
        .new-dot { position: absolute; top: -4px; right: -4px; width: 8px; height: 8px; background: #14b8a6; border-radius: 50%; animation: pulse 2s infinite; }
        .carousel-arrow { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; }
        .carousel-arrow:disabled { opacity: 0.3; cursor: not-allowed; }
        .bottom-sheet { position: fixed; bottom: 0; left: 0; right: 0; background: #1e293b; border-top: 1px solid #475569; padding: 1rem; z-index: 50; }
        .safe-bottom { padding-bottom: calc(env(safe-area-inset-bottom) + 1rem); }
        @media (prefers-reduced-motion: reduce) { .carousel-container { scroll-behavior: auto; } }
      `}</style>
      
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white py-8 md:py-12 px-4 text-center">
        <h1 className="text-4xl font-bold mb-2">🐋 AlphaWhale Lite V2</h1>
        <p className="text-xl opacity-90">Enhanced whale intelligence with real-time insights</p>
      </div>
      
      <main className="max-w-4xl mx-auto p-6">
        {/* For You Carousel */}
        <section id="for-you" className="section-gap">
          <div className="card-header mb-4">
            <h2 className="text-lg font-semibold text-white">🎯 For You</h2>
            <div className="flex gap-1">
              <button 
                className="carousel-arrow rounded-lg bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-30"
                onClick={() => scrollCarousel('left')}
                disabled={carouselIndex === 0}
                style={{ display: carouselIndex === 0 ? 'none' : 'flex' }}
                aria-label="Previous items"
              >
                ←
              </button>
              <button 
                className="carousel-arrow rounded-lg bg-slate-700 hover:bg-slate-600 text-white disabled:opacity-30"
                onClick={() => scrollCarousel('right')}
                disabled={carouselIndex >= maxCarouselIndex}
                style={{ display: carouselIndex >= maxCarouselIndex ? 'none' : 'flex' }}
                aria-label="Next items"
              >
                →
              </button>
            </div>
          </div>
          <div ref={carouselRef} className="carousel-container">
            {isLoading ? (
              Array.from({ length: 3 }, (_, i) => <SkeletonCard key={`skeleton-${i}`} />)
            ) : (
              forYouItems.map((item, i) => {
                const isNew = Date.now() - item.timestamp.getTime() < 60 * 60 * 1000;
                return (
                  <div key={item.id} className="flex-shrink-0 w-80 bg-slate-800 rounded-lg p-4 border border-slate-700 relative">
                    {isNew && <div className="new-dot"></div>}
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-slate-400">{item.whale}</span>
                      <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">whale</span>
                    </div>
                    <p className="text-white text-sm mb-3">{item.activity}</p>
                    <div className="flex gap-2">
                      <Button variant="primary" size="sm">{copy.setAlert}</Button>
                      <Button variant="secondary" size="sm">{copy.follow}</Button>
                      <Button variant="tertiary" size="sm">{copy.share}</Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
        
        {/* Enhanced Spotlight */}
        <section id="spotlight" className="card-padding bg-slate-800 rounded-2xl border border-slate-700 section-gap">
          <div className="card-header mb-2">
            <div className="text-sm font-semibold text-teal-400">🚨 Whale Spotlight</div>
            <Tooltip content={copy.simulatedTooltip}>
              <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 cursor-help status-chip">
                Simulated
              </span>
            </Tooltip>
          </div>
          <div className="text-xl font-bold text-white mb-3">
            0xabcd...1234 bought 12,500,000 ETH
          </div>
          <div className="flex gap-2 mb-2">
            <Button variant="tertiary" size="sm">{copy.share}</Button>
            <Button variant="secondary" size="sm">Follow Whale</Button>
            <Button variant="primary" size="sm">{copy.setAlert}</Button>
            <ExternalLink href="https://etherscan.io/address/0xabcd" className="cta-secondary">
              Etherscan ↗
            </ExternalLink>
          </div>
          <div className="footer-baseline text-xs text-slate-500">
            <span aria-live="polite">14:32 UTC • 11m ago •</span>
            <RefreshButton onRefresh={async () => {
              await new Promise(resolve => setTimeout(resolve, 500));
            }} />
          </div>
        </section>
        
        {/* Fear Index Card */}
        <div className="card-padding bg-slate-800 rounded-2xl border border-slate-700 section-gap">
          <div className="card-header mb-4">
            <h3 className="text-sm font-semibold text-white">🧭 Fear & Whale Index</h3>
            <Tooltip content={copy.simulatedTooltip}>
              <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 cursor-help status-chip">
                Simulated
              </span>
            </Tooltip>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <div className="flex-1 relative">
              <div className="h-4 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 rounded" role="meter" aria-valuenow={62} aria-valuemin={0} aria-valuemax={100} aria-label="Fear and Whale Index">
                <div className="absolute top-0 w-3 h-4 bg-white border-2 border-slate-800 rounded flex items-center justify-center shadow-sm" style={{left: 'calc(62% - 6px)'}}>
                  <span className="text-xs font-bold text-slate-800">62</span>
                </div>
              </div>
            </div>
            <div className="text-sm text-slate-300">Accumulation bias</div>
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span aria-live="polite">{copy.lastUpdated}: 11m ago</span>
            <Tooltip content="Scale: 0-24 Extreme Fear, 25-44 Fear, 45-55 Neutral, 56-74 Accumulation, 75-100 Aggressive Accumulation. Based on whale flow, volume, entity breadth, and recency.">
              <a href="/docs/methodology#fear-index" className="text-teal-400 hover:text-teal-300 hover:underline">
                Methodology
              </a>
            </Tooltip>
          </div>
        </div>

        {/* Daily Digest Card */}
        <div id="alerts" className="card-padding bg-slate-800 rounded-2xl border border-slate-700 section-gap">
          <div className="card-header mb-4">
            <h3 className="text-sm font-semibold text-white">📩 Daily Whale Digest</h3>
            <Tooltip content={copy.simulatedTooltip}>
              <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700 cursor-help status-chip">
                Simulated
              </span>
            </Tooltip>
          </div>
          <div className="space-y-2">
            {isLoading ? (
              Array.from({ length: 3 }, (_, i) => <SkeletonRow key={`skeleton-${i}`} />)
            ) : (
              digestItems.map((item) => (
                <div 
                  key={item.id}
                  className="group flex items-center justify-between p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 cursor-pointer transition-colors w-full"
                  onClick={() => isMobile ? setShowBottomSheet(`digest-${item.id}`) : console.log('Navigate to details:', item.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      isMobile ? setShowBottomSheet(`digest-${item.id}`) : console.log('Navigate to details:', item.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <span className={item.color}>{item.icon}</span>
                    <span className="text-sm text-slate-200">{item.text}</span>
                  </div>
                  {!isMobile && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); }}>{copy.setAlert}</Button>
                      <Button variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); }}>{copy.follow}</Button>
                      <Button variant="tertiary" size="sm" onClick={(e) => { e.stopPropagation(); }}>+Watchlist</Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Portfolio Demo */}
        <div className="card-padding bg-slate-800 rounded-2xl border border-slate-700 section-gap safe-bottom">
          <div className="card-header mb-4">
            <h3 className="text-sm font-semibold text-white">
              📊 Portfolio
              {demoPortfolio && (
                <span className="text-xs text-slate-400 ml-2">
                  ${demoPortfolio.totalValue.toLocaleString()} • {demoPortfolio.changePercent >= 0 ? '+' : ''}{demoPortfolio.changePercent.toFixed(1)}%
                </span>
              )}
            </h3>
            {demoPortfolio && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded status-chip">Demo</span>
            )}
          </div>
          
          {!demoPortfolio ? (
            <div className="text-center py-8">
              <div className="text-slate-400 mb-6">Try our demo portfolio</div>
              <div className="flex gap-4 justify-center">
                <Button variant="primary" size="lg" onClick={seedDemoPortfolio}>Try Demo</Button>
                <Button variant="secondary" size="lg">Connect Wallet</Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <div className="text-2xl font-bold text-white">
                  ${demoPortfolio.totalValue.toLocaleString()}
                </div>
                <div className={`text-sm ${demoPortfolio.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {demoPortfolio.changePercent >= 0 ? '+' : ''}${demoPortfolio.totalChange.toFixed(2)} ({demoPortfolio.changePercent.toFixed(2)}%) 24h
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                {demoPortfolio.positions.map((position: any) => (
                  <div key={position.symbol} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {position.symbol.slice(0, 2)}
                      </div>
                      <div>
                        <div className="text-white font-medium">{position.symbol}</div>
                        <div className="text-slate-400 text-sm">{position.amount} {position.symbol}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-white">${(position.amount * position.price).toLocaleString()}</div>
                      <div className={`text-sm ${position.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {position.change24h >= 0 ? '+' : ''}{position.change24h}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button variant="tertiary" size="sm" onClick={resetDemoPortfolio}>Reset</Button>
              </div>
            </div>
          )}
        </div>
      </main>
      
      {/* Bottom Sheets for Mobile */}
      {showBottomSheet && isMobile && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-40" onClick={() => setShowBottomSheet(null)}>
          <div className="bg-slate-800 p-4 rounded-t-lg w-full border-t border-slate-700" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
            {showBottomSheet === 'simulated' && (
              <div>
                <h4 className="font-semibold text-white mb-2">Simulated Data</h4>
                <p className="text-slate-300 text-sm">This is simulated until live sources are connected. Connect a wallet or upgrade to Pro to see verified data.</p>
              </div>
            )}
            {showBottomSheet === 'methodology' && (
              <div>
                <h4 className="font-semibold text-white mb-2">Fear & Whale Index</h4>
                <p className="text-slate-300 text-sm mb-2">Combines whale activity (40%), market sentiment (30%), and volume patterns (30%) on a 0-100 scale.</p>
                <button 
                  className="text-teal-400 text-sm"
                  onClick={() => window.location.href = '/docs/methodology#fear-index'}
                >
                  Read full methodology →
                </button>
              </div>
            )}
            {showBottomSheet?.startsWith('digest-') && (
              <div>
                <h4 className="font-semibold text-white mb-3">Quick Actions</h4>
                <div className="flex gap-2">
                  <button className="cta-primary flex-1">Set Alert</button>
                  <button className="cta-secondary flex-1">Follow</button>
                  <button className="cta-tertiary flex-1">+Watchlist</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      <MobileDock 
        alerts={[
          { id: 'a1', ts: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
          { id: 'a2', ts: new Date(Date.now() - 1000 * 60 * 10).toISOString() },
          { id: 'a3', ts: new Date().toISOString() }
        ]}
        modalOpen={!!showBottomSheet}
      />
    </div>
  );
}

export default function Lite() {
  // Force v2 for testing
  return <EnhancedLiteV2 />;
}