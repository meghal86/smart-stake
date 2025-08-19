import { Shield, Search, Zap, Crown } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ScannerEmptyStateProps {
  type: "initial" | "no-results";
  walletAddress?: string;
}

export function ScannerEmptyState({ type, walletAddress }: ScannerEmptyStateProps) {
  if (type === "initial") {
    return (
      <Card className="p-8 text-center bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border border-border/50">
        <div className="space-y-6">
          <div className="relative">
            <div className="p-4 bg-premium/10 rounded-2xl inline-block">
              <Shield className="h-12 w-12 text-premium" />
            </div>
            <div className="absolute -top-1 -right-1 p-1 bg-premium/20 rounded-full">
              <Crown className="h-4 w-4 text-premium" />
            </div>
          </div>
          
          <div className="space-y-3 max-w-md mx-auto">
            <h2 className="text-xl font-bold text-foreground">
              Wallet Risk Analysis
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Enter a wallet address to get a detailed risk analysis including transaction patterns, 
              security flags, and comprehensive risk scoring.
            </p>
          </div>
          
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground pt-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              Transaction History
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-warning" />
              Risk Patterns
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              Security Score
            </div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8 text-center bg-gradient-to-br from-card/90 to-card/70 backdrop-blur-sm border border-border/50">
      <div className="space-y-6">
        <div className="p-4 bg-muted/20 rounded-2xl inline-block">
          <Search className="h-12 w-12 text-muted-foreground" />
        </div>
        
        <div className="space-y-3 max-w-md mx-auto">
          <h2 className="text-xl font-bold text-foreground">
            No Risk Data Found
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Unable to retrieve risk analysis for address{" "}
            <code className="px-2 py-1 bg-muted/50 rounded text-xs font-mono">
              {walletAddress?.slice(0, 8)}...{walletAddress?.slice(-6)}
            </code>
          </p>
          <p className="text-sm text-muted-foreground">
            This could be due to insufficient transaction history or network connectivity issues.
          </p>
        </div>
      </div>
    </Card>
  );
}