import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Mock historical data
const generateMockData = (protocol: string, chain: string) => {
  const data = [];
  const baseAPY = Math.random() * 15 + 5; // 5-20% base APY
  const baseTVL = Math.random() * 500000000 + 100000000; // 100M-600M base TVL

  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const apyVariation = (Math.random() - 0.5) * 4; // ±2% variation
    const tvlVariation = (Math.random() - 0.5) * 0.2; // ±10% variation
    
    data.push({
      date: date.toISOString().split('T')[0],
      dateLabel: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      apy: +(baseAPY + apyVariation).toFixed(2),
      tvl: +(baseTVL * (1 + tvlVariation)).toFixed(0),
      protocol,
      chain
    });
  }
  
  return data;
};

const protocols = [
  { name: "Compound V3", chain: "Ethereum" },
  { name: "Aave V3", chain: "Polygon" },
  { name: "Uniswap V3", chain: "Ethereum" },
  { name: "Curve Finance", chain: "Ethereum" },
  { name: "PancakeSwap", chain: "BSC" },
];

const chains = ["All", "Ethereum", "Polygon", "BSC", "Arbitrum"];

export function YieldAnalytics() {
  const [selectedProtocol, setSelectedProtocol] = useState("Compound V3");
  const [selectedChain, setSelectedChain] = useState("All");
  const [dataType, setDataType] = useState<"apy" | "tvl">("apy");

  const filteredProtocols = selectedChain === "All" 
    ? protocols 
    : protocols.filter(p => p.chain === selectedChain);

  const currentProtocol = protocols.find(p => p.name === selectedProtocol) || protocols[0];
  const chartData = generateMockData(currentProtocol.name, currentProtocol.chain);

  const formatValue = (value: number, type: "apy" | "tvl") => {
    if (type === "apy") {
      return `${value}%`;
    }
    return `$${(value / 1000000).toFixed(1)}M`;
  };

  const CustomTooltip = ({ active, payload, label }: unknown) => {
    if (active && payload && payload.length) {
      return (
        <Card className="p-3 bg-card/95 backdrop-blur-sm border border-border/50">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          {payload.map((entry: unknown, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-muted-foreground">
                {entry.dataKey === "apy" ? "APY" : "TVL"}: 
              </span>
              <span className="text-sm font-medium text-foreground">
                {formatValue(entry.value, entry.dataKey)}
              </span>
            </div>
          ))}
        </Card>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Protocol</label>
          <Select value={selectedProtocol} onValueChange={setSelectedProtocol}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {filteredProtocols.map((protocol) => (
                <SelectItem key={protocol.name} value={protocol.name}>
                  <div className="flex items-center gap-2">
                    <span>{protocol.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {protocol.chain}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Chain Filter</label>
          <Select value={selectedChain} onValueChange={setSelectedChain}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {chains.map((chain) => (
                <SelectItem key={chain} value={chain}>
                  {chain}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Data Type Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setDataType("apy")}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            dataType === "apy"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/30 text-muted-foreground hover:text-foreground"
          }`}
        >
          APY Trends
        </button>
        <button
          onClick={() => setDataType("tvl")}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            dataType === "tvl"
              ? "bg-primary text-primary-foreground"
              : "bg-muted/30 text-muted-foreground hover:text-foreground"
          }`}
        >
          TVL Trends
        </button>
      </div>

      {/* Chart */}
      <Card className="p-6 bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border border-border/50">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            30-Day {dataType === "apy" ? "APY" : "TVL"} History
          </h3>
          <p className="text-sm text-muted-foreground">
            {selectedProtocol} on {currentProtocol.chain}
          </p>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="dateLabel" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                tickFormatter={(value) => formatValue(value, dataType)}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: "20px" }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey={dataType}
                stroke={dataType === "apy" ? "hsl(var(--success))" : "hsl(var(--primary))"}
                strokeWidth={2}
                dot={{ fill: dataType === "apy" ? "hsl(var(--success))" : "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, stroke: dataType === "apy" ? "hsl(var(--success))" : "hsl(var(--primary))", strokeWidth: 2 }}
                name={dataType === "apy" ? "APY (%)" : "TVL ($)"}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-4 text-center bg-card/80 backdrop-blur-sm border border-border/50">
          <div className="text-sm text-muted-foreground mb-1">Current {dataType.toUpperCase()}</div>
          <div className="text-lg font-bold text-foreground">
            {formatValue(chartData[chartData.length - 1]?.[dataType] || 0, dataType)}
          </div>
        </Card>
        
        <Card className="p-4 text-center bg-card/80 backdrop-blur-sm border border-border/50">
          <div className="text-sm text-muted-foreground mb-1">30d High</div>
          <div className="text-lg font-bold text-success">
            {formatValue(Math.max(...chartData.map(d => d[dataType])), dataType)}
          </div>
        </Card>
        
        <Card className="p-4 text-center bg-card/80 backdrop-blur-sm border border-border/50">
          <div className="text-sm text-muted-foreground mb-1">30d Low</div>
          <div className="text-lg font-bold text-destructive">
            {formatValue(Math.min(...chartData.map(d => d[dataType])), dataType)}
          </div>
        </Card>
      </div>
    </div>
  );
}