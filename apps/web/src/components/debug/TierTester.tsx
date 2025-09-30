import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TieredPredictionCard } from '@/components/predictions/TieredPredictionCard';
import { QuotaProgressBar } from '@/components/ui/QuotaProgressBar';

const mockPrediction = {
  id: 'test-1',
  asset: 'ETH',
  confidence: 0.85,
  prediction_type: 'whale_activity',
  explanation: 'Large whale accumulation detected with 3 major transactions totaling $2.1M in the last 6 hours.',
  features: {
    whale_volume: { score: 0.85 },
    accumulation_pattern: { score: 0.78 },
    time_clustering: { score: 0.62 },
    market_sentiment: { score: 0.71 }
  }
};

export function TierTester() {
  const [testTier, setTestTier] = useState<string>('guest');

  // Simulate tier by updating localStorage
  const setTier = (tier: string) => {
    setTestTier(tier);
    // This would normally be handled by your auth system
    localStorage.setItem('test_tier', tier);
    window.location.reload();
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="p-4">
        <h2 className="text-lg font-semibold mb-4">Tier Testing</h2>
        <div className="flex gap-2 flex-wrap">
          {['guest', 'free', 'pro', 'premium', 'enterprise'].map((tier) => (
            <Button
              key={tier}
              variant={testTier === tier ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTier(tier)}
            >
              {tier.toUpperCase()}
            </Button>
          ))}
        </div>
        <div className="mt-4">
          <Badge variant="secondary">Current Test Tier: {testTier.toUpperCase()}</Badge>
        </div>
      </Card>

      <QuotaProgressBar />

      <TieredPredictionCard prediction={mockPrediction}>
        {/* Content handled by TieredPredictionCard */}
      </TieredPredictionCard>
    </div>
  );
}