import React from 'react';
import { Badge } from '@/components/ui/badge';

interface ImpactLabelProps {
  confidence: number;
  predictionType: string;
}

export function ImpactLabel({ confidence, predictionType }: ImpactLabelProps) {
  const getImpactLevel = () => {
    if (confidence >= 0.8) return { level: 'High', color: 'bg-red-500' };
    if (confidence >= 0.65) return { level: 'Medium', color: 'bg-yellow-500' };
    return { level: 'Low', color: 'bg-green-500' };
  };

  const { level, color } = getImpactLevel();

  return (
    <Badge className={`${color} text-white text-xs`}>
      {level} Impact
    </Badge>
  );
}