import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Bell, 
  Filter, 
  Search, 
  ArrowLeft, 
  Eye, 
  TrendingUp, 
  TrendingDown,
  Clock,
  DollarSign,
  Users,
  Zap,
  ExternalLink,
  Copy,
  Star,
  Settings,
  Home,
  FileText
} from 'lucide-react';
import { AlertDashboard } from '@/components/alerts/AlertDashboard';
import { ClusterTransactionsList } from '@/components/market-hub/ClusterTransactionsList';
import { BottomNavigation } from '@/components/layout/BottomNavigation';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AlertItem {
  id: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  clusterId?: string;
  clusterName?: string;
  clusterType?: string;
  amountUSD: number;
  chain: string;
  token: string;
  timestamp: Date;
  txHash?: string;
  fromAddress?: string;
  toAddress?: string;
  riskScore?: number;
  isRead: boolean;
  source: 'cluster' | 'custom' | 'system';
}

function AlertsContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  
  // URL params for deep linking from Hub Overview
  const clusterId = searchParams.get('cluster');
  const clusterName = searchParams.get('name');
  const source = searchParams.get('source') || 'all';
  
  // State
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<AlertItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [chainFilter, setChainFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState(source);
  const [showAlertDashboard, setShowAlertDashboard] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'cards' | 'detailed'>('cards');

  // Fetch whale alerts data
  const { data: whaleData, isLoading } = useQuery({
    queryKey: ['whale-alerts-page'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('whale-alerts');
      if (error) throw error;
      return data;
    },
    staleTime: 2 * 60 * 1000,
  });

  // Fetch cluster data for context
  const { data: clusterData } = useQuery({
    queryKey: ['whale-clusters'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('whale-clusters');
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Transform whale data into alerts
  useEffect(() => {
    if (!whaleData?.transactions) return;

    const transformedAlerts: AlertItem[] = whaleData.transactions.map((tx: any, index: number) => {
      const amountUSD = Number(tx.amount_usd || tx.amount) || 0;
      const severity = amountUSD >= 50000000 ? 'Critical' : 
                      amountUSD >= 10000000 ? 'High' : 
                      amountUSD >= 5000000 ? 'Medium' : 'Low';
      
      // Match transaction to cluster if possible
      const matchedCluster = clusterData?.clusters?.find((cluster: any) => {
        const clusterAddresses = cluster.addresses || [];
        return clusterAddresses.includes(tx.from?.address) || 
               clusterAddresses.includes(tx.to?.address);
      });

      return {
        id: tx.hash || `alert_${index}_${Date.now()}_${Math.random()}`,
        title: `${severity} Whale Alert: $${(amountUSD / 1000000).toFixed(1)}M ${(tx.symbol || 'ETH').toUpperCase()}`,
        description: `Large ${(tx.symbol || 'ETH').toUpperCase()} transaction detected on ${tx.blockchain || 'Ethereum'}`,
        severity,
        clusterId: matchedCluster?.id,
        clusterName: matchedCluster?.name,
        clusterType: matchedCluster?.type,
        amountUSD,
        chain: (tx.blockchain || 'Ethereum').charAt(0).toUpperCase() + (tx.blockchain || 'Ethereum').slice(1),
        token: (tx.symbol || 'ETH').toUpperCase(),
        timestamp: new Date(tx.timestamp * 1000 || Date.now() - Math.random() * 3600000),
        txHash: tx.hash,
        fromAddress: tx.from?.address,
        toAddress: tx.to?.address,
        riskScore: Math.floor(Math.random() * 100),
        isRead: Math.random() > 0.7,
        source: matchedCluster ? 'cluster' : 'system'
      };
    });

    // Add mock custom alerts for demonstration
    const mockCustomAlerts: AlertItem[] = [
      {
        id: 'custom_1',
        title: 'Custom Alert: ETH > $5M',
        description: 'Your custom rule triggered for large ETH movements',
        severity: 'High',
        amountUSD: 7500000,
        chain: 'Ethereum',
        token: 'ETH',
        timestamp: new Date(Date.now() - 300000),
        isRead: false,
        source: 'custom'
      },
      {
        id: 'custom_2',
        title: 'Watchlist Alert: USDT Whale',
        description: 'Watched address made large USDT transfer',
        severity: 'Medium',
        amountUSD: 12000000,
        chain: 'Tron',
        token: 'USDT',
        timestamp: new Date(Date.now() - 900000),
        isRead: true,
        source: 'custom'
      }
    ];

    const allAlerts = [...transformedAlerts, ...mockCustomAlerts].sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
    );

    setAlerts(allAlerts);
  }, [whaleData, clusterData]);

  // Filter alerts based on search and filters
  useEffect(() => {
    let filtered = alerts;

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(alert => 
        alert.title.toLowerCase().includes(query) ||
        alert.description.toLowerCase().includes(query) ||
        alert.token.toLowerCase().includes(query) ||
        alert.chain.toLowerCase().includes(query) ||
        alert.clusterName?.toLowerCase().includes(query)
      );
    }

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(alert => alert.severity === severityFilter);
    }

    // Chain filter
    if (chainFilter !== 'all') {
      filtered = filtered.filter(alert => alert.chain.toLowerCase() === chainFilter);
    }

    // Source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter(alert => alert.source === sourceFilter);
    }

    // Cluster filter (from URL params)
    if (clusterId) {
      filtered = filtered.filter(alert => alert.clusterId === clusterId);
    }

    setFilteredAlerts(filtered);
  }, [alerts, searchQuery, severityFilter, chainFilter, sourceFilter, clusterId]);

  // Handle cluster selection from URL
  useEffect(() => {
    if (clusterId) {
      setSelectedCluster(clusterId);
    }
  }, [clusterId]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'bg-red-500 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Medium': return 'bg-yellow-500 text-black';
      case 'Low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'cluster': return '🎯';
      case 'custom': return '⚡';
      case 'system': return '🔔';
      default: return '📢';
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return timestamp.toLocaleDateString();
  };

  const unreadCount = alerts.filter(a => !a.isRead).length;
  const criticalCount = alerts.filter(a => a.severity === 'Critical').length;
  const clusterAlerts = alerts.filter(a => a.source === 'cluster').length;
  const customAlerts = alerts.filter(a => a.source === 'custom').length;

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {clusterId && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchParams({});
                navigate('/?tab=hub');
              }}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Hub
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {clusterId ? `${clusterName || 'Cluster'} Alerts` : 'Whale Alerts'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {clusterId 
                  ? `Showing alerts from ${clusterName || 'selected cluster'}`
                  : 'Real-time whale transaction monitoring'
                }
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAlertDashboard(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage Rules
          </Button>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90"
          >
            <Bell className="h-4 w-4 mr-2" />
            Create Alert
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-xs text-muted-foreground">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{criticalCount}</p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{clusterAlerts}</p>
                <p className="text-xs text-muted-foreground">Cluster</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{customAlerts}</p>
                <p className="text-xs text-muted-foreground">Custom</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={chainFilter} onValueChange={setChainFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Chain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Chains</SelectItem>
                <SelectItem value="ethereum">Ethereum</SelectItem>
                <SelectItem value="tron">Tron</SelectItem>
                <SelectItem value="ripple">Ripple</SelectItem>
                <SelectItem value="solana">Solana</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="cluster">Cluster</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex border rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setViewMode('list')}
                className="text-xs px-2"
              >
                List
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                onClick={() => setViewMode('cards')}
                className="text-xs px-2"
              >
                Cards
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'detailed' ? 'default' : 'ghost'}
                onClick={() => setViewMode('detailed')}
                className="text-xs px-2"
              >
                Detailed
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3">Loading alerts...</span>
          </div>
        ) : filteredAlerts.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="font-medium mb-2">No Alerts Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery || severityFilter !== 'all' || chainFilter !== 'all' || sourceFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'No whale alerts at the moment'
                }
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setSeverityFilter('all');
                  setChainFilter('all');
                  setSourceFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {viewMode === 'cards' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredAlerts.map((alert) => (
                  <Card
                    key={alert.id}
                    className={cn(
                      "cursor-pointer hover:shadow-md transition-all",
                      !alert.isRead && "ring-2 ring-primary/20 bg-primary/5"
                    )}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{getSourceIcon(alert.source)}</span>
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatTime(alert.timestamp)}
                          </span>
                        </div>
                        
                        <div>
                          <h3 className="font-medium mb-1">{alert.title}</h3>
                          <p className="text-sm text-muted-foreground">{alert.description}</p>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{alert.chain}</Badge>
                            <Badge variant="outline">{alert.token}</Badge>
                          </div>
                          <span className="font-mono text-sm font-bold">
                            ${(alert.amountUSD / 1000000).toFixed(1)}M
                          </span>
                        </div>
                        
                        {alert.clusterName && (
                          <div className="text-xs text-muted-foreground">
                            From cluster: {alert.clusterName}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Show cluster transactions if viewing cluster alerts */}
      {clusterId && selectedCluster && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Cluster Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ClusterTransactionsList clusterId={selectedCluster} />
          </CardContent>
        </Card>
      )}
      
      {/* Footer spacing */}
      <div className="pb-20" />

      {/* Alert Dashboard Modal */}
      <AlertDashboard
        isOpen={showAlertDashboard}
        onClose={() => setShowAlertDashboard(false)}
      />

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">{getSourceIcon(selectedAlert.source)}</span>
                  Alert Details
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedAlert(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">{selectedAlert.title}</h3>
                <p className="text-muted-foreground">{selectedAlert.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Severity</p>
                  <Badge className={getSeverityColor(selectedAlert.severity)}>
                    {selectedAlert.severity}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{selectedAlert.timestamp.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <p className="font-mono font-bold">
                    ${selectedAlert.amountUSD.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Token/Chain</p>
                  <p className="font-medium">{selectedAlert.token} on {selectedAlert.chain}</p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button className="flex-1">
                  <Bell className="h-4 w-4 mr-2" />
                  Create Similar Alert
                </Button>
                {selectedAlert.txHash && (
                  <Button variant="outline" className="flex-1">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View on Explorer
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default function Alerts() {
  return (
    <div className="min-h-screen flex flex-col bg-background circuit-pattern">
      {/* Header */}
      <div className="sticky top-0 z-50 whale-card border-b border-primary/20 px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Bell className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold">Whale Alerts</h1>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20">
        <AlertsContent />
      </main>
      
      {/* Bottom Navigation */}
      <BottomNavigation 
        activeTab="alerts" 
        onTabChange={(tab) => {
          if (tab === 'alerts') return;
          window.location.href = `/?tab=${tab}`;
        }} 
      />
    </div>
  );
}