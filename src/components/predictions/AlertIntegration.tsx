import { useState } from 'react';
import { Bell, Mail, Smartphone, Plus, Trash2, Edit } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DisabledTooltipButton } from '@/components/ui/disabled-tooltip-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

interface Alert {
  id: string;
  name: string;
  type: 'price_movement' | 'whale_activity' | 'confidence_threshold';
  asset: string;
  threshold: number;
  channels: ('email' | 'push' | 'sms')[];
  enabled: boolean;
  created_at: string;
}

export function AlertIntegration() {
  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      name: 'ETH High Confidence Predictions',
      type: 'confidence_threshold',
      asset: 'ETH',
      threshold: 85,
      channels: ['email', 'push'],
      enabled: true,
      created_at: new Date().toISOString()
    }
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlert, setNewAlert] = useState({
    name: '',
    type: 'confidence_threshold' as const,
    asset: 'ETH',
    threshold: 80,
    channels: ['email'] as ('email' | 'push' | 'sms')[]
  });

  const createAlert = () => {
    const alert: Alert = {
      id: Date.now().toString(),
      ...newAlert,
      enabled: true,
      created_at: new Date().toISOString()
    };
    
    setAlerts(prev => [...prev, alert]);
    setNewAlert({
      name: '',
      type: 'confidence_threshold',
      asset: 'ETH',
      threshold: 80,
      channels: ['email']
    });
    setShowCreateForm(false);
  };

  const toggleAlert = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, enabled: !alert.enabled } : alert
    ));
  };

  const deleteAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  const toggleChannel = (channel: 'email' | 'push' | 'sms') => {
    setNewAlert(prev => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter(c => c !== channel)
        : [...prev.channels, channel]
    }));
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'price_movement': return 'Price Movement';
      case 'whale_activity': return 'Whale Activity';
      case 'confidence_threshold': return 'High Confidence';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Settings */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Prediction Alerts</h3>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Alert
          </Button>
        </div>

        {/* Create Alert Form */}
        {showCreateForm && (
          <Card className="p-4 mb-4 border-dashed">
            <div className="space-y-4">
              <div>
                <Label>Alert Name</Label>
                <Input 
                  value={newAlert.name}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., High Confidence ETH Predictions"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Alert Type</Label>
                  <Select value={newAlert.type} onValueChange={(value: unknown) => 
                    setNewAlert(prev => ({ ...prev, type: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confidence_threshold">High Confidence Predictions</SelectItem>
                      <SelectItem value="price_movement">Significant Price Predictions</SelectItem>
                      <SelectItem value="whale_activity">Whale Activity Alerts</SelectItem>
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
              </div>
              
              <div>
                <Label>
                  {newAlert.type === 'confidence_threshold' ? 'Minimum Confidence (%)' : 'Threshold'}
                </Label>
                <Input 
                  type="number"
                  value={newAlert.threshold}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, threshold: Number(e.target.value) }))}
                />
              </div>
              
              <div>
                <Label>Notification Channels</Label>
                <div className="flex gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={newAlert.channels.includes('email')}
                      onCheckedChange={() => toggleChannel('email')}
                    />
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">Email</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={newAlert.channels.includes('push')}
                      onCheckedChange={() => toggleChannel('push')}
                    />
                    <Bell className="h-4 w-4" />
                    <span className="text-sm">Push</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={newAlert.channels.includes('sms')}
                      onCheckedChange={() => toggleChannel('sms')}
                    />
                    <Smartphone className="h-4 w-4" />
                    <span className="text-sm">SMS</span>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <DisabledTooltipButton 
                  onClick={createAlert} 
                  disabled={!newAlert.name.trim()}
                  disabledTooltip={!newAlert.name.trim() ? "Enter an alert name to continue" : undefined}
                >
                  Create Alert
                </DisabledTooltipButton>
                <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Active Alerts */}
        <div className="space-y-3">
          {alerts.map((alert) => (
            <Card key={alert.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{alert.name}</h4>
                    <Badge variant="outline">{getAlertTypeLabel(alert.type)}</Badge>
                    <Badge variant="outline">{alert.asset}</Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Threshold: {alert.threshold}{alert.type === 'confidence_threshold' ? '%' : ''}</span>
                    <div className="flex items-center gap-1">
                      {alert.channels.map((channel) => (
                        <span key={channel} className="flex items-center gap-1">
                          {channel === 'email' && <Mail className="h-3 w-3" />}
                          {channel === 'push' && <Bell className="h-3 w-3" />}
                          {channel === 'sms' && <Smartphone className="h-3 w-3" />}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={alert.enabled}
                    onCheckedChange={() => toggleAlert(alert.id)}
                  />
                  <Button size="sm" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => deleteAlert(alert.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
          
          {alerts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No prediction alerts configured</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}