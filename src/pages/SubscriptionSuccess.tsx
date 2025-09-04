import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useSimpleSubscription } from '@/hooks/useSimpleSubscription';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyPayment } = useSimpleSubscription();
  const [isVerifying, setIsVerifying] = useState(true);
  const [plan, setPlan] = useState('');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (sessionId) {
      verifyPayment(sessionId)
        .then((data) => {
          setPlan(data.plan);
          setIsVerifying(false);
        })
        .catch(() => {
          setIsVerifying(false);
        });
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