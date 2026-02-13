/**
 * NotificationPreferences Component
 * 
 * UI for managing portfolio notification preferences
 * 
 * Requirements: 11.2, 11.5
 */

'use client';

import { useState } from 'react';
import { useNotificationPreferences } from '@/hooks/usePortfolioNotifications';
import type { NotificationSeverity } from '@/lib/portfolio/notification-service';

export function NotificationPreferences() {
  const { preferences, isLoading, updatePreferences, isUpdating } = useNotificationPreferences();
  const [localPrefs, setLocalPrefs] = useState(preferences);

  // Update local state when preferences load
  if (preferences && !localPrefs) {
    setLocalPrefs(preferences);
  }

  const handleSave = () => {
    if (localPrefs) {
      updatePreferences(localPrefs);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/3"></div>
          <div className="h-4 bg-white/10 rounded w-2/3"></div>
          <div className="h-4 bg-white/10 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!localPrefs) {
    return null;
  }

  return (
    <div className="p-6 bg-white/5 backdrop-blur-md border border-white/10 rounded-lg space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">
          Notification Preferences
        </h3>
        <p className="text-sm text-white/60">
          Control when and how you receive portfolio alerts
        </p>
      </div>

      {/* Do Not Disturb */}
      <div className="space-y-3">
        <label className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={localPrefs.dnd}
            onChange={(e) =>
              setLocalPrefs({ ...localPrefs, dnd: e.target.checked })
            }
            className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500"
          />
          <span className="text-sm text-white">Enable Do Not Disturb</span>
        </label>

        {localPrefs.dnd && (
          <div className="ml-7 space-y-2">
            <div className="flex items-center space-x-4">
              <label className="text-sm text-white/60">From:</label>
              <input
                type="number"
                min="0"
                max="23"
                value={localPrefs.dndStartHour ?? 22}
                onChange={(e) =>
                  setLocalPrefs({
                    ...localPrefs,
                    dndStartHour: parseInt(e.target.value, 10),
                  })
                }
                className="w-20 px-3 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-sm text-white/60">:00</span>
            </div>
            <div className="flex items-center space-x-4">
              <label className="text-sm text-white/60">To:</label>
              <input
                type="number"
                min="0"
                max="23"
                value={localPrefs.dndEndHour ?? 8}
                onChange={(e) =>
                  setLocalPrefs({
                    ...localPrefs,
                    dndEndHour: parseInt(e.target.value, 10),
                  })
                }
                className="w-20 px-3 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              <span className="text-sm text-white/60">:00</span>
            </div>
            <p className="text-xs text-white/40">
              Critical notifications will still be sent during DND hours
            </p>
          </div>
        )}
      </div>

      {/* Severity Threshold */}
      <div className="space-y-2">
        <label className="text-sm text-white">Minimum Severity</label>
        <select
          value={localPrefs.severityThreshold}
          onChange={(e) =>
            setLocalPrefs({
              ...localPrefs,
              severityThreshold: e.target.value as NotificationSeverity,
            })
          }
          className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
        >
          <option value="low">Low and above</option>
          <option value="medium">Medium and above</option>
          <option value="high">High and above</option>
          <option value="critical">Critical only</option>
        </select>
        <p className="text-xs text-white/40">
          Only show notifications at or above this severity level
        </p>
      </div>

      {/* Daily Caps */}
      <div className="space-y-3">
        <label className="text-sm text-white">Daily Notification Limits</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-white/60">Critical</label>
            <input
              type="number"
              min="1"
              max="20"
              value={localPrefs.dailyCaps.critical}
              onChange={(e) =>
                setLocalPrefs({
                  ...localPrefs,
                  dailyCaps: {
                    ...localPrefs.dailyCaps,
                    critical: parseInt(e.target.value, 10),
                  },
                })
              }
              className="w-full px-3 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-white/60">High</label>
            <input
              type="number"
              min="1"
              max="10"
              value={localPrefs.dailyCaps.high}
              onChange={(e) =>
                setLocalPrefs({
                  ...localPrefs,
                  dailyCaps: {
                    ...localPrefs.dailyCaps,
                    high: parseInt(e.target.value, 10),
                  },
                })
              }
              className="w-full px-3 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-white/60">Medium</label>
            <input
              type="number"
              min="1"
              max="5"
              value={localPrefs.dailyCaps.medium}
              onChange={(e) =>
                setLocalPrefs({
                  ...localPrefs,
                  dailyCaps: {
                    ...localPrefs.dailyCaps,
                    medium: parseInt(e.target.value, 10),
                  },
                })
              }
              className="w-full px-3 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
          <div>
            <label className="text-xs text-white/60">Low</label>
            <input
              type="number"
              min="1"
              max="3"
              value={localPrefs.dailyCaps.low}
              onChange={(e) =>
                setLocalPrefs({
                  ...localPrefs,
                  dailyCaps: {
                    ...localPrefs.dailyCaps,
                    low: parseInt(e.target.value, 10),
                  },
                })
              }
              className="w-full px-3 py-1 bg-white/5 border border-white/10 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
          </div>
        </div>
        <p className="text-xs text-white/40">
          Maximum notifications per severity level per day
        </p>
      </div>

      {/* Channels */}
      <div className="space-y-2">
        <label className="text-sm text-white">Notification Channels</label>
        <div className="space-y-2">
          {['web_push', 'email', 'sms'].map((channel) => (
            <label key={channel} className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={localPrefs.channels.includes(channel)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setLocalPrefs({
                      ...localPrefs,
                      channels: [...localPrefs.channels, channel],
                    });
                  } else {
                    setLocalPrefs({
                      ...localPrefs,
                      channels: localPrefs.channels.filter((c) => c !== channel),
                    });
                  }
                }}
                className="w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-500"
              />
              <span className="text-sm text-white capitalize">
                {channel.replace('_', ' ')}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="pt-4 border-t border-white/10">
        <button
          onClick={handleSave}
          disabled={isUpdating}
          className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-500/50 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          {isUpdating ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
