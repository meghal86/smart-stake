import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, ExternalLink, TrendingUp, TrendingDown, Activity, Wallet, Users, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WhaleProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  chain: string;
}

interface WhaleProfile {
  profile: unknown;
  transactions: unknown[];
  portfolio: unknown[];
  counterparties: unknown[];
  metrics: unknown;
  analytics: unknown;
}

export const WhaleProfileModal: React.FC<WhaleProfileModalProps> = ({
  isOpen,
  onClose,
  address,
  chain
}) => {
  const [profile, setProfile] = useState<WhaleProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && address) {
      fetchWhaleProfile();
    }
  }, [isOpen, address, chain]);

  const fetchWhaleProfile = async () => {
    setLoading(true);
    try {
      const url = new URL(`${supabase.supabaseUrl}/functions/v1/whale-profile`);
      url.searchParams.set('address', address);
      url.searchParams.set('chain', chain);
      
      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${supabase.supabaseKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch profile');
      const data = await response.json();
      setProfile(data);
    } catch (error) {
      console.error('Error fetching whale profile:', error);
      toast.error('Failed to load whale profile');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatAddress = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  const formatNumber = (num: number) => new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(num);

  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  if (!profile && !loading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Whale Profile: {formatAddress(address)}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(address)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : profile ? (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="counterparties">Network</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(profile.metrics.total_portfolio_value)}</div>
                    <p className="text-xs text-muted-foreground">Current holdings</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">30D Volume</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(profile.metrics.volume_30d)}</div>
                    <p className="text-xs text-muted-foreground">{profile.metrics.transactions_30d} transactions</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(profile.metrics.avg_transaction_size)}</div>
                    <p className="text-xs text-muted-foreground">Per transaction</p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    Activity Timeline (30 Days)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-32 flex items-end gap-1">
                    {profile.analytics.activity_timeline.map((day: unknown, index: number) => (
                      <div
                        key={index}
                        className="flex-1 bg-blue-200 rounded-t"
                        style={{
                          height: `${Math.max(4, (day.volume / Math.max(...profile.analytics.activity_timeline.map((d: unknown) => d.volume))) * 100)}%`
                        }}
                        title={`${day.date}: ${formatNumber(day.volume)}`}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-4">
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {profile.transactions.map((tx: unknown) => (
                  <Card key={tx.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant={tx.transaction_type === 'buy' ? 'default' : 
                                      tx.transaction_type === 'sell' ? 'destructive' : 'secondary'}>
                          {tx.transaction_type || 'transfer'}
                        </Badge>
                        <div>
                          <div className="font-medium">{tx.token_symbol}</div>
                          <div className="text-sm text-muted-foreground">{formatDate(tx.timestamp)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatNumber(tx.amount_usd)}</div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(tx.tx_hash)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="portfolio" className="space-y-4">
              <div className="space-y-2">
                {profile.portfolio.map((holding: unknown) => (
                  <Card key={`${holding.token_address}-${holding.chain}`} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="font-medium">{holding.token_symbol}</div>
                          <div className="text-sm text-muted-foreground">{holding.token_name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatNumber(holding.balance_usd)}</div>
                        <div className={`text-sm flex items-center gap-1 ${
                          (holding.pnl_usd || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(holding.pnl_usd || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                          {formatNumber(holding.pnl_usd || 0)} ({(holding.pnl_percentage || 0).toFixed(1)}%)
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="counterparties" className="space-y-4">
              <div className="space-y-2">
                {profile.counterparties.map((counterparty: unknown) => (
                  <Card key={counterparty.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{formatAddress(counterparty.counterparty_address)}</div>
                          <div className="text-sm text-muted-foreground">
                            {counterparty.interaction_count} interactions
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{formatNumber(counterparty.total_volume_usd)}</div>
                        <div className="text-sm text-muted-foreground">Total volume</div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Token Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(profile.analytics.token_distribution).map(([token, data]: [string, unknown]) => (
                        <div key={token} className="flex items-center justify-between">
                          <span className="text-sm">{token}</span>
                          <span className="text-sm font-medium">{data.percentage.toFixed(1)}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Performance Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Total P&L:</span>
                        <span className={`text-sm font-medium ${
                          profile.analytics.performance.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatNumber(profile.analytics.performance.total_pnl)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Winning Positions:</span>
                        <span className="text-sm font-medium text-green-600">
                          {profile.analytics.performance.winning_positions}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Losing Positions:</span>
                        <span className="text-sm font-medium text-red-600">
                          {profile.analytics.performance.losing_positions}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        ) : null}
      </DialogContent>
    </Dialog>
  );
};