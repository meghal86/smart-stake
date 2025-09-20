import { useState, useEffect } from 'react';

interface ExplainabilityData {
  features: Record<string, number>;
  importance: Record<string, number>;
  narrative: string;
}

export function useExplainability(predictionId: string | null) {
  const [data, setData] = useState<ExplainabilityData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!predictionId) {
      setData(null);
      return;
    }

    setLoading(true);
    // Mock explainability data - in production this would call an API
    setTimeout(() => {
      setData({
        features: {
          'Whale Volume': 0.85,
          'Market Sentiment': 0.72,
          'Technical Indicators': 0.68,
          'Liquidity Depth': 0.61
        },
        importance: {
          'Whale Volume': 0.35,
          'Market Sentiment': 0.25,
          'Technical Indicators': 0.25,
          'Liquidity Depth': 0.15
        },
        narrative: 'This prediction is primarily driven by unusual whale accumulation patterns (35% weight), supported by positive market sentiment and technical breakout signals.'
      });
      setLoading(false);
    }, 500);
  }, [predictionId]);

  return { data, loading };
}