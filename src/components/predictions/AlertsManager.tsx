import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, Mail, Webhook, Smartphone, Trash2, Plus } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';

interface Alert {
  id: string;
  name: string;
  type: 'email' | 'webhook' | 'push';
  asset: string;
  condition: string;
  isActive: boolean;
  tier: 'free' | 'pro' | 'premium' | 'enterprise';
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    name: 'ETH Whale Activity',
    type: 'email',
    asset: 'ETH',
    condition: 'Confidence > 80%',
    isActive: true,
    tier: 'free'
  },
  {
    id: '2',
    name: 'BTC Price Movement',
    type: 'webhook',
    asset: 'BTC',
    condition: 'High Impact signals',
    isActive: false,
    tier: 'premium'
  }
];

export function AlertsManager() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    name: '',
    type: 'email' as const,
    asset: 'ETH',
    condition: ''
  });
  
  const { canAccessFeature } = useSubscription();

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'webhook': return <Webhook className="h-4 w-4" />;
      case 'push': return <Smartphone className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getChannelAccess = (type: string) => {
    switch (type) {
      case 'email': return canAccessFeature('emailAlerts');
      case 'webhook': return canAccessFeature('webhookAlerts');
      case 'push': return canAccessFeature('pushAlerts');
      default: return false;
    }
  };

  const toggleAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, isActive: !alert.isActive } : alert
    ));
  };

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const addAlert = () => {
    if (!newAlert.name || !newAlert.condition) return;
    
    const alert: Alert = {
      id: Date.now().toString(),
      ...newAlert,
      isActive: true,
      tier: 'free'
    };
    
    setAlerts(prev => [...prev, alert]);
    setNewAlert({ name: '', type: 'email', asset: 'ETH', condition: '' });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Add New Alert */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Multi-Channel Alert Delivery</h3>
          <Button 
            size="sm" 
            onClick={() => setShowAddForm(!showAddForm)}
            className="gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Alert
          </Button>
        </div>

        {/* Tier Information */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
            <Mail className="h-5 w-5 text-green-600" />
            <div>
              <div className="font-medium text-sm">Email Alerts</div>
              <div className="text-xs text-muted-foreground">Free tier included</div>
            </div>
          </div>
          
          <div className={`flex items-center gap-3 p-3 rounded-lg ${
            canAccessFeature('webhookAlerts') 
              ? 'bg-blue-50 dark:bg-blue-950/20' 
              : 'bg-gray-50 dark:bg-gray-950/20 opacity-50'
          }`}>
            <Webhook className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-medium text-sm">Webhook Alerts</div>
              <div className="text-xs text-muted-foreground">
                {canAccessFeature('webhookAlerts') ? 'Premium tier' : 'Requires Premium'}
              </div>
            </div>
          </div>
          
          <div className={`flex items-center gap-3 p-3 rounded-lg ${
            canAccessFeature('pushAlerts') 
              ? 'bg-purple-50 dark:bg-purple-950/20' 
              : 'bg-gray-50 dark:bg-gray-950/20 opacity-50'
          }`}>
            <Smartphone className="h-5 w-5 text-purple-600" />
            <div>
              <div className="font-medium text-sm">Push Notifications</div>
              <div className="text-xs text-muted-foreground">
                {canAccessFeature('pushAlerts') ? 'Enterprise tier' : 'Requires Enterprise'}
              </div>
            </div>
          </div>
        </div>

        {/* Add Alert Form */}
        {showAddForm && (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Alert Name</Label>
                <Input 
                  value={newAlert.name}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., ETH Whale Activity"
                />
              </div>
              
              <div>
                <Label>Channel Type</Label>
                <Select value={newAlert.type} onValueChange={(value: any) => 
                  setNewAlert(prev => ({ ...prev, type: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="webhook" disabled={!canAccessFeature('webhookAlerts')}>
                      Webhook {!canAccessFeature('webhookAlerts') && '(Premium)'}
                    </SelectItem>
                    <SelectItem value="push" disabled={!canAccessFeature('pushAlerts')}>
                      Push {!canAccessFeature('pushAlerts') && '(Enterprise)'}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Asset</Label>
                <Select value={newAlert.asset} onValueChange={(value) => 
                  setNewAlert(prev => ({ ...prev, asset: value }))
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ETH">Ethereum (ETH)</SelectItem>
                    <SelectItem value="BTC">Bitcoin (BTC)</SelectItem>
                    <SelectItem value="ALL">All Assets</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Condition</Label>
                <Input 
                  value={newAlert.condition}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, condition: e.target.value }))}
                  placeholder="e.g., Confidence > 80%"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={addAlert}>Create Alert</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Active Alerts */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Active Alerts</h3>
        
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No alerts configured yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getChannelIcon(alert.type)}
                  <div>
                    <div className="font-medium">{alert.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {alert.asset} • {alert.condition}
                    </div>
                  </div>
                  <Badge variant={alert.isActive ? 'default' : 'secondary'}>
                    {alert.isActive ? 'Active' : 'Disabled'}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={alert.isActive}
                    onCheckedChange={() => toggleAlert(alert.id)}
                    disabled={!getChannelAccess(alert.type)}
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => deleteAlert(alert.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}