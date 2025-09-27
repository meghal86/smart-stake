import { useState } from "react";
import { useHub2 } from "@/store/hub2";
import EntitySummaryCard from "@/components/hub2/EntitySummaryCard";
import Hub2Layout from "@/components/hub2/Hub2Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Star, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  Plus,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  AlertTriangle,
  MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";

interface WatchlistItem {
  id: string;
  name: string;
  symbol?: string;
  status: 'monitoring' | 'action_required' | 'completed';
  notes?: string;
  addedAt: string;
  lastActivity?: string;
  lastUpdated: string;
}

// Mock data - replace with real data from your API
const MOCK_WATCHLIST: WatchlistItem[] = [
  {
    id: '1',
    name: 'Bitcoin',
    symbol: 'BTC',
    status: 'monitoring',
    notes: 'Monitoring for breakout above $50k',
    addedAt: '2024-01-15T10:00:00Z',
    lastActivity: '2024-01-20T14:30:00Z',
    lastUpdated: '2024-01-20T14:30:00Z'
  },
  {
    id: '2',
    name: 'Ethereum',
    symbol: 'ETH',
    status: 'action_required',
    notes: 'Risk level increased, need to review position',
    addedAt: '2024-01-10T09:00:00Z',
    lastActivity: '2024-01-20T16:45:00Z',
    lastUpdated: '2024-01-20T16:45:00Z'
  },
  {
    id: '3',
    name: 'Solana',
    symbol: 'SOL',
    status: 'completed',
    notes: 'Target reached, position closed',
    addedAt: '2024-01-05T11:00:00Z',
    lastActivity: '2024-01-18T12:00:00Z',
    lastUpdated: '2024-01-18T12:00:00Z'
  }
];

export default function WatchlistPage() {
  const { watchlist, removeWatch } = useHub2();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'monitoring' | 'action_required' | 'completed'>('all');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [showNotes, setShowNotes] = useState<Record<string, boolean>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  const filteredItems = MOCK_WATCHLIST.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.symbol?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'monitoring': return <Eye className="w-4 h-4" />;
      case 'action_required': return <AlertTriangle className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'monitoring': return 'text-blue-600 bg-blue-50';
      case 'action_required': return 'text-orange-600 bg-orange-50';
      case 'completed': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'monitoring': return 'Monitoring';
      case 'action_required': return 'Action Required';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  const formatLastUpdated = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `Updated ${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `Updated ${diffHours}h ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `Updated ${diffMinutes}m ago`;
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    console.log(`Exporting watchlist as ${format}`);
    // Implement export functionality
  };

  const handleBulkAction = (action: string) => {
    console.log(`Bulk action: ${action} on items:`, selectedItems);
    // Implement bulk actions
  };

  const toggleNotes = (itemId: string) => {
    setShowNotes(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const updateNotes = (itemId: string, newNotes: string) => {
    setNotes(prev => ({ ...prev, [itemId]: newNotes }));
  };

  return (
    <Hub2Layout>
      <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Watchlist</h1>
            <p className="text-muted-foreground">
              Track and manage your watched assets
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search watchlist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex border rounded-lg p-1">
            {(['all', 'monitoring', 'action_required', 'completed'] as const).map((status) => (
              <Button
                key={status}
                size="sm"
                variant={statusFilter === status ? 'default' : 'ghost'}
                onClick={() => setStatusFilter(status)}
                className="text-xs px-3"
              >
                {status === 'all' ? 'All' : getStatusLabel(status)}
              </Button>
            ))}
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedItems.length > 0 && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedItems.length} item(s) selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('mark_watching')}
                >
                  Mark Watching
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('mark_resolved')}
                >
                  Mark Resolved
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('remove')}
                >
                  Remove
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Needs Action */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            <h2 className="text-lg font-semibold">Needs Action</h2>
            <Badge variant="secondary">
              {filteredItems.filter(item => item.status === 'needs_action').length}
            </Badge>
          </div>
          <div className="space-y-3">
            {filteredItems
              .filter(item => item.status === 'needs_action')
              .map((item) => (
                <Card key={item.id} className="border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        {item.symbol && (
                          <p className="text-sm text-muted-foreground">{item.symbol}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleNotes(item.id)}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mb-3">{item.notes}</p>
                    )}
                    
                    {showNotes[item.id] && (
                      <div className="mb-3">
                        <Textarea
                          placeholder="Add notes..."
                          value={notes[item.id] || ''}
                          onChange={(e) => updateNotes(item.id, e.target.value)}
                          className="text-sm"
                          rows={2}
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Mark as watching
                            console.log('Mark as watching:', item.id);
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Watch
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Mark as resolved
                            console.log('Mark as resolved:', item.id);
                          }}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Resolve
                        </Button>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {formatLastUpdated(item.lastUpdated)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Added {new Date(item.addedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* Watching */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold">Watching</h2>
            <Badge variant="secondary">
              {filteredItems.filter(item => item.status === 'watching').length}
            </Badge>
          </div>
          <div className="space-y-3">
            {filteredItems
              .filter(item => item.status === 'watching')
              .map((item) => (
                <Card key={item.id} className="border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        {item.symbol && (
                          <p className="text-sm text-muted-foreground">{item.symbol}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleNotes(item.id)}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mb-3">{item.notes}</p>
                    )}
                    
                    {showNotes[item.id] && (
                      <div className="mb-3">
                        <Textarea
                          placeholder="Add notes..."
                          value={notes[item.id] || ''}
                          onChange={(e) => updateNotes(item.id, e.target.value)}
                          className="text-sm"
                          rows={2}
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Mark as needs action
                            console.log('Mark as needs action:', item.id);
                          }}
                        >
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Flag
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Mark as resolved
                            console.log('Mark as resolved:', item.id);
                          }}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Resolve
                        </Button>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {formatLastUpdated(item.lastUpdated)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Added {new Date(item.addedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* Resolved */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold">Resolved</h2>
            <Badge variant="secondary">
              {filteredItems.filter(item => item.status === 'resolved').length}
            </Badge>
          </div>
          <div className="space-y-3">
            {filteredItems
              .filter(item => item.status === 'resolved')
              .map((item) => (
                <Card key={item.id} className="border-green-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-medium">{item.name}</h3>
                        {item.symbol && (
                          <p className="text-sm text-muted-foreground">{item.symbol}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => toggleNotes(item.id)}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {item.notes && (
                      <p className="text-sm text-muted-foreground mb-3">{item.notes}</p>
                    )}
                    
                    {showNotes[item.id] && (
                      <div className="mb-3">
                        <Textarea
                          placeholder="Add notes..."
                          value={notes[item.id] || ''}
                          onChange={(e) => updateNotes(item.id, e.target.value)}
                          className="text-sm"
                          rows={2}
                        />
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Reopen
                            console.log('Reopen:', item.id);
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Reopen
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // Remove from watchlist
                            removeWatch(item.id);
                          }}
                        >
                          <Star className="w-3 h-3 mr-1" />
                          Remove
                        </Button>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {formatLastUpdated(item.lastUpdated)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Added {new Date(item.addedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      </div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-12">
          <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No items in watchlist</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'Try adjusting your search terms' : 'Start by adding assets to watch'}
          </p>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Items
          </Button>
        </div>
      )}
      </div>
    </Hub2Layout>
  );
}
