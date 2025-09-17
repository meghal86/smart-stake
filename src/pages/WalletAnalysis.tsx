import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Shield, TrendingUp, Users, FileText } from 'lucide-react';

// Import all phase components
import { TokenHoldingsBreakdown } from '@/components/portfolio/TokenHoldingsBreakdown';
import { PortfolioValueChart } from '@/components/portfolio/PortfolioValueChart';
import { TransactionGraph } from '@/components/transaction/TransactionGraph';
import { DeFiPositions } from '@/components/defi/DeFiPositions';
import { RiskBreakdown } from '@/components/risk/RiskBreakdown';
import { ReportExporter } from '@/components/reports/ReportExporter';
import { WalletAnnotations } from '@/components/collaboration/WalletAnnotations';

export default function WalletAnalysis() {
  const { address } = useParams<{ address: string }>();
  const [walletAddress, setWalletAddress] = useState(address || '0x742d35Cc6634C0532925a3b8D4C9db4C532925a3');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    if (!walletAddress.trim()) return;
    
    setIsAnalyzing(true);
    // Simulate analysis
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsAnalyzing(false);
  };

  const walletSummary = {
    totalValue: 195000,
    riskScore: 6,
    transactionCount: 1247,
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
    complianceFlags: 2
  };

  const getRiskColor = (score: number) => {
    if (score <= 3) return 'text-green-600';
    if (score <= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskBadge = (score: number) => {
    if (score <= 3) return <Badge className="bg-green-100 text-green-800">Low Risk</Badge>;
    if (score <= 6) return <Badge className="bg-yellow-100 text-yellow-800">Medium Risk</Badge>;
    return <Badge className="bg-red-100 text-red-800">High Risk</Badge>;
  };

  return (
    <div className="flex-1 bg-gradient-to-br from-background to-background/80">
      <div className="p-4 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Wallet Risk Analysis</h1>
            <p className="text-muted-foreground">Comprehensive blockchain wallet analysis and risk assessment</p>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">WhalePlus Pro</span>
          </div>
        </div>

        {/* Wallet Input */}
        <Card className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Enter wallet address (0x...) or ENS name"
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="text-sm font-mono"
              />
            </div>
            <Button onClick={handleAnalyze} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Analyzing...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Analyze Wallet
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Wallet Summary */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold">${walletSummary.totalValue.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Total Value</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className={`text-2xl font-bold ${getRiskColor(walletSummary.riskScore)}`}>
              {walletSummary.riskScore}/10
            </div>
            <div className="text-sm text-muted-foreground">Risk Score</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold">{walletSummary.transactionCount.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Transactions</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold">2h</div>
            <div className="text-sm text-muted-foreground">Last Activity</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{walletSummary.complianceFlags}</div>
            <div className="text-sm text-muted-foreground">Compliance Flags</div>
          </Card>
        </div>

        {/* Main Analysis Tabs */}
        <Tabs defaultValue="portfolio" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="portfolio" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Portfolio
            </TabsTrigger>
            <TabsTrigger value="transactions" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="defi" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              DeFi
            </TabsTrigger>
            <TabsTrigger value="risk" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Risk
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Reports
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Notes
            </TabsTrigger>
          </TabsList>

          {/* Phase 1: Portfolio Analytics */}
          <TabsContent value="portfolio" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <PortfolioValueChart walletAddress={walletAddress} />
              <TokenHoldingsBreakdown walletAddress={walletAddress} />
            </div>
          </TabsContent>

          {/* Phase 2: Transaction Analysis */}
          <TabsContent value="transactions" className="space-y-6">
            <TransactionGraph centerAddress={walletAddress} />
          </TabsContent>

          {/* Phase 3: DeFi Analytics */}
          <TabsContent value="defi" className="space-y-6">
            <DeFiPositions walletAddress={walletAddress} />
          </TabsContent>

          {/* Phase 4: Risk Intelligence */}
          <TabsContent value="risk" className="space-y-6">
            <RiskBreakdown walletAddress={walletAddress} />
          </TabsContent>

          {/* Phase 5: Reports & Export */}
          <TabsContent value="reports" className="space-y-6">
            <ReportExporter walletAddress={walletAddress} />
          </TabsContent>

          {/* Phase 5: Collaboration */}
          <TabsContent value="collaboration" className="space-y-6">
            <WalletAnnotations walletAddress={walletAddress} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}