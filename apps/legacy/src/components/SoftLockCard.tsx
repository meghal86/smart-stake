import { Lock, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface SoftLockCardProps {
  feature: string;
  planHint?: 'pro' | 'premium' | 'enterprise';
  className?: string;
}

export function SoftLockCard({ feature, planHint = 'premium', className }: SoftLockCardProps) {
  const navigate = useNavigate();
  
  const planColors = {
    pro: 'bg-blue-500',
    premium: 'bg-purple-500', 
    enterprise: 'bg-orange-500'
  };
  
  return (
    <Card className={`p-6 text-center relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted/20 backdrop-blur-sm" />
      <div className="relative z-10">
        <div className="flex items-center justify-center mb-4">
          <div className={`p-3 rounded-full ${planColors[planHint]} bg-opacity-20`}>
            <Lock className="h-6 w-6 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-2">{feature}</h3>
        <p className="text-muted-foreground mb-4">
          Upgrade to {planHint.charAt(0).toUpperCase() + planHint.slice(1)} to unlock this feature
        </p>
        <div className="flex items-center justify-center gap-2 mb-4">
          <Badge variant="outline" className={`${planColors[planHint]} text-white border-0`}>
            <Zap className="h-3 w-3 mr-1" />
            {planHint.toUpperCase()}
          </Badge>
        </div>
        <Button 
          onClick={() => navigate('/subscription')}
          className="w-full"
        >
          Upgrade Now
        </Button>
      </div>
    </Card>
  );
}