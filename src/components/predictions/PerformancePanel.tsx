import { Download, TrendingUp, Target, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export function PerformancePanel() {
  const performanceMetrics = {
    accuracy: 87.5,
    totalPredictions: 1247,
    correctPredictions: 1091,
    avgConfidence: 82.3
  };

  const handleExportPDF = () => {
    // TODO: Implement PDF export
    console.log('Exporting PDF...');
  };

  const handleExportCSV = () => {
    // TODO: Implement CSV export
    console.log('Exporting CSV...');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Model Performance</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportPDF}>
            <Download className="h-4 w-4 mr-1" />
            PDF
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Accuracy</span>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {performanceMetrics.accuracy}%
          </div>
          <Progress value={performanceMetrics.accuracy} className="h-2 mt-2" />
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium">Total Predictions</span>
          </div>
          <div className="text-2xl font-bold">
            {performanceMetrics.totalPredictions.toLocaleString()}
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">Correct</span>
          </div>
          <div className="text-2xl font-bold text-purple-600">
            {performanceMetrics.correctPredictions.toLocaleString()}
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium">Avg Confidence</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {performanceMetrics.avgConfidence}%
          </div>
        </Card>
      </div>
      
      <Card className="p-4">
        <h4 className="font-medium mb-3">Recent Backtests</h4>
        <div className="space-y-3">
          {[
            { period: 'Last 7 days', accuracy: 89.2, predictions: 156 },
            { period: 'Last 30 days', accuracy: 87.8, predictions: 642 },
            { period: 'Last 90 days', accuracy: 86.1, predictions: 1891 }
          ].map((test, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="font-medium">{test.period}</div>
                <div className="text-sm text-muted-foreground">{test.predictions} predictions</div>
              </div>
              <div className="text-right">
                <div className="font-medium text-green-600">{test.accuracy}%</div>
                <div className="text-xs text-muted-foreground">accuracy</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}