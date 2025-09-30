import { useState } from 'react';
import { Play, Loader2, BarChart3 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useScenarioBuilder } from '@/hooks/useScenarioBuilder';

interface ScenarioBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ScenarioBuilderModal({ open, onOpenChange }: ScenarioBuilderModalProps) {
  const { run, loading, results } = useScenarioBuilder();
  const [params, setParams] = useState({
    whaleCount: 5,
    transactionSize: 1000,
    timeframe: '6h',
    chain: 'ethereum',
    token: 'ETH'
  });

  const handleRunSimulation = async () => {
    await run(params);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Scenario Builder
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Parameters */}
          <div className="space-y-4">
            <h3 className="font-medium">Simulation Parameters</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="whaleCount">Whale Count</Label>
                <Input
                  id="whaleCount"
                  type="number"
                  value={params.whaleCount}
                  onChange={(e) => setParams({...params, whaleCount: parseInt(e.target.value) || 0})}
                />
              </div>
              <div>
                <Label htmlFor="transactionSize">Transaction Size (ETH)</Label>
                <Input
                  id="transactionSize"
                  type="number"
                  value={params.transactionSize}
                  onChange={(e) => setParams({...params, transactionSize: parseInt(e.target.value) || 0})}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Chain</Label>
                <Select value={params.chain} onValueChange={(value) => setParams({...params, chain: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="polygon">Polygon</SelectItem>
                    <SelectItem value="bsc">BSC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Timeframe</Label>
                <Select value={params.timeframe} onValueChange={(value) => setParams({...params, timeframe: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">1 Hour</SelectItem>
                    <SelectItem value="6h">6 Hours</SelectItem>
                    <SelectItem value="24h">24 Hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button onClick={handleRunSimulation} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Running Simulation...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Simulation
                </>
              )}
            </Button>
          </div>
          
          {/* Results */}
          <div className="space-y-4">
            <h3 className="font-medium">Results ({results.length})</h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {results.map((result) => (
                <Card key={result.id} className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline">
                      {result.params.whaleCount} whales × {result.params.transactionSize} ETH
                    </Badge>
                    <Badge variant={result.priceImpact > 5 ? 'destructive' : 'secondary'}>
                      {result.priceImpact.toFixed(2)}% impact
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {result.params.chain} • {result.params.timeframe} • {Math.round(result.confidence * 100)}% confidence
                  </div>
                </Card>
              ))}
              
              {results.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No simulations run yet
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}