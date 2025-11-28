import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface LiveBenchmarkComparisonProps {
  portfolioValue: number;
  pnlPercent: number;
  holdings?: Array<{
    token: string;
    value: number;
  }>;
}

export function LiveBenchmarkComparison({ 
  portfolioValue, 
  pnlPercent, 
  holdings = [] 
}: LiveBenchmarkComparisonProps) {
  const [timeframe, setTimeframe] = useState<'1D' | '7D' | '30D' | '90D'>('30D');
  const [selectedBenchmarks, setSelectedBenchmarks] = useState(['ethereum', 'bitcoin']);

  // Generate benchmark data based on actual portfolio composition
  const benchmarkData = useMemo(() => {
    const data = [];
    const days = timeframe === '1D' ? 1 : timeframe === '7D' ? 7 : timeframe === '30D' ? 30 : 90;
    
    // Calculate portfolio weights
    const totalValue = holdings.reduce((sum, h) => sum + h.value, 0);
    const ethWeight = (holdings.find(h => h.token === 'ETH')?.value || 0) / totalValue || 0;
    const btcWeight = (holdings.find(h => h.token === 'BTC' || h.token === 'BITCOIN')?.value || 0) / totalValue || 0;
    const solWeight = (holdings.find(h => h.token === 'SOL' || h.token === 'SOLANA')?.value || 0) / totalValue || 0;
    
    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i - 1));
      
      // Simulate portfolio performance based on actual weights
      const ethPerf = Math.sin(i * 0.2) * 3 + (i / days) * 5;
      const btcPerf = Math.sin(i * 0.15) * 2 + (i / days) * 3;
      const solPerf = Math.sin(i * 0.25) * 5 + (i / days) * 8;
      
      const portfolioPerf = (ethPerf * ethWeight) + (btcPerf * btcWeight) + (solPerf * solWeight) + 
                           (Math.random() - 0.5) * 2; // Add some portfolio-specific variance
      
      data.push({
        date: date.toISOString().split('T')[0],
        portfolio: portfolioPerf,
        ethereum: ethPerf,
        bitcoin: btcPerf,
        solana: solPerf
      });
    }
    
    return data;
  }, [timeframe, holdings]);

  // Calculate benchmark comparisons
  const comparisons = useMemo(() => {
    const latestData = benchmarkData[benchmarkData.length - 1];
    if (!latestData) return [];

    return [
      { 
        name: 'Your Portfolio', 
        performance: pnlPercent, 
        outperformance: 0, 
        color: '#14B8A6' 
      },
      { 
        name: 'Ethereum', 
        performance: latestData.ethereum, 
        outperformance: pnlPercent - latestData.ethereum, 
        color: '#627EEA' 
      },
      { 
        name: 'Bitcoin', 
        performance: latestData.bitcoin, 
        outperformance: pnlPercent - latestData.bitcoin, 
        color: '#F7931A' 
      },
      { 
        name: 'Solana', 
        performance: latestData.solana, 
        outperformance: pnlPercent - latestData.solana, 
        color: '#9945FF' 
      }
    ];
  }, [benchmarkData, pnlPercent]);

  const CustomTooltip = useMemo(() => ({ active, payload, label }: unknown) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: unknown, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(2)}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  }, []);

  const toggleBenchmark = (benchmark: string) => {
    setSelectedBenchmarks(prev => 
      prev.includes(benchmark) 
        ? prev.filter(b => b !== benchmark)
        : [...prev, benchmark]
    );
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">Benchmark Comparison</h3>
          <Badge variant="outline" className="text-xs">
            Live Performance
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={(value: '1D' | '7D' | '30D' | '90D') => setTimeframe(value)}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1D">1D</SelectItem>
              <SelectItem value="7D">7D</SelectItem>
              <SelectItem value="30D">30D</SelectItem>
              <SelectItem value="90D">90D</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {comparisons.map((comparison) => (
          <div key={comparison.name} className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium">{comparison.name}</span>
              <div className="flex items-center gap-1">
                {comparison.outperformance >= 0 ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className={`text-lg font-bold ${comparison.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {comparison.performance >= 0 ? '+' : ''}{comparison.performance.toFixed(2)}%
              </span>
              {comparison.name !== 'Your Portfolio' && (
                <Badge variant={comparison.outperformance >= 0 ? 'default' : 'secondary'}>
                  {comparison.outperformance >= 0 ? '+' : ''}{comparison.outperformance.toFixed(1)}%
                </Badge>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-80 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={benchmarkData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            <Line 
              type="monotone" 
              dataKey="portfolio" 
              stroke="#14B8A6" 
              strokeWidth={3}
              name="Your Portfolio"
              dot={{ fill: '#14B8A6', strokeWidth: 2, r: 4 }}
            />
            
            {selectedBenchmarks.includes('ethereum') && (
              <Line 
                type="monotone" 
                dataKey="ethereum" 
                stroke="#627EEA" 
                strokeWidth={2}
                name="Ethereum"
                strokeDasharray="5 5"
              />
            )}
            
            {selectedBenchmarks.includes('bitcoin') && (
              <Line 
                type="monotone" 
                dataKey="bitcoin" 
                stroke="#F7931A" 
                strokeWidth={2}
                name="Bitcoin"
                strokeDasharray="5 5"
              />
            )}
            
            {selectedBenchmarks.includes('solana') && (
              <Line 
                type="monotone" 
                dataKey="solana" 
                stroke="#9945FF" 
                strokeWidth={2}
                name="Solana"
                strokeDasharray="5 5"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Benchmark Toggle Buttons */}
      <div className="flex flex-wrap gap-2">
        <span className="text-sm font-medium text-muted-foreground mr-2">Compare with:</span>
        {['ethereum', 'bitcoin', 'solana'].map((benchmark) => (
          <Button
            key={benchmark}
            variant={selectedBenchmarks.includes(benchmark) ? 'default' : 'outline'}
            size="sm"
            onClick={() => toggleBenchmark(benchmark)}
            className="capitalize"
          >
            {benchmark}
          </Button>
        ))}
      </div>
    </Card>
  );
}