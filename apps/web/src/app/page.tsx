'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { legacyUrl } from '../lib/legacy';
import { track } from '../lib/track';

export default function HomePage() {
  const [tier, setTier] = useState<'lite'|'pro'|'enterprise'>('lite');
  const [showLiteFeatures, setShowLiteFeatures] = useState(false);
  const [showProFeatures, setShowProFeatures] = useState(false);
  const isProd = process.env.NODE_ENV === 'production';

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tierParam = params.get('tier') as 'lite'|'pro'|'enterprise';
    if (tierParam && ['lite','pro','enterprise'].includes(tierParam)) {
      setTier(tierParam);
    }
    track('landing_view', { tier });
  }, [tier]);

  const handleChoice = (choice: string) => {
    track('landing_choice', { choice, env: isProd ? 'prod' : 'dev' });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4">🐋 AlphaWhale</h1>
          <p className="text-xl text-slate-400">Whale Intelligence Platform</p>
          <div className="mt-4 text-sm text-green-400">
            ✅ Legacy remains during migration — no features will be lost
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Lite App */}
          <div className={`bg-slate-900 rounded-2xl p-8 border transition-all ${
            tier === 'lite' ? 'border-teal-500 ring-2 ring-teal-500/20' : 'border-slate-800'
          }`}>
            <div className="text-center">
              <div className="text-4xl mb-4">⚡</div>
              <h2 className="text-2xl font-bold mb-4">AlphaWhale Lite</h2>
              <p className="text-slate-400 mb-4">
                Lightweight whale intelligence for quick insights and daily tracking
              </p>
              <button 
                onClick={() => setShowLiteFeatures(!showLiteFeatures)}
                className="text-sm text-teal-400 hover:text-teal-300 mb-4"
              >
                {showLiteFeatures ? 'Hide' : 'Learn more'} ↓
              </button>
              {showLiteFeatures && (
                <ul className="text-sm text-slate-400 mb-4 text-left space-y-1">
                  <li>• 🐋 Daily whale movements</li>
                  <li>• 🧭 Fear & Whale Index</li>
                  <li>• 📩 Daily digest</li>
                  <li>• 💼 Portfolio Lite</li>
                </ul>
              )}
              <Link 
                href="/lite"
                onClick={() => handleChoice('lite')}
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Open Lite App
              </Link>
            </div>
          </div>

          {/* Pro App */}
          <div className={`bg-slate-900 rounded-2xl p-8 border transition-all ${
            tier === 'pro' ? 'border-green-500 ring-2 ring-green-500/20' : 'border-slate-800'
          }`}>
            <div className="text-center">
              <div className="text-4xl mb-4">🚀</div>
              <h2 className="text-2xl font-bold mb-4">AlphaWhale Pro</h2>
              <p className="text-slate-400 mb-4">
                Advanced whale intelligence with leaderboards, custom alerts, and portfolio sync
              </p>
              <button 
                onClick={() => setShowProFeatures(!showProFeatures)}
                className="text-sm text-green-400 hover:text-green-300 mb-4"
              >
                {showProFeatures ? 'Hide' : 'Learn more'} ↓
              </button>
              {showProFeatures && (
                <ul className="text-sm text-slate-400 mb-4 text-left space-y-1">
                  <li>• 🏆 Smart Money Leaderboard</li>
                  <li>• 📅 Unlock Calendar</li>
                  <li>• 🔔 Custom Alerts</li>
                  <li>• 🤖 Whale Coach</li>
                </ul>
              )}
              <Link 
                href="/pro"
                onClick={() => handleChoice('pro')}
                className="inline-block bg-teal-600 hover:bg-teal-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Open Pro App
              </Link>
            </div>
          </div>

          {/* Legacy App */}
          <div className="bg-slate-900 rounded-2xl p-8 border border-slate-800">
            <div className="text-center">
              <div className="text-4xl mb-4">🔧</div>
              <h2 className="text-2xl font-bold mb-4">Legacy App</h2>
              <p className="text-slate-400 mb-6">
                Full-featured whale intelligence platform with all advanced features
              </p>
              <a 
                href={legacyUrl()}
                target={isProd ? '_self' : '_blank'}
                rel="noopener"
                onClick={() => handleChoice('legacy')}
                className="inline-block bg-gray-600 hover:bg-gray-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
              >
                Open Legacy App
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-500 text-sm">
            Choose your preferred interface above
          </p>
        </div>
      </div>
    </div>
  )
}