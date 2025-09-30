import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import { Save, RotateCcw, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAnalytics } from '@/hooks/useAnalytics';

interface PortfolioAsset {
  symbol: string;
  name: string;
  currentAllocation: number;
  currentValue: number;
  price: number;
  change24h: number;
}

interface WhatIfScenario {
  id: string;
  name: string;
  allocations: Record<string, number>;
  expectedReturn: number;
  riskScore: number;
  taxImpact: number;
  createdAt: Date;
}

interface PortfolioWhatIfModalProps {
  isOpen: boolean;
  onClose: () => void;
  assets: PortfolioAsset[];
  totalValue: number;
}

export function PortfolioWhatIfModal({ isOpen, onClose, assets, totalValue }: PortfolioWhatIfModalProps) {
  const { userPlan } = useSubscription();
  const { track } = useAnalytics();
  
  const [allocations, setAllocations] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    assets.forEach(asset => {
      initial[asset.symbol] = asset.currentAllocation;
    });
    return initial;
  });

  const [savedScenarios, setSavedScenarios] = useState<WhatIfScenario[]>([]);
  const [scenarioName, setScenarioName] = useState('');

  // Calculate rebalanced portfolio metrics
  const rebalancedMetrics = useMemo(() => {
    const totalAllocation = Object.values(allocations).reduce((sum, val) => sum + val, 0);
    
    // Normalize allocations to 100%
    const normalizedAllocations: Record<string, number> = {};
    Object.entries(allocations).forEach(([symbol, allocation]) => {
      normalizedAllocations[symbol] = (allocation / totalAllocation) * 100;
    });

    // Calculate new values
    const newValues: Record<string, number> = {};
    let totalNewValue = 0;
    
    Object.entries(normalizedAllocations).forEach(([symbol, allocation]) => {
      const newValue = (totalValue * allocation) / 100;
      newValues[symbol] = newValue;
      totalNewValue += newValue;
    });

    // Calculate expected return (mock calculation)
    const expectedReturn = Object.entries(normalizedAllocations).reduce((sum, [symbol, allocation]) => {
      const asset = assets.find(a => a.symbol === symbol);
      if (!asset) return sum;
      return sum + (allocation / 100) * asset.change24h;
    }, 0);

    // Calculate risk score (mock calculation based on allocation diversity)
    const diversity = Object.values(normalizedAllocations).length;
    const maxAllocation = Math.max(...Object.values(normalizedAllocations));
    const riskScore = Math.max(0, Math.min(100, 100 - diversity * 10 + maxAllocation));

    // Calculate tax impact (mock calculation)
    const totalRebalanceAmount = Object.entries(allocations).reduce((sum, [symbol, newAllocation]) => {
      const asset = assets.find(a => a.symbol === symbol);
      if (!asset) return sum;
      const currentValue = asset.currentValue;
      const newValue = (totalValue * newAllocation) / 100;
      return sum + Math.abs(newValue - currentValue);
    }, 0);
    
    const taxImpact = totalRebalanceAmount * (0.02 + Math.random() * 0.03); // 2-5% tax impact

    return {
      normalizedAllocations,
      newValues,
      totalNewValue,
      expectedReturn,
      riskScore,
      taxImpact
    };
  }, [allocations, assets, totalValue]);

  const handleAllocationChange = (symbol: string, value: number[]) => {
    setAllocations(prev => ({
      ...prev,
      [symbol]: value[0]
    }));
    
    track('whatif_allocation_changed', { symbol, value: value[0] });
  };

  const resetAllocations = () => {
    const original: Record<string, number> = {};
    assets.forEach(asset => {
      original[asset.symbol] = asset.currentAllocation;
    });
    setAllocations(original);
    track('whatif_reset');
  };

  const saveScenario = () => {
    if (!scenarioName.trim()) return;
    
    const scenario: WhatIfScenario = {
      id: Date.now().toString(),
      name: scenarioName,
      allocations: { ...rebalancedMetrics.normalizedAllocations },
      expectedReturn: rebalancedMetrics.expectedReturn,
      riskScore: rebalancedMetrics.riskScore,
      taxImpact: rebalancedMetrics.taxImpact,
      createdAt: new Date()
    };

    setSavedScenarios(prev => [...prev, scenario]);
    setScenarioName('');
    
    track('whatif_saved', { 
      scenarioName, 
      expectedReturn: rebalancedMetrics.expectedReturn,
      riskScore: rebalancedMetrics.riskScore 
    });
  };

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Portfolio Rebalancing Simulator
            <Badge variant="secondary" className="text-xs">What-If Analysis</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Allocation Sliders */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Adjust Allocations</h3>
              <div className="space-y-4">
                {assets.map(asset => (
                  <div key={asset.symbol} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{asset.symbol}</span>
                        <span className="text-sm text-muted-foreground">{asset.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm">
                          {formatPercentage(allocations[asset.symbol] || 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency((totalValue * (allocations[asset.symbol] || 0)) / 100)}
                        </div>
                      </div>
                    </div>
                    
                    <Slider
                      value={[allocations[asset.symbol] || 0]}
                      onValueChange={(value) => handleAllocationChange(asset.symbol, value)}
                      max={100}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Current: {formatPercentage(asset.currentAllocation)}</span>
                      <span>Change: {formatPercentage((allocations[asset.symbol] || 0) - asset.currentAllocation)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" onClick={resetAllocations}>
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Reset
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel - Analysis Results */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-3">Rebalancing Impact</h3>
              
              {/* Portfolio Metrics */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <Card className="p-3">
                  <div className="text-sm text-muted-foreground">Expected Return</div>
                  <div className={`text-lg font-bold ${rebalancedMetrics.expectedReturn >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {rebalancedMetrics.expectedReturn >= 0 ? '+' : ''}{formatPercentage(rebalancedMetrics.expectedReturn)}
                  </div>
                </Card>
                
                <Card className="p-3">
                  <div className="text-sm text-muted-foreground">Risk Score</div>
                  <div className={`text-lg font-bold ${
                    rebalancedMetrics.riskScore < 30 ? 'text-green-500' : 
                    rebalancedMetrics.riskScore < 70 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    {rebalancedMetrics.riskScore.toFixed(0)}/100
                  </div>
                </Card>
              </div>

              {/* Tax Impact Warning */}
              {rebalancedMetrics.taxImpact > 1000 && (
                <Card className="p-3 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
                  <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Tax Impact</span>
                  </div>
                  <div className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                    Estimated tax impact: {formatCurrency(rebalancedMetrics.taxImpact)}
                  </div>
                </Card>
              )}

              {/* Allocation Changes */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Allocation Changes</Label>
                {assets.map(asset => {
                  const change = (allocations[asset.symbol] || 0) - asset.currentAllocation;
                  if (Math.abs(change) < 0.1) return null;
                  
                  return (
                    <div key={asset.symbol} className="flex items-center justify-between text-sm">
                      <span>{asset.symbol}</span>
                      <span className={change >= 0 ? 'text-green-500' : 'text-red-500'}>
                        {change >= 0 ? '+' : ''}{formatPercentage(change)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Save Scenario (Premium only) */}
            {userPlan.plan !== 'free' && (
              <div className="space-y-3">
                <Separator />
                <div>
                  <Label className="text-sm font-medium">Save Scenario</Label>
                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="Scenario name..."
                      value={scenarioName}
                      onChange={(e) => setScenarioName(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border rounded-md"
                    />
                    <Button 
                      size="sm" 
                      onClick={saveScenario}
                      disabled={!scenarioName.trim()}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </Button>
                  </div>
                </div>

                {/* Saved Scenarios */}
                {savedScenarios.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Saved Scenarios</Label>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {savedScenarios.map(scenario => (
                        <div key={scenario.id} className="flex items-center justify-between text-xs p-2 bg-muted/50 rounded">
                          <span className="font-medium">{scenario.name}</span>
                          <div className="flex items-center gap-2">
                            <span className={scenario.expectedReturn >= 0 ? 'text-green-500' : 'text-red-500'}>
                              {formatPercentage(scenario.expectedReturn)}
                            </span>
                            <span className="text-muted-foreground">
                              Risk: {scenario.riskScore.toFixed(0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => track('whatif_apply_clicked')}>
            Apply Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}