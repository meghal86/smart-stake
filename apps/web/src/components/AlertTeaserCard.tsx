import { Mail, Webhook, Crown, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useUserPlan } from '@/hooks/useUserPlan';

interface AlertTeaserCardProps {
  plan: 'premium' | 'enterprise';
}

export function AlertTeaserCard({ plan }: AlertTeaserCardProps) {
  const navigate = useNavigate();
  const { plan: userPlan } = useUserPlan();
  
  const features = {
    premium: {
      icon: Mail,
      title: 'Email Alerts',
      description: 'Get instant email notifications for whale movements',
      benefits: ['Real-time email delivery', 'Custom templates', 'HTML formatting'],
      color: 'bg-purple-500'
    },
    enterprise: {
      icon: Webhook,
      title: 'Webhook Integration',
      description: 'Connect to Slack, Discord, Zapier and more',
      benefits: ['JSON webhook payloads', 'Automation platforms', 'Custom integrations'],
      color: 'bg-orange-500'
    }
  };
  
  const feature = features[plan];
  const Icon = feature.icon;
  
  // Don't show if user already has this plan or higher
  const planHierarchy = { free: 0, pro: 1, premium: 2, enterprise: 3 };
  if (planHierarchy[userPlan] >= planHierarchy[plan]) {
    return null;
  }
  
  return (
    <Card className="p-4 border-2 border-dashed border-muted-foreground/20 bg-gradient-to-br from-muted/20 to-muted/10">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${feature.color} bg-opacity-20`}>
            <Icon className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <h3 className="font-medium">{feature.title}</h3>
            <p className="text-sm text-muted-foreground">{feature.description}</p>
          </div>
        </div>
        <Badge variant="outline" className={`${feature.color} text-white border-0`}>
          <Crown className="h-3 w-3 mr-1" />
          {plan.toUpperCase()}
        </Badge>
      </div>
      
      <div className="space-y-2 mb-4">
        {feature.benefits.map((benefit, idx) => (
          <div key={idx} className="flex items-center gap-2 text-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-muted-foreground">{benefit}</span>
          </div>
        ))}
      </div>
      
      <Button 
        onClick={() => navigate('/subscription')}
        className="w-full"
        size="sm"
      >
        Upgrade to {plan.charAt(0).toUpperCase() + plan.slice(1)}
        <ArrowRight className="h-4 w-4 ml-2" />
      </Button>
    </Card>
  );
}