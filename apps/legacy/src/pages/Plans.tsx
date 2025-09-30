import { useState } from 'react';
import { Check, Crown, Zap, Building2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { SUBSCRIPTION_PLANS, SubscriptionTier } from '@/types/subscription';
import { useToast } from '@/hooks/use-toast';

export default function Plans() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [upgrading, setUpgrading] = useState<SubscriptionTier | null>(null);
  const { subscription, upgradeToTier } = useSubscription();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const suggestedTier = searchParams.get('upgrade') as SubscriptionTier;

  const handleUpgrade = async (tier: SubscriptionTier) => {
    if (tier === subscription.tier) return;
    
    setUpgrading(tier);
    try {
      await upgradeToTier(tier);
      toast({
        title: "Plan Updated!",
        description: `Successfully upgraded to ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan.`,
      });
      navigate('/portfolio-enhanced');
    } catch (error) {
      toast({
        title: "Upgrade Failed",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    } finally {
      setUpgrading(null);
    }
  };

  const getPrice = (plan: typeof SUBSCRIPTION_PLANS[0]) => {
    if (plan.price === 0) return 'Free';
    const price = isAnnual ? Math.floor(plan.price * 12 * 0.8) : plan.price;
    const interval = isAnnual ? 'year' : 'month';
    return `$${price}/${interval}`;
  };

  const getPlanIcon = (tier: SubscriptionTier) => {
    switch (tier) {
      case 'free': return '🆓';
      case 'pro': return <Zap className="h-5 w-5" />;
      case 'institutional': return <Building2 className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 py-12">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Unlock the full power of whale intelligence and portfolio analytics
          </p>
          
          {/* Annual Toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`text-sm ${!isAnnual ? 'font-medium' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <span className={`text-sm ${isAnnual ? 'font-medium' : 'text-muted-foreground'}`}>
              Annual
            </span>
            {isAnnual && (
              <Badge variant="secondary" className="ml-2">
                Save 20%
              </Badge>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isCurrentPlan = subscription.tier === plan.id;
            const isSuggested = suggestedTier === plan.id;
            const isUpgrading = upgrading === plan.id;
            
            return (
              <Card 
                key={plan.id} 
                className={`relative p-8 ${
                  isSuggested ? 'ring-2 ring-primary shadow-lg scale-105' : ''
                } ${isCurrentPlan ? 'border-green-500' : ''}`}
              >
                {isSuggested && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      Recommended
                    </Badge>
                  </div>
                )}
                
                {isCurrentPlan && (
                  <div className="absolute -top-4 right-4">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Current Plan
                    </Badge>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className="flex items-center justify-center mb-2">
                    {getPlanIcon(plan.id)}
                    <h3 className="text-2xl font-bold ml-2">{plan.name}</h3>
                  </div>
                  
                  <div className="text-3xl font-bold mb-2">
                    {getPrice(plan)}
                  </div>
                  
                  {plan.price > 0 && isAnnual && (
                    <p className="text-sm text-muted-foreground">
                      ${plan.price}/month billed annually
                    </p>
                  )}
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* Limits */}
                <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Limits</h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    <div>Portfolio Addresses: {plan.limits.portfolioAddresses === -1 ? 'Unlimited' : plan.limits.portfolioAddresses}</div>
                    <div>Daily Alerts: {plan.limits.whaleAlerts === -1 ? 'Unlimited' : plan.limits.whaleAlerts}</div>
                    <div>API Calls: {plan.limits.apiCalls === 0 ? 'None' : plan.limits.apiCalls === -1 ? 'Unlimited' : plan.limits.apiCalls.toLocaleString()}</div>
                    <div>Team Seats: {plan.limits.teamSeats}</div>
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={isCurrentPlan || isUpgrading}
                  className={`w-full ${
                    plan.id === 'pro' ? 'bg-blue-600 hover:bg-blue-700' :
                    plan.id === 'institutional' ? 'bg-purple-600 hover:bg-purple-700' :
                    ''
                  }`}
                  variant={plan.id === 'free' ? 'outline' : 'default'}
                >
                  {isUpgrading ? (
                    'Upgrading...'
                  ) : isCurrentPlan ? (
                    'Current Plan'
                  ) : plan.id === 'free' ? (
                    'Get Started'
                  ) : (
                    <>
                      Upgrade to {plan.name}
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                {plan.id === 'institutional' && (
                  <p className="text-center text-xs text-muted-foreground mt-2">
                    Contact sales for custom pricing
                  </p>
                )}
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="mt-16 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-medium mb-2">Can I change plans anytime?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">What payment methods do you accept?</h3>
              <p className="text-sm text-muted-foreground">
                We accept all major credit cards and cryptocurrency payments through Stripe.
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Is there a free trial?</h3>
              <p className="text-sm text-muted-foreground">
                Yes, all paid plans come with a 14-day free trial. No credit card required.
              </p>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="text-center mt-12">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back to Portfolio
          </Button>
        </div>
      </div>
    </div>
  );
}