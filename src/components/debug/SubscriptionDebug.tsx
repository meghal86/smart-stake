import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { EnvCheck } from './EnvCheck';

export const SubscriptionDebug = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    const debug = {
      sessionId,
      user: user ? { id: user.id, email: user.email } : null,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      origin: window.location.origin
    };
    
    setDebugInfo(debug);
    
    // Test the function call
    if (sessionId && user) {
      testVerifyPayment(sessionId, user.id);
    }
  }, [searchParams, user]);

  const testVerifyPayment = async (sessionId: string, userId: string) => {
    try {
      console.log('Testing verify payment with:', { sessionId, userId });
      
      const { data, error } = await supabase.functions.invoke('simple-subscription', {
        body: {
          action: 'verify-payment',
          sessionId,
          userId
        }
      });

      if (error) {
        console.error('Function error:', error);
        setError(`Function error: ${error.message}`);
      } else {
        console.log('Function success:', data);
        setDebugInfo(prev => ({ ...prev, functionResult: data }));
      }
    } catch (err: any) {
      console.error('Catch error:', err);
      setError(`Catch error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <EnvCheck />
      <div className="p-4 bg-gray-100 rounded-lg">
        <h3 className="font-bold mb-2">Subscription Debug Info</h3>
        <pre className="text-xs bg-white p-2 rounded overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
        {error && (
          <div className="mt-2 p-2 bg-red-100 text-red-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}
      </div>
    </div>
  );
};