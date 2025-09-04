import { useState, useEffect } from "react";
import { TrendingUp, Filter, ArrowUpDown, BarChart3 } from "lucide-react";
import { YieldProtocolCard } from "@/components/yields/YieldProtocolCard";
import { YieldAnalytics } from "@/components/yields/YieldAnalytics";
import { UpgradePrompt } from "@/components/subscription/UpgradePrompt";
import { PlanBadge } from "@/components/subscription/PlanBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/hooks/useSubscription";



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
  const { userPlan, canAccessFeature, getUpgradeMessage } = useSubscription();
  const [selectedChain, setSelectedChain] = useState("all");
  const [sortBy, setSortBy] = useState("apy");
  const [protocols, setProtocols] = useState(mockProtocols);
  const [isLoading, setIsLoading] = useState(true);
  
  const yieldsAccess = canAccessFeature('yields');
  const canViewYields = yieldsAccess === 'full';

  useEffect(() => {
    fetchYields();
  }, []);

  const fetchYields = async () => {
    try {
      // Fetch real data from Supabase
      const { data: yields, error } = await supabase
        .from('yields')
        .select('*')
        .order('apy', { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      // Transform yields data to match component expectations
      const transformedProtocols = yields?.map((yieldItem) => ({
        id: yieldItem.id,
        name: yieldItem.protocol || 'Unknown Protocol',
        apy: Number(yieldItem.apy) || 0,
        chain: yieldItem.chain || 'Ethereum',
        tvlUSD: Number(yieldItem.tvl_usd) || 0,
        riskScore: yieldItem.risk_score || 5,
        category: 'DeFi',
      })) || [];

      setProtocols(transformedProtocols.length > 0 ? transformedProtocols : mockProtocols);
    } catch (err) {
      console.error('Error fetching yields:', err);
      // Fallback to mock data on error
      setProtocols(mockProtocols);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-background to-background/80 pb-20">
      <div className="p-4">
        <PlanBadge plan={userPlan.plan} />
        {!canViewYields ? (
          <UpgradePrompt
            feature="Yield Farming Insights"
            message={getUpgradeMessage('yields')}
            requiredPlan="pro"
            className="max-w-md mx-auto mt-8"
          />
        ) : (
          <Tabs defaultValue="protocols" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="protocols" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Protocols
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="protocols" className="space-y-6">
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

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3">
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
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="animate-pulse bg-card/80 rounded-lg p-4 h-24" />
                ))
              ) : (
                protocols.map((protocol) => (
                  <YieldProtocolCard key={protocol.id} protocol={protocol} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <YieldAnalytics />
          </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}