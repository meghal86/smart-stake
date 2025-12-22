import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { DisabledTooltipButton } from '@/components/ui/disabled-tooltip-button';
import { Card } from '@/components/ui/card';
import { syncSubscriptionStatus } from '@/utils/syncSubscription';

export const UserPlanDebug = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchUserData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error fetching user data:', error);
        setUserData({ error: error.message });
      } else {
        setUserData(data);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setUserData({ error: 'Failed to fetch' });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!user) return;
    
    setSyncing(true);
    try {
      const result = await syncSubscriptionStatus(user.id);
      if (result.success) {
        alert('Sync successful!');
        await fetchUserData(); // Refresh data after sync
      } else {
        alert(`Sync failed: ${result.error}`);
      }
    } catch (err) {
      console.error('Sync error:', err);
      alert('Sync failed with error');
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  if (!user) return null;

  return (
    <Card className="p-4 mb-4 bg-yellow-50 border-yellow-200">
      <h3 className="font-semibold mb-2">User Plan Debug</h3>
      <div className="flex gap-2 mb-2">
        <DisabledTooltipButton 
          onClick={fetchUserData} 
          disabled={loading} 
          size="sm"
          disabledTooltip={loading ? "Loading user data..." : undefined}
        >
          {loading ? 'Loading...' : 'Refresh User Data'}
        </DisabledTooltipButton>
        <DisabledTooltipButton 
          onClick={handleSync} 
          disabled={syncing} 
          size="sm" 
          variant="outline"
          disabledTooltip={syncing ? "Syncing to premium..." : undefined}
        >
          {syncing ? 'Syncing...' : 'Sync to Premium'}
        </DisabledTooltipButton>
      </div>
      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
        {JSON.stringify(userData, null, 2)}
      </pre>
    </Card>
  );
};