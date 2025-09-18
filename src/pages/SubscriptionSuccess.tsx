import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSimpleSubscription } from '@/hooks/useSimpleSubscription';
import { SubscriptionDebug } from '@/components/debug/SubscriptionDebug';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyPayment } = useSimpleSubscription();
  const [isVerifying, setIsVerifying] = useState(true);
  const [plan, setPlan] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      verifyPayment(sessionId)
        .then((data) => {
          setPlan(data.plan);
          setIsVerifying(false);
        })
        .catch((err) => {
          console.error('Verification error:', err);
          setError(err.message || 'Payment verification failed');
          setIsVerifying(false);
        });
    } else {
      setError('No session ID found in URL');
      setIsVerifying(false);
    }
  }, [searchParams, verifyPayment]);

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p>Verifying payment...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-2xl w-full space-y-4">
          <Card className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Payment Verification Failed</h1>
            <p className="text-muted-foreground mb-6">
              {error}
            </p>
            <div className="space-y-2">
              <Button onClick={() => navigate('/subscription')} className="w-full">
                Try Again
              </Button>
              <Button variant="outline" onClick={() => navigate('/')} className="w-full">
                Go Home
              </Button>
            </div>
          </Card>
          <SubscriptionDebug />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground mb-6">
          Welcome to the {plan} plan! You now have access to all premium features.
        </p>
        <Button onClick={() => navigate('/')} className="w-full">
          Get Started
        </Button>
      </Card>
    </div>
  );
}