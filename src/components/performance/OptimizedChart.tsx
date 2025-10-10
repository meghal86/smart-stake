import { memo, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
// import { LazyComponent } from '@/hooks/useLazyLoad'; // Temporarily disabled
import { Skeleton } from '@/components/ui/loading-skeleton';

interface DataPoint {
  date: string;
  value: number;
}

interface OptimizedChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  showTooltip?: boolean;
}

const ChartComponent = memo(({ data, color = '#8884d8', height = 200, showTooltip = true }: OptimizedChartProps) => {
  // Memoize processed data to avoid recalculation
  const processedData = useMemo(() => {
    // Sample data if too many points for performance
    if (data.length > 100) {
      const step = Math.ceil(data.length / 100);
      return data.filter((_, index) => index % step === 0);
    }
    return data;
  }, [data]);

  // Memoize chart configuration
  const chartConfig = useMemo(() => ({
    margin: { top: 5, right: 5, left: 5, bottom: 5 }
  }), []);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={processedData} {...chartConfig}>
        <XAxis 
          dataKey="date" 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis 
          axisLine={false}
          tickLine={false}
          tick={{ fontSize: 12 }}
          width={40}
        />
        {showTooltip && (
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
          />
        )}
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={color}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, stroke: color, strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

ChartComponent.displayName = 'ChartComponent';

export function OptimizedChart(props: OptimizedChartProps) {
  // Temporarily return ChartComponent directly until LazyComponent is implemented
  return <ChartComponent {...props} />;
}