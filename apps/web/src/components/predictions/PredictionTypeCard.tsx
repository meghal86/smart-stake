import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Activity, Shuffle } from 'lucide-react';

interface PredictionTypeCardProps {
  predictionType: string;
  children: React.ReactNode;
}

export function PredictionTypeCard({ predictionType, children }: PredictionTypeCardProps) {
  const getTypeConfig = (type: string) => {
    switch (type) {
      case 'whale_activity':
        return {
          color: 'border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20',
          icon: <Activity className="h-4 w-4 text-blue-600" />,
          label: 'Whale Activity'
        };
      case 'price_movement':
        return {
          color: 'border-l-green-500 bg-green-50/50 dark:bg-green-950/20',
          icon: <TrendingUp className="h-4 w-4 text-green-600" />,
          label: 'Price Movement'
        };
      case 'cross_chain':
        return {
          color: 'border-l-purple-500 bg-purple-50/50 dark:bg-purple-950/20',
          icon: <Shuffle className="h-4 w-4 text-purple-600" />,
          label: 'Cross-Chain'
        };
      default:
        return {
          color: 'border-l-gray-500 bg-gray-50/50 dark:bg-gray-950/20',
          icon: <Activity className="h-4 w-4 text-gray-600" />,
          label: 'Unknown'
        };
    }
  };

  const config = getTypeConfig(predictionType);

  return (
    <Card className={`p-6 hover:shadow-lg transition-all duration-200 border-l-4 ${config.color}`}>
      <div className="flex items-center gap-2 mb-3">
        {config.icon}
        <Badge variant="outline" className="text-xs">
          {config.label}
        </Badge>
      </div>
      {children}
    </Card>
  );
}