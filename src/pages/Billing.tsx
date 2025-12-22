import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTier } from "@/hooks/useTier";
import { Button } from "@/components/ui/button";
import { DisabledTooltipButton } from "@/components/ui/disabled-tooltip-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Crown, 
  Building, 
  Zap,
  ArrowLeft
} from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Basic features for getting started",
    features: [
      "Basic whale tracking",
      "Limited alerts",
      "Community support"
    ],
    current: true,
    popular: false
  },
  {
    name: "Pro",
    price: "$29",
    period: "month",
    description: "Advanced analytics and insights",
    features: [
      "Advanced whale tracking",
      "Unlimited alerts",
      "Priority support",
      "API access",
      "Custom dashboards"
    ],
    current: false,
    popular: true
  },
  {
    name: "Premium",
    price: "$99",
    period: "month",
    description: "Professional-grade intelligence",
    features: [
      "Everything in Pro",
      "Real-time data",
      "Advanced analytics",
      "White-label options",
      "Dedicated support"
    ],
    current: false,
    popular: false
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "contact",
    description: "Custom solutions for organizations",
    features: [
      "Everything in Premium",
      "Custom integrations",
      "SLA guarantees",
      "On-premise deployment",
      "Dedicated account manager"
    ],
    current: false,
    popular: false
  }
];

export default function BillingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier } = useTier();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async (planName: string) => {
    setIsLoading(true);
    try {
      // In a real implementation, this would redirect to Stripe or payment processor
      console.log(`Upgrading to ${planName}`);
      // For now, just show a message
      alert(`Upgrade to ${planName} - This would redirect to payment processor`);
    } catch (error) {
      console.error('Upgrade failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTierIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'premium':
        return <Crown className="w-5 h-5 text-yellow-600" />;
      case 'enterprise':
        return <Building className="w-5 h-5 text-purple-600" />;
      default:
        return <Zap className="w-5 h-5 text-blue-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Plans & Billing</h1>
          <p className="text-muted-foreground mt-2">
            Choose the plan that's right for you
          </p>
        </div>

        {/* Current Plan */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Current Plan
                <Badge variant="outline" className="capitalize">
                  {tier}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                You're currently on the {tier} plan. 
                {tier === 'free' && ' Upgrade to unlock more features.'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={cn(
                "relative",
                plan.popular && "ring-2 ring-primary",
                plan.current && "bg-muted"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-center gap-2">
                  {getTierIcon(plan.name)}
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/{plan.period}</span>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {plan.current ? (
                  <DisabledTooltipButton 
                    disabled 
                    className="w-full"
                    disabledTooltip="This is your current plan"
                  >
                    Current Plan
                  </DisabledTooltipButton>
                ) : (
                  <Button 
                    onClick={() => handleUpgrade(plan.name)}
                    disabled={isLoading}
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {isLoading ? "Executing..." : `Upgrade to ${plan.name}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">
            Need help choosing a plan? Contact our sales team.
          </p>
          <Button variant="outline" onClick={() => window.open('mailto:sales@example.com')}>
            Contact Sales
          </Button>
        </div>
      </div>
    </div>
  );
}
