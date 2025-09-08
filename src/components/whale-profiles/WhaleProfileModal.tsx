import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Download, Share2, TrendingUp, Activity, Users, PieChart } from 'lucide-react';

interface WhaleProfileProps {
  whale: {
    id: string;
    address: string;
    balance: string;
    type: string;
    riskScore: number;
    signals: string[];
    activity: {
      volume24h: string;
      transactions24h: number;
      lastActive: string;
    };
  };
  isOpen: boolean;
  onClose: () => void;
}

export const WhaleProfileModal = ({ whale, isOpen, onClose }: WhaleProfileProps) => {
  const [activeTab, setActiveTab] = useState('timeline');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <Card className="w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
            <div>
              <h2 className="text-2xl font-bold">{whale.address}</h2>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="outline" className="capitalize">{whale.type}</Badge>
                <Badge variant={whale.riskScore >= 7 ? 'destructive' : 'secondary'}>
                  Risk: {whale.riskScore}/10
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const data = {
                    address: whale.address,
                    type: whale.type,
                    riskScore: whale.riskScore,
                    balance: whale.balance,
                    signals: whale.signals,
                    activity: whale.activity
                  };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `whale-${whale.address.slice(0, 8)}.json`;
                  a.click();
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const shareText = `🐋 Whale Analysis: ${whale.address}\nRisk Score: ${whale.riskScore}/10\nType: ${whale.type}\nBalance: ${whale.balance}`;
                  if (navigator.share) {
                    navigator.share({
                      title: 'WhalePlus Analysis',
                      text: shareText,
                      url: window.location.href
                    });
                  } else {
                    navigator.clipboard.writeText(shareText);
                    alert('Whale data copied to clipboard!');
                  }
                }}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Balance</span>
              </div>
              <div className="text-2xl font-bold">{whale.balance}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">24h Volume</span>
              </div>
              <div className="text-2xl font-bold">{whale.activity.volume24h}</div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium">Transactions</span>
              </div>
              <div className="text-2xl font-bold">{whale.activity.transactions24h}</div>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 h-auto">
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              <TabsTrigger value="network">Network</TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-4 sm:mt-6">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Risk & Activity Timeline</h3>
                <div className="space-y-4">
                  {[
                    { time: '2h ago', event: 'Large transaction detected', risk: 8, type: 'high' },
                    { time: '6h ago', event: 'Pattern change: Trader → Hodler', risk: 6, type: 'medium' },
                    { time: '1d ago', event: 'New counterparty interaction', risk: 5, type: 'low' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded">
                      <div>
                        <div className="font-medium">{item.event}</div>
                        <div className="text-sm text-muted-foreground">{item.time}</div>
                      </div>
                      <Badge variant={item.type === 'high' ? 'destructive' : item.type === 'medium' ? 'default' : 'secondary'}>
                        Risk: {item.risk}
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="portfolio" className="mt-4 sm:mt-6">
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <PieChart className="h-5 w-5" />
                  <h3 className="font-semibold">Portfolio Breakdown</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { token: 'ETH', amount: '1,234.56', value: '$2.4M', percentage: 45 },
                    { token: 'USDC', amount: '890,123', value: '$890K', percentage: 25 },
                    { token: 'WBTC', amount: '12.34', value: '$534K', percentage: 15 }
                  ].map((asset, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `hsl(${index * 90}, 70%, 50%)` }} />
                        <div>
                          <div className="font-medium">{asset.token}</div>
                          <div className="text-sm text-muted-foreground">{asset.amount}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{asset.value}</div>
                        <div className="text-sm text-muted-foreground">{asset.percentage}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="network" className="mt-4 sm:mt-6">
              <Card className="p-4">
                <h3 className="font-semibold mb-4">Key Counterparties</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Uniswap V3', interactions: 156, volume: '$2.1M' },
                    { name: 'Binance Hot Wallet', interactions: 89, volume: '$1.8M' },
                    { name: '1inch Router', interactions: 67, volume: '$1.2M' }
                  ].map((party, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/20 rounded">
                      <div>
                        <div className="font-medium">{party.name}</div>
                        <div className="text-sm text-muted-foreground">{party.interactions} interactions</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{party.volume}</div>
                        <div className="text-sm text-muted-foreground">Total volume</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </Card>
    </div>
  );
};