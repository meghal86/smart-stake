import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { testDatabaseConnection } from '@/utils/databaseTest';
import { syncSubscriptionStatus } from '@/utils/syncSubscription';

export const SubscriptionStatus = () => {
  const { user } = useAuth();
  const [userData, setUserData] = useState<any>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [metadataData, setMetadataData] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Test database connection first
      const dbTest = await testDatabaseConnection();
      setDbStatus(dbTest);

      // Fetch user data
      const { data: userResult } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setUserData(userResult);

      // Fetch subscription data
      const { data: subResult } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setSubscriptionData(subResult);

      // Fetch metadata
      const { data: metaResult } = await supabase
        .from('users_metadata')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setMetadataData(metaResult);
    } catch (error) {
      console.error('Error fetching data:', error);
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
        alert('Subscription synced successfully!');
        await fetchData(); // Refresh data
      } else {
        alert(`Sync failed: ${result.error}`);
      }
    } catch (error) {
      alert(`Sync error: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  if (!user) return null;

  return (
    <Card className="p-4 m-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Subscription Debug</h3>
        <div className="flex gap-2">
          <Button onClick={fetchData} disabled={loading} size="sm">
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
          <Button onClick={handleSync} disabled={syncing} size="sm" variant="outline">
            {syncing ? 'Syncing...' : 'Sync Pro Plan'}
          </Button>
        </div>
      </div>
      
      <div className="space-y-4 text-sm">
        <div>
          <h4 className="font-medium mb-2">Database Status:</h4>
          <pre className="bg-muted p-2 rounded text-xs overflow-auto">
            {JSON.stringify(dbStatus, null, 2)}
          </pre>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">User Data:</h4>
          <pre className="bg-muted p-2 rounded text-xs overflow-auto">
            {JSON.stringify(userData, null, 2)}
          </pre>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Subscription Data:</h4>
          <pre className="bg-muted p-2 rounded text-xs overflow-auto">
            {JSON.stringify(subscriptionData, null, 2)}
          </pre>
        </div>
        
        <div>
          <h4 className="font-medium mb-2">Metadata:</h4>
          <pre className="bg-muted p-2 rounded text-xs overflow-auto">
            {JSON.stringify(metadataData, null, 2)}
          </pre>
        </div>
      </div>
    </Card>
  );
};