import { useTier } from '@/hooks/useTier';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function TierDebug() {
  const { user } = useAuth();
  const { tier, loading, features } = useTier();

  if (!user) return null;

  return (
    <Card className="fixed bottom-4 right-4 p-4 max-w-sm z-50 bg-yellow-50 border-yellow-200">
      <div className="text-xs space-y-2">
        <div className="font-bold text-yellow-800">🐛 Tier Debug</div>
        
        <div>
          <span className="font-medium">Current Tier:</span>{' '}
          <Badge variant={tier === 'free' ? 'secondary' : 'default'}>
            {loading ? 'Loading...' : tier.toUpperCase()}
          </Badge>
        </div>
        
        <div>
          <span className="font-medium">User ID:</span>{' '}
          <span className="text-xs">{user.id?.slice(0, 8)}...</span>
        </div>
        
        <div>
          <span className="font-medium">User Metadata Plan:</span>{' '}
          <span className="text-xs">{user.user_metadata?.plan || 'None'}</span>
        </div>
        
        <div>
          <span className="font-medium">Features:</span>
          <div className="text-xs">
            <div>Predictions: {features.predictions_per_day === -1 ? '∞' : features.predictions_per_day}/day</div>
            <div>Exports: {features.exports ? '✅' : '❌'}</div>
            <div>Forensics: {features.forensics ? '✅' : '❌'}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}