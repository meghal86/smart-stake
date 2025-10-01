import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AlphaWhale Ops Dashboard',
  robots: 'noindex, nofollow'
};

// Mock data - replace with real telemetry
const mockMetrics = {
  errorRate5xx: [2, 1, 0, 3, 1, 0, 0, 2, 1, 0, 1, 0], // Last 12 hours
  frontendErrors: [5, 3, 2, 8, 4, 1, 2, 6, 3, 1, 2, 1], // Last 12 hours
  last24h: {
    totalRequests: 45230,
    errors5xx: 12,
    frontendErrors: 38,
    uptime: 99.97
  }
};

function Sparkline({ data, color = 'text-blue-400' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - (value / max) * 100;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="w-24 h-8" viewBox="0 0 100 100" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        points={points}
        className={color}
      />
    </svg>
  );
}

export default function OpsPage() {
  const errorRate = ((mockMetrics.last24h.errors5xx / mockMetrics.last24h.totalRequests) * 100).toFixed(3);
  const frontendErrorRate = ((mockMetrics.last24h.frontendErrors / mockMetrics.last24h.totalRequests) * 100).toFixed(3);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Operations Dashboard</h1>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-2">24h Requests</h3>
            <div className="text-2xl font-bold">{mockMetrics.last24h.totalRequests.toLocaleString()}</div>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-2">5xx Error Rate</h3>
            <div className="text-2xl font-bold text-red-400">{errorRate}%</div>
            <div className="text-sm text-slate-500">{mockMetrics.last24h.errors5xx} errors</div>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Frontend Errors</h3>
            <div className="text-2xl font-bold text-orange-400">{frontendErrorRate}%</div>
            <div className="text-sm text-slate-500">{mockMetrics.last24h.frontendErrors} errors</div>
          </div>
          
          <div className="bg-slate-800 rounded-lg p-6">
            <h3 className="text-sm font-medium text-slate-400 mb-2">Uptime</h3>
            <div className="text-2xl font-bold text-green-400">{mockMetrics.last24h.uptime}%</div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">5xx Errors (12h)</h3>
              <Sparkline data={mockMetrics.errorRate5xx} color="text-red-400" />
            </div>
            <div className="space-y-2">
              {mockMetrics.errorRate5xx.slice(-6).map((value, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-slate-400">{6-index}h ago</span>
                  <span className={value > 0 ? 'text-red-400' : 'text-green-400'}>
                    {value} errors
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Frontend Errors (12h)</h3>
              <Sparkline data={mockMetrics.frontendErrors} color="text-orange-400" />
            </div>
            <div className="space-y-2">
              {mockMetrics.frontendErrors.slice(-6).map((value, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span className="text-slate-400">{6-index}h ago</span>
                  <span className={value > 5 ? 'text-orange-400' : 'text-green-400'}>
                    {value} errors
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-8 bg-slate-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Error Budget Status</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>5xx Error Budget (99.9% SLA)</span>
                <span>{(100 - parseFloat(errorRate)).toFixed(3)}% remaining</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-green-400 h-2 rounded-full" 
                  style={{ width: `${Math.max(0, 100 - parseFloat(errorRate) * 1000)}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Frontend Error Budget (99.5% SLA)</span>
                <span>{(100 - parseFloat(frontendErrorRate)).toFixed(3)}% remaining</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-green-400 h-2 rounded-full" 
                  style={{ width: `${Math.max(0, 100 - parseFloat(frontendErrorRate) * 200)}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-xs text-slate-500 text-center">
          Last updated: {new Date().toLocaleString()} • Auto-refresh every 5 minutes
        </div>
      </div>
    </div>
  );
}