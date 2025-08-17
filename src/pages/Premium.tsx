import { Crown, Check, Zap, Shield, TrendingUp, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Get started with basic whale tracking",
    features: [
      "50 whale alerts per day",
      "Basic chain support",
      "Standard notifications",
      "Community support",
    ],
    limitations: [
      "Limited historical data",
      "No yield farming insights",
      "No risk scanner",
    ],
    buttonText: "Current Plan",
    buttonVariant: "outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    price: "$9.99",
    period: "per month",
    description: "Perfect for active DeFi traders",
    features: [
      "Unlimited whale alerts",
      "All chain support",
      "Real-time notifications",
      "Advanced filtering",
      "Yield farming insights",
      "Portfolio tracking",
      "Priority support",
    ],
    limitations: [],
    buttonText: "Upgrade to Pro",
    buttonVariant: "default" as const,
    popular: true,
  },
  {
    name: "Premium",
    price: "$19.99",
    period: "per month",
    description: "Advanced tools for professional traders",
    features: [
      "Everything in Pro",
      "AI-powered risk scanner",
      "Smart contract analysis",
      "Wallet security scoring",
      "Advanced analytics",
      "API access",
      "White-label options",
      "Dedicated support",
    ],
    limitations: [],
    buttonText: "Upgrade to Premium",
    buttonVariant: "default" as const,
    popular: false,
  },
];

export default function Premium() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10 pb-20">
      {/* Header */}
      <div className="p-4 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-gradient-to-br from-premium/20 to-secondary/20 rounded-2xl">
            <Crown className="h-8 w-8 text-premium" />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Upgrade Your Experience</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Unlock powerful features to maximize your DeFi trading potential
        </p>
      </div>

      {/* Features Grid */}
      <div className="p-4 mb-6">
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Card className="p-4 text-center bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <Zap className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-sm text-foreground mb-1">Real-time Alerts</h3>
            <p className="text-xs text-muted-foreground">Never miss a whale move</p>
          </Card>
          
          <Card className="p-4 text-center bg-gradient-to-br from-success/10 to-success/5 border-success/20">
            <TrendingUp className="h-8 w-8 text-success mx-auto mb-2" />
            <h3 className="font-semibold text-sm text-foreground mb-1">Yield Insights</h3>
            <p className="text-xs text-muted-foreground">Top DeFi opportunities</p>
          </Card>
          
          <Card className="p-4 text-center bg-gradient-to-br from-premium/10 to-warning/5 border-premium/20">
            <Shield className="h-8 w-8 text-premium mx-auto mb-2" />
            <h3 className="font-semibold text-sm text-foreground mb-1">Risk Scanner</h3>
            <p className="text-xs text-muted-foreground">AI-powered analysis</p>
          </Card>
          
          <Card className="p-4 text-center bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
            <Sparkles className="h-8 w-8 text-accent mx-auto mb-2" />
            <h3 className="font-semibold text-sm text-foreground mb-1">AI Insights</h3>
            <p className="text-xs text-muted-foreground">Smart recommendations</p>
          </Card>
        </div>
      </div>

      {/* Pricing Plans */}
      <div className="p-4 space-y-4">
        {plans.map((plan) => (
          <Card key={plan.name} className={`p-6 relative overflow-hidden ${
            plan.popular 
              ? "bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30" 
              : "bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border-border/50"
          }`}>
            {plan.popular && (
              <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground">
                Most Popular
              </Badge>
            )}
            
            <div className="mb-4">
              <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                <span className="text-sm text-muted-foreground">/{plan.period}</span>
              </div>
            </div>

            <div className="space-y-2 mb-6">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Check size={16} className="text-success" />
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
              {plan.limitations.map((limitation, index) => (
                <div key={index} className="flex items-center gap-3 opacity-60">
                  <div className="w-4 h-4 rounded-full border border-muted-foreground/30" />
                  <span className="text-sm text-muted-foreground line-through">{limitation}</span>
                </div>
              ))}
            </div>

            <Button 
              variant={plan.buttonVariant}
              className="w-full"
              disabled={plan.name === "Free"}
            >
              {plan.buttonText}
            </Button>
          </Card>
        ))}
      </div>

      {/* Trust Indicators */}
      <div className="p-4 mt-8">
        <Card className="p-6 text-center bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border-border/50">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">10K+</div>
              <div className="text-xs text-muted-foreground">Active Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">$2.5B</div>
              <div className="text-xs text-muted-foreground">Tracked Volume</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">99.9%</div>
              <div className="text-xs text-muted-foreground">Uptime</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}