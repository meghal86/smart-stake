import { headers } from 'next/headers';
import Link from 'next/link';

export default function ProPage() {
  const tier = headers().get('x-user-tier') ?? 'lite';
  
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🚀</div>
          <h1 className="text-4xl font-bold mb-4">AlphaWhale Pro</h1>
          <p className="text-xl text-slate-400">Advanced whale intelligence platform</p>
          <div className="mt-4 text-sm text-green-400">Current tier: {tier}</div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h3 className="text-xl font-bold mb-4">🏆 Smart Money Leaderboard</h3>
            <p className="text-slate-400">Track top-performing whale wallets</p>
          </div>
          
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h3 className="text-xl font-bold mb-4">📅 Unlock Calendar</h3>
            <p className="text-slate-400">Advanced token unlock tracking</p>
          </div>
          
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h3 className="text-xl font-bold mb-4">🔔 Custom Alerts</h3>
            <p className="text-slate-400">User-defined notifications</p>
          </div>
          
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800">
            <h3 className="text-xl font-bold mb-4">🤖 Whale Coach</h3>
            <p className="text-slate-400">AI-powered insights</p>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <Link href="/" className="text-slate-400 hover:text-white">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}