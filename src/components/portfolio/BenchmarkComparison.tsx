import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface BenchmarkData {
  date: string;
  portfolio: number;
  ethereum: number;
  bitcoin: number;
  solana: number;
  custom?: number;
}

interface BenchmarkComparison {
  name: string;
  performance: number;
  outperformance: number;
  color: string;
}

interface BenchmarkComparisonProps {
  data: BenchmarkData[];
  timeframe: '1D' | '7D' | '30D' | '90D';
  onTimeframeChange: (timeframe: '1D' | '7D' | '30D' | '90D') => void;
  comparisons: BenchmarkComparison[];
}

export function BenchmarkComparison({ 
  data, 
  timeframe, 
  onTimeframeChange, 
  comparisons 
}: BenchmarkComparisonProps) {
  const [selectedBenchmarks, setSelectedBenchmarks] = useState(['ethereum', 'bitcoin']);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value.toFixed(2)}%
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

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
        <div>
          <h3 className="text-lg font-semibold">Benchmark Comparison</h3>
          <p className="text-sm text-muted-foreground">Portfolio performance vs market indices</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeframe} onValueChange={onTimeframeChange}>
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
              <Badge variant={comparison.outperformance >= 0 ? 'default' : 'secondary'}>
                {comparison.outperformance >= 0 ? '+' : ''}{comparison.outperformance.toFixed(1)}%
              </Badge>
            </div>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="h-80 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
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