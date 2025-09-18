import { useState } from 'react';
import { Plus, Search, Star, Bell, BellOff, Trash2, Edit, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useWatchlist } from '@/hooks/useWatchlist';

export function WatchlistManager() {
  const {
    watchlist,
    loading,
    addToWatchlist,
    removeFromWatchlist,
    toggleAlerts,
    searchWatchlist,
    totalItems,
    activeAlerts
  } = useWatchlist();

  const [showAddForm, setShowAddForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newWallet, setNewWallet] = useState({
    address: '',
    label: '',
    tags: '',
    notes: '',
    alertsEnabled: true
  });

  const handleAddWallet = async () => {
    if (!newWallet.address || !newWallet.label) return;

    const success = await addToWatchlist(
      newWallet.address,
      newWallet.label,
      {
        tags: newWallet.tags.split(',').map(t => t.trim()).filter(Boolean),
        notes: newWallet.notes || undefined,
        alertsEnabled: newWallet.alertsEnabled
      }
    );

    if (success) {
      setNewWallet({
        address: '',
        label: '',
        tags: '',
        notes: '',
        alertsEnabled: true
      });
      setShowAddForm(false);
    }
  };

  const filteredWatchlist = searchQuery 
    ? searchWatchlist(searchQuery)
    : watchlist;

  const getRiskColor = (score: number) => {
    if (score <= 3) return 'text-green-600';
    if (score <= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Watchlist Manager</h3>
          <p className="text-sm text-muted-foreground">
            Monitor wallets and receive real-time alerts
          </p>
        </div>
        <Button onClick={() => setShowAddForm(true)} disabled={loading}>
          <Plus className="h-4 w-4 mr-2" />
          Add Wallet
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-muted/20 rounded-lg">
          <div className="text-2xl font-bold">{totalItems}</div>
          <div className="text-sm text-muted-foreground">Total Wallets</div>
        </div>
        <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{activeAlerts}</div>
          <div className="text-sm text-muted-foreground">Active Alerts</div>
        </div>
        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {watchlist.filter(w => w.riskScore > 6).length}
          </div>
          <div className="text-sm text-muted-foreground">High Risk</div>
        </div>
      </div>

      {/* Add Wallet Form */}
      {showAddForm && (
        <Card className="p-4 mb-6 bg-muted/20">
          <h4 className="font-medium mb-4">Add New Wallet</h4>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address">Wallet Address</Label>
                <Input
                  id="address"
                  placeholder="0x..."
                  value={newWallet.address}
                  onChange={(e) => setNewWallet({ ...newWallet, address: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  placeholder="e.g., Whale #1"
                  value={newWallet.label}
                  onChange={(e) => setNewWallet({ ...newWallet, label: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="e.g., exchange, defi, high-risk"
                value={newWallet.tags}
                onChange={(e) => setNewWallet({ ...newWallet, tags: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                placeholder="Additional notes about this wallet..."
                value={newWallet.notes}
                onChange={(e) => setNewWallet({ ...newWallet, notes: e.target.value })}
                rows={2}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="alerts"
                checked={newWallet.alertsEnabled}
                onCheckedChange={(checked) => setNewWallet({ ...newWallet, alertsEnabled: checked })}
              />
              <Label htmlFor="alerts">Enable alerts for this wallet</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddWallet} disabled={loading}>
                {loading ? 'Adding...' : 'Add Wallet'}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search watchlist..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Watchlist Items */}
      <div className="space-y-3">
        {filteredWatchlist.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{searchQuery ? 'No matching wallets found' : 'No wallets in watchlist'}</p>
          </div>
        ) : (
          filteredWatchlist.map((item) => (
            <Card key={item.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{item.label}</h4>
                    <Badge variant="outline" className={getRiskColor(item.riskScore)}>
                      Risk: {item.riskScore}/10
                    </Badge>
                    {item.alertsEnabled && (
                      <Badge variant="outline" className="text-green-600">
                        <Bell className="h-3 w-3 mr-1" />
                        Alerts On
                      </Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-muted-foreground font-mono mb-2">
                    {item.address}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span>Value: ${item.totalValue.toLocaleString()}</span>
                    <span>Last Activity: {item.lastActivity.toLocaleDateString()}</span>
                  </div>
                  
                  {item.tags.length > 0 && (
                    <div className="flex gap-1 mt-2">
                      {item.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => toggleAlerts(item.id)}
                  >
                    {item.alertsEnabled ? (
                      <Bell className="h-4 w-4" />
                    ) : (
                      <BellOff className="h-4 w-4" />
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => removeFromWatchlist(item.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </Card>
  );
}