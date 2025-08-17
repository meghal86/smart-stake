import { useState } from "react";
import { TrendingUp, Filter, ArrowUpDown } from "lucide-react";
import { YieldProtocolCard } from "@/components/yields/YieldProtocolCard";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data for yield protocols
const mockProtocols = [
  {
    id: "1",
    name: "Compound V3",
    apy: 12.45,
    chain: "Ethereum",
    tvlUSD: 1250000000,
    riskScore: 9,
    category: "Lending",
  },
  {
    id: "2",
    name: "Aave V3",
    apy: 8.92,
    chain: "Polygon",
    tvlUSD: 2100000000,
    riskScore: 8,
    category: "Lending",
  },
  {
    id: "3",
    name: "Uniswap V3",
    apy: 24.67,
    chain: "Ethereum",
    tvlUSD: 850000000,
    riskScore: 7,
    category: "DEX",
  },
  {
    id: "4",
    name: "Curve Finance",
    apy: 15.33,
    chain: "Ethereum",
    tvlUSD: 1800000000,
    riskScore: 8,
    category: "Stablecoins",
  },
  {
    id: "5",
    name: "PancakeSwap",
    apy: 18.75,
    chain: "BSC",
    tvlUSD: 650000000,
    riskScore: 6,
    category: "DEX",
  },
];

export default function Yields() {
  const [selectedChain, setSelectedChain] = useState("all");
  const [sortBy, setSortBy] = useState("apy");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-success/20 rounded-xl">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">DeFi Yields</h1>
              <p className="text-sm text-muted-foreground">Top performing protocols</p>
            </div>
          </div>

          {/* Filters and Sort */}
          <div className="flex gap-2">
            <Select value={selectedChain} onValueChange={setSelectedChain}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Chain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chains</SelectItem>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="polygon">Polygon</SelectItem>
                <SelectItem value="bsc">BSC</SelectItem>
                <SelectItem value="arbitrum">Arbitrum</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apy">Highest APY</SelectItem>
                <SelectItem value="tvl">Highest TVL</SelectItem>
                <SelectItem value="risk">Lowest Risk</SelectItem>
              </SelectContent>
            </Select>
            
            <Button size="icon" variant="outline">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Avg APY</div>
            <div className="text-lg font-bold text-success">16.02%</div>
          </div>
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Total TVL</div>
            <div className="text-lg font-bold text-foreground">$6.65B</div>
          </div>
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">Protocols</div>
            <div className="text-lg font-bold text-primary">157</div>
          </div>
        </div>

        {/* Protocol Cards */}
        <div className="space-y-4">
          {mockProtocols.map((protocol) => (
            <YieldProtocolCard key={protocol.id} protocol={protocol} />
          ))}
        </div>
      </div>
    </div>
  );
}