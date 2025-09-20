import { Card } from '@/components/ui/card';

export function TestPredictionCard() {
  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Test Prediction Card</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-2 bg-muted rounded">
          <div className="text-xs text-muted-foreground">Whale Volume</div>
          <div className="font-medium">High (70%)</div>
        </div>
        <div className="p-2 bg-muted rounded">
          <div className="text-xs text-muted-foreground">Accumulation Pattern</div>
          <div className="font-medium">87%</div>
        </div>
        <div className="p-2 bg-muted rounded">
          <div className="text-xs text-muted-foreground">Time Clustering</div>
          <div className="font-medium">62%</div>
        </div>
        <div className="p-2 bg-muted rounded">
          <div className="text-xs text-muted-foreground">Market Sentiment</div>
          <div className="font-medium">71%</div>
        </div>
      </div>
    </Card>
  );
}