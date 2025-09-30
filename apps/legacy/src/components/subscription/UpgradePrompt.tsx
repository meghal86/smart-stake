import { Crown, Zap, ArrowRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";

interface UpgradePromptProps {
  feature: string;
  message: string;
  requiredPlan: 'pro' | 'premium';
  className?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
  feature,
  message,
  requiredPlan,
  className = ""
}) => {
  const navigate = useNavigate();

  const getPlanDetails = () => {
    if (requiredPlan === 'pro') {
      return {
        name: 'Pro',
        price: '$9.99',
        icon: <Zap className="h-5 w-5" />,
        gradient: 'from-success/20 to-success/5',
        border: 'border-success/30'
      };
    }
    return {
      name: 'Premium',
      price: '$19.99',
      icon: <Crown className="h-5 w-5" />,
      gradient: 'from-premium/20 to-premium/5',
      border: 'border-premium/30'
    };
  };

  const planDetails = getPlanDetails();

  return (
    <Card className={`bg-gradient-to-br ${planDetails.gradient} ${planDetails.border} ${className}`}>
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          {planDetails.icon}
          <Badge variant="outline" className="border-current">
            {planDetails.name} Feature
          </Badge>
        </div>
        <CardTitle className="text-lg">Unlock {feature}</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      
      <CardContent className="text-center">
        <div className="mb-4">
          <div className="text-2xl font-bold">{planDetails.price}</div>
          <div className="text-sm text-muted-foreground">per month</div>
        </div>
        
        <Button 
          className="w-full gap-2" 
          onClick={() => navigate('/subscription')}
        >
          Upgrade to {planDetails.name}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};