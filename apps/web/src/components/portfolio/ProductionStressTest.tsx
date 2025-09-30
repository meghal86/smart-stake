import { useState } from 'react';
import { Sliders, Play, RotateCcw, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useProductionStressTest } from '@/hooks/useProductionStressTest';

interface ProductionStressTestProps {
  portfolioData: {
    totalValue: number;
    holdings: Array<{
      token: string;
      qty: number;
      value: number;
      source: 'real' | 'simulated';
    }>;
    riskScore: number;
  };
}

const PRESET_SCENARIOS = [
  {
    name: "Market Crash",
    description: "Major market downturn with 30-50% drops",
    parameters: { ethChange: -35, btcChange: -30, altcoinChange: -50, correlationBreak: false, stablecoinDepeg: false }
  },
  {
    name: "Crypto Winter",
    description: "Extended bear market conditions",
    parameters: { ethChange: -60, btcChange: -55, altcoinChange: -75, correlationBreak: true, stablecoinDepeg: false }
  },
  {
    name: "Stablecoin Crisis",
    description: "Major stablecoin depegging event",
    parameters: { ethChange: -20, btcChange: -15, altcoinChange: -35, correlationBreak: true, stablecoinDepeg: true }
  },
  {
    name: "Bull Run",
    description: "Strong market rally across all assets",
    parameters: { ethChange: 50, btcChange: 40, altcoinChange: 80, correlationBreak: false, stablecoinDepeg: false }
  }
];

export function ProductionStressTest({ portfolioData }: ProductionStressTestProps) {
  const [ethChange, setEthChange] = useState([0]);
  const [btcChange, setBtcChange] = useState([0]);
  const [altcoinChange, setAltcoinChange] = useState([0]);
  const [correlationBreak, setCorrelationBreak] = useState(false);
  const [stablecoinDepeg, setStablecoinDepeg] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const { simulateScenario } = useProductionStressTest(portfolioData);

  const formatValue = (value: number) => {
    if (Math.abs(value) >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (Math.abs(value) >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const scenario = {
        ethChange: ethChange[0],
        btcChange: btcChange[0],
        altcoinChange: altcoinChange[0],
        correlationBreak,
        stablecoinDepeg
      };
      
      const simulationResult = await simulateScenario(scenario);
      setResult(simulationResult);
    } catch (error) {
      console.error('Simulation failed:', error);
    } finally {
      setIsSimulating(false);
    }
  };

  const resetSimulation = () => {
    setEthChange([0]);
    setBtcChange([0]);
    setAltcoinChange([0]);
    setCorrelationBreak(false);
    setStablecoinDepeg(false);
    setResult(null);
  };

  const applyPreset = (scenario: any) => {
    console.log('🎯 Applying preset scenario:', scenario);
    setEthChange([scenario.parameters.ethChange]);
    setBtcChange([scenario.parameters.btcChange]);
    setAltcoinChange([scenario.parameters.altcoinChange]);
    setCorrelationBreak(scenario.parameters.correlationBreak);
    setStablecoinDepeg(scenario.parameters.stablecoinDepeg);
    console.log('✅ Preset applied - ETH:', scenario.parameters.ethChange, 'BTC:', scenario.parameters.btcChange);
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sliders className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Live Portfolio Stress Test</h3>
          <Badge variant="outline" className="text-xs">Production Data</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={resetSimulation} size="sm">
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={runSimulation} disabled={isSimulating} size="sm">
            <Play className="h-4 w-4 mr-2" />
            {isSimulating ? 'Simulating...' : 'Run Test'}
          </Button>
        </div>
      </div>

      {/* Portfolio Summary */}
      <div className="mb-6 p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">Current Portfolio</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Value</p>
            <p className="font-bold">{formatValue(portfolioData.totalValue)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Holdings</p>
            <p className="font-bold">{portfolioData.holdings.length} tokens</p>
          </div>
          <div>
            <p className="text-muted-foreground">Risk Score</p>
            <p className="font-bold">{portfolioData.riskScore.toFixed(1)}/10</p>
          </div>
          <div>
            <p className="text-muted-foreground">Real Data</p>
            <p className="font-bold">
              {portfolioData.holdings.filter(h => h.source === 'real').length} tokens
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="custom" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="custom">Custom Scenario</TabsTrigger>
          <TabsTrigger value="presets">Preset Scenarios</TabsTrigger>
        </TabsList>

        <TabsContent value="custom" className="space-y-6">
          {/* Custom Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Ethereum</label>
                <span className={`text-sm font-medium ${ethChange[0] >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {ethChange[0] >= 0 ? '+' : ''}{ethChange[0]}%
                </span>
              </div>
              <Slider
                value={ethChange}
                onValueChange={setEthChange}
                max={100}
                min={-80}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Bitcoin</label>
                <span className={`text-sm font-medium ${btcChange[0] >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {btcChange[0] >= 0 ? '+' : ''}{btcChange[0]}%
                </span>
              </div>
              <Slider
                value={btcChange}
                onValueChange={setBtcChange}
                max={100}
                min={-80}
                step={5}
                className="w-full"
              />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-medium">Altcoins</label>
                <span className={`text-sm font-medium ${altcoinChange[0] >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {altcoinChange[0] >= 0 ? '+' : ''}{altcoinChange[0]}%
                </span>
              </div>
              <Slider
                value={altcoinChange}
                onValueChange={setAltcoinChange}
                max={150}
                min={-90}
                step={5}
                className="w-full"
              />
            </div>
          </div>

          {/* Advanced Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Correlation Break</p>
                <p className="text-sm text-muted-foreground">Assets move independently</p>
              </div>
              <Button
                variant={correlationBreak ? "default" : "outline"}
                size="sm"
                onClick={() => setCorrelationBreak(!correlationBreak)}
              >
                {correlationBreak ? 'On' : 'Off'}
              </Button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="font-medium">Stablecoin Depeg</p>
                <p className="text-sm text-muted-foreground">USDT/USDC lose peg</p>
              </div>
              <Button
                variant={stablecoinDepeg ? "default" : "outline"}
                size="sm"
                onClick={() => setStablecoinDepeg(!stablecoinDepeg)}
              >
                {stablecoinDepeg ? 'On' : 'Off'}
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="presets" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PRESET_SCENARIOS.map((scenario, index) => {
              const handleApplyClick = async () => {
                console.log('🔄 Apply button clicked for:', scenario.name);
                console.log('📊 Scenario parameters:', scenario.parameters);
                
                // Set the sliders
                setEthChange([scenario.parameters.ethChange]);
                setBtcChange([scenario.parameters.btcChange]);
                setAltcoinChange([scenario.parameters.altcoinChange]);
                setCorrelationBreak(scenario.parameters.correlationBreak);
                setStablecoinDepeg(scenario.parameters.stablecoinDepeg);
                
                // Automatically run the simulation
                setIsSimulating(true);
                try {
                  const simulationResult = await simulateScenario(scenario.parameters);
                  setResult(simulationResult);
                  console.log('🎯 Auto-simulation completed:', simulationResult);
                } catch (error) {
                  console.error('Auto-simulation failed:', error);
                } finally {
                  setIsSimulating(false);
                }
              };
              
              return (
                <div key={index} className="p-4 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{scenario.name}</h4>
                    <Button 
                      variant="default" 
                      size="sm" 
                      type="button"
                      onClick={handleApplyClick}
                      disabled={isSimulating}
                    >
                      {isSimulating ? 'Running...' : 'Apply & Run'}
                    </Button>
                  </div>
                <p className="text-sm text-muted-foreground mb-3">{scenario.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">ETH: {scenario.parameters.ethChange}%</Badge>
                  <Badge variant="outline">BTC: {scenario.parameters.btcChange}%</Badge>
                  <Badge variant="outline">ALT: {scenario.parameters.altcoinChange}%</Badge>
                </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Simulation Results */}
      {result && (
        <div className="mt-6 p-4 rounded-lg bg-muted/50 border">
          <h4 className="font-medium mb-4 flex items-center gap-2">
            Simulation Results
            {result.changePercent < -20 && <AlertTriangle className="h-4 w-4 text-red-500" />}
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Portfolio Value</p>
              <p className="text-lg font-bold">{formatValue(result.totalValue)}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Change</p>
              <div className="flex items-center gap-1">
                {result.changePercent >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-lg font-bold ${result.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.changePercent >= 0 ? '+' : ''}{result.changePercent.toFixed(1)}%
                </span>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Risk Score</p>
              <p className="text-lg font-bold">{result.riskScore.toFixed(1)}</p>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground">Impact</p>
              <p className={`text-lg font-bold ${result.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatValue(result.change)}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Worst Performer</p>
              <p className="font-medium text-red-600">{result.worstToken}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Best Performer</p>
              <p className="font-medium text-green-600">{result.bestToken}</p>
            </div>
          </div>

          {result.changePercent < -30 && (
            <Alert className="mt-4 border-red-200 bg-red-50 dark:bg-red-900/20">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Severe portfolio impact detected. Consider diversification or hedging strategies.
                Worst performing: {result.worstToken}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </Card>
  );
}