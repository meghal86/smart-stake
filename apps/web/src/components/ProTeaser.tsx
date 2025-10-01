'use client';

import { useTelemetry } from '../hooks/useTelemetry';

export function ProTeaser() {
  const { track } = useTelemetry();
  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">Unlock AlphaWhale Pro</h3>
          <div className="mb-4">
            <div className="text-2xl font-bold mb-2">$19/mo</div>
            <ul className="text-sm space-y-1 mb-3">
              <li>• Unlimited alerts</li>
              <li>• AI Copilot</li>
              <li>• CSV/PDF exports</li>
            </ul>
            <div className="text-xs text-white/70 space-y-1">
              <div>Cancel anytime</div>
              <div>No keys required • Read-only</div>
            </div>
          </div>
          <button 
            onClick={() => {
              track({ event: 'upgrade_click', properties: { source: 'pro_teaser', cta: '7_day_trial' } });
              window.location.href = '/upgrade';
            }}
            className="bg-white text-blue-600 px-6 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
See full analysis
          </button>
        </div>
        
        <div className="ml-6 relative">
          <div className="w-32 h-24 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <div className="text-center">
              <div className="text-2xl mb-1">📊</div>
              <div className="text-xs opacity-75">Preview</div>
            </div>
          </div>
          <div className="absolute inset-0 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center">
            <span className="text-xs font-medium">Unlock to view</span>
          </div>
        </div>
      </div>
    </div>
  );
}