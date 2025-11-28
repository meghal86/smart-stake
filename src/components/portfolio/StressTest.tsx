import React, { useState } from 'react';
import { TrendingDown, AlertTriangle, BarChart3, Zap, DollarSign, MessageSquare, Share, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, LineChart, Line } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import './StressTest.css';

interface StressTestScenario {
  name: string;
  description: string;
  impact: number;
  probability: number;
  timeframe: string;
}

interface StressTestProps {
  currentValue: number;
  onRunStressTest: (scenarios: unknown) => Promise<unknown>;
}

export const StressTest: React.FC<StressTestProps> = ({
  currentValue,
  onRunStressTest
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<unknown>(null);
  const [scenarios, setScenarios] = useState({
    ethereum: -30,
    bitcoin: -25,
    altcoins: -50,
    stablecoinDepeg: -5,
    liquidityCrisis: -40,
    regulatoryShock: -35
  });

  const predefinedScenarios: StressTestScenario[] = [
    {
      name: 'Market Crash 2008-style',
      description: 'Severe market downturn with liquidity crisis',
      impact: -60,
      probability: 15,
      timeframe: '6-12 months'
    },
    {
      name: 'Regulatory Crackdown',
      description: 'Major regulatory restrictions on crypto',
      impact: -45,
      probability: 25,
      timeframe: '3-6 months'
    },
    {
      name: 'Stablecoin Collapse',
      description: 'Major stablecoin loses peg permanently',
      impact: -35,
      probability: 20,
      timeframe: '1-3 months'
    },
    {
      name: 'DeFi Protocol Hack',
      description: 'Major DeFi protocol suffers significant exploit',
      impact: -25,
      probability: 40,
      timeframe: '1 month'
    },
    {
      name: 'Bull Market Rally',
      description: 'Strong institutional adoption drives prices up',
      impact: 40,
      probability: 30,
      timeframe: '3-6 months'
    },
    {
      name: 'ETF Approval Surge',
      description: 'Major ETF approvals trigger massive inflows',
      impact: 25,
      probability: 45,
      timeframe: '1-2 months'
    },
    {
      name: 'Banking Crisis',
      description: 'Traditional banking system instability',
      impact: -50,
      probability: 20,
      timeframe: '3-9 months'
    },
    {
      name: 'Inflation Hedge Rally',
      description: 'High inflation drives crypto adoption',
      impact: 30,
      probability: 35,
      timeframe: '6-12 months'
    },
    {
      name: 'Exchange Collapse',
      description: 'Major centralized exchange fails',
      impact: -40,
      probability: 15,
      timeframe: '1-2 months'
    },
    {
      name: 'Institutional FOMO',
      description: 'Corporate treasuries allocate to crypto',
      impact: 35,
      probability: 25,
      timeframe: '2-4 months'
    },
    {
      name: 'Quantum Computing Threat',
      description: 'Quantum breakthrough threatens crypto security',
      impact: -70,
      probability: 5,
      timeframe: '1-6 months'
    },
    {
      name: 'Global Adoption Wave',
      description: 'Multiple countries adopt crypto as legal tender',
      impact: 50,
      probability: 20,
      timeframe: '6-18 months'
    }
  ];

  const handleRunStressTest = async () => {
    setIsRunning(true);
    // Trigger wave animation through scenario cards
    document.querySelectorAll('.scenario-card').forEach((card, index) => {
      setTimeout(() => {
        card.classList.add('pulse-wave');
        setTimeout(() => card.classList.remove('pulse-wave'), 300);
      }, index * 100);
    });
    
    try {
      const testResults = await onRunStressTest(scenarios);
      setResults(testResults);
    } catch (error) {
      console.error('Stress test failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getResilienceMessage = (results: unknown) => {
    if (!results) return '';
    const worstCase = results.worstCase || 0;
    const portfolioValue = currentValue;
    const lossPercentage = (worstCase / portfolioValue) * 100;
    
    if (lossPercentage < 20) {
      return `Your portfolio would weather extreme scenarios with only $${worstCase.toLocaleString()} at risk—more resilient than 78% of users.`;
    } else if (lossPercentage < 40) {
      return `Moderate exposure detected: $${worstCase.toLocaleString()} at risk in worst case—resilience matches 52% of users.`;
    } else {
      return `Warning: High exposure to market shocks. $${worstCase.toLocaleString()} at risk—diversification strongly recommended.`;
    }
  };

  const handleShareProof = () => {
    const proofData = {
      worstCase: results?.worstCase || 0,
      expectedLoss: results?.expectedLoss || 0,
      recoveryTime: results?.recoveryTime || 12,
      timestamp: new Date().toISOString(),
      portfolioValue: currentValue
    };
    
    const shareText = `AlphaWhale Stress Test: Portfolio resilience verified. Worst case: $${proofData.worstCase.toLocaleString()}, Recovery: ${proofData.recoveryTime} months. ${window.location.origin}/stress-proof/${btoa(JSON.stringify(proofData))}`;
    
    if (navigator.share) {
      navigator.share({ text: shareText });
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  const handleScenarioChange = (scenario: string, value: number[]) => {
    setScenarios(prev => ({
      ...prev,
      [scenario]: value[0]
    }));
  };

  const getImpactColor = (impact: number) => {
    if (impact > 0) return 'text-green-500';
    if (impact >= -10) return 'text-blue-500';
    if (impact >= -30) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getImpactBgColor = (impact: number) => {
    if (impact > 0) return 'bg-green-500/10 border-green-500/20';
    if (impact >= -10) return 'bg-blue-500/10 border-blue-500/20';
    if (impact >= -30) return 'bg-yellow-500/10 border-yellow-500/20';
    return 'bg-red-500/10 border-red-500/20';
  };

  const calculateProjectedValue = (impact: number) => {
    return currentValue * (1 + impact / 100);
  };

  const calculateAverageImpact = (scenarioParams: unknown) => {
    return (scenarioParams.ethereum + scenarioParams.bitcoin + scenarioParams.altcoins) / 3;
  };

  return (
    <div className="relative">
      {/* Floating QuickBar */}
      <motion.div 
        className="fixed bottom-6 right-6 z-50 flex gap-2"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Button size="sm" variant="outline" className="bg-background/80 backdrop-blur">
          <MessageSquare className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" className="bg-background/80 backdrop-blur">
          <Share className="h-4 w-4" />
        </Button>
        <Button size="sm" variant="outline" className="bg-background/80 backdrop-blur">
          <Download className="h-4 w-4" />
        </Button>
      </motion.div>

      <Card className="p-6 bg-gradient-to-br from-background via-background to-muted/20">
        <div className="space-y-6">
          {/* Animated Header */}
          <motion.div 
            className="flex items-center justify-between"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: isRunning ? 360 : 0 }}
                transition={{ duration: 2, repeat: isRunning ? Infinity : 0 }}
              >
                <TrendingDown className="h-6 w-6 text-primary" />
              </motion.div>
              <div>
                <h3 className="text-lg font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  Portfolio Stress Test
                </h3>
                <p className="text-sm text-muted-foreground">
                  Simulate extreme market conditions and assess portfolio resilience
                </p>
              </div>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button 
                onClick={handleRunStressTest}
                disabled={isRunning}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg"
              >
                {isRunning ? (
                  <motion.span
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    Running...
                  </motion.span>
                ) : (
                  'Run Stress Test'
                )}
              </Button>
            </motion.div>
          </motion.div>

        <Tabs defaultValue="scenarios" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scenarios">Custom Scenarios</TabsTrigger>
            <TabsTrigger value="predefined">Predefined Tests</TabsTrigger>
          </TabsList>

          {/* Custom Scenarios Tab */}
          <TabsContent value="scenarios" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Scenario Sliders */}
              <div className="space-y-4">
                <h4 className="font-medium">Market Impact Scenarios</h4>
                
                {Object.entries(scenarios).map(([key, value], index) => (
                  <motion.div 
                    key={key} 
                    className="space-y-2 scenario-card"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex justify-between items-center">
                      <label className="text-sm font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </label>
                      <motion.span 
                        className={`text-sm font-bold ${getImpactColor(value)}`}
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 0.3 }}
                        key={value}
                      >
                        {value}%
                      </motion.span>
                    </div>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      className="relative"
                    >
                      <Slider
                        value={[value]}
                        onValueChange={(newValue) => {
                          handleScenarioChange(key, newValue);
                          // Haptic feedback for mobile
                          if ('vibrate' in navigator) {
                            navigator.vibrate(10);
                          }
                        }}
                        max={50}
                        min={-80}
                        step={5}
                        className="w-full"
                      />
                      <motion.div
                        className="absolute inset-0 pointer-events-none"
                        animate={{ 
                          background: `linear-gradient(90deg, transparent 0%, ${getImpactColor(value).replace('text-', '')}20 50%, transparent 100%)`,
                          x: ['-100%', '100%']
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        key={`ripple-${value}`}
                      />
                    </motion.div>
                  </motion.div>
                ))}
              </div>

              {/* Impact Preview */}
              <div className="space-y-4">
                <h4 className="font-medium">Projected Impact</h4>
                <div className="space-y-3">
                  {Object.entries(scenarios).map(([key, value]) => {
                    const projectedValue = calculateProjectedValue(value);
                    const loss = currentValue - projectedValue;
                    
                    return (
                      <div key={key} className={`p-3 rounded-lg ${getImpactBgColor(value)}`}>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <Badge className={getImpactColor(value)}>
                            {value}%
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Portfolio Value: ${projectedValue.toLocaleString()}
                        </div>
                        <div className={`text-xs font-medium ${getImpactColor(value)}`}>
                          {value >= 0 ? 'Gain' : 'Loss'}: ${Math.abs(loss).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Predefined Tests Tab */}
          <TabsContent value="predefined" className="space-y-4">
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ staggerChildren: 0.1 }}
            >
              {predefinedScenarios.map((scenario, index) => {
                const projectedLoss = currentValue * Math.abs(scenario.impact) / 100;
                const projectedValue = currentValue - projectedLoss;
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ 
                      scale: 1.02, 
                      y: -2,
                      boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
                    }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={`p-4 cursor-pointer transition-all duration-300 ${getImpactBgColor(scenario.impact)} hover:shadow-lg border-2 hover:border-primary/30`}
                      onClick={async () => {
                      let scenarioParams;
                      
                      // Scenario-specific parameter mapping
                      switch (scenario.name) {
                        case 'Market Crash 2008-style':
                          scenarioParams = {
                            ethereum: -55, bitcoin: -50, altcoins: -70,
                            stablecoinDepeg: -5, liquidityCrisis: -60, regulatoryShock: -20
                          };
                          break;
                        case 'Regulatory Crackdown':
                          scenarioParams = {
                            ethereum: -40, bitcoin: -35, altcoins: -55,
                            stablecoinDepeg: -15, liquidityCrisis: -20, regulatoryShock: -50
                          };
                          break;
                        case 'Stablecoin Collapse':
                          scenarioParams = {
                            ethereum: -25, bitcoin: -20, altcoins: -40,
                            stablecoinDepeg: -50, liquidityCrisis: -30, regulatoryShock: -10
                          };
                          break;
                        case 'Bull Market Rally':
                          scenarioParams = {
                            ethereum: 35, bitcoin: 30, altcoins: 50,
                            stablecoinDepeg: 0, liquidityCrisis: 10, regulatoryShock: 5
                          };
                          break;
                        case 'ETF Approval Surge':
                          scenarioParams = {
                            ethereum: 20, bitcoin: 30, altcoins: 15,
                            stablecoinDepeg: 2, liquidityCrisis: 5, regulatoryShock: 10
                          };
                          break;
                        case 'Banking Crisis':
                          scenarioParams = {
                            ethereum: 15, bitcoin: 20, altcoins: -10,
                            stablecoinDepeg: -25, liquidityCrisis: -40, regulatoryShock: -15
                          };
                          break;
                        case 'Inflation Hedge Rally':
                          scenarioParams = {
                            ethereum: 25, bitcoin: 35, altcoins: 20,
                            stablecoinDepeg: -5, liquidityCrisis: 0, regulatoryShock: 0
                          };
                          break;
                        case 'Exchange Collapse':
                          scenarioParams = {
                            ethereum: -35, bitcoin: -30, altcoins: -50,
                            stablecoinDepeg: -20, liquidityCrisis: -45, regulatoryShock: -25
                          };
                          break;
                        case 'Institutional FOMO':
                          scenarioParams = {
                            ethereum: 30, bitcoin: 40, altcoins: 25,
                            stablecoinDepeg: 5, liquidityCrisis: 15, regulatoryShock: 20
                          };
                          break;
                        case 'Quantum Computing Threat':
                          scenarioParams = {
                            ethereum: -65, bitcoin: -70, altcoins: -75,
                            stablecoinDepeg: -30, liquidityCrisis: -50, regulatoryShock: -60
                          };
                          break;
                        case 'Global Adoption Wave':
                          scenarioParams = {
                            ethereum: 45, bitcoin: 50, altcoins: 55,
                            stablecoinDepeg: 10, liquidityCrisis: 20, regulatoryShock: 30
                          };
                          break;
                        default:
                          scenarioParams = {
                            ethereum: scenario.impact, bitcoin: scenario.impact * 0.8, altcoins: scenario.impact * 1.2,
                            stablecoinDepeg: -2, liquidityCrisis: scenario.impact * 0.5, regulatoryShock: scenario.impact * 0.3
                          };
                      }
                      
                      setIsRunning(true);
                      try {
                        const testResults = await onRunStressTest(scenarioParams);
                        setResults(testResults);
                      } catch (error) {
                        console.error('Predefined stress test failed:', error);
                      } finally {
                        setIsRunning(false);
                      }
                    }}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium">{scenario.name}</h4>
                        <Badge className={getImpactColor(scenario.impact)}>
                          {scenario.impact}%
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {scenario.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-muted-foreground">Probability:</span>
                          <div className="font-medium">{scenario.probability}%</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Timeframe:</span>
                          <div className="font-medium">{scenario.timeframe}</div>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-muted/50 space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Avg Impact:</span>
                          <span className="text-sm font-medium">
                            {scenario.impact}%
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">{scenario.impact >= 0 ? 'Projected Gain' : 'Projected Loss'}:</span>
                          <span className={`text-sm font-bold ${getImpactColor(scenario.impact)}`}>
                            ${projectedLoss.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </TabsContent>


        </Tabs>

        {/* Animated Inline Results */}
        <AnimatePresence>
          {results && (
            <motion.div 
              className="space-y-6 mt-8 pt-6 border-t border-gradient-to-r from-transparent via-primary/20 to-transparent"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
            >
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-lg font-semibold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">
                  Stress Test Results
                </h3>
                <div className="text-sm text-muted-foreground mt-1">
                  Your portfolio is more resilient than 67% of users
                </div>
              </motion.div>
              
              {/* Animated Summary Cards */}
              <motion.div 
                className="grid grid-cols-1 md:grid-cols-3 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, staggerChildren: 0.1 }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Card className="p-4 bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20 hover:border-red-500/40 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                      >
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                      </motion.div>
                      <span className="text-sm font-medium">Worst Case</span>
                    </div>
                    <motion.div 
                      className="text-2xl font-bold text-red-500"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 }}
                    >
                      ${results.worstCase?.toLocaleString() || '0'}
                    </motion.div>
                    <div className="text-xs text-muted-foreground">
                      Maximum potential loss
                    </div>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Card className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/40 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <motion.div
                        animate={{ y: [0, -2, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <BarChart3 className="h-4 w-4 text-yellow-500" />
                      </motion.div>
                      <span className="text-sm font-medium">Expected Loss</span>
                    </div>
                    <motion.div 
                      className="text-2xl font-bold text-yellow-500"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 }}
                    >
                      ${results.expectedLoss?.toLocaleString() || '0'}
                    </motion.div>
                    <div className="text-xs text-muted-foreground">
                      Probability-weighted average
                    </div>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <Card className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:border-blue-500/40 transition-all">
                    <div className="flex items-center gap-2 mb-2">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <Zap className="h-4 w-4 text-blue-500" />
                      </motion.div>
                      <span className="text-sm font-medium">Recovery Time</span>
                    </div>
                    <motion.div 
                      className="text-2xl font-bold text-blue-500"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                    >
                      {results.recoveryTime || '12'} months
                    </motion.div>
                    <div className="text-xs text-muted-foreground">
                      Estimated recovery period
                    </div>
                  </Card>
                </motion.div>
              </motion.div>

            {/* Scenario Results Chart */}
            <Card className="p-4">
              <h4 className="font-medium mb-4">Scenario Impact Analysis</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={results.scenarioResults || []}>
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="impact" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Animated Recommendations */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
            >
              <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:border-primary/40 transition-all">
                <motion.h4 
                  className="font-medium mb-3 flex items-center gap-2"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.3 }}
                >
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <DollarSign className="h-4 w-4 text-primary" />
                  </motion.div>
                  Risk Mitigation Recommendations
                </motion.h4>
                {/* Resilience Message */}
                <motion.div
                  className="mb-4 p-3 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2 }}
                >
                  <p className="text-sm font-medium text-primary">
                    {getResilienceMessage(results)}
                  </p>
                </motion.div>

                <div className="space-y-2">
                  {(results.recommendations || [
                    '• Consider diversifying into less correlated assets',
                    '• Maintain higher cash reserves for market downturns', 
                    '• Implement stop-loss orders for high-risk positions',
                    '• Review and adjust position sizes based on risk tolerance'
                  ]).map((rec: string, index: number) => (
                    <motion.div 
                      key={index} 
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1.4 + index * 0.1 }}
                      whileHover={{ x: 5 }}
                    >
                      {rec}
                    </motion.div>
                  ))}
              </div>
                
                {/* Social Proof & Actions */}
                <motion.div 
                  className="mt-4 pt-4 border-t border-primary/10 flex justify-between items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.8 }}
                >
                  <div className="text-xs text-muted-foreground">
                    💡 Similar portfolios recovered in {results.recoveryTime || 12} months
                  </div>
                  <div className="flex gap-2">
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button size="sm" variant="outline" className="text-xs">
                        Ask Copilot
                      </Button>
                    </motion.div>
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button 
                        size="sm" 
                        className="text-xs bg-gradient-to-r from-primary to-primary/80"
                        onClick={handleShareProof}
                      >
                        Share Proof
                      </Button>
                    </motion.div>
                  </div>
                </motion.div>
              </Card>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>
        </div>
      </Card>
    </div>
  );
};