'use client';

import { useCloudSync } from '../hooks/useCloudSync';

export function SyncChip() {
  const { syncStatus } = useCloudSync();

  const getStatusText = () => {
    switch (syncStatus.status) {
      case 'syncing':
        return 'Syncing...';
      case 'synced':
        return `Synced • ${syncStatus.lastSyncAt ? formatTimeAgo(syncStatus.lastSyncAt) : 'now'}`;
      case 'error':
        return 'Sync failed';
      default:
        return 'Link to email';
    }
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    
    if (minutes < 1) return 'now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <button className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-600">
      {getStatusText()}
    </button>
  );
}