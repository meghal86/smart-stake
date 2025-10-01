'use client';

import { useState, useEffect } from 'react';

// Inline styles to avoid import issues
const styles = `
  .safe-bottom { padding-bottom: 5rem; }
  .btn-primary { background: #0d9488; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; }
  .btn-secondary { border: 1px solid #64748b; color: white; padding: 0.5rem 1rem; border-radius: 0.5rem; }
`;

export default function SimpleEnhanced() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Inject styles
  useEffect(() => {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  useEffect(() => {
    const completed = localStorage.getItem('onboardingCompleted');
    if (!completed) {
      setShowOnboarding(true);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Onboarding Modal */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">🎯 Welcome to AlphaWhale!</h2>
            <p className="text-slate-300 mb-4">Make it yours. Track the smart money. Never miss a move.</p>
            <button 
              onClick={() => {
                localStorage.setItem('onboardingCompleted', 'true');
                setShowOnboarding(false);
              }}
              className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
            >
              Get Started
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white py-12 px-4 text-center">
        <h1 className="text-4xl font-bold mb-2">🐋 AlphaWhale Lite</h1>
        <p className="text-xl opacity-90">Enhanced whale intelligence with real-time insights</p>
      </div>

      <main className="max-w-4xl mx-auto p-6 space-y-6">
        {/* For You Row */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">🎯 For You</h2>
          <div className="flex gap-4 overflow-x-auto">
            <div className="flex-shrink-0 w-80 bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="text-white mb-2">Whale #1234</div>
              <div className="text-sm text-slate-300 mb-3">Bought 500 ETH</div>
              <div className="flex gap-2">
                <button className="px-2 py-1 text-xs bg-teal-600 text-white rounded">Set Alert</button>
                <button className="px-2 py-1 text-xs bg-blue-600 text-white rounded">Follow</button>
                <button className="px-2 py-1 text-xs bg-slate-600 text-white rounded">Share</button>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Spotlight */}
        <section className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold text-teal-400">🚨 Whale Spotlight</div>
            <span className="text-xs px-2 py-1 rounded bg-yellow-100 text-yellow-700">Simulated</span>
          </div>
          <div className="text-xl font-bold text-white mb-3">
            0xabcd...1234 bought 12,500,000 ETH
          </div>
          <div className="flex gap-2 mb-2">
            <button className="px-3 py-1 bg-teal-600 text-white rounded">Share</button>
            <button className="px-3 py-1 border border-slate-600 text-white rounded">Follow Whale</button>
            <button className="px-3 py-1 bg-teal-600 text-white rounded">Set Alert</button>
            <a href="https://etherscan.io/address/0xabcd" className="px-3 py-1 border border-slate-600 text-teal-400 rounded">Etherscan</a>
          </div>
          <div className="text-xs text-slate-500">
            Last updated: 14:32 UTC • 11m ago • 
            <button className="text-teal-400 hover:underline ml-1">Refresh</button> • 
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded ml-1">High Confidence</span>
          </div>
        </section>

        {/* Alerts Feed */}
        <section className="bg-slate-800 rounded-lg p-6 border border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">🔔 Alerts Feed</h2>
            <div className="flex gap-2">
              <div className="flex border border-slate-600 rounded">
                <button className="px-2 py-1 text-xs bg-teal-600 text-white">All</button>
                <button className="px-2 py-1 text-xs text-slate-400">Mine</button>
                <button className="px-2 py-1 text-xs text-slate-400">System</button>
              </div>
              <button className="text-xs text-slate-400">Mark all read</button>
              <button className="px-3 py-1 bg-teal-600 text-white rounded text-sm">Create Alert</button>
            </div>
          </div>
          <div className="space-y-2">
            <div className="p-3 rounded border border-teal-500/50 bg-teal-900/20">
              <div className="text-white text-sm font-medium">Large ETH Movement</div>
              <div className="text-slate-300 text-sm">Whale moved 500 ETH</div>
            </div>
          </div>
        </section>

        {/* Pro Teaser */}
        <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Unlock AlphaWhale Pro</h3>
              <div className="text-2xl font-bold mb-2">$19/mo</div>
              <ul className="text-sm space-y-1 mb-3">
                <li>• Unlimited alerts</li>
                <li>• AI Copilot</li>
                <li>• CSV/PDF exports</li>
              </ul>
              <div className="text-xs opacity-75 mb-4">Cancel anytime • No keys required • Read-only</div>
              <button className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold">
                See full analysis
              </button>
            </div>
            <div className="w-32 h-24 bg-white/20 rounded-lg flex items-center justify-center">
              <span className="text-xs">Preview</span>
            </div>
          </div>
        </section>
      </main>

      {/* Mobile Dock */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700">
        <div className="flex items-center justify-around py-2">
          <button className="flex flex-col items-center p-2 text-slate-400">
            <span>🐋</span>
            <span className="text-xs">Spotlight</span>
          </button>
          <button className="flex flex-col items-center p-2 text-slate-400">
            <span>👁️</span>
            <span className="text-xs">Watchlist</span>
          </button>
          <button className="flex flex-col items-center p-2 text-slate-400">
            <span>🔔</span>
            <span className="text-xs">Alerts</span>
          </button>
          <button className="flex flex-col items-center p-2 text-teal-400">
            <span>⭐</span>
            <span className="text-xs">Upgrade</span>
          </button>
        </div>
      </div>
    </div>
  );
}