import React, { useEffect } from 'react';
import PortfolioLayout from '@/components/layouts/PortfolioLayout';
import { PortfolioHeader } from '@/components/portfolio/PortfolioHeader';
import { usePortfolioSummary } from '@/hooks/portfolio/usePortfolioSummary';
import { useAddresses } from '@/hooks/portfolio/useAddresses';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUIMode } from '@/store/uiMode';
import Hub2Layout from '@/components/hub2/Hub2Layout';
import LegendaryLayout from '@/components/ui/LegendaryLayout';

export default function Addresses() {
  const { data: summary } = usePortfolioSummary();
  const { rows, isLoading } = useAddresses();
  const { mode } = useUIMode() || { mode: 'novice' };
  
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "dark";
    document.documentElement.classList.remove("dark", "pro");
    if (savedTheme === "dark") document.documentElement.classList.add("dark");
    if (savedTheme === "pro") document.documentElement.classList.add("dark", "pro");
  }, []);

  return (
    <LegendaryLayout mode={mode}>
      <Hub2Layout>
        <PortfolioLayout>
          <div style={{ 
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 24px'
          }}>
            <div className="space-y-6">
              <PortfolioHeader summary={summary} />
              
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Monitored Addresses</h2>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
              </div>

              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="p-6">
                      <div className="animate-pulse space-y-3">
                        <div className="h-4 bg-muted rounded w-1/3"></div>
                        <div className="h-4 bg-muted rounded w-1/2"></div>
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : rows.length > 0 ? (
                <div className="space-y-4">
                  {rows.map((address) => (
                    <Card key={address.address} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <code className="text-sm font-mono">{address.address}</code>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <span>Value: <span className="font-medium">${address.totalValue.toLocaleString()}</span></span>
                            <span>PnL: <span className={`font-medium ${address.pnl24hPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {address.pnl24hPct >= 0 ? '+' : ''}{address.pnl24hPct}%
                            </span></span>
                            <span>Risk: <span className="font-medium">{address.risk}/10</span></span>
                            <span>Tokens: <span className="font-medium">{address.tokens}</span></span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">Sources:</span>
                            {address.sources.real && <Badge variant="outline" className="text-xs">Real</Badge>}
                            {address.sources.sim && <Badge variant="outline" className="text-xs">Simulated</Badge>}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Activity</div>
                          <div className="text-lg font-semibold">{address.activity}/10</div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center">
                  <MapPin className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No Addresses Monitored</h3>
                  <p className="text-muted-foreground mb-4">
                    Add wallet addresses to unlock portfolio intelligence features
                  </p>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Your First Address
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </PortfolioLayout>
      </Hub2Layout>
    </LegendaryLayout>
  );
}