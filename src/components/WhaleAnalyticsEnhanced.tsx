import { useState } from 'react';
import { Fish, Plus, RefreshCw, Download, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { WhaleFilters } from './WhaleFilters';
import { QuickAlertCreator } from './QuickAlertCreator';
import { useWhaleAnalytics } from '@/hooks/useWhaleAnalytics';
import { WhaleCard } from './WhaleCard';

// Enhanced header with actions
const EnhancedHeader = ({ metrics, onRefresh, onIngest, loading }: unknown) => {
  const exportData = () => {
    // Export whale data as CSV
    const csvContent = "data:text/csv;charset=utf-8," + 
      "Address,Balance,Risk Score,Activity,Chain\n" +
      metrics.whales?.map((w: unknown) => 
        `${w.fullAddress},${w.balance},${w.riskScore},${w.recentActivity},${w.chain}`
      ).join("\n");
    
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `whale_analytics_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-xl">
            <Fish className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Whale Analytics</h1>
            <p className="text-muted-foreground">AI-powered whale risk assessment</p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={onIngest} disabled={loading}>
            <Plus className="h-4 w-4 mr-2" />
            Ingest Data
          </Button>
        </div>
      </div>

      {/* Market metrics cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 bg-green-600 rounded" />
            <div>
              <p className="text-sm text-muted-foreground">24h Volume</p>
              <p className="text-xl font-bold">${metrics.volume24h.toLocaleString()}M</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 bg-blue-600 rounded" />
            <div>
              <p className="text-sm text-muted-foreground">Active Whales</p>
              <p className="text-xl font-bold">{metrics.activeWhales}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 bg-orange-600 rounded" />
            <div>
              <p className="text-sm text-muted-foreground">Risk Alerts</p>
              <p className="text-xl font-bold">{metrics.topSignals.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Market signals strip */}
      {metrics.topSignals.length > 0 && (
        <Card className="p-3">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-4 w-4 text-orange-600" />
            <span className="text-sm font-medium">Current Market Signals</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {metrics.topSignals.map((signal: unknown, idx: number) => (
              <Badge key={idx} variant="outline" className="whitespace-nowrap">
                <span className="capitalize">{signal.signal_type.replace('_', ' ')}</span>
                <span className="text-xs opacity-70 ml-1">
                  ({Math.round(signal.confidence * 100)}%)
                </span>
              </Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

// Enhanced whale card with quick alert
const EnhancedWhaleCard = ({ whale, onCreateAlert }: unknown) => {
  const [showQuickAlert, setShowQuickAlert] = useState(false);

  return (
    <div className="space-y-2">
      <WhaleCard whale={whale} />
      
      {showQuickAlert && (
        <QuickAlertCreator
          whaleAddress={whale.fullAddress}
          currentBalance={whale.balance}
          riskScore={whale.riskScore}
          onClose={() => setShowQuickAlert(false)}
        />
      )}
      
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => setShowQuickAlert(true)}
          className="text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          Quick Alert
        </Button>
      </div>
    </div>
  );
};

// Main enhanced component
export const WhaleAnalyticsEnhanced = () => {
  const {
    whales,
    totalWhales,
    metrics,
    loading,
    error,
    filters,
    setFilters,
    fetchWhaleData,
    ingestBlockchainData
  } = useWhaleAnalytics();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Pagination
  const totalPages = Math.ceil(whales.length / itemsPerPage);
  const paginatedWhales = whales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const riskCounts = {
    high: whales.filter(w => w.riskScore >= 70).length,
    medium: whales.filter(w => w.riskScore >= 40 && w.riskScore < 70).length,
    low: whales.filter(w => w.riskScore < 40).length
  };

  if (loading && whales.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p>Loading whale analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="p-6 text-center border-red-200 bg-red-50">
          <h3 className="text-lg font-medium mb-2 text-red-900">Error Loading Data</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={fetchWhaleData}>Retry</Button>
            <Button variant="outline" onClick={ingestBlockchainData}>
              Ingest Live Data
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Enhanced Header */}
      <EnhancedHeader 
        metrics={metrics}
        onRefresh={fetchWhaleData}
        onIngest={ingestBlockchainData}
        loading={loading}
      />

      {/* Filters */}
      <WhaleFilters
        filters={filters}
        onFiltersChange={setFilters}
        totalCount={totalWhales}
        filteredCount={whales.length}
      />

      {/* Whale List */}
      <div className="space-y-4">
        {paginatedWhales.length > 0 ? (
          <>
            <div className="text-sm text-muted-foreground mb-4">
              Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, whales.length)} of {whales.length} whales
            </div>
            
            {paginatedWhales.map(whale => (
              <EnhancedWhaleCard key={whale.id} whale={whale} />
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        ) : (
          <Card className="p-8 text-center">
            <Fish className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">No Whales Found</h3>
            <p className="text-muted-foreground mb-4">
              {totalWhales === 0 
                ? "No whale data available in the database."
                : "No whales match your current filters."
              }
            </p>
            {totalWhales === 0 && (
              <Button onClick={ingestBlockchainData}>
                Ingest Live Data
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Enhanced Summary */}
      {whales.length > 0 && (
        <Card className="p-4">
          <div className="flex justify-between items-start mb-4">
            <h3 className="font-semibold">Risk Summary</h3>
            <Badge variant="outline" className="text-xs">
              Live Data • Updated {new Date().toLocaleTimeString()}
            </Badge>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">High Risk</p>
              <p className="text-2xl font-bold text-red-600">{riskCounts.high}</p>
              <p className="text-xs text-muted-foreground">
                {totalWhales > 0 ? Math.round((riskCounts.high / totalWhales) * 100) : 0}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Medium Risk</p>
              <p className="text-2xl font-bold text-yellow-600">{riskCounts.medium}</p>
              <p className="text-xs text-muted-foreground">
                {totalWhales > 0 ? Math.round((riskCounts.medium / totalWhales) * 100) : 0}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Low Risk</p>
              <p className="text-2xl font-bold text-green-600">{riskCounts.low}</p>
              <p className="text-xs text-muted-foreground">
                {totalWhales > 0 ? Math.round((riskCounts.low / totalWhales) * 100) : 0}%
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};