import { useState, useEffect, useCallback } from 'react';

interface SyncStatus {
  status: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncAt: Date | null;
  error?: string;
}

export function useCloudSync() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    status: 'idle',
    lastSyncAt: null
  });

  // Get owner ID (user_id or anon_id)
  const getOwnerId = useCallback(() => {
    // Try to get user_id from existing auth first
    const userId = localStorage.getItem('supabase.auth.token')?.includes('user_id');
    if (userId) return userId;
    
    // Fallback to anonymous ID
    let anonId = localStorage.getItem('alpha/anonId');
    if (!anonId) {
      anonId = crypto.randomUUID();
      localStorage.setItem('alpha/anonId', anonId);
    }
    return anonId;
  }, []);

  const syncData = useCallback(async (data: any, type: string) => {
    setSyncStatus(prev => ({ ...prev, status: 'syncing' }));
    
    try {
      const ownerId = getOwnerId();
      
      // In a real implementation, this would sync to Supabase
      // For now, just simulate the sync
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      localStorage.setItem(`alpha/synced_${type}`, JSON.stringify({
        data,
        ownerId,
        syncedAt: new Date().toISOString()
      }));

      setSyncStatus({
        status: 'synced',
        lastSyncAt: new Date()
      });
    } catch (error) {
      setSyncStatus({
        status: 'error',
        lastSyncAt: null,
        error: error instanceof Error ? error.message : 'Sync failed'
      });
    }
  }, [getOwnerId]);

  const linkToEmail = useCallback(async (email: string) => {
    // Simulate linking anonymous data to email
    const anonId = localStorage.getItem('alpha/anonId');
    if (anonId) {
      // In real implementation, this would create a magic link
      // and migrate data from anon_id to user_id
      console.log('Linking', anonId, 'to', email);
    }
  }, []);

  const generateShareCode = useCallback(() => {
    const anonId = localStorage.getItem('alpha/anonId');
    if (anonId) {
      // Generate a short code that maps to the anon_id
      const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      localStorage.setItem(`alpha/shareCode_${shareCode}`, anonId);
      return shareCode;
    }
    return null;
  }, []);

  return {
    syncStatus,
    syncData,
    linkToEmail,
    generateShareCode,
    ownerId: getOwnerId()
  };
}