import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Crown, Zap, ArrowRight } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

const SubscriptionSuccess: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      navigate('/subscription');
      return;
    }

    // Wait for webhook to process and then check subscription status
    const checkSubscriptionStatus = async () => {
      try {
        // Wait a moment for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // Check if subscription was updated
          const { data: userData } = await supabase
            .from('users')
            .select('plan, subscription_status')
            .eq('user_id', user.id)
            .single();

          if (userData?.plan !== 'free') {
            setSessionData({ plan: userData.plan });
            toast({
              title: "Welcome to Premium!",
              description: "Your subscription has been activated successfully.",
            });
          } else {
            // If not updated yet, wait a bit more and try again
            setTimeout(async () => {
              const { data: retryData } = await supabase
                .from('users')
                .select('plan, subscription_status')
                .eq('user_id', user.id)
                .single();
              
              if (retryData?.plan !== 'free') {
                setSessionData({ plan: retryData.plan });
                toast({
                  title: "Welcome to Premium!",
                  description: "Your subscription has been activated successfully.",
                });
              }
            }, 3000);
          }
        }
      } catch (error) {
        console.error('Error checking subscription status:', error);
        toast({
          variant: "destructive",
          title: "Processing Payment",
          description: "Your payment is being processed. Please check your profile in a few minutes.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscriptionStatus();
  }, [searchParams, navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Verifying your subscription...</h2>
            <p className="text-muted-foreground">Please wait while we confirm your payment.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Success Animation */}
        <div className="text-center">
          <div className="relative mx-auto w-20 h-20 mb-6">
            <div className="absolute inset-0 bg-green-100 rounded-full animate-ping"></div>
            <div className="relative bg-green-500 rounded-full w-20 h-20 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-green-600 mb-2">Payment Successful!</h1>
          <p className="text-muted-foreground">Welcome to the premium experience</p>
        </div>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/20 rounded-2xl">
                <Crown className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-xl">Premium Activated</CardTitle>
            <CardDescription>
              Your premium subscription is now active and ready to use
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">Unlimited whale alerts</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">Real-time notifications</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">Advanced filtering & analytics</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-sm">Priority customer support</span>
              </div>
            </div>

            {sessionData && (
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <h4 className="font-medium text-sm">Subscription Details</h4>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Plan: Premium {sessionData.interval === 'year' ? 'Annual' : 'Monthly'}</p>
                  <p>Amount: ${sessionData.amount_total / 100}</p>
                  {sessionData.current_period_end && (
                    <p>Next billing: {new Date(sessionData.current_period_end * 1000).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3 pt-4">
              <Button 
                className="w-full" 
                onClick={() => navigate('/')}
              >
                <Zap className="w-4 h-4 mr-2" />
                Start Tracking Whales
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate('/profile')}
              >
                Manage Subscription
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-xs text-muted-foreground">
          <p>
            Need help? Contact our{' '}
            <a href="mailto:support@whaletracker.com" className="text-primary hover:underline">
              support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionSuccess;