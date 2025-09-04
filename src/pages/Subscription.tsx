import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Check, Zap, Shield, ArrowLeft, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { UserHeader } from '@/components/layout/UserHeader';
import { useSimpleSubscription } from '@/hooks/useSimpleSubscription';

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
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { plan: currentPlan, createCheckout } = useSimpleSubscription();





  const handleSubscribe = async (plan: PricingPlan) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (plan.id === 'free') {
      toast({ title: "Already on free plan" });
      return;
    }

    try {
      setIsLoading(true);
      const url = await createCheckout(plan.stripePriceId!);
      window.location.href = url;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start checkout"
      });
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



        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {pricingPlans.map((plan) => (
            <Card 
              key={plan.id}
              className={`relative transition-all hover:shadow-lg ${plan.popular ? 'border-primary' : ''}`}
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
                  variant={currentPlan === plan.id ? "outline" : "default"}
                  onClick={() => handleSubscribe(plan)}
                  disabled={isLoading || currentPlan === plan.id}
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  ) : currentPlan === plan.id ? (
                    'Current Plan'
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      {plan.id === 'free' ? 'Free' : `Upgrade to ${plan.name}`}
                    </>
                  )}
                </Button>

              </CardFooter>
            </Card>
          ))}
        </div>


        </div>
      </div>
    </AppLayout>
  );
};

export default Subscription;