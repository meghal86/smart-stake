import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface ScenarioResult {
  asset: string;
  predictedImpact: number;
  riskScore: 'Low' | 'Medium' | 'High';
  confidence: number;
}

interface ScenarioResultsProps {
  results: ScenarioResult[];
}

export function ScenarioResults({ results }: ScenarioResultsProps) {
  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low': return 'bg-green-500';
      case 'Medium': return 'bg-yellow-500';
      case 'High': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatImpact = (impact: number) => {
    const sign = impact > 0 ? '+' : '';
    return `${sign}${impact.toFixed(1)}%`;
  };

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4" />
        Scenario Results
      </h3>
      
      <div className="space-y-3">
        {results.map((result, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-3">
              <Badge variant="outline">{result.asset}</Badge>
              <div className="flex items-center gap-1">
                {result.predictedImpact > 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className="font-medium">
                  Predicted impact: {formatImpact(result.predictedImpact)} {result.asset}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge className={`${getRiskColor(result.riskScore)} text-white text-xs`}>
                {result.riskScore} Risk
              </Badge>
              <span className="text-sm text-muted-foreground">
                {Math.round(result.confidence * 100)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}