import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Crown, Check, Zap, TrendingUp, Shield, Headphones, ArrowLeft, CreditCard, Smartphone, Wallet } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { UserHeader } from '@/components/layout/UserHeader';

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  description: string;
  features: string[];
  popular?: boolean;
  stripePriceId?: string;
}

const pricingPlans: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    description: 'Get started with basic whale tracking',
    features: [
      '50 whale alerts per day',
      'Basic chain support',
      'Standard notifications',
      'Community support',
      'Limited historical data',
      'No yield farming insights',
      'No risk scanner',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9.99,
    interval: 'month',
    description: 'Perfect for active DeFi traders',
    features: [
      'Unlimited whale alerts',
      'All chain support',
      'Real-time notifications',
      'Advanced filtering',
      'Yield farming insights',
      'Portfolio tracking',
      'Priority support',
    ],
    popular: true,
    stripePriceId: 'price_1S0HB3JwuQyqUsks8bKNUt6M', // Pro Monthly Price ID
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 19.99,
    interval: 'month',
    description: 'Advanced tools for professional traders',
    features: [
      'Everything in Pro',
      'AI-powered risk scanner',
      'Smart contract analysis',
      'Wallet security scoring',
      'Advanced analytics',
      'API access',
      'White-label options',
      'Dedicated support',
    ],
    stripePriceId: 'price_1S0HBOJwuQyqUsksDCs7SbPB', // Premium Monthly Price ID
  },
];

const Subscription: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string>('pro');
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Set plan from URL params
    const planFromUrl = searchParams.get('plan');
    if (planFromUrl === 'pro') {
      setSelectedPlan('pro');
    } else if (planFromUrl === 'premium') {
      setSelectedPlan('premium');
    }

    // Fetch current user plan
    const fetchCurrentPlan = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('users')
          .select('plan')
          .eq('user_id', user.id)
          .single();
        
        if (error) {
          console.error('Error fetching user plan:', error);
          setError(`Database connection issue: ${error.message}`);
        } else if (data?.plan) {
          setCurrentPlan(data.plan);
          console.log('Current user plan from database:', data.plan);
          console.log('Full user data:', data);
        } else {
          console.log('No plan found in database, defaulting to free');
          setCurrentPlan('free');
        }
      } catch (err) {
        console.error('Database test failed:', err);
        setError('Database connection failed');
      }
    };

    if (user) {
      fetchCurrentPlan();
    }
  }, [searchParams, user]);

  // Listen for plan updates
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user_plan_updated' && user) {
        fetchCurrentPlan();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  // Show loading while auth is being determined
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading authentication...</p>
        </div>
      </div>
    );
  }

  const handleStripeCheckout = async (plan: PricingPlan) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please sign in to subscribe to a plan.",
      });
      navigate('/login');
      return;
    }

    if (plan.id === 'free') {
      // Handle free plan selection
      try {
        setIsLoading(true);
        
        // Update user's plan in database
        const { error } = await supabase
          .from('users')
          .upsert({
            user_id: user.id,
            email: user.email,
            plan: 'free',
            updated_at: new Date().toISOString(),
          });

        if (error) throw error;

        toast({
          title: "Plan Updated",
          description: "You're now on the free plan.",
        });
        navigate('/');
      } catch (err) {
        setError('Failed to update plan');
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to update your plan. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Check if Stripe is configured
      console.log('Calling Edge Function with priceId:', plan.stripePriceId);
      
      const response = await supabase.functions.invoke('create-checkout-session', {
        body: {
          priceId: plan.stripePriceId,
          successUrl: `${window.location.origin}/subscription/success`,
          cancelUrl: `${window.location.origin}/subscription/cancel`,
        },
      });

      console.log('Edge Function response:', response);

      if (response.error) {
        console.error('Edge Function error:', response.error);
        
        // Show detailed error information
        setError(`Edge Function Error: ${JSON.stringify(response.error)}`);
        toast({
          variant: "destructive",
          title: "Subscription Error",
          description: `Error: ${response.error.message || 'Unknown error'}. Check console for details.`,
        });
        return;
      }

      const { url } = response.data;
      
      if (url) {
        // Open Stripe checkout in a new tab for better UX
        window.open(url, '_blank');
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Stripe checkout error:', err);
      
      // Show helpful error message
      if (err.message?.includes('Edge Function returned a non-2xx status code')) {
        setError('Stripe integration is not configured yet. Please set up Stripe keys and deploy the Edge Function.');
        toast({
          variant: "destructive",
          title: "Setup Required",
          description: "Stripe integration needs to be configured. Check STRIPE_SETUP.md for instructions.",
        });
      } else {
        setError('Failed to start subscription process');
        toast({
          variant: "destructive",
          title: "Subscription Error",
          description: "Failed to start the subscription process. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: number, interval: string) => {
    if (price === 0) return 'Free';
    return `$${price}/${interval === 'year' ? 'year' : 'month'}`;
  };

  return (
    <AppLayout showHeader={false}>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
        <div className="container mx-auto px-4 py-8">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-xl">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-bold">Premium Plans</h1>
                  <p className="text-sm text-muted-foreground">Choose the best plan for your DeFi journey</p>
                </div>
              </div>
            </div>
            <UserHeader />
          </div>

          {/* Hero Section */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Premium Plans</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the best plan for your DeFi journey.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-6 max-w-2xl mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {pricingPlans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative transition-all hover:shadow-lg ${
                selectedPlan === plan.id ? 'ring-2 ring-primary' : ''
              } ${plan.popular ? 'border-primary' : ''}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-4">
                <div className="flex justify-center mb-4">
                  {plan.id === 'free' ? (
                    <div className="p-3 bg-muted/20 rounded-2xl">
                      <Shield className="h-8 w-8 text-muted-foreground" />
                    </div>
                  ) : plan.id === 'pro' ? (
                    <div className="p-3 bg-success/20 rounded-2xl">
                      <Zap className="h-8 w-8 text-success" />
                    </div>
                  ) : (
                    <div className="p-3 bg-primary/20 rounded-2xl">
                      <Crown className="h-8 w-8 text-primary" />
                    </div>
                  )}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold">
                  {formatPrice(plan.price, plan.interval)}
                </div>
                {plan.interval === 'month' && plan.price > 0 && (
                  <div className="text-sm text-muted-foreground">per month</div>
                )}
                <CardDescription className="mt-2">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="flex flex-col gap-2">
                <Button
                  className="w-full"
                  variant={plan.id === 'free' ? "outline" : "default"}
                  onClick={() => {
                    setSelectedPlan(plan.id);
                    handleStripeCheckout(plan);
                  }}
                  disabled={isLoading}
                >
                  {isLoading && selectedPlan === plan.id ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (currentPlan === 'premium' && (plan.id === 'pro' || plan.id === 'premium')) ? (
                    'Current Plan'
                  ) : plan.id === 'free' && currentPlan === 'free' ? (
                    'Current Plan'
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      {plan.id === 'free' ? 'Downgrade to Free' : `Upgrade to ${plan.name}`}
                    </>
                  )}
                </Button>
                {plan.id !== 'free' && (
                  <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <CreditCard className="h-3 w-3" />
                    <Smartphone className="h-3 w-3" />
                    <Wallet className="h-3 w-3" />
                    <span>Card • Apple Pay • Google Pay</span>
                  </div>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Features Highlight */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8">Why Choose Premium?</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="p-6">
                <TrendingUp className="h-8 w-8 text-primary mx-auto mb-4" />
                <h4 className="font-semibold mb-2">Real-time Alerts</h4>
                <p className="text-sm text-muted-foreground">
                  Get instant notifications when whales make large moves
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Shield className="h-8 w-8 text-primary mx-auto mb-4" />
                <h4 className="font-semibold mb-2">Risk Analysis</h4>
                <p className="text-sm text-muted-foreground">
                  Advanced tools to assess market risks and opportunities
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Zap className="h-8 w-8 text-primary mx-auto mb-4" />
                <h4 className="font-semibold mb-2">Advanced Filtering</h4>
                <p className="text-sm text-muted-foreground">
                  Filter alerts by token, chain, amount, and more
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardContent className="p-6">
                <Headphones className="h-8 w-8 text-primary mx-auto mb-4" />
                <h4 className="font-semibold mb-2">Priority Support</h4>
                <p className="text-sm text-muted-foreground">
                  Get help when you need it with priority customer support
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

          {/* FAQ or Additional Info */}
          <div className="max-w-2xl mx-auto mt-12 text-center">
            <Separator className="mb-6" />
            <p className="text-sm text-muted-foreground mb-4">
              All plans include a 7-day free trial. Cancel anytime. No hidden fees.
            </p>
            <p className="text-xs text-muted-foreground">
              Secure payments powered by Stripe. Your payment information is encrypted and secure.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Subscription;