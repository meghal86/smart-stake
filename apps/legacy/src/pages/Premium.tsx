import { Crown, Check, Zap, Shield, TrendingUp, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";



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

const Premium = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 bg-gradient-to-br from-background to-background/80 pb-20">
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-2 text-foreground flex items-center gap-2">
          <Crown className="h-6 w-6 text-premium" /> Premium Plans
        </h1>
        <p className="text-muted-foreground mb-6">Choose the best plan for your DeFi journey.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, idx) => (
            <Card key={plan.name} className={`p-6 flex flex-col ${plan.popular ? 'border-2 border-premium shadow-lg' : ''}`}>
              <div className="flex items-center gap-2 mb-2">
                {plan.name === "Premium" && <Sparkles className="h-5 w-5 text-premium" />}
                {plan.name === "Pro" && <Zap className="h-5 w-5 text-success" />}
                {plan.name === "Free" && <Shield className="h-5 w-5 text-accent" />}
                <h2 className="text-xl font-bold">{plan.name}</h2>
                {plan.popular && <Badge variant="success">Most Popular</Badge>}
              </div>
              <div className="text-3xl font-bold mb-1">{plan.price}</div>
              <div className="text-muted-foreground mb-2">{plan.period}</div>
              <div className="mb-4">{plan.description}</div>
              <ul className="mb-4">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-success"><Check className="h-4 w-4" /> {f}</li>
                ))}
                {plan.limitations.map(l => (
                  <li key={l} className="flex items-center gap-2 text-muted-foreground"><Shield className="h-4 w-4" /> {l}</li>
                ))}
              </ul>
              <Button
                variant={plan.buttonVariant}
                className="w-full mt-auto"
                onClick={() => plan.name !== "Free" && navigate("/subscription")}
                disabled={plan.name === "Free"}
              >
                {plan.buttonText}
              </Button>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Premium;