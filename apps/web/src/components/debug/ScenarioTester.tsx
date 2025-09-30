import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScenarioForm, ScenarioInputs } from '@/components/scenarios/ScenarioForm';
import { ScenarioResult, ScenarioResult as ScenarioResultType } from '@/components/scenarios/ScenarioResult';
import { supabase } from '@/integrations/supabase/client';

export function ScenarioTester() {
  const [result, setResult] = useState<ScenarioResultType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleTest = async (inputs: ScenarioInputs) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('scenario-simulate', {
        body: { inputs }
      });

      if (error) throw error;
      
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <h2 className="text-lg font-semibold mb-4">Scenario System Test</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="font-medium mb-3">Test Form</h3>
          <ScenarioForm
            onRun={handleTest}
            onSave={() => {}}
            onCreateAlert={() => {}}
            isLoading={isLoading}
          />
          
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
              <Badge variant="destructive">Error</Badge>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          )}
        </div>
        
        <div>
          <h3 className="font-medium mb-3">Test Result</h3>
          {result ? (
            <ScenarioResult result={result} />
          ) : (
            <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-lg">
              Run a test scenario to see results
            </div>
          )}
        </div>
      </div>
      
      {/* Quick Test Buttons */}
      <div className="mt-6 pt-4 border-t">
        <h4 className="font-medium mb-3">Quick Tests</h4>
        <div className="flex gap-2 flex-wrap">
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleTest({
              asset: 'ETH',
              timeframe: '6h',
              whaleCount: 3,
              txnSize: 100,
              direction: 'accumulation',
              marketCondition: 'bull',
              cexFlowBias: 0
            })}
          >
            Bull Market Test
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleTest({
              asset: 'ETH',
              timeframe: '24h',
              whaleCount: 8,
              txnSize: 500,
              direction: 'distribution',
              marketCondition: 'bear',
              cexFlowBias: -1
            })}
          >
            Bear Market Test
          </Button>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => handleTest({
              asset: 'BTC',
              timeframe: '2h',
              whaleCount: 2,
              txnSize: 50,
              direction: 'accumulation',
              marketCondition: 'neutral',
              cexFlowBias: 1
            })}
          >
            BTC Test
          </Button>
        </div>
      </div>
    </Card>
  );
}