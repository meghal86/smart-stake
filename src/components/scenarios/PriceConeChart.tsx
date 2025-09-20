import { LineChart, Line, Area, ComposedChart, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';

interface PriceConeData {
  basisPrice: number;
  points: Array<{
    t: number;
    p?: number;
    lo?: number;
    hi?: number;
  }>;
  confidenceBand: number;
}

interface PriceConeChartProps {
  data: PriceConeData;
  className?: string;
}

export function PriceConeChart({ data, className = '' }: PriceConeChartProps) {
  const chartData = data.points.map(point => ({
    time: point.t,
    price: point.p || data.basisPrice,
    lower: point.lo || data.basisPrice,
    upper: point.hi || data.basisPrice,
    baseline: data.basisPrice
  }));

  return (
    <div className={`h-48 w-full ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <XAxis 
            dataKey="time" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#6b7280' }}
          />
          <YAxis 
            domain={['dataMin - 20', 'dataMax + 20']}
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 10, fill: '#6b7280' }}
            tickFormatter={(value) => `$${value.toFixed(0)}`}
          />
          
          {/* Confidence Band */}
          <Area
            dataKey="upper"
            stroke="none"
            fill="url(#confidenceGradient)"
            fillOpacity={0.2}
          />
          <Area
            dataKey="lower"
            stroke="none"
            fill="url(#confidenceGradient)"
            fillOpacity={0.2}
          />
          
          {/* Baseline */}
          <ReferenceLine 
            y={data.basisPrice} 
            stroke="#6b7280" 
            strokeDasharray="2 2"
            strokeWidth={1}
          />
          
          {/* Price Lines */}
          <Line
            dataKey="upper"
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            strokeDasharray="3 3"
          />
          <Line
            dataKey="lower"
            stroke="#ef4444"
            strokeWidth={2}
            dot={false}
            strokeDasharray="3 3"
          />
          <Line
            dataKey="price"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 3 }}
          />
          
          <defs>
            <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
        </ComposedChart>
      </ResponsiveContainer>
      
      <div className="flex justify-center mt-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-teal-500"></div>
            <span>Predicted</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-green-500 opacity-60"></div>
            <span>Upper Band</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-red-500 opacity-60"></div>
            <span>Lower Band</span>
          </div>
          <div className="text-amber-600">
            Risk: {Math.round((1 - data.confidenceBand) * 100)}%
          </div>
        </div>
      </div>
    </div>
  );
}