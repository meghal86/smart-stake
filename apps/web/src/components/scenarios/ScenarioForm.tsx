import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Play, Save, Bell } from 'lucide-react';
import { useTier } from '@/hooks/useTier';
import { useToast } from '@/hooks/use-toast';

export interface ScenarioInputs {
  asset: string;
  timeframe: string;
  whaleCount: number;
  txnSize: number;
  direction: string;
  marketCondition: string;
  cexFlowBias: number;
}

interface ScenarioFormProps {
  onRun: (inputs: ScenarioInputs) => void;
  onSave: (inputs: ScenarioInputs, name: string) => void;
  onCreateAlert: (inputs: ScenarioInputs) => void;
  isLoading?: boolean;
}

export function ScenarioForm({ onRun, onSave, onCreateAlert, isLoading }: ScenarioFormProps) {
  const { tier, isPro, isPremium, isEnterprise } = useTier();
  const { toast } = useToast();
  const canSave = isPro || isPremium || isEnterprise;
  const [inputs, setInputs] = useState<ScenarioInputs>({
    asset: 'ETH',
    timeframe: '6h',
    whaleCount: 3,
    txnSize: 100,
    direction: 'accumulation',
    marketCondition: 'neutral',
    cexFlowBias: 0
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Debounced validation
  const validateInputs = useCallback(() => {
    const newErrors: Record<string, string> = {};
    
    if (inputs.whaleCount < 1 || inputs.whaleCount > 10) {
      newErrors.whaleCount = 'Whale count must be between 1-10';
    }
    if (inputs.txnSize <= 0 || inputs.txnSize > 10000) {
      newErrors.txnSize = 'Transaction size must be between 1-10,000 ETH';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [inputs]);

  useEffect(() => {
    const timer = setTimeout(validateInputs, 250);
    return () => clearTimeout(timer);
  }, [validateInputs]);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">What-If Scenario Builder</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Asset</Label>
            <Select value={inputs.asset} onValueChange={(value) => setInputs({...inputs, asset: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ETH">ETH</SelectItem>
                {tier !== 'free' && <SelectItem value="BTC">BTC</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Timeframe</Label>
            <Select value={inputs.timeframe} onValueChange={(value) => setInputs({...inputs, timeframe: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2h">2 hours</SelectItem>
                <SelectItem value="6h">6 hours</SelectItem>
                {tier !== 'free' && <SelectItem value="24h">24 hours</SelectItem>}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Whale Count: {inputs.whaleCount}</Label>
            <Slider
              value={[inputs.whaleCount]}
              onValueChange={([value]) => setInputs({...inputs, whaleCount: value})}
              max={10}
              min={1}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <Label>Transaction Size (ETH)</Label>
            <Input
              type="number"
              value={inputs.txnSize}
              onChange={(e) => setInputs({...inputs, txnSize: Number(e.target.value)})}
            />
          </div>

          <div className="space-y-2">
            <Label>Direction</Label>
            <Select value={inputs.direction} onValueChange={(value) => setInputs({...inputs, direction: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="accumulation">Accumulation</SelectItem>
                <SelectItem value="distribution">Distribution</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Market Condition</Label>
            <Select value={inputs.marketCondition} onValueChange={(value) => setInputs({...inputs, marketCondition: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bull">Bull Market</SelectItem>
                <SelectItem value="neutral">Neutral</SelectItem>
                <SelectItem value="bear">Bear Market</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Validation Errors */}
        {Object.keys(errors).length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            {Object.entries(errors).map(([field, error]) => (
              <div key={field} className="text-sm text-red-700">{error}</div>
            ))}
          </div>
        )}

        <div className="flex gap-2 pt-4">
          <Button 
            onClick={() => {
              if (validateInputs()) {
                onRun(inputs);
              } else {
                toast({
                  title: "Invalid Inputs",
                  description: "Please fix validation errors before running.",
                  variant: "destructive"
                });
              }
            }} 
            disabled={isLoading || Object.keys(errors).length > 0} 
            className="flex-1"
          >
            <Play className="h-4 w-4 mr-2" />
            {isLoading ? 'Running...' : 'Run Simulation'}
          </Button>
          
          {canSave && (
            <Button variant="outline" onClick={() => {
              const name = prompt('Scenario name:') || `Scenario ${new Date().toLocaleDateString()}`;
              onSave(inputs, name);
            }}>
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
          )}
          
          {isEnterprise && (
            <Button variant="outline" onClick={() => onCreateAlert(inputs)}>
              <Bell className="h-4 w-4 mr-2" />
              Alert
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}