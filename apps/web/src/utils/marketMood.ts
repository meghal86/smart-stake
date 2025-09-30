/**
 * Market mood calculation based on multiple indicators
 */

interface MarketIndicators {
  btcChange: number;
  ethChange: number;
  volume24h: number;
  activeWhales: number;
  riskScore: number;
  fearGreedIndex?: number;
}

export function calculateMarketMood(indicators: MarketIndicators): {
  mood: number;
  label: string;
  color: string;
  description: string;
} {
  const {
    btcChange,
    ethChange,
    volume24h,
    activeWhales,
    riskScore,
    fearGreedIndex = 50
  } = indicators;

  // Weight different factors
  const priceWeight = 0.4;
  const volumeWeight = 0.2;
  const whaleWeight = 0.2;
  const riskWeight = 0.1;
  const fearGreedWeight = 0.1;

  // Normalize price changes (-10% to +10% -> 0 to 100)
  const avgPriceChange = (btcChange + ethChange) / 2;
  const priceScore = Math.max(0, Math.min(100, 50 + (avgPriceChange * 5)));

  // Volume score (higher volume = more bullish)
  const volumeScore = Math.min(100, (volume24h / 1000000) * 10); // Normalize to billions

  // Whale activity score
  const whaleScore = Math.min(100, (activeWhales / 1000) * 100);

  // Risk score (inverted - lower risk = more bullish)
  const riskScoreNormalized = 100 - riskScore;

  // Calculate weighted mood
  const mood = Math.round(
    priceScore * priceWeight +
    volumeScore * volumeWeight +
    whaleScore * whaleWeight +
    riskScoreNormalized * riskWeight +
    fearGreedIndex * fearGreedWeight
  );

  // Determine label and color
  let label: string;
  let color: string;
  let description: string;

  if (mood >= 80) {
    label = 'Extremely Bullish';
    color = 'text-green-600';
    description = 'Strong positive momentum across all indicators';
  } else if (mood >= 65) {
    label = 'Bullish';
    color = 'text-green-500';
    description = 'Positive market sentiment with good fundamentals';
  } else if (mood >= 55) {
    label = 'Slightly Bullish';
    color = 'text-green-400';
    description = 'Cautiously optimistic market conditions';
  } else if (mood >= 45) {
    label = 'Neutral';
    color = 'text-yellow-500';
    description = 'Mixed signals, market direction unclear';
  } else if (mood >= 35) {
    label = 'Slightly Bearish';
    color = 'text-orange-500';
    description = 'Some negative pressure, proceed with caution';
  } else if (mood >= 20) {
    label = 'Bearish';
    color = 'text-red-500';
    description = 'Negative sentiment across multiple indicators';
  } else {
    label = 'Extremely Bearish';
    color = 'text-red-600';
    description = 'Strong selling pressure and negative sentiment';
  }

  return { mood, label, color, description };
}