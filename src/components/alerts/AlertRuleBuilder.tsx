import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Zap, TestTube } from 'lucide-react';
import { AlertRule, AlertCondition } from '@/hooks/useCustomAlerts';

interface AlertRuleBuilderProps {
  initialRule?: Partial<AlertRule>;
  onSave: (rule: Omit<AlertRule, 'id'>) => Promise<void>;
  onCancel: () => void;
}

export function AlertRuleBuilder({ initialRule, onSave, onCancel }: AlertRuleBuilderProps) {
  const [rule, setRule] = useState<Omit<AlertRule, 'id'>>({
    name: initialRule?.name || '',
    description: initialRule?.description || '',
    conditions: initialRule?.conditions || [],
    logic_operator: initialRule?.logic_operator || 'AND',
    time_window_hours: initialRule?.time_window_hours,
    frequency_limit: initialRule?.frequency_limit || 10,
    delivery_channels: initialRule?.delivery_channels || { push: true },
    webhook_url: initialRule?.webhook_url || '',
    priority: initialRule?.priority || 3,
    is_active: initialRule?.is_active ?? true
  });

  const [saving, setSaving] = useState(false);

  const addCondition = () => {
    setRule(prev => ({
      ...prev,
      conditions: [...prev.conditions, {
        type: 'amount',
        operator: 'gte',
        value: 1000000,
        currency: 'USD'
      }]
    }));
  };

  const updateCondition = (index: number, updates: Partial<AlertCondition>) => {
    setRule(prev => ({
      ...prev,
      conditions: prev.conditions.map((condition, i) => 
        i === index ? { ...condition, ...updates } : condition
      )
    }));
  };

  const removeCondition = (index: number) => {
    setRule(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    if (!rule.name.trim() || rule.conditions.length === 0) return;
    
    setSaving(true);
    try {
      await onSave(rule);
    } finally {
      setSaving(false);
    }
  };

  const testRule = () => {
    // Simulate testing the rule
    alert('Rule test: This rule would trigger for the current conditions');
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Rule Name</Label>
          <Input
            id="name"
            value={rule.name}
            onChange={(e) => setRule(prev => ({ ...prev, name: e.target.value }))}
            placeholder="Large ETH Movements"
            className="mt-1"
          />
        </div>
        
        <div>
          <Label htmlFor="description">Description (Optional)</Label>
          <Input
            id="description"
            value={rule.description}
            onChange={(e) => setRule(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Alert when ETH transactions exceed $1M"
            className="mt-1"
          />
        </div>
      </div>

      {/* Conditions */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium">Alert Conditions</h3>
          <Button size="sm" onClick={addCondition}>
            <Plus className="h-4 w-4 mr-2" />
            Add Condition
          </Button>
        </div>

        {rule.conditions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No conditions added. Click "Add Condition" to start.
          </p>
        ) : (
          <div className="space-y-3">
            {rule.conditions.map((condition, index) => (
              <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                {index > 0 && (
                  <Badge variant="outline" className="text-xs">
                    {rule.logic_operator}
                  </Badge>
                )}
                
                <Select
                  value={condition.type}
                  onValueChange={(value: any) => updateCondition(index, { type: value })}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="amount">Amount</SelectItem>
                    <SelectItem value="chain">Chain</SelectItem>
                    <SelectItem value="token">Token</SelectItem>
                    <SelectItem value="whale_tag">Whale Tag</SelectItem>
                    <SelectItem value="direction">Direction</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={condition.operator}
                  onValueChange={(value) => updateCondition(index, { operator: value })}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {condition.type === 'amount' && (
                      <>
                        <SelectItem value="gte">≥</SelectItem>
                        <SelectItem value="lte">≤</SelectItem>
                        <SelectItem value="eq">=</SelectItem>
                      </>
                    )}
                    {condition.type !== 'amount' && (
                      <>
                        <SelectItem value="eq">Equals</SelectItem>
                        <SelectItem value="in">In List</SelectItem>
                        <SelectItem value="not_in">Not In</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>

                <Input
                  value={condition.value}
                  onChange={(e) => updateCondition(index, { 
                    value: condition.type === 'amount' ? Number(e.target.value) : e.target.value 
                  })}
                  placeholder={condition.type === 'amount' ? '1000000' : 'ETH'}
                  className="flex-1"
                />

                {condition.type === 'amount' && (
                  <Select
                    value={condition.currency || 'USD'}
                    onValueChange={(value) => updateCondition(index, { currency: value })}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                      <SelectItem value="BTC">BTC</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeCondition(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {rule.conditions.length > 1 && (
          <div className="mt-4">
            <Label>Logic Operator</Label>
            <Select
              value={rule.logic_operator}
              onValueChange={(value: any) => setRule(prev => ({ ...prev, logic_operator: value }))}
            >
              <SelectTrigger className="w-32 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AND">AND</SelectItem>
                <SelectItem value="OR">OR</SelectItem>
                <SelectItem value="NOR">NOR</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </Card>

      {/* Delivery Settings */}
      <Card className="p-4">
        <h3 className="font-medium mb-4">Delivery Channels</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Push Notifications</Label>
            <Switch
              checked={rule.delivery_channels.push}
              onCheckedChange={(checked) => 
                setRule(prev => ({
                  ...prev,
                  delivery_channels: { ...prev.delivery_channels, push: checked }
                }))
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label>Email Alerts</Label>
            <Switch
              checked={rule.delivery_channels.email}
              onCheckedChange={(checked) => 
                setRule(prev => ({
                  ...prev,
                  delivery_channels: { ...prev.delivery_channels, email: checked }
                }))
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Webhook</Label>
            <Switch
              checked={rule.delivery_channels.webhook}
              onCheckedChange={(checked) => 
                setRule(prev => ({
                  ...prev,
                  delivery_channels: { ...prev.delivery_channels, webhook: checked }
                }))
              }
            />
          </div>

          {rule.delivery_channels.webhook && (
            <div>
              <Label htmlFor="webhook">Webhook URL</Label>
              <Input
                id="webhook"
                value={rule.webhook_url}
                onChange={(e) => setRule(prev => ({ ...prev, webhook_url: e.target.value }))}
                placeholder="https://your-api.com/webhook"
                className="mt-1"
              />
            </div>
          )}
        </div>
      </Card>

      {/* Advanced Settings */}
      <Card className="p-4">
        <h3 className="font-medium mb-4">Advanced Settings</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="priority">Priority Level</Label>
            <Select
              value={rule.priority.toString()}
              onValueChange={(value) => setRule(prev => ({ ...prev, priority: Number(value) }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 - Low</SelectItem>
                <SelectItem value="2">2 - Medium</SelectItem>
                <SelectItem value="3">3 - Normal</SelectItem>
                <SelectItem value="4">4 - High</SelectItem>
                <SelectItem value="5">5 - Emergency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="frequency">Frequency Limit</Label>
            <Input
              id="frequency"
              type="number"
              value={rule.frequency_limit}
              onChange={(e) => setRule(prev => ({ ...prev, frequency_limit: Number(e.target.value) }))}
              placeholder="10"
              className="mt-1"
            />
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex gap-3">
        <Button onClick={testRule} variant="outline" className="flex-1">
          <TestTube className="h-4 w-4 mr-2" />
          Test Rule
        </Button>
        <Button onClick={onCancel} variant="outline" className="flex-1">
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          disabled={saving || !rule.name.trim() || rule.conditions.length === 0}
          className="flex-1 bg-[#14B8A6] hover:bg-[#0F9488]"
        >
          <Zap className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Rule'}
        </Button>
      </div>
    </div>
  );
}