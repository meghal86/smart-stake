import { useState } from "react";
import { Search, Filter, Zap } from "lucide-react";
import { WhaleTransactionCard } from "@/components/whale/WhaleTransactionCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data for whale transactions
const mockTransactions = [
  {
    id: "1",
    fromAddress: "0x1234567890abcdef1234567890abcdef12345678",
    toAddress: "0xabcdef1234567890abcdef1234567890abcdef12",
    amountUSD: 2500000,
    token: "ETH",
    chain: "Ethereum",
    timestamp: new Date(Date.now() - 300000), // 5 minutes ago
    txHash: "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12",
    type: "buy" as const,
  },
  {
    id: "2",
    fromAddress: "0x9876543210fedcba9876543210fedcba98765432",
    toAddress: "0xfedcba9876543210fedcba9876543210fedcba98",
    amountUSD: 1800000,
    token: "USDC",
    chain: "Polygon",
    timestamp: new Date(Date.now() - 900000), // 15 minutes ago
    txHash: "0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210fe",
    type: "sell" as const,
  },
  {
    id: "3",
    fromAddress: "0x5555555555555555555555555555555555555555",
    toAddress: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    amountUSD: 950000,
    token: "BTC",
    chain: "Bitcoin",
    timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
    txHash: "0x5555555555555555555555555555555555555555555555555555555555555555",
    type: "buy" as const,
  },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChain, setSelectedChain] = useState("all");
  const [minAmount, setMinAmount] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-background/80 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-lg border-b border-border">
        <div className="p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/20 rounded-xl">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Whale Alerts</h1>
              <p className="text-sm text-muted-foreground">Live whale transactions</p>
            </div>
          </div>

          {/* Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search by token, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
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
              
              <Input
                placeholder="Min USD"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
                className="flex-1"
                type="number"
              />
              
              <Button size="icon" variant="outline">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Feed */}
      <div className="p-4 space-y-4">
        {mockTransactions.map((transaction) => (
          <WhaleTransactionCard key={transaction.id} transaction={transaction} />
        ))}
        
        {/* Load more indicator */}
        <div className="text-center py-8">
          <div className="animate-pulse text-muted-foreground">Loading more transactions...</div>
        </div>
      </div>
    </div>
  );
}