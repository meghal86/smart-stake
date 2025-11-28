import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp } from 'lucide-react';
import OutcomeBadge from './OutcomeBadge';

interface HistoricalPrediction {
  id: string;
  date: string;
  asset: string;
  confidence: number;
  accuracy: number;
  realized_return: number;
  was_correct: boolean;
}

const mockHistoryData = [
  { date: '2025-01-15', accuracy: 75, confidence: 82 },
  { date: '2025-01-16', accuracy: 78, confidence: 85 },
  { date: '2025-01-17', accuracy: 72, confidence: 79 },
  { date: '2025-01-18', accuracy: 80, confidence: 88 },
  { date: '2025-01-19', accuracy: 76, confidence: 83 },
  { date: '2025-01-20', accuracy: 82, confidence: 87 },
  { date: '2025-01-21', accuracy: 79, confidence: 84 }
];

const mockPredictions: HistoricalPrediction[] = [
  {
    id: '1',
    date: '2025-01-20',
    asset: 'ETH',
    confidence: 0.85,
    accuracy: 82,
    realized_return: 0.032,
    was_correct: true
  },
  {
    id: '2',
    date: '2025-01-19',
    asset: 'BTC',
    confidence: 0.78,
    accuracy: 75,
    realized_return: -0.015,
    was_correct: false
  }
];

export function PredictionHistory() {
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  const handleExport = () => {
    const csv = [
      'Date,Asset,Confidence,Accuracy,Return,Correct',
      ...mockPredictions.map(p => 
        `${p.date},${p.asset},${p.confidence},${p.accuracy}%,${p.realized_return},${p.was_correct}`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prediction-history-${selectedPeriod}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Period Selection */}
      <div className="flex items-center justify-between">
        <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as unknown)}>
          <TabsList>
            <TabsTrigger value="7d">7 Days</TabsTrigger>
            <TabsTrigger value="30d">30 Days</TabsTrigger>
            <TabsTrigger value="90d">90 Days</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-1" />
          Export CSV
        </Button>
      </div>

      {/* Accuracy Trend Chart */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Accuracy vs Confidence Trend</h3>
        </div>
        
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={mockHistoryData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis domain={[60, 100]} />
            <Tooltip />
            <Line 
              type="monotone" 
              dataKey="accuracy" 
              stroke="#10b981" 
              strokeWidth={2}
              name="Accuracy %"
            />
            <Line 
              type="monotone" 
              dataKey="confidence" 
              stroke="#3b82f6" 
              strokeWidth={2}
              name="Confidence %"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Historical Predictions List */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Recent Predictions</h3>
        
        <div className="space-y-3">
          {mockPredictions.map((prediction) => (
            <div key={prediction.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant="outline">{prediction.asset}</Badge>
                <span className="text-sm">{prediction.date}</span>
                <span className="text-sm text-muted-foreground">
                  Confidence: {Math.round(prediction.confidence * 100)}%
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <OutcomeBadge 
                  wasCorrect={prediction.was_correct}
                  pct={prediction.realized_return}
                />
                <span className="text-sm text-muted-foreground">
                  {prediction.accuracy}% accuracy
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}