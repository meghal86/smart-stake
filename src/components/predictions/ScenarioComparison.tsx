import { useState } from 'react';
import { Save, Copy, Trash2, Play, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface Scenario {
  id: string;
  name: string;
  parameters: {
    asset: string;
    timeframe: string;
    whale_threshold: number;
    market_condition: string;
  };
  results: {
    predicted_price: number;
    confidence: number;
    risk_score: number;
  };
  created_at: string;
}

export function ScenarioComparison() {
  const [scenarios, setScenarios] = useState<Scenario[]>([
    {
      id: '1',
      name: 'Bull Market ETH',
      parameters: {
        asset: 'ETH',
        timeframe: '24h',
        whale_threshold: 1000,
        market_condition: 'bullish'
      },
      results: {
        predicted_price: 2450,
        confidence: 0.85,
        risk_score: 3.2
      },
      created_at: new Date().toISOString()
    }
  ]);

  const [currentScenario, setCurrentScenario] = useState({
    asset: 'ETH',
    timeframe: '24h',
    whale_threshold: 1000,
    market_condition: 'neutral'
  });

  const [scenarioName, setScenarioName] = useState('');
  const [isRunning, setIsRunning] = useState(false);

  const runScenario = async () => {
    setIsRunning(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const results = {
      predicted_price: Math.round(2000 + Math.random() * 1000),
      confidence: 0.7 + Math.random() * 0.3,
      risk_score: 1 + Math.random() * 8
    };
    
    setIsRunning(false);
    return results;
  };

  const saveScenario = async () => {
    if (!scenarioName.trim()) return;
    
    const results = await runScenario();
    const newScenario: Scenario = {
      id: Date.now().toString(),
      name: scenarioName,
      parameters: { ...currentScenario },
      results,
      created_at: new Date().toISOString()
    };
    
    setScenarios(prev => [...prev, newScenario]);
    setScenarioName('');
  };

  const deleteScenario = (id: string) => {
    setScenarios(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Scenario Builder */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Create New Scenario</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <Label>Asset</Label>
            <Select value={currentScenario.asset} onValueChange={(value) => 
              setCurrentScenario(prev => ({ ...prev, asset: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                <SelectItem value="USDC">USD Coin (USDC)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Timeframe</Label>
            <Select value={currentScenario.timeframe} onValueChange={(value) => 
              setCurrentScenario(prev => ({ ...prev, timeframe: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">1 Hour</SelectItem>
                <SelectItem value="24h">24 Hours</SelectItem>
                <SelectItem value="7d">7 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Whale Threshold (ETH)</Label>
            <Input 
              type="number" 
              value={currentScenario.whale_threshold}
              onChange={(e) => setCurrentScenario(prev => ({ 
                ...prev, 
                whale_threshold: Number(e.target.value) 
              }))}
            />
          </div>
          
          <div>
            <Label>Market Condition</Label>
            <Select value={currentScenario.market_condition} onValueChange={(value) => 
              setCurrentScenario(prev => ({ ...prev, market_condition: value }))
            }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bearish">Bearish</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="bullish">Bullish</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Input 
            placeholder="Scenario name (optional)"
            value={scenarioName}
            onChange={(e) => setScenarioName(e.target.value)}
            className="flex-1"
          />
          <Button onClick={runScenario} disabled={isRunning}>
            <Play className="h-4 w-4 mr-1" />
            {isRunning ? 'Running...' : 'Run'}
          </Button>
          <Button onClick={saveScenario} variant="outline" disabled={!scenarioName.trim()}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </Card>

      {/* Saved Scenarios */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Saved Scenarios</h3>
        
        {scenarios.length === 0 ? (
          <Card className="p-8 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No saved scenarios yet</p>
          </Card>
        ) : (
          <div className="grid gap-4">
            {scenarios.map((scenario) => (
              <Card key={scenario.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-medium">{scenario.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {new Date(scenario.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteScenario(scenario.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Parameters</p>
                    <div className="space-y-1">
                      <div className="flex gap-2">
                        <Badge variant="outline">{scenario.parameters.asset}</Badge>
                        <Badge variant="outline">{scenario.parameters.timeframe}</Badge>
                      </div>
                      <p>Threshold: {scenario.parameters.whale_threshold} ETH</p>
                      <p>Market: {scenario.parameters.market_condition}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground">Results</p>
                    <div className="space-y-1">
                      <p>Price: ${scenario.results.predicted_price}</p>
                      <p>Confidence: {Math.round(scenario.results.confidence * 100)}%</p>
                      <p>Risk: {scenario.results.risk_score.toFixed(1)}/10</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}