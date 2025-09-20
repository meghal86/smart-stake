import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Zap } from 'lucide-react';

export function ModelPerformanceSummary() {
  const metrics = [
    { label: 'Accuracy', value: '73.2%', icon: <Target className="h-4 w-4" />, color: 'text-green-600' },
    { label: 'Precision', value: '68.5%', icon: <TrendingUp className="h-4 w-4" />, color: 'text-blue-600' },
    { label: 'Signals/Day', value: '12-18', icon: <Zap className="h-4 w-4" />, color: 'text-purple-600' }
  ];

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-sm">Model Performance</h3>
        <Badge variant="outline" className="text-xs">Live</Badge>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {metrics.map((metric) => (
          <div key={metric.label} className="text-center">
            <div className={`flex items-center justify-center mb-1 ${metric.color}`}>
              {metric.icon}
            </div>
            <div className="font-bold text-sm">{metric.value}</div>
            <div className="text-xs text-muted-foreground">{metric.label}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}