import { Crown, Zap, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PlanBadgeProps {
  plan: 'free' | 'pro' | 'premium';
  className?: string;
}

export const PlanBadge: React.FC<PlanBadgeProps> = ({ plan, className = "" }) => {
  const getPlanConfig = () => {
    switch (plan) {
      case 'pro':
        return {
          label: 'Pro',
          icon: <Zap className="h-3 w-3" />,
          variant: 'success' as const
        };
      case 'premium':
        return {
          label: 'Premium',
          icon: <Crown className="h-3 w-3" />,
          variant: 'premium' as const
        };
      default:
        return {
          label: 'Free',
          icon: <Shield className="h-3 w-3" />,
          variant: 'outline' as const
        };
    }
  };

  const config = getPlanConfig();

  return (
    <Badge variant={config.variant} className={`gap-1 ${className}`}>
      {config.icon}
      {config.label}
    </Badge>
  );
};