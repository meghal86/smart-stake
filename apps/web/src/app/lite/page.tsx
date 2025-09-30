import { headers } from 'next/headers';
import PortfolioLite from '../../components/portfolio/PortfolioLite';

export const revalidate = 300;

const mockSpotlight = {
  id: 'sp1',
  whaleId: '0xabcd...1234',
  asset: 'ETH',
  amount: 12500000,
  narrative: 'Large ETH movement detected. Upgrade for full analysis.',
  risk: 'med' as const
};

const mockDial = { score: 62, label: 'Accumulation bias' };

const mockDigest = [
  { id: 'd1', text: 'Whales bought $200M BTC', direction: 'buy' as const },
  { id: 'd2', text: 'ETH CEX inflows up 15%', direction: 'sell' as const },
  { id: 'd3', text: 'USDT mints spiked to $500M', direction: 'buy' as const }
];

export default function Lite() {
  const tier = 'lite';
  
  return (
    <main className="p-4 space-y-6">
      <section className="rounded-lg border p-4 bg-white shadow">
        <div className="text-sm font-semibold text-teal-600">🚨 Whale Spotlight</div>
        <div className="text-lg font-bold mt-1">
          {mockSpotlight.whaleId} bought {mockSpotlight.amount.toLocaleString()} {mockSpotlight.asset}
        </div>
        <p className="mt-2 text-sm text-gray-600">{mockSpotlight.narrative}</p>
        <div className="mt-3 flex gap-2">
          <button className="px-3 py-1 rounded bg-teal-600 text-white">Share</button>
          <button className="px-3 py-1 rounded border">Follow Whale</button>
          <a href="/upgrade" className="px-3 py-1 rounded border ml-auto">Unlock Pro</a>
        </div>
      </section>
      
      <section className="rounded-lg border p-4">
        <div className="text-sm font-semibold">🧭 Fear & Whale Index</div>
        <div className="mt-2 flex items-center gap-4">
          <div className="h-4 flex-1 bg-gradient-to-r from-red-500 via-yellow-400 to-green-500 rounded" />
          <div className="text-sm font-medium">{mockDial.score} – {mockDial.label}</div>
        </div>
      </section>
      
      <section className="rounded-lg border p-4">
        <div className="text-sm font-semibold">📩 Daily Whale Digest</div>
        <ul className="mt-2 space-y-2">
          {mockDigest.map(i => (
            <li key={i.id} className="text-sm">
              {i.text} {i.direction === 'buy' ? '🟢' : '🔴'}
            </li>
          ))}
        </ul>
      </section>
      
      <PortfolioLite />
    </main>
  );
}