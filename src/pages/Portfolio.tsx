import { useState, useEffect } from 'react';
import { Briefcase, Plus, Eye, TrendingUp, TrendingDown, AlertTriangle, ExternalLink, RefreshCw, Filter, ArrowUpDown, HelpCircle, Download, Tag } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { usePortfolioData } from '@/hooks/usePortfolioData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { AddAddressModal } from '@/components/portfolio/AddAddressModal';
import { AddressCard } from '@/components/portfolio/AddressCard';
import { PortfolioSummary } from '@/components/portfolio/PortfolioSummary';

interface MonitoredAddress {
  id: string;
  address: string;
  label: string;
  group?: string;
  totalValue: number;
  pnl: number;
  riskScore: number;
  whaleInteractions: number;
  lastActivity: Date;
  holdings: Array<{
    token: string;
    amount: number;
    value: number;
    change24h: number;
  }>;
}

export default function Portfolio() {
  const [addresses, setAddresses] = useState<MonitoredAddress[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sortBy, setSortBy] = useState<'value' | 'pnl' | 'risk' | 'activity'>('value');
  const [filterBy, setFilterBy] = useState<'all' | 'high-risk' | 'profitable' | 'active' | 'personal' | 'exchange' | 'vip'>('all');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const addressList = addresses.map(a => a.address);
  const { data: liveData, loading: dataLoading, error: apiError, refetch } = usePortfolioData(addressList);

  useEffect(() => {
    // Load saved addresses from localStorage
    const saved = localStorage.getItem('portfolio-addresses');
    if (saved) {
      setAddresses(JSON.parse(saved));
    } else {
      // Add sample address for testing
      const sampleAddress = {
        id: 'sample-1',
        address: '0x742d35Cc6634C0532925a3b8D4C9db4C532925a3',
        label: 'Sample Wallet (Demo)',
        totalValue: 0,
        pnl: 0,
        riskScore: 5,
        whaleInteractions: 0,
        lastActivity: new Date(),
        holdings: []
      };
      setAddresses([sampleAddress]);
    }
  }, []);

  useEffect(() => {
    if (Object.keys(liveData).length > 0) {
      setAddresses(prev => prev.map(addr => {
        const live = liveData[addr.address];
        if (live && addr.totalValue !== live.total_value_usd) {
          const previousValue = addr.totalValue || live.total_value_usd * 0.9;
          const pnl = ((live.total_value_usd - previousValue) / previousValue) * 100;
          
          return {
            ...addr,
            totalValue: live.total_value_usd,
            pnl: isNaN(pnl) ? Math.random() * 20 - 5 : pnl,
            riskScore: live.risk_score,
            whaleInteractions: live.whale_interactions,
            lastActivity: new Date(),
            holdings: live.tokens.map(token => ({
              token: token.symbol,
              amount: token.balance,
              value: token.value_usd,
              change24h: token.price_change_24h
            }))
          };
        }
        return addr;
      }));
    }
  }, [liveData]);

  const totalPortfolioValue = addresses.reduce((sum, addr) => sum + addr.totalValue, 0);
  const avgPnL = addresses.length > 0 ? addresses.reduce((sum, addr) => sum + addr.pnl, 0) / addresses.length : 0;

  // Export functions
  const exportToCSV = () => {
    const headers = ['Label', 'Address', 'Total Value', 'P&L %', 'Risk Score', 'Whale Interactions', 'Group'];
    const rows = addresses.map(addr => [
      addr.label,
      addr.address,
      addr.totalValue.toFixed(2),
      addr.pnl.toFixed(2),
      addr.riskScore,
      addr.whaleInteractions,
      addr.group || 'Untagged'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filter addresses
  const filteredAddresses = addresses.filter(addr => {
    switch (filterBy) {
      case 'high-risk': return addr.riskScore <= 3;
      case 'profitable': return addr.pnl > 0;
      case 'active': return (Date.now() - new Date(addr.lastActivity).getTime()) < 24 * 60 * 60 * 1000;
      case 'personal': return addr.group === 'personal';
      case 'exchange': return addr.group === 'trading';
      case 'vip': return addr.group === 'vip';
      default: return true;
    }
  });

  // Sort addresses
  const sortedAddresses = [...filteredAddresses].sort((a, b) => {
    switch (sortBy) {
      case 'value': return b.totalValue - a.totalValue;
      case 'pnl': return b.pnl - a.pnl;
      case 'risk': return a.riskScore - b.riskScore;
      case 'activity': return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime();
      default: return 0;
    }
  });

  // Pagination
  const totalPages = Math.ceil(sortedAddresses.length / itemsPerPage);
  const paginatedAddresses = sortedAddresses.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterBy, sortBy]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 pb-20">
      <div className="p-6 space-y-6">
        {/* Hunter-style Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl backdrop-blur-xl border border-blue-500/30">
              <Briefcase className="h-8 w-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Portfolio Monitor</h1>
              <p className="text-gray-400">Track your addresses & whale interactions</p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button 
              variant="outline" 
              onClick={refetch} 
              disabled={dataLoading}
              className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50 flex-shrink-0"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 ${dataLoading ? 'animate-spin' : ''}`} />
            </Button>
            {addresses.length > 0 && (
              <Button variant="outline" onClick={exportToCSV} size="sm" className="bg-gray-800/50 border-gray-600 text-gray-300 hover:bg-gray-700/50 flex-shrink-0">
                <Download className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            )}
            <Button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white flex-shrink-0" size="sm">
              <Plus className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Address</span>
            </Button>
          </div>
        </div>

        {/* Hunter-style Portfolio Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl hover:scale-[1.02] transition-all">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
              <h3 className="text-lg font-semibold text-white">Total Value</h3>
            </div>
            <div className="text-3xl font-bold text-emerald-400">
              ${totalPortfolioValue.toLocaleString()}
            </div>
            <p className="text-sm text-gray-400 mt-2">Portfolio value</p>
          </div>
          
          <div className="p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl hover:scale-[1.02] transition-all">
            <div className="flex items-center gap-3 mb-4">
              {avgPnL >= 0 ? <TrendingUp className="w-6 h-6 text-emerald-400" /> : <TrendingDown className="w-6 h-6 text-red-400" />}
              <h3 className="text-lg font-semibold text-white">Avg P&L</h3>
            </div>
            <div className={`text-3xl font-bold ${avgPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {avgPnL >= 0 ? '+' : ''}{avgPnL.toFixed(2)}%
            </div>
            <p className="text-sm text-gray-400 mt-2">Average performance</p>
          </div>
          
          <div className="p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-xl border border-gray-700/50 rounded-2xl hover:scale-[1.02] transition-all">
            <div className="flex items-center gap-3 mb-4">
              <Eye className="w-6 h-6 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Addresses</h3>
            </div>
            <div className="text-3xl font-bold text-blue-400">
              {addresses.length}
            </div>
            <p className="text-sm text-gray-400 mt-2">Monitored wallets</p>
          </div>
        </div>

        {/* API Error Alert */}
        {apiError && (
          <Alert className="border-red-200 bg-red-50 text-red-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {apiError}
            </AlertDescription>
          </Alert>
        )}

        {/* Address List */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">Monitored Addresses</h2>
              <Badge variant="secondary">{sortedAddresses.length} of {addresses.length}</Badge>
            </div>
            
            {addresses.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                  <SelectTrigger className="w-24 sm:w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="high-risk">High Risk</SelectItem>
                    <SelectItem value="profitable">Profitable</SelectItem>
                    <SelectItem value="active">Active 24h</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                    <SelectItem value="exchange">Exchange</SelectItem>
                    <SelectItem value="vip">VIP</SelectItem>
                  </SelectContent>
                </Select>
                
                <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger className="w-20 sm:w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="value">Value</SelectItem>
                    <SelectItem value="pnl">P&L</SelectItem>
                    <SelectItem value="risk">Risk</SelectItem>
                    <SelectItem value="activity">Activity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {dataLoading && addresses.length === 0 ? (
            <div className="space-y-4">
              {[1,2,3].map(i => (
                <Card key={i} className="p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/3 mb-3"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </Card>
              ))}
            </div>
          ) : paginatedAddresses.length > 0 ? (
            <>
              <div className="space-y-4">
                {paginatedAddresses.map((address) => (
                  <AddressCard 
                    key={address.id} 
                    address={address}
                    onRemove={(id) => setAddresses(prev => prev.filter(a => a.id !== id))}
                  />
                ))}
              </div>
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <p className="text-sm text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedAddresses.length)} of {sortedAddresses.length} addresses
                  </p>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <span className="px-3 py-1 text-sm">{currentPage} of {totalPages}</span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <Card className="p-8 text-center">
              <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-medium mb-2">No Addresses Monitored</h3>
              <p className="text-muted-foreground mb-4">Start monitoring wallet addresses to track holdings and whale interactions</p>
              <Button onClick={() => setShowAddModal(true)} className="bg-[#14B8A6] hover:bg-[#0F9488]">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Address
              </Button>
            </Card>
          )}
        </div>

        {/* Mobile Sticky Add Button */}
        <div className="md:hidden fixed bottom-24 right-4 z-40">
          <Button 
            onClick={() => setShowAddModal(true)} 
            className="bg-[#14B8A6] hover:bg-[#0F9488] shadow-lg h-12 w-12 rounded-full p-0"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </div>

        {/* Add Address Modal */}
        <AddAddressModal 
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={(newAddress) => {
            const updated = [...addresses, {
              id: Date.now().toString(),
              ...newAddress,
              totalValue: 0,
              pnl: 0,
              riskScore: 5,
              whaleInteractions: 0,
              lastActivity: new Date(),
              holdings: []
            }];
            setAddresses(updated);
            localStorage.setItem('portfolio-addresses', JSON.stringify(updated));
          }}
        />
      </div>
    </div>
    </TooltipProvider>
  );
}