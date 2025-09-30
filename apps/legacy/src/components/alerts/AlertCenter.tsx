import { useState } from 'react';
import { Bell, Plus, Settings, Trash2, Eye, EyeOff } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface AlertRule {
  id: string;
  name: string;
  type: 'risk_threshold' | 'large_transaction' | 'sanctions_match' | 'defi_health';
  condition: string;
  threshold: number;
  isActive: boolean;
  notifications: string[];
  walletAddress?: string;
}

interface AlertCenterProps {
  walletAddress?: string;
}

export function AlertCenter({ walletAddress }: AlertCenterProps) {
  const [rules, setRules] = useState<AlertRule[]>([
    {
      id: '1',
      name: 'High Risk Alert',
      type: 'risk_threshold',
      condition: 'Risk score > 7',
      threshold: 7,
      isActive: true,
      notifications: ['email', 'dashboard'],
      walletAddress
    }
  ]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRule, setNewRule] = useState({
    name: '',
    type: 'risk_threshold' as const,
    threshold: 5,
    notifications: ['dashboard']
  });

  const handleCreateRule = () => {
    const rule: AlertRule = {
      id: Date.now().toString(),
      name: newRule.name,
      type: newRule.type,
      condition: getConditionText(newRule.type, newRule.threshold),
      threshold: newRule.threshold,
      isActive: true,
      notifications: newRule.notifications,
      walletAddress
    };

    setRules([...rules, rule]);
    setNewRule({ name: '', type: 'risk_threshold', threshold: 5, notifications: ['dashboard'] });
    setShowCreateForm(false);
  };

  const getConditionText = (type: string, threshold: number) => {
    switch (type) {
      case 'risk_threshold': return `Risk score > ${threshold}`;
      case 'large_transaction': return `Transaction > $${threshold.toLocaleString()}`;
      case 'sanctions_match': return 'Sanctions list match detected';
      case 'defi_health': return `Health factor < ${threshold}`;
      default: return 'Custom condition';
    }
  };

  const toggleRule = (id: string) => {
    setRules(rules.map(rule => 
      rule.id === id ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  const deleteRule = (id: string) => {
    setRules(rules.filter(rule => rule.id !== id));
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Alert Center</h3>
          <Badge variant="outline">{rules.length} rules</Badge>
        </div>
        <Button onClick={() => setShowCreateForm(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Alert
        </Button>
      </div>

      {/* Create Alert Form */}
      {showCreateForm && (
        <Card className="p-4 mb-6 bg-muted/20">
          <h4 className="font-medium mb-4">Create New Alert Rule</h4>
          <div className="space-y-4">
            <div>
              <Label htmlFor="alertName">Alert Name</Label>
              <Input
                id="alertName"
                placeholder="e.g., High Risk Wallet Alert"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="alertType">Alert Type</Label>
                <Select value={newRule.type} onValueChange={(value: any) => setNewRule({ ...newRule, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="risk_threshold">Risk Threshold</SelectItem>
                    <SelectItem value="large_transaction">Large Transaction</SelectItem>
                    <SelectItem value="sanctions_match">Sanctions Match</SelectItem>
                    <SelectItem value="defi_health">DeFi Health Factor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="threshold">Threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  value={newRule.threshold}
                  onChange={(e) => setNewRule({ ...newRule, threshold: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleCreateRule} disabled={!newRule.name}>
                Create Alert
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Alert Rules List */}
      <div className="space-y-3">
        {rules.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No alert rules configured</p>
          </div>
        ) : (
          rules.map((rule) => (
            <Card key={rule.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Switch
                    checked={rule.isActive}
                    onCheckedChange={() => toggleRule(rule.id)}
                  />
                  <div>
                    <div className="font-medium">{rule.name}</div>
                    <div className="text-sm text-muted-foreground">{rule.condition}</div>
                  </div>
                  <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-xs text-muted-foreground">
                    {rule.notifications.join(', ')}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => deleteRule(rule.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Alert Statistics */}
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
          <div className="text-2xl font-bold text-green-600">
            {rules.filter(r => r.isActive).length}
          </div>
          <div className="text-sm text-muted-foreground">Active Rules</div>
        </div>
        
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">24</div>
          <div className="text-sm text-muted-foreground">Triggered Today</div>
        </div>
        
        <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
          <div className="text-2xl font-bold text-purple-600">156</div>
          <div className="text-sm text-muted-foreground">Total Alerts</div>
        </div>
      </div>
    </Card>
  );
}