import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ChainData {
  name: string;
  value: number;
  percentage: number;
  color: string;
}

interface ChainBreakdownChartProps {
  data: ChainData[];
  totalValue: number;
}

const CHAIN_COLORS = {
  Ethereum: '#627EEA',
  Bitcoin: '#F7931A',
  Solana: '#9945FF',
  Polygon: '#8247E5',
  BSC: '#F3BA2F',
  Arbitrum: '#28A0F0',
  Optimism: '#FF0420',
  Others: '#6B7280'
};

export function ChainBreakdownChart({ data, totalValue }: ChainBreakdownChartProps) {
  const formatValue = (value: number) => {
    if (value >= 1000000) return `$${(value / 1000000).toFixed(2)}M`;
    if (value >= 1000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${value.toFixed(0)}`;
  };

  const CustomTooltip = ({ active, payload }: unknown) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{data.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatValue(data.value)} ({data.percentage.toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Chain Distribution</h3>
        <Badge variant="outline">{data.length} chains</Badge>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Chain List */}
        <div className="space-y-3">
          {data.map((chain, index) => (
            <div key={chain.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: chain.color }}
                />
                <div>
                  <p className="font-medium">{chain.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {chain.percentage.toFixed(1)}% of portfolio
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-medium">{formatValue(chain.value)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}