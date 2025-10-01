import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AlphaWhale Status',
  robots: 'noindex, nofollow'
};

async function getHealthStatus() {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/healthz`, {
      cache: 'no-store'
    });
    return await response.json();
  } catch (error) {
    return { mode: 'unknown', providers: {}, error: 'Failed to fetch status' };
  }
}

export default async function StatusPage() {
  const health = await getHealthStatus();
  
  const statusColors = {
    live: 'text-green-500',
    cached: 'text-yellow-500', 
    simulated: 'text-orange-500',
    unknown: 'text-red-500'
  } as const;
  
  const statusColor = statusColors[health.mode as keyof typeof statusColors] || 'text-red-500';

  const providerStatus = (status: string) => ({
    ok: '🟢',
    degraded: '🟡', 
    down: '🔴'
  }[status] || '❓');

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">AlphaWhale Status</h1>
        
        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">System Status</h2>
            <span className={`text-lg font-bold ${statusColor}`}>
              {health.mode?.toUpperCase() || 'UNKNOWN'}
            </span>
          </div>
          
          {health.lastUpdateISO && (
            <p className="text-slate-400 text-sm">
              Last updated: {new Date(health.lastUpdateISO).toLocaleString()}
            </p>
          )}
        </div>

        <div className="bg-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Data Providers</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span>Etherscan API</span>
              <span className="flex items-center gap-2">
                {providerStatus(health.providers?.etherscan)}
                <span className="text-sm text-slate-400">
                  {health.providers?.etherscan || 'unknown'}
                </span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>CoinGecko API</span>
              <span className="flex items-center gap-2">
                {providerStatus(health.providers?.coingecko)}
                <span className="text-sm text-slate-400">
                  {health.providers?.coingecko || 'unknown'}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">System Information</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Version:</span>
              <span className="text-slate-400">{health.version || 'unknown'}</span>
            </div>
            <div className="flex justify-between">
              <span>Environment:</span>
              <span className="text-slate-400">{process.env.NODE_ENV || 'development'}</span>
            </div>
          </div>
        </div>

        {health.error && (
          <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mt-6">
            <p className="text-red-400">Error: {health.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}