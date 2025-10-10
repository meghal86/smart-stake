import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const ManualSync = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const runDiagnostics = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fix-subscription', {
        body: { action: 'diagnose' }
      });

      if (error) throw error;

      console.log('Full diagnostics:', data);
      toast({
        title: "Diagnostics Complete",
        description: `User exists: ${data.checks.public_user.exists}, Plan: ${data.checks.public_user.data?.plan || 'unknown'}`,
      });

    } catch (error) {
      console.error('Diagnostics error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to run diagnostics.",
      });
    } finally {
      setLoading(false);
    }
  };

  const manuallySetPro = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fix-subscription', {
        body: { action: 'fix' }
      });

      if (error) throw error;

      console.log('Fix results:', data);
      
      const successful = data.fixes_applied.some((fix: any) => fix.success);
      
      if (successful) {
        toast({
          title: "Success!",
          description: "Your plan has been updated to Pro. Refreshing page...",
        });

        // Force page reload to ensure all components refresh
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast({
          variant: "destructive",
          title: "Fix Failed",
          description: "Could not update plan. Check console for details.",
        });
      }

    } catch (error) {
      console.error('Manual sync error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update plan manually.",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentPlan = async () => {
    if (!user) return;
    
    try {
      // Force fresh data by adding timestamp to bypass any caching
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      toast({
        title: "Current Plan Data",
        description: `Plan: ${data.plan}, Updated: ${data.updated_at}`,
      });

      console.log('Full user data from database:', data);
      console.log('User ID being queried:', user.id);
      console.log('Timestamp:', new Date().toISOString());
      
      // Also trigger a refresh
      localStorage.setItem('user_plan_updated', Date.now().toString());
      window.dispatchEvent(new StorageEvent('storage', {
        key: 'user_plan_updated',
        newValue: Date.now().toString()
      }));
      
    } catch (error) {
      console.error('Check plan error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to check current plan.",
      });
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Manual Subscription Sync</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          If you've paid for Pro but it's not showing up, use these debug tools:
        </p>
        
        <Button 
          onClick={checkCurrentPlan}
          variant="outline" 
          className="w-full"
        >
          Check Current Plan
        </Button>

        <Button 
          onClick={runDiagnostics}
          variant="outline" 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Running...' : 'Run Full Diagnostics'}
        </Button>

        <Button 
          onClick={async () => {
            if (!user) return;
            setLoading(true);
            try {
              const { data, error } = await supabase.functions.invoke('test-user-plan');
              if (error) throw error;
              console.log('Test results:', data);
              toast({
                title: "Test Complete",
                description: `Admin sees: ${data.tests.admin_query.data?.[0]?.plan || 'none'}, App sees: ${data.tests.anon_query.data?.[0]?.plan || 'none'}`,
              });
            } catch (error) {
              console.error('Test error:', error);
              toast({ variant: "destructive", title: "Test Failed", description: error instanceof Error ? error.message : String(error) });
            } finally {
              setLoading(false);
            }
          }}
          variant="outline" 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Testing...' : 'Test Database Access'}
        </Button>
        
        <Button 
          onClick={manuallySetPro}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Fixing...' : 'Fix & Set to Pro'}
        </Button>
        
        <p className="text-xs text-muted-foreground">
          This is a temporary fix while we debug the webhook issue.
        </p>
      </CardContent>
    </Card>
  );
};