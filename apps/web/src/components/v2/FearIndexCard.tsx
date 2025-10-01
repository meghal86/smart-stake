'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface FearIndexData {
  score: number;
  label: string;
  provenance: 'Real' | 'Simulated';
  lastUpdated: Date;
}

export function FearIndexCard() {
  const [data, setData] = useState<FearIndexData | null>(null);

  useEffect(() => {
    // Simulate data loading - reuse existing adapter
    setData({
      score: 62,
      label: 'Accumulation bias',
      provenance: 'Simulated',
      lastUpdated: new Date(Date.now() - 1000 * 60 * 11)
    });
  }, []);

  if (!data) return null;

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    return minutes < 60 ? `${minutes}m ago` : `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <div className="card-padding bg-slate-800 rounded-2xl border border-slate-700 section-gap">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-white">🧭 Fear & Whale Index</h3>
        <div className="flex items-center gap-2">
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
      </div>

      <div className="flex items-center gap-4 mb-3">
        <div className="flex-1 relative">
          <div className="h-4 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 rounded">
            <div 
              className="absolute top-0 w-3 h-4 bg-white border-2 border-slate-800 rounded flex items-center justify-center"
              style={{ left: `calc(${data.score}% - 6px)` }}
            >
              <span className="text-xs font-bold text-slate-800">{data.score}</span>
            </div>
          </div>
        </div>
        <div className="text-sm text-slate-300">{data.label}</div>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>Last updated: {formatTimeAgo(data.lastUpdated)}</span>
        <Link 
          href="/docs/methodology#fear-index"
          className="text-teal-400 hover:text-teal-300 hover:underline"
        >
          Methodology
        </Link>
      </div>
    </div>
  );
}