import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, CreditCard, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { checkUserAccess } from '@/utils/databaseHealthCheck';
import { supabase } from '@/integrations/supabase/client';

export const SubscriptionDebug: React.FC = () => {
  const { user } = useAuth();
  const [userAccess, setUserAccess] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [subscriptionTest, setSubscriptionTest] = useState<any>(null);

  const runUserAccessCheck = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const accessResult = await checkUserAccess(user.id);
      setUserAccess(accessResult);

      // Test subscription query specifically
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select('status, current_period_end')
          .eq('user_id', user.id);
        
        setSubscriptionTest({
          success: !error,
          data,
          error: error?.message,
          query: `subscriptions?select=status,current_period_end&user_id=eq.${user.id}`
        });
      } catch (err) {
        setSubscriptionTest({
          success: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          query: `subscriptions?select=status,current_period_end&user_id=eq.${user.id}`
        });
      }
    } catch (error) {
      console.error('User access check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      runUserAccessCheck();
    }
  }, [user]);

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Subscription Debug
          </CardTitle>
          <CardDescription>
            Please log in to test subscription functionality
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Debug
            </CardTitle>
            <CardDescription>
              Testing subscription access for user: {user.email}
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={runUserAccessCheck}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Test
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* User ID Info */}
        <div className="p-3 rounded-lg bg-muted/20">
          <div className="text-sm font-medium">User ID</div>
          <div className="font-mono text-xs text-muted-foreground">{user.id}</div>
        </div>

        {/* User Access Results */}
        {userAccess && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Database Access Test</h4>
            
            {/* Users Table */}
            <div className="flex items-center justify-between p-2 rounded border">
              <div className="flex items-center gap-2">
                {userAccess.user?.exists ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">Users Table</span>
              </div>
              <Badge variant={userAccess.user?.exists ? 'default' : 'destructive'}>
                {userAccess.user?.exists ? 'Found' : 'Missing'}
              </Badge>
            </div>

            {/* Metadata Table */}
            <div className="flex items-center justify-between p-2 rounded border">
              <div className="flex items-center gap-2">
                {userAccess.metadata?.exists ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm">User Metadata</span>
              </div>
              <Badge variant={userAccess.metadata?.exists ? 'default' : 'destructive'}>
                {userAccess.metadata?.exists ? 'Found' : 'Missing'}
              </Badge>
            </div>

            {/* Subscription Table */}
            <div className="flex items-center justify-between p-2 rounded border">
              <div className="flex items-center gap-2">
                {userAccess.subscription?.exists ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                )}
                <span className="text-sm">Subscription</span>
              </div>
              <Badge variant={userAccess.subscription?.exists ? 'default' : 'secondary'}>
                {userAccess.subscription?.exists ? 'Found' : 'None'}
              </Badge>
            </div>
          </div>
        )}

        {/* Subscription Query Test */}
        {subscriptionTest && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Subscription Query Test</h4>
            <div className="p-3 rounded border">
              <div className="flex items-center gap-2 mb-2">
                {subscriptionTest.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-sm font-medium">
                  {subscriptionTest.success ? 'Query Successful' : 'Query Failed'}
                </span>
              </div>
              
              <div className="text-xs font-mono bg-muted/50 p-2 rounded mb-2">
                {subscriptionTest.query}
              </div>
              
              {subscriptionTest.error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    {subscriptionTest.error}
                  </AlertDescription>
                </Alert>
              )}
              
              {subscriptionTest.success && subscriptionTest.data && (
                <div className="text-xs text-muted-foreground">
                  Result: {JSON.stringify(subscriptionTest.data, null, 2)}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error Details */}
        {userAccess && (userAccess.user?.error || userAccess.metadata?.error || userAccess.subscription?.error) && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-red-600">Error Details</h4>
            {userAccess.user?.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Users:</strong> {userAccess.user.error}
                </AlertDescription>
              </Alert>
            )}
            {userAccess.metadata?.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Metadata:</strong> {userAccess.metadata.error}
                </AlertDescription>
              </Alert>
            )}
            {userAccess.subscription?.error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Subscription:</strong> {userAccess.subscription.error}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Fix Instructions */}
        {subscriptionTest && !subscriptionTest.success && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Fix Required:</strong> Run the database setup script or migration to create the subscriptions table with proper structure.
              <br />
              <br />
              See <code>QUICK_FIX_DATABASE.md</code> for detailed instructions.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};