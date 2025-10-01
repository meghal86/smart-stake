'use client';

import { useState } from 'react';

export default function ReferralsPage() {
  const [inviteCode] = useState('WHALE' + Math.random().toString(36).substr(2, 6).toUpperCase());
  const [invitesSent, setInvitesSent] = useState(0);
  const [email, setEmail] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    // Simulate sending invite
    await new Promise(resolve => setTimeout(resolve, 1000));
    setInvitesSent(prev => prev + 1);
    setEmail('');
    alert(`Invite sent to ${email}!`);
  };

  const copyInviteLink = async () => {
    const link = `${window.location.origin}?ref=${inviteCode}`;
    await navigator.clipboard.writeText(link);
    alert('Invite link copied to clipboard!');
  };

  const progress = Math.min((invitesSent / 3) * 100, 100);
  const daysRemaining = invitesSent >= 3 ? 7 : 0;

  return (
    <main className="p-4 max-w-2xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">🎁 Invite Friends</h1>
        <p className="text-slate-400">
          Invite 3 friends to unlock 7 days of Pro features
        </p>
      </div>

      {/* Progress Card */}
      <div className="rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Your Progress</h2>
            <p className="text-white/80">{invitesSent}/3 friends invited</p>
          </div>
          {daysRemaining > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold">{daysRemaining}</div>
              <div className="text-sm text-white/80">days Pro</div>
            </div>
          )}
        </div>
        
        <div className="w-full bg-white/20 rounded-full h-3 mb-4">
          <div 
            className="bg-white h-3 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        {daysRemaining > 0 ? (
          <div className="text-center">
            <div className="text-lg font-semibold">🎉 Congratulations!</div>
            <div className="text-white/90">You've unlocked 7 days of Pro features</div>
          </div>
        ) : (
          <div className="text-center text-white/90">
            Invite {3 - invitesSent} more friend{3 - invitesSent !== 1 ? 's' : ''} to unlock Pro
          </div>
        )}
      </div>

      {/* Invite Form */}
      <div className="rounded-lg border p-6 bg-white">
        <h3 className="text-lg font-semibold mb-4">Send Invite</h3>
        <form onSubmit={handleInvite} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Friend's Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Send Invite
          </button>
        </form>
      </div>

      {/* Share Link */}
      <div className="rounded-lg border p-6 bg-white">
        <h3 className="text-lg font-semibold mb-4">Share Your Link</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/signup?ref=${inviteCode}`}
            readOnly
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
          />
          <button
            onClick={copyInviteLink}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Copy
          </button>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Your invite code: <span className="font-mono font-semibold">{inviteCode}</span>
        </p>
      </div>

      {/* Social Share */}
      <div className="rounded-lg border p-6 bg-white">
        <h3 className="text-lg font-semibold mb-4">Share on Social</h3>
        <div className="flex gap-3">
          <button 
            onClick={() => window.open(`https://twitter.com/intent/tweet?text=Join me on AlphaWhale for whale intelligence! Use my code ${inviteCode}&url=${window.location.origin}/signup?ref=${inviteCode}`)}
            className="flex-1 bg-blue-400 text-white py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors"
          >
            Twitter
          </button>
          <button 
            onClick={() => window.open(`https://discord.com/channels/@me`)}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Discord
          </button>
        </div>
      </div>
    </main>
  );
}