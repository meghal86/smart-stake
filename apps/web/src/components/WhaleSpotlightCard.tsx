'use client';

interface Spotlight {
  id: string;
  whaleId: string;
  asset: string;
  amount: number;
  narrative: string;
  risk: 'low' | 'med' | 'high';
}

interface WhaleSpotlightCardProps {
  data: Spotlight;
  tier: string;
}

export function WhaleSpotlightCard({ data, tier }: WhaleSpotlightCardProps) {
  return (
    <section className="rounded-lg border p-4 bg-white shadow">
      <div className="text-sm font-semibold text-teal-600">🚨 Whale Spotlight</div>
      <div className="text-lg font-bold mt-1">
        {data.whaleId} bought {data.amount.toLocaleString()} {data.asset}
      </div>
      <p className="mt-2 text-sm text-gray-600">{data.narrative}</p>
      <div className="mt-3 flex gap-2">
        <button className="px-3 py-1 rounded bg-teal-600 text-white">Share</button>
        <button className="px-3 py-1 rounded border">Follow Whale</button>
        {tier === 'lite' && <a href="/upgrade" className="px-3 py-1 rounded border ml-auto">Unlock Pro</a>}
      </div>
    </section>
  );
}
