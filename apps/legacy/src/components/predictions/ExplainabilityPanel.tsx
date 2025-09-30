import { X, Brain, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useExplainability } from '@/hooks/useExplainability';
import { Prediction } from '@/hooks/usePredictions';

interface ExplainabilityPanelProps {
  prediction: Prediction | null;
  onClose: () => void;
}

export function ExplainabilityPanel({ prediction, onClose }: ExplainabilityPanelProps) {
  const { data, loading } = useExplainability(prediction?.id || null);

  return (
    <Drawer open={!!prediction} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[80vh]">
        <DrawerHeader>
          <div className="flex items-center justify-between">
            <DrawerTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Prediction Explainability
            </DrawerTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DrawerHeader>
        
        <div className="p-4 space-y-6">
          {loading ? (
            <div className="space-y-4">
              <div className="h-4 bg-muted rounded animate-pulse"></div>
              <div className="h-20 bg-muted rounded animate-pulse"></div>
            </div>
          ) : data ? (
            <>
              <Card className="p-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Feature Importance
                </h4>
                <div className="space-y-3">
                  {Object.entries(data.importance).map(([feature, importance]) => (
                    <div key={feature}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{feature}</span>
                        <span>{Math.round(importance * 100)}%</span>
                      </div>
                      <Progress value={importance * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </Card>
              
              <Card className="p-4">
                <h4 className="font-medium mb-3">Feature Values</h4>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(data.features).map(([feature, value]) => (
                    <div key={feature} className="text-sm">
                      <div className="text-muted-foreground">{feature}</div>
                      <div className="font-medium">{value.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </Card>
              
              <Card className="p-4">
                <h4 className="font-medium mb-3">AI Explanation</h4>
                <p className="text-sm text-muted-foreground">{data.narrative}</p>
              </Card>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No explainability data available
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}