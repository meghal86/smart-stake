import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, PieChart as PieChartIcon } from 'lucide-react';
import { OptimizedChart } from '@/components/performance/OptimizedChart';
// import { LazyComponent } from '@/hooks/useLazyLoad'; // Temporarily disabled
import { Skeleton } from '@/components/ui/loading-skeleton';

interface PortfolioData {
  date: string;
  totalValue: number;
  ethValue: number;
  tokenValue: number;
  nftValue: number;
}

interface PortfolioValueChartProps {
  walletAddress: string;
}

export function PortfolioValueChart({ walletAddress }: PortfolioValueChartProps) {
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | '90D' | '1Y'>('30D');
  const [viewType, setViewType] = useState<'line' | 'pie'>('line');

  const portfolioData: PortfolioData[] = [
    { date: '2024-01-01', totalValue: 150000, ethValue: 75000, tokenValue: 50000, nftValue: 25000 },
    { date: '2024-01-15', totalValue: 165000, ethValue: 82500, tokenValue: 52500, nftValue: 30000 },
    { date: '2024-02-01', totalValue: 180000, ethValue: 90000, tokenValue: 60000, nftValue: 30000 },
    { date: '2024-02-15', totalValue: 175000, ethValue: 87500, tokenValue: 57500, nftValue: 30000 },
    { date: '2024-03-01', totalValue: 195000, ethValue: 97500, tokenValue: 67500, nftValue: 30000 },
  ];

  const pieData = [
    { name: 'ETH', value: 97500, color: '#627EEA' },
    { name: 'Tokens', value: 67500, color: '#F7931A' },
    { name: 'NFTs', value: 30000, color: '#9945FF' },
  ];

  // Memoize calculations for performance
  const { currentValue, previousValue, change, changePercent, chartData } = useMemo(() => {
    const current = portfolioData[portfolioData.length - 1]?.totalValue || 0;
    const previous = portfolioData[portfolioData.length - 2]?.totalValue || 0;
    const diff = current - previous;
    const percent = ((diff / previous) * 100);
    
    // Transform data for optimized chart
    const optimizedData = portfolioData.map(item => ({
      date: item.date,
      value: item.totalValue
    }));
    
    return {
      currentValue: current,
      previousValue: previous,
      change: diff,
      changePercent: percent,
      chartData: optimizedData
    };
  }, [portfolioData]);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Portfolio Value</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold">${currentValue.toLocaleString()}</span>
            <div className={`flex items-center gap-1 text-sm ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {change >= 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {Math.abs(changePercent).toFixed(2)}%
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex border rounded-lg p-1">
            <Button
              size="sm"
              variant={viewType === 'line' ? 'default' : 'ghost'}
              onClick={() => setViewType('line')}
              className="text-xs px-2"
            >
              Chart
            </Button>
            <Button
              size="sm"
              variant={viewType === 'pie' ? 'default' : 'ghost'}
              onClick={() => setViewType('pie')}
              className="text-xs px-2"
            >
              <PieChartIcon className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex border rounded-lg p-1">
            {(['7D', '30D', '90D', '1Y'] as const).map((period) => (
              <Button
                key={period}
                size="sm"
                variant={timeframe === period ? 'default' : 'ghost'}
                onClick={() => setTimeframe(period)}
                className="text-xs px-2"
              >
                {period}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-80">
        {viewType === 'line' ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={portfolioData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <YAxis 
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip 
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Line 
                type="monotone" 
                dataKey="totalValue" 
                stroke="#8884d8" 
                strokeWidth={2}
                dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="w-80 h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="ml-6 space-y-2">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm">{entry.name}</span>
                  <span className="text-sm font-medium">${entry.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}