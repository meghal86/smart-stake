'use client';

interface ConfidenceChipProps {
  amount: number;
  walletActivity?: number;
}

export function ConfidenceChip({ amount, walletActivity = 5 }: ConfidenceChipProps) {
  // Simple heuristic for confidence based on amount and wallet activity
  const getConfidence = () => {
    const amountScore = amount > 1000000 ? 3 : amount > 100000 ? 2 : 1;
    const activityScore = walletActivity > 10 ? 3 : walletActivity > 5 ? 2 : 1;
    const total = amountScore + activityScore;
    
    if (total >= 5) return { level: 'High', color: 'bg-green-100 text-green-700' };
    if (total >= 3) return { level: 'Med', color: 'bg-yellow-100 text-yellow-700' };
    return { level: 'Low', color: 'bg-red-100 text-red-700' };
  };

  const confidence = getConfidence();

  return (
    <span className={`text-xs px-2 py-1 rounded ${confidence.color}`}>
      {confidence.level} Confidence
    </span>
  );
}