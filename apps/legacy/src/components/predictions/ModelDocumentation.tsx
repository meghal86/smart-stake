import { BookOpen, Brain, Database, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ModelDocumentation() {
  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="h-6 w-6 text-primary" />
          <h2 className="text-xl font-bold">Whale Prediction Models</h2>
        </div>
        
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="models">Models</TabsTrigger>
            <TabsTrigger value="data">Data Sources</TabsTrigger>
            <TabsTrigger value="limitations">Limitations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">What Are Whale Predictions?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Our AI-powered whale prediction system analyzes large cryptocurrency holders' behavior patterns 
                to forecast potential market movements, price impacts, and trading opportunities.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Key Features</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Real-time whale activity monitoring</li>
                    <li>• Price movement predictions</li>
                    <li>• Volume spike forecasting</li>
                    <li>• Risk assessment scoring</li>
                  </ul>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Supported Assets</h4>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline">ETH</Badge>
                    <Badge variant="outline">BTC</Badge>
                    <Badge variant="outline">USDC</Badge>
                    <Badge variant="outline">USDT</Badge>
                    <Badge variant="outline">More...</Badge>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="font-semibold mb-3">How It Works</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">1</div>
                  <div>
                    <h4 className="font-medium text-sm">Data Collection</h4>
                    <p className="text-xs text-muted-foreground">
                      Continuous monitoring of on-chain transactions, exchange flows, and whale wallet activities
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">2</div>
                  <div>
                    <h4 className="font-medium text-sm">Pattern Analysis</h4>
                    <p className="text-xs text-muted-foreground">
                      ML models identify patterns in whale behavior and correlate with historical market movements
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium">3</div>
                  <div>
                    <h4 className="font-medium text-sm">Prediction Generation</h4>
                    <p className="text-xs text-muted-foreground">
                      Ensemble models generate predictions with confidence scores and explanations
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="models" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Model Architecture</h3>
              
              <div className="space-y-4">
                <div className="p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Ensemble Approach</h4>
                  <p className="text-xs text-muted-foreground mb-2">
                    We use multiple specialized models working together for robust predictions:
                  </p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• <strong>LSTM Networks:</strong> Time series analysis of whale transaction patterns</li>
                    <li>• <strong>Random Forest:</strong> Feature importance and non-linear relationships</li>
                    <li>• <strong>Gradient Boosting:</strong> Sequential learning from prediction errors</li>
                    <li>• <strong>Transformer Models:</strong> Attention-based pattern recognition</li>
                  </ul>
                </div>
                
                <div className="p-3 bg-muted/30 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">Training Data</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <p className="font-medium">Historical Period</p>
                      <p className="text-muted-foreground">2+ years of whale activity</p>
                    </div>
                    <div>
                      <p className="font-medium">Update Frequency</p>
                      <p className="text-muted-foreground">Daily retraining</p>
                    </div>
                    <div>
                      <p className="font-medium">Validation Method</p>
                      <p className="text-muted-foreground">Time-series cross-validation</p>
                    </div>
                    <div>
                      <p className="font-medium">Accuracy Rate</p>
                      <p className="text-muted-foreground">~75-85% (varies by asset)</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Data Sources & Features</h3>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    On-Chain Data
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-muted/30 rounded">
                      <p className="font-medium">Transaction Volume</p>
                      <p className="text-muted-foreground">Large wallet movements</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <p className="font-medium">Exchange Flows</p>
                      <p className="text-muted-foreground">Deposits/withdrawals</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <p className="font-medium">Dormant Coins</p>
                      <p className="text-muted-foreground">Long-term holder activity</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <p className="font-medium">Network Metrics</p>
                      <p className="text-muted-foreground">Gas fees, congestion</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Market Data
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-muted/30 rounded">
                      <p className="font-medium">Price & Volume</p>
                      <p className="text-muted-foreground">Real-time market data</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <p className="font-medium">Technical Indicators</p>
                      <p className="text-muted-foreground">RSI, MACD, Bollinger Bands</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <p className="font-medium">Order Book</p>
                      <p className="text-muted-foreground">Depth and liquidity</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <p className="font-medium">Volatility</p>
                      <p className="text-muted-foreground">Historical and implied</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Social & Sentiment
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-muted/30 rounded">
                      <p className="font-medium">Social Media</p>
                      <p className="text-muted-foreground">Twitter, Reddit sentiment</p>
                    </div>
                    <div className="p-2 bg-muted/30 rounded">
                      <p className="font-medium">News Analysis</p>
                      <p className="text-muted-foreground">Market-moving events</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="limitations" className="space-y-4">
            <Card className="p-4 border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-3 text-yellow-800 dark:text-yellow-200">
                    Important Limitations & Disclaimers
                  </h3>
                  
                  <div className="space-y-3 text-sm text-yellow-700 dark:text-yellow-300">
                    <div>
                      <h4 className="font-medium mb-1">Market Unpredictability</h4>
                      <p>
                        Cryptocurrency markets are highly volatile and influenced by factors beyond whale activity, 
                        including regulatory changes, technological developments, and macroeconomic events.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-1">Historical Bias</h4>
                      <p>
                        Models are trained on historical data and may not perform well during unprecedented market conditions 
                        or black swan events that haven't occurred in the training period.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-1">Data Limitations</h4>
                      <p>
                        Not all whale activities are visible on-chain. Private transactions, OTC trades, 
                        and cross-chain movements may not be fully captured.
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-1">No Financial Advice</h4>
                      <p>
                        Predictions are for informational purposes only and should not be considered financial advice. 
                        Always conduct your own research and consider your risk tolerance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Best Practices</h3>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Use predictions as one factor in a comprehensive analysis</li>
                <li>• Pay attention to confidence scores - higher is generally better</li>
                <li>• Consider multiple timeframes and scenarios</li>
                <li>• Monitor prediction accuracy over time</li>
                <li>• Set appropriate risk management strategies</li>
                <li>• Stay updated with model improvements and changes</li>
              </ul>
            </Card>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}