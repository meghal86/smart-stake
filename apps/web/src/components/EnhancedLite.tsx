'use client';

import { useState, useEffect } from 'react';
import { ForYouRow } from './ForYouRow';
import { AlertsFeed } from './AlertsFeed';
import MobileDock from './MobileDock';
import { ProTeaser } from './ProTeaser';
import { OnboardingWizard } from './OnboardingWizard';
import { RefreshButton } from './RefreshButton';
import { ConfidenceChip } from './ConfidenceChip';
import '../styles/tokens.css';
// Simple inline Logo component
function Logo({ size = 'lg', showText = false, variant = 'header', className = '' }: {
  size?: string;
  showText?: boolean;
  variant?: string;
  className?: string;
}) {
  return (
    <img 
      src="/hero_logo_512.png" 
      alt="AlphaWhale Logo" 
      className={`w-16 h-16 object-contain ${className}`}
    />
  );
}

interface WhaleSpotlightData {
  id: string;
  whaleId: string;
  asset: string;
  amount: number;
  narrative: string;
  risk: 'low' | 'med' | 'high';
  provenance: 'Real' | 'Simulated';
}

interface FearIndexData {
  score: number;
  label: string;
  provenance: 'Real' | 'Simulated';
}

interface DigestData {
  items: Array<{
    id: string;
    text: string;
    direction: 'buy' | 'sell';
  }>;
  provenance: 'Real' | 'Simulated';
}

function ProvenanceBadge({ provenance }: { provenance: 'Real' | 'Simulated' }) {
  return (
    <span className={`text-xs px-2 py-1 rounded ${
      provenance === 'Real' 
        ? 'bg-green-100 text-green-700' 
        : 'bg-yellow-100 text-yellow-700'
    }`}>
      {provenance}
    </span>
  );
}

function ShareButton({ data, type }: { data: any; type: string }) {
  const handleShare = async () => {
    const text = type === 'spotlight' 
      ? `🐋 ${data.whaleId} moved ${data.amount.toLocaleString()} ${data.asset}!`
      : `🧭 Fear & Whale Index: ${data.score} - ${data.label}`;
    
    try {
      if (navigator.share) {
        await navigator.share({ text, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(`${text} ${window.location.href}`);
        alert('Copied to clipboard!');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  return (
    <button 
      onClick={handleShare}
      className="px-3 py-1 rounded bg-teal-600 text-white hover:bg-teal-700 transition-colors"
    >
      Share
    </button>
  );
}

export default function EnhancedLite() {
  const [spotlight, setSpotlight] = useState<WhaleSpotlightData | null>(null);
  const [fearIndex, setFearIndex] = useState<FearIndexData | null>(null);
  const [digest, setDigest] = useState<DigestData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Simulate API calls with fallback data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setSpotlight({
          id: 'sp1',
          whaleId: '0xabcd...1234',
          asset: 'ETH',
          amount: 12500000,
          narrative: 'Large ETH movement detected. Upgrade for full analysis.',
          risk: 'med',
          provenance: 'Simulated'
        });
        
        setFearIndex({
          score: 62,
          label: 'Accumulation bias',
          provenance: 'Simulated'
        });
        
        setDigest({
          items: [
            { id: 'd1', text: 'Whales bought $200M BTC', direction: 'buy' },
            { id: 'd2', text: 'ETH CEX inflows up 15%', direction: 'sell' },
            { id: 'd3', text: 'USDT mints spiked to $500M', direction: 'buy' }
          ],
          provenance: 'Simulated'
        });
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white py-12 px-4 text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <img 
              src="/whaleplus-monochrome-white-512x512.png" 
              alt="AlphaWhale Logo" 
              className="w-16 h-16"
            />
            <h1 className="text-4xl font-bold">AlphaWhale Lite</h1>
          </div>
          <p className="text-xl opacity-90">Loading whale intelligence...</p>
        </div>
        <main className="max-w-4xl mx-auto p-6 space-y-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-2xl border border-slate-700 p-6 bg-slate-800 animate-pulse">
              <div className="h-4 bg-slate-700 rounded w-1/4 mb-3"></div>
              <div className="h-6 bg-slate-700 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-slate-700 rounded w-1/2"></div>
            </div>
          ))}
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white py-12 px-4 text-center">
        <div className="flex items-center justify-center gap-4 mb-4">
          <Logo 
            size="lg" 
            showText={false}
            variant="header"
            className="filter brightness-0 invert"
          />
          <h1 className="text-4xl font-bold">AlphaWhale Lite</h1>
        </div>
        <p className="text-xl opacity-90">Enhanced whale intelligence with real-time insights</p>
      </div>
      
      <main className="max-w-4xl mx-auto p-6 space-y-6 safe-bottom">
        <OnboardingWizard />
        <ForYouRow />
        
      {/* Whale Spotlight */}
      <section id="spotlight" className="rounded-2xl border border-slate-700 p-6 bg-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold text-teal-400">🚨 Whale Spotlight</div>
          {spotlight && <ProvenanceBadge provenance={spotlight.provenance} />}
        </div>
        {spotlight && (
          <>
            <div className="text-xl font-bold mt-2 text-white">
              {spotlight.whaleId} bought {spotlight.amount.toLocaleString()} {spotlight.asset}
            </div>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed">{spotlight.narrative}</p>
            <div className="mt-3 flex gap-2">
              <ShareButton data={spotlight} type="spotlight" />
              <button className="px-3 py-1 rounded border border-slate-600 text-white hover:bg-slate-700 transition-colors">
                Follow Whale
              </button>
              <button className="px-3 py-1 rounded bg-teal-600 text-white hover:bg-teal-700 transition-colors">
                Set Alert
              </button>
              <a href={`https://etherscan.io/address/${spotlight.whaleId}`} target="_blank" rel="noopener noreferrer" className="px-3 py-1 rounded border border-slate-600 text-teal-400 hover:bg-slate-700 transition-colors text-sm">
                Etherscan
              </a>
            </div>
            <div className="mt-2 text-xs text-slate-500 flex items-center gap-2">
              <span>Last updated: 14:32 UTC • 11m ago</span>
              <RefreshButton onRefresh={async () => {
                await new Promise(resolve => setTimeout(resolve, 1000));
                // Refresh spotlight data
              }} />
              <ConfidenceChip amount={spotlight.amount} />
            </div>
          </>
        )}
      </section>
      
      {/* Fear & Whale Index */}
      <section className="rounded-2xl border border-slate-700 p-6 bg-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-white">🧭 Fear & Whale Index</div>
          {fearIndex && <ProvenanceBadge provenance={fearIndex.provenance} />}
        </div>
        {fearIndex && (
          <div className="mt-2 flex items-center gap-4">
            <div className="h-4 flex-1 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 rounded relative">
              <div 
                className="absolute top-0 w-2 h-4 bg-white border-2 border-gray-800 rounded"
                style={{ left: `${fearIndex.score}%` }}
              />
            </div>
            <div className="text-lg font-bold text-white">{fearIndex.score}</div>
            <div className="text-sm text-slate-300 mt-1">{fearIndex.label}</div>
          </div>
        )}
      </section>
      
      {/* Daily Digest */}
      <section className="rounded-2xl border border-slate-700 p-6 bg-slate-800 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-semibold text-white">📩 Daily Whale Digest</div>
          {digest && <ProvenanceBadge provenance={digest.provenance} />}
        </div>
        {digest && (
          <ul className="mt-2 space-y-2">
            {digest.items.map(item => (
              <li key={item.id} className="text-sm flex items-center gap-3 p-3 rounded-lg bg-slate-700/50 text-slate-200">
                <span className={item.direction === 'buy' ? 'text-green-400' : 'text-red-400'}>
                  {item.direction === 'buy' ? '🟢' : '🔴'}
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 space-y-2">
          {digest?.items.map(item => (
            <div key={item.id} className="group cursor-pointer hover:bg-slate-700/30 p-2 rounded transition-colors">
              <div className="flex items-center justify-between">
                <span className="flex-1">{item.text}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    className="px-2 py-1 bg-teal-600 text-white rounded text-xs hover:bg-teal-700"
                    title="Set Alert (A)"
                  >
                    A
                  </button>
                  <button 
                    className="px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                    title="Follow (F)"
                  >
                    F
                  </button>
                  <button 
                    className="px-2 py-1 bg-slate-600 text-white rounded text-xs hover:bg-slate-700"
                    title="Add to Watchlist"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-center">
          <a href="/upgrade" className="text-sm text-blue-400 hover:text-blue-300">
            See full analysis →
          </a>
        </div>
      </section>
      
      {/* Alerts Feed */}
      <section id="alerts">
        <AlertsFeed />
      </section>

      {/* Portfolio Lite */}
      <section id="watchlist" className="rounded-2xl border border-slate-700 p-6 bg-slate-800 shadow-xl">
        <div className="text-sm font-semibold text-white">📊 Portfolio Lite</div>
        <div className="mt-4 text-center py-8">
          <div className="text-slate-400 mb-6">Connect your wallet to start tracking</div>
          <div className="flex gap-4 justify-center">
            <button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600 px-8 py-4 rounded-xl transition-all duration-300 text-white font-semibold shadow-lg">
              Connect Wallet
            </button>
            <button className="bg-slate-700 hover:bg-slate-600 px-8 py-4 rounded-xl transition-all duration-300 text-white font-semibold border border-slate-600">
              Try Demo Portfolio
            </button>
          </div>
        </div>
      </section>

      {/* Pro Teaser */}
      <ProTeaser />
      </main>
      <MobileDock />
    </div>
  );
}