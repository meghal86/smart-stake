'use client';
import type { Spotlight } from '../../../sdk/src/lite';
// Note: track function should be imported from the consuming app
import { track } from '@/src/lib/track';

export function WhaleSpotlightCard({ data, tier, onShare, onUpgrade }: { 
  data: Spotlight; 
  tier: string;
  onShare?: () => void;
  onUpgrade?: () => void;
}) {
  const handleShare = () => {
    onShare?.();
    // TODO: implement actual sharing with OG image
    navigator.share?.({ 
      title: `Whale Alert: ${data.amount.toLocaleString()} ${data.asset}`,
      url: `/api/share/spotlight/${data.id}`
    });
  };

  const handleUpgrade = () => {
    onUpgrade?.();
  };

  return (
    <section className="rounded-lg border p-4 bg-white shadow">
      <div className="text-sm font-semibold text-teal-600">🚨 Whale Spotlight</div>
      <div className="text-lg font-bold mt-1">
        {data.whaleId} bought {data.amount.toLocaleString()} {data.asset}
      </div>
      <p className="mt-2 text-sm text-gray-600">{data.narrative}</p>
      <div className="mt-3 flex gap-2">
        <button onClick={handleShare} className="px-3 py-1 rounded bg-teal-600 text-white">Share</button>
        <button className="px-3 py-1 rounded border">Follow Whale</button>
        {tier === 'lite' && <a href="/upgrade" onClick={handleUpgrade} className="px-3 py-1 rounded border ml-auto">Unlock Pro</a>}
      </div>
    </section>
  );
}
