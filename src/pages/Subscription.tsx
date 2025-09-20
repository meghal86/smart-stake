import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Check, Zap, Shield, ArrowLeft, CreditCard, Building2, Mail, Lock, Grid, LayoutGrid, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AppLayout } from '@/components/layout/AppLayout';
import { UserHeader } from '@/components/layout/UserHeader';
import { useSimpleSubscription } from '@/hooks/useSimpleSubscription';
import { ComingSoonBadge } from '@/components/ComingSoonBadge';
import { EnterpriseContactModal } from '@/components/EnterpriseContactModal';
import { PlanComparisonTable } from '@/components/PlanComparisonTable';
import { BadgeBestValue } from '@/components/BadgeBestValue';
import { analytics } from '@/lib/analytics';

// Pricing-specific analytics helpers
const trackPricingEvent = {
  viewModeChanged: (mode: 'cards' | 'table') => {
    analytics.track('pricing_view_mode_changed', { view_mode: mode });
  },
  planCtaClicked: (plan: string, billingPeriod: 'month' | 'year', viewMode: 'cards' | 'table') => {
    analytics.track('pricing_plan_cta_clicked', { plan, billing_period: billingPeriod, view_mode: viewMode });
  },
  comingSoonTooltipOpened: (feature: string, plan: string) => {
    analytics.track('coming_soon_tooltip_opened', { feature, plan });
  },
  enterpriseContactOpened: () => {
    analytics.track('enterprise_contact_opened');
  },
  billingPeriodToggled: (period: 'month' | 'year') => {
    analytics.track('toggle_billing_period', { billing_period: period });
  }
};

interface PricingPlan {
  id: string;
  name: string;
  price: number | 'custom';
  interval: 'month' | 'year';
  description: string;
  features: (string | { text: string; comingSoon?: boolean; eta?: string })[];
  popular?: boolean;
  enterprise?: boolean;
  stripePriceId?: string;
  monthlyPriceId?: string;
  yearlyPriceId?: string;
}

const getPlans = (isAnnual: boolean): PricingPlan[] => [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: isAnnual ? 'year' : 'month',
    description: 'Get started with basic whale tracking',
    features: [
      '50 whale alerts/day',
      'Basic chain support',
      'Limited history',
      'Community support only',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: isAnnual ? 95.99 : 9.99,
    interval: isAnnual ? 'year' : 'month',
    description: 'Perfect for active DeFi traders',
    features: [
      'Unlimited whale alerts',
      'All chain support',
      'Yield farming insights',
      'Portfolio tracking',
      'Priority email support',
    ],
    popular: true,
    monthlyPriceId: 'price_1S0HB3JwuQyqUsks8bKNUt6M',
    yearlyPriceId: 'price_1S0HB3JwuQyqUsks8bKNUt6M_yearly',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: isAnnual ? 191.99 : 19.99,
    interval: isAnnual ? 'year' : 'month',
    description: 'Advanced tools for professional traders',
    features: [
      'Everything in Pro',
      'AI-powered risk scanner',
      { text: 'Smart contract analysis', comingSoon: true, eta: 'ETA Q2 2025' },
      { text: 'Wallet security scoring', comingSoon: true, eta: 'ETA Q2 2025' },
      'Advanced analytics',
      'API access',
      'Basic white-label options',
    ],
    monthlyPriceId: 'price_1S0HBOJwuQyqUsksDCs7SbPB',
    yearlyPriceId: 'price_1S0HBOJwuQyqUsksDCs7SbPB_yearly',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'custom',
    interval: isAnnual ? 'year' : 'month',
    description: 'Custom solutions for institutions',
    features: [
      'Everything in Premium',
      { text: 'Workflow automation', comingSoon: true, eta: 'ETA Q3 2025' },
      { text: 'Forensics dashboard: wash trading, collusion detection', comingSoon: true, eta: 'ETA Q3 2025' },
      'Custom API limits',
      'SLA + dedicated account manager',
      'Advanced white-label options',
    ],
    enterprise: true,
  },
];

const Subscription: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnnual, setIsAnnual] = useState(false);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [currency, setCurrency] = useState('USD');
  const [userRegion, setUserRegion] = useState('US');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { plan: currentPlan, createCheckout } = useSimpleSubscription();

  // Load currency from localStorage
  useEffect(() => {
    const savedCurrency = localStorage.getItem('preferred_currency');
    if (savedCurrency) setCurrency(savedCurrency);
    
    // Detect user region (simplified)
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (timezone.includes('Europe')) setUserRegion('EU');
    else if (timezone.includes('Asia/Seoul')) setUserRegion('KR');
    else if (timezone.includes('Asia/Tokyo')) setUserRegion('JP');
  }, []);

  const currencies = [
    { code: 'USD', symbol: '$', rate: 1 },
    { code: 'EUR', symbol: '€', rate: 0.85 },
    { code: 'JPY', symbol: '¥', rate: 110 },
    { code: 'KRW', symbol: '₩', rate: 1200 }
  ];

  const formatPrice = (price: number | 'custom', interval: string) => {
    if (price === 0) return 'Free';
    if (price === 'custom') return 'Custom pricing';
    
    const currencyInfo = currencies.find(c => c.code === currency) || currencies[0];
    const convertedPrice = price * currencyInfo.rate;
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: currency === 'JPY' || currency === 'KRW' ? 0 : 2
    }).format(convertedPrice) + `/${interval === 'year' ? 'year' : 'month'}`;
  };

  const handleCurrencyChange = (newCurrency: string) => {
    setCurrency(newCurrency);
    localStorage.setItem('preferred_currency', newCurrency);
  };

  const handleViewModeChange = (mode: 'cards' | 'table') => {
    setViewMode(mode);
    trackPricingEvent.viewModeChanged(mode);
  };

  const handleBillingToggle = (annual: boolean) => {
    setIsAnnual(annual);
    trackPricingEvent.billingPeriodToggled(annual ? 'year' : 'month');
  };

  const pricingPlans = getPlans(isAnnual);
  const trustedUsers = 1247;

  const handleSubscribe = async (plan: PricingPlan) => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (plan.id === 'free') {
      toast({ title: "Already on free plan" });
      return;
    }

    if (plan.id === 'enterprise') {
      setShowEnterpriseModal(true);
      trackPricingEvent.enterpriseContactOpened();
      return;
    }

    trackPricingEvent.planCtaClicked(plan.id, isAnnual ? 'year' : 'month', viewMode);

    try {
      setIsLoading(true);
      const priceId = isAnnual ? plan.yearlyPriceId : plan.monthlyPriceId;
      const url = await createCheckout(priceId!);
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



  const renderFeature = (feature: string | { text: string; comingSoon?: boolean; eta?: string }, planId?: string) => {
    if (typeof feature === 'string') {
      return feature;
    }
    return (
      <span className="flex items-center">
        {feature.text}
        {feature.comingSoon && (
          <ComingSoonBadge 
            label="Coming Soon" 
            eta={feature.eta || 'Coming Soon'}
            onTooltipOpen={() => trackPricingEvent.comingSoonTooltipOpened(feature.text, planId || '')}
          />
        )}
      </span>
    );
  };

  const renderUpsellTeaser = (planId: string) => {
    if (planId === 'pro') {
      return (
        <li className="flex items-start gap-3 opacity-50 cursor-pointer" onClick={() => document.getElementById('premium-cta')?.scrollIntoView()}>
          <Lock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <span className="text-sm">Unlock Smart Contract Analysis (Premium)</span>
        </li>
      );
    }
    if (planId === 'premium') {
      return (
        <li className="flex items-start gap-3 opacity-50 cursor-pointer" onClick={() => document.getElementById('enterprise-cta')?.scrollIntoView()}>
          <Lock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <span className="text-sm">Unlock Workflow Automation (Enterprise)</span>
        </li>
      );
    }
    return null;
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
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
              Choose the best plan for your DeFi journey.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              Trusted by {trustedUsers.toLocaleString()}+ traders worldwide.
            </p>
            
            {/* View Toggle */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewModeChange('cards')}
                className="gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                Cards View
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewModeChange('table')}
                className="gap-2"
              >
                <Grid className="h-4 w-4" />
                Comparison Table
              </Button>
            </div>
            
            {/* Currency Selector */}
            <div className="flex items-center justify-center gap-2 mb-6">
              <Label htmlFor="currency-select" className="text-sm text-muted-foreground">
                Currency:
              </Label>
              <Select value={currency} onValueChange={handleCurrencyChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map(curr => (
                    <SelectItem key={curr.code} value={curr.code}>
                      {curr.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mb-4">
              <Label htmlFor="billing-toggle" className={!isAnnual ? 'font-semibold' : ''}>
                Monthly
              </Label>
              <Switch
                id="billing-toggle"
                checked={isAnnual}
                onCheckedChange={handleBillingToggle}
              />
              <Label htmlFor="billing-toggle" className={isAnnual ? 'font-semibold' : ''}>
                Annual
                <Badge variant="secondary" className="ml-2">Save 20% with annual billing</Badge>
              </Label>
            </div>
            
            {/* Tax Footnote */}
            {userRegion !== 'US' && (
              <p className="text-xs text-muted-foreground text-center mb-8">
                Taxes/VAT may apply and are calculated at checkout.
              </p>
            )}
          </div>

          {/* Pricing Content */}
          {viewMode === 'table' ? (
            <div className="mb-12">
              <PlanComparisonTable
                plans={pricingPlans}
                currentPlan={currentPlan}
                isAnnual={isAnnual}
                onSubscribe={handleSubscribe}
                isLoading={isLoading}
              />
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-12">
              {pricingPlans.map((plan) => (
                <Card 
                  key={plan.id}
                  className={`relative transition-all hover:shadow-lg ${
                    plan.popular ? 'border-primary ring-2 ring-primary/30 shadow-lg shadow-primary/20 glow-primary' : ''
                  } ${
                    plan.id === 'premium' ? 'border-green-500 ring-2 ring-green-500/30 shadow-lg shadow-green-500/20 glow-green' : ''
                  } ${
                    plan.enterprise ? 'border-2 border-purple-500 ring-2 ring-purple-500/30 shadow-lg shadow-purple-500/20' : ''
                  }`}
                >
                  {plan.popular && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                      Most Popular
                    </Badge>
                  )}
                  {plan.id === 'premium' && (
                    <BadgeBestValue />
                  )}
                  {plan.enterprise && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-blue-500">
                      Enterprise
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
                      ) : plan.id === 'premium' ? (
                        <div className="p-3 bg-primary/20 rounded-2xl">
                          <Crown className="h-8 w-8 text-primary" />
                        </div>
                      ) : (
                        <div className="p-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl">
                          <Building2 className="h-8 w-8 text-purple-600" />
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="text-3xl font-bold">
                      {formatPrice(plan.price, plan.interval)}
                    </div>
                    {plan.price !== 'custom' && plan.price > 0 && (
                      <div className="text-sm text-muted-foreground">
                        per {plan.interval}
                        {isAnnual && plan.price !== 0 && (
                          <div className="text-xs text-green-600 font-medium">
                            Save 20% vs monthly
                          </div>
                        )}
                      </div>
                    )}
                    {plan.enterprise && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Plans typically start at $499/mo. Volume and SLA included.
                      </div>
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
                          <span className="text-sm">{renderFeature(feature, plan.id)}</span>
                        </li>
                      ))}
                      {renderUpsellTeaser(plan.id)}
                    </ul>
                    
                    {/* Feature Captions */}
                    {plan.id === 'pro' && (
                      <p className="text-xs text-muted-foreground mt-4 pt-2 border-t">
                        Unlimited alerts + all chains.
                      </p>
                    )}
                    
                    {plan.id === 'premium' && (
                      <div className="mt-4 pt-2 border-t">
                        <div className="flex flex-wrap gap-1">
                          <Badge size="sm" variant="secondary">AI Risk</Badge>
                          <Badge size="sm" variant="secondary">Scenarios</Badge>
                          <Badge size="sm" variant="secondary">API</Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>

                  <CardFooter className="flex flex-col gap-2">
                    <Button
                      id={`${plan.id}-cta`}
                      className={`w-full ${
                        plan.enterprise ? 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600' : ''
                      }`}
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
                          {plan.enterprise ? (
                            <><Mail className="w-4 h-4 mr-2" />Contact Sales</>
                          ) : (
                            <><CreditCard className="w-4 h-4 mr-2" />{plan.id === 'free' ? 'Free' : `Upgrade to ${plan.name}`}</>
                          )}
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {/* FAQ Section */}
          <section aria-label="Pricing FAQ" className="max-w-3xl mx-auto mb-12">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold mb-2">Frequently Asked Questions</h3>
              <p className="text-muted-foreground">Questions? We've got answers.</p>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="cancel">
                <AccordionTrigger className="text-left">
                  Can I cancel anytime?
                </AccordionTrigger>
                <AccordionContent>
                  Yes, monthly plans can be canceled anytime; you retain access until period end.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="prorate">
                <AccordionTrigger className="text-left">
                  Do you prorate upgrades?
                </AccordionTrigger>
                <AccordionContent>
                  Yes, upgrades are prorated automatically via Stripe.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="invoices">
                <AccordionTrigger className="text-left">
                  Do you offer invoices?
                </AccordionTrigger>
                <AccordionContent>
                  Annual Premium + Enterprise include invoice billing.
                </AccordionContent>
              </AccordionItem>
              
              {/* Hide trial row if not enabled */}
              {false && (
                <AccordionItem value="trial">
                  <AccordionTrigger className="text-left">
                    Is there a free trial?
                  </AccordionTrigger>
                  <AccordionContent>
                    7-day Premium trial available for new users.
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </section>

          {/* Partner Logos */}
          <div className="text-center mb-24">
            <p className="text-sm text-muted-foreground mb-6">Trusted by leading exchanges</p>
            <div className="flex justify-center items-center gap-8 opacity-60">
              <img src="/partners/binance.svg" alt="Binance" className="h-8 grayscale hover:grayscale-0 transition-all" />
              <img src="/partners/coinbase.svg" alt="Coinbase" className="h-8 grayscale hover:grayscale-0 transition-all" />
              <img src="/partners/kraken.svg" alt="Kraken" className="h-8 grayscale hover:grayscale-0 transition-all" />
            </div>
          </div>

          <EnterpriseContactModal
            isOpen={showEnterpriseModal}
            onClose={() => setShowEnterpriseModal(false)}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default Subscription;