import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Bell, Plus, Trash2, TrendingDown, Activity, AlertTriangle, Users } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';

interface AlertConfig {
  id: string;
  triggerType: 'price_drop' | 'whale_move' | 'stress_impact' | 'whale_proximity';
  threshold: {
    token?: string;
    amount?: number;
    percentage?: number;
    direction?: 'inflow' | 'outflow';
  };
  channel: 'in_app' | 'email';
  isActive: boolean;
  quotaDaily: number;
}

interface AlertsCardProps {
  alerts: AlertConfig[];
  onCreateAlert: (alert: Omit<AlertConfig, 'id'>) => void;
  onUpdateAlert: (id: string, updates: Partial<AlertConfig>) => void;
  onDeleteAlert: (id: string) => void;
  dailyUsage: number;
}

const TRIGGER_TYPES = [
  { value: 'price_drop', label: 'Price Drop', icon: TrendingDown, description: 'Token drops by %' },
  { value: 'whale_move', label: 'Whale Move', icon: Activity, description: 'Large transaction detected' },
  { value: 'stress_impact', label: 'Stress Impact', icon: AlertTriangle, description: 'Portfolio stress threshold' },
  { value: 'whale_proximity', label: 'Whale Proximity', icon: Users, description: 'Whale activity nearby (3 hops)' }
];

const TOKENS = ['ETH', 'BTC', 'SOL', 'LINK', 'MATIC'];

export function AlertsCard({ alerts, onCreateAlert, onUpdateAlert, onDeleteAlert, dailyUsage }: AlertsCardProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newAlert, setNewAlert] = useState<Partial<AlertConfig>>({
    triggerType: 'price_drop',
    threshold: {},
    channel: 'in_app',
    isActive: true,
    quotaDaily: 5
  });
  
  const { subscription } = useSubscription();
  const isProUser = subscription.tier !== 'free';
  const dailyLimit = isProUser ? 999 : 5;

  const handleCreateAlert = () => {
    if (newAlert.triggerType && Object.keys(newAlert.threshold || {}).length > 0) {
      onCreateAlert(newAlert as Omit<AlertConfig, 'id'>);
      setNewAlert({
        triggerType: 'price_drop',
        threshold: {},
        channel: 'in_app',
        isActive: true,
        quotaDaily: 5
      });
      setShowCreateForm(false);
    }
  };

  const getTriggerIcon = (type: string) => {
    const trigger = TRIGGER_TYPES.find(t => t.value === type);
    return trigger?.icon || Bell;
  };

  const formatThreshold = (alert: AlertConfig) => {
    const { threshold, triggerType } = alert;
    
    switch (triggerType) {
      case 'price_drop':
        return `${threshold.token} drops ${threshold.percentage}%`;
      case 'whale_move':
        return `$${(threshold.amount || 0).toLocaleString()} ${threshold.direction}`;
      case 'stress_impact':
        return `Portfolio drops ${threshold.percentage}%`;
      case 'whale_proximity':
        return `Whale moves $${(threshold.amount || 0).toLocaleString()}+ nearby`;
      default:
        return 'Custom trigger';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Smart Alerts</h3>
          <Badge variant="outline" className="text-xs">
            {dailyUsage}/{dailyLimit} today
          </Badge>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)} 
          size="sm"
          disabled={!isProUser && dailyUsage >= dailyLimit}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Alert
        </Button>
      </div>

      {/* Usage Warning */}
      {!isProUser && dailyUsage >= dailyLimit && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Daily alert limit reached. <span className="font-medium text-primary cursor-pointer">Upgrade to Pro</span> for unlimited alerts.
          </p>
        </div>
      )}

      {/* Create Alert Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 border rounded-lg bg-muted/50">
          <h4 className="font-medium mb-4">Create New Alert</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Trigger Type</label>
              <Select 
                value={newAlert.triggerType} 
                onValueChange={(value: unknown) => setNewAlert({...newAlert, triggerType: value})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map(trigger => (
                    <SelectItem key={trigger.value} value={trigger.value}>
                      <div className="flex items-center gap-2">
                        <trigger.icon className="h-4 w-4" />
                        <div>
                          <div>{trigger.label}</div>
                          <div className="text-xs text-muted-foreground">{trigger.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic threshold inputs based on trigger type */}
            {newAlert.triggerType === 'price_drop' && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Token</label>
                  <Select 
                    value={newAlert.threshold?.token} 
                    onValueChange={(value) => setNewAlert({
                      ...newAlert, 
                      threshold: {...newAlert.threshold, token: value}
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select token" />
                    </SelectTrigger>
                    <SelectContent>
                      {TOKENS.map(token => (
                        <SelectItem key={token} value={token}>{token}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Drop Percentage</label>
                  <Input 
                    type="number" 
                    placeholder="10" 
                    value={newAlert.threshold?.percentage || ''} 
                    onChange={(e) => setNewAlert({
                      ...newAlert, 
                      threshold: {...newAlert.threshold, percentage: Number(e.target.value)}
                    })}
                  />
                </div>
              </>
            )}

            {newAlert.triggerType === 'whale_move' && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">Amount (USD)</label>
                  <Input 
                    type="number" 
                    placeholder="1000000" 
                    value={newAlert.threshold?.amount || ''} 
                    onChange={(e) => setNewAlert({
                      ...newAlert, 
                      threshold: {...newAlert.threshold, amount: Number(e.target.value)}
                    })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Direction</label>
                  <Select 
                    value={newAlert.threshold?.direction} 
                    onValueChange={(value: unknown) => setNewAlert({
                      ...newAlert, 
                      threshold: {...newAlert.threshold, direction: value}
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inflow">Inflow (Buy)</SelectItem>
                      <SelectItem value="outflow">Outflow (Sell)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {newAlert.triggerType === 'whale_proximity' && (
              <div>
                <label className="text-sm font-medium mb-2 block">Minimum Amount (USD)</label>
                <Input 
                  type="number" 
                  placeholder="500000" 
                  value={newAlert.threshold?.amount || ''} 
                  onChange={(e) => setNewAlert({
                    ...newAlert, 
                    threshold: {...newAlert.threshold, amount: Number(e.target.value)}
                  })}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateAlert}>
              Create Alert
            </Button>
          </div>
        </div>
      )}

      {/* Active Alerts */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No alerts configured</p>
            <p className="text-sm">Create your first alert to get notified of important portfolio events</p>
          </div>
        ) : (
          alerts.map(alert => {
            const IconComponent = getTriggerIcon(alert.triggerType);
            return (
              <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${alert.isActive ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    <IconComponent className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium">{formatThreshold(alert)}</p>
                    <p className="text-sm text-muted-foreground">
                      {alert.channel === 'in_app' ? 'In-app notification' : 'Email notification'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={alert.isActive}
                    onCheckedChange={(checked) => onUpdateAlert(alert.id, { isActive: checked })}
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onDeleteAlert(alert.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pro Upsell */}
      {!isProUser && (
        <div className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Upgrade to Pro</p>
              <p className="text-sm text-muted-foreground">Unlimited alerts + email notifications</p>
            </div>
            <Button size="sm">
              Upgrade
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}