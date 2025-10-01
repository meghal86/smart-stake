'use client';

import { useState, useEffect } from 'react';
import { useGate } from '../hooks/useGate';
import { useTelemetry } from '../hooks/useTelemetry';

interface Alert {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  type: 'whale' | 'price' | 'volume';
  address?: string;
  read: boolean;
}

export function AlertsFeed() {
  const { hasFlag } = useGate();
  const { track } = useTelemetry();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mine' | 'system'>('all');

  useEffect(() => {
    // Load from localStorage
    const saved = localStorage.getItem('alpha/alerts');
    if (saved) {
      const parsed = JSON.parse(saved).map((a: any) => ({
        ...a,
        timestamp: new Date(a.timestamp)
      }));
      setAlerts(parsed);
    } else {
      // Mock alerts
      const mockAlerts: Alert[] = [
        {
          id: '1',
          title: 'Large ETH Movement',
          message: 'Whale 0xabcd...1234 moved 500 ETH',
          timestamp: new Date(Date.now() - 1000 * 60 * 30),
          type: 'whale',
          address: '0xabcd...1234',
          read: false
        },
        {
          id: '2',
          title: 'Price Alert',
          message: 'BTC crossed $45,000',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
          type: 'price',
          read: true
        }
      ];
      setAlerts(mockAlerts);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('alpha/alerts', JSON.stringify(alerts));
  }, [alerts]);

  if (!hasFlag('alerts.feed')) return null;

  const groupedAlerts = alerts.reduce((groups, alert) => {
    const now = new Date();
    const diff = now.getTime() - alert.timestamp.getTime();
    const hours = diff / (1000 * 60 * 60);
    
    let group = 'Older';
    if (hours < 1) group = 'Last hour';
    else if (hours < 24) group = 'Today';
    else if (hours < 48) group = 'Yesterday';
    
    if (!groups[group]) groups[group] = [];
    groups[group].push(alert);
    return groups;
  }, {} as Record<string, Alert[]>);

  const markAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  return (
    <div className="bg-slate-800 rounded-lg p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">🔔 Alerts Feed</h2>
        <div className="flex items-center gap-2">
          <div className="flex border border-slate-600 rounded">
            {(['all', 'mine', 'system'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 text-xs capitalize ${
                  filter === f ? 'bg-teal-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            onClick={() => setAlerts(prev => prev.map(a => ({ ...a, read: true })))}
            className="text-xs text-slate-400 hover:text-white"
          >
            Mark all read
          </button>
          <button 
            onClick={() => {
              track({ event: 'create_alert_open', properties: { source: 'alerts_feed' } });
              setShowCreateModal(true);
            }}
            className="px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-700"
          >
            Create Alert
          </button>
        </div>
      </div>
      
      {Object.entries(groupedAlerts).map(([group, groupAlerts]) => (
        <div key={group} className="mb-4">
          <h3 className="text-sm font-medium text-slate-400 mb-2">{group}</h3>
          <div className="space-y-2">
            {groupAlerts.map(alert => (
              <div 
                key={alert.id}
                className={`p-3 rounded border cursor-pointer hover:bg-slate-700/50 ${
                  alert.read ? 'border-slate-600 bg-slate-700/20' : 'border-teal-500/50 bg-teal-900/20'
                }`}
                onClick={() => markAsRead(alert.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-white text-sm font-medium">{alert.title}</h4>
                    <p className="text-slate-300 text-sm">{alert.message}</p>
                    {alert.address && (
                      <a 
                        href={`https://etherscan.io/address/${alert.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-400 text-xs hover:underline"
                      >
                        View on Etherscan →
                      </a>
                    )}
                  </div>
                  <span className="text-xs text-slate-500">
                    {alert.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">Create Alert</h3>
            <div className="space-y-4">
              <input 
                placeholder="Alert title"
                className="w-full p-2 bg-slate-700 text-white rounded border border-slate-600"
              />
              <textarea 
                placeholder="Alert conditions"
                className="w-full p-2 bg-slate-700 text-white rounded border border-slate-600 h-20"
              />
              <div className="flex gap-2">
                <button 
                  onClick={() => {
                    track({ event: 'alert_created', properties: { source: 'alerts_feed' } });
                    setShowCreateModal(false);
                  }}
                  className="px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
                >
                  Create
                </button>
                <button 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-600 text-white rounded hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}