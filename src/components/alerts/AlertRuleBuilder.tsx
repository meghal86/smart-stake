import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Plus, X, Zap, TestTube, Save } from 'lucide-react';

interface AlertCondition {
  id: string;
  type: 'amount' | 'chain' | 'token' | 'whale_tag' | 'direction' | 'time_window';
  operator: 'eq' | 'gte' | 'lte' | 'in' | 'not_in';
  value: string | number | string[];
  currency?: 'USD' | 'ETH' | 'BTC';
  unit?: 'hours' | 'days' | 'minutes';
}

interface AlertRule {
  id?: string;
  name: string;
  description: string;
  conditions: AlertCondition[];
  logicOperator: 'AND' | 'OR' | 'NOR';
  timeWindowHours?: number;
  frequencyLimit?: number;
  deliveryChannels: {
    push: boolean;
    email: boolean;
    sms: boolean;
    webhook: boolean;
  };
  webhookUrl?: string;
  priority: number;
  isActive: boolean;
}

interface AlertRuleBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: AlertRule) => void;
  editingRule?: AlertRule | null;
}

const CONDITION_TYPES = [
  { value: 'amount', label: 'Transaction Amount', operators: ['gte', 'lte', 'eq'] },
  { value: 'chain', label: 'Blockchain', operators: ['eq', 'in', 'not_in'] },
  { value: 'token', label: 'Token/Asset', operators: ['eq', 'in', 'not_in'] },
  { value: 'whale_tag', label: 'Whale Wallet', operators: ['eq'] },
  { value: 'direction', label: 'Transaction Type', operators: ['eq'] },
  { value: 'time_window', label: 'Time Window', operators: ['lte'] }
];

const CHAINS = ['ethereum', 'polygon', 'bsc', 'arbitrum', 'optimism', 'avalanche'];
const TOKENS = ['ETH', 'BTC', 'USDC', 'USDT', 'MATIC', 'BNB', 'AVAX', 'OP', 'ARB'];

export const AlertRuleBuilder = ({ isOpen, onClose, onSave, editingRule }: AlertRuleBuilderProps) => {
  const [rule, setRule] = useState<AlertRule>({
    name: '',
    description: '',
    conditions: [],
    logicOperator: 'AND',
    deliveryChannels: { push: true, email: false, sms: false, webhook: false },
    priority: 1,
    isActive: true
  });

  const [previewResults, setPreviewResults] = useState<string[]>([]);
  const [isTestingRule, setIsTestingRule] = useState(false);

  useEffect(() => {
    if (editingRule) {
      setRule(editingRule);
    } else {
      setRule({
        name: '',
        description: '',
        conditions: [],
        logicOperator: 'AND',
        deliveryChannels: { push: true, email: false, sms: false, webhook: false },
        priority: 1,
        isActive: true
      });
    }
  }, [editingRule, isOpen]);

  const addCondition = () => {
    const newCondition: AlertCondition = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'amount',
      operator: 'gte',
      value: 1000000,
      currency: 'USD'
    };
    setRule(prev => ({ ...prev, conditions: [...prev.conditions, newCondition] }));
  };

  const updateCondition = (id: string, updates: Partial<AlertCondition>) => {
    setRule(prev => ({
      ...prev,
      conditions: prev.conditions.map(c => c.id === id ? { ...c, ...updates } : c)
    }));
  };

  const removeCondition = (id: string) => {
    setRule(prev => ({
      ...prev,
      conditions: prev.conditions.filter(c => c.id !== id)
    }));
  };

  const testRule = () => {
    setIsTestingRule(true);
    
    // Simulate rule testing
    setTimeout(() => {
      const mockResults = [
        "Would trigger on: ETH transfer of $2.5M on Ethereum",
        "Would trigger on: USDC transfer of $1.8M on Polygon", 
        "Would NOT trigger on: BTC transfer of $500K (below threshold)"
      ];
      setPreviewResults(mockResults);
      setIsTestingRule(false);
    }, 1500);
  };

  const handleSave = () => {
    if (!rule.name.trim() || rule.conditions.length === 0) {
      alert('Please provide a name and at least one condition');
      return;
    }
    onSave(rule);
    onClose();
  };

  const renderConditionValue = (condition: AlertCondition) => {
    switch (condition.type) {
      case 'amount':
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              value={condition.value}
              onChange={(e) => updateCondition(condition.id, { value: Number(e.target.value) })}
              placeholder="1000000"
              className="flex-1"
            />
            <Select
              value={condition.currency}
              onValueChange={(value) => updateCondition(condition.id, { currency: value as 'USD' | 'ETH' | 'BTC' })}
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
          </div>
        );
      
      case 'chain':
        return (
          <Select
            value={Array.isArray(condition.value) ? condition.value[0] : condition.value}
            onValueChange={(value) => updateCondition(condition.id, { value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select chain" />
            </SelectTrigger>
            <SelectContent>
              {CHAINS.map(chain => (
                <SelectItem key={chain} value={chain}>{chain}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'token':
        return (
          <Select
            value={Array.isArray(condition.value) ? condition.value[0] : condition.value}
            onValueChange={(value) => updateCondition(condition.id, { value })}
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
        );
      
      case 'whale_tag':
        return (
          <Select
            value={condition.value as string}
            onValueChange={(value) => updateCondition(condition.id, { value: value === 'true' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Is Whale Wallet</SelectItem>
              <SelectItem value="false">Not Whale Wallet</SelectItem>
            </SelectContent>
          </Select>
        );
      
      case 'direction':
        return (
          <Select
            value={condition.value as string}
            onValueChange={(value) => updateCondition(condition.id, { value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="buy">Buy/Deposit</SelectItem>
              <SelectItem value="sell">Sell/Withdrawal</SelectItem>
              <SelectItem value="transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
        );
      
      case 'time_window':
        return (
          <div className="flex gap-2">
            <Input
              type="number"
              value={condition.value}
              onChange={(e) => updateCondition(condition.id, { value: Number(e.target.value) })}
              placeholder="24"
              className="flex-1"
            />
            <Select
              value={condition.unit}
              onValueChange={(value) => updateCondition(condition.id, { unit: value as 'hours' | 'days' })}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hours">Hours</SelectItem>
                <SelectItem value="days">Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      
      default:
        return <Input value={condition.value} onChange={(e) => updateCondition(condition.id, { value: e.target.value })} />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold">
                {editingRule ? 'Edit Alert Rule' : 'Create Alert Rule'}
              </h2>
              <p className="text-muted-foreground">Set up custom conditions for on-chain alerts</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Basic Info */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Rule Name</Label>
                  <Input
                    id="name"
                    value={rule.name}
                    onChange={(e) => setRule(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Large ETH Whale Movements"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={rule.description}
                    onChange={(e) => setRule(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what this alert monitors..."
                  />
                </div>
              </div>
            </Card>

            {/* Conditions */}
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Alert Conditions</h3>
                <Button onClick={addCondition} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Condition
                </Button>
              </div>

              {rule.conditions.length > 0 && (
                <div className="mb-4">
                  <Label>Logic Operator</Label>
                  <Select
                    value={rule.logicOperator}
                    onValueChange={(value) => setRule(prev => ({ ...prev, logicOperator: value as 'AND' | 'OR' | 'NOR' }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AND">AND</SelectItem>
                      <SelectItem value="OR">OR</SelectItem>
                      <SelectItem value="NOR">NOR</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    How to combine multiple conditions
                  </p>
                </div>
              )}

              <div className="space-y-4">
                {rule.conditions.map((condition, index) => (
                  <div key={condition.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-4 mb-3">
                      {index > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {rule.logicOperator}
                        </Badge>
                      )}
                      <Select
                        value={condition.type}
                        onValueChange={(value) => updateCondition(condition.id, { type: value as AlertCondition['type'] })}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITION_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select
                        value={condition.operator}
                        onValueChange={(value) => updateCondition(condition.id, { operator: value as AlertCondition['operator'] })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="eq">Equals</SelectItem>
                          <SelectItem value="gte">≥ Greater</SelectItem>
                          <SelectItem value="lte">≤ Less</SelectItem>
                          <SelectItem value="in">In List</SelectItem>
                          <SelectItem value="not_in">Not In</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCondition(condition.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex-1">
                      {renderConditionValue(condition)}
                    </div>
                  </div>
                ))}
              </div>

              {rule.conditions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No conditions added yet</p>
                  <p className="text-sm">Click "Add Condition" to start building your alert</p>
                </div>
              )}
            </Card>

            {/* Delivery Settings */}
            <Card className="p-4">
              <h3 className="font-semibold mb-4">Delivery Settings</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label>Push Notifications</Label>
                    <Switch
                      checked={rule.deliveryChannels.push}
                      onCheckedChange={(checked) => 
                        setRule(prev => ({
                          ...prev,
                          deliveryChannels: { ...prev.deliveryChannels, push: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Email Alerts</Label>
                    <Switch
                      checked={rule.deliveryChannels.email}
                      onCheckedChange={(checked) => 
                        setRule(prev => ({
                          ...prev,
                          deliveryChannels: { ...prev.deliveryChannels, email: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>SMS Alerts</Label>
                    <Switch
                      checked={rule.deliveryChannels.sms}
                      onCheckedChange={(checked) => 
                        setRule(prev => ({
                          ...prev,
                          deliveryChannels: { ...prev.deliveryChannels, sms: checked }
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Webhook</Label>
                    <Switch
                      checked={rule.deliveryChannels.webhook}
                      onCheckedChange={(checked) => 
                        setRule(prev => ({
                          ...prev,
                          deliveryChannels: { ...prev.deliveryChannels, webhook: checked }
                        }))
                      }
                    />
                  </div>
                </div>
                
                {rule.deliveryChannels.webhook && (
                  <div>
                    <Label htmlFor="webhook">Webhook URL</Label>
                    <Input
                      id="webhook"
                      value={rule.webhookUrl || ''}
                      onChange={(e) => setRule(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      placeholder="https://your-app.com/webhook"
                    />
                  </div>
                )}

                <div>
                  <Label>Priority Level</Label>
                  <Select
                    value={rule.priority.toString()}
                    onValueChange={(value) => setRule(prev => ({ ...prev, priority: Number(value) }))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Low</SelectItem>
                      <SelectItem value="2">Normal</SelectItem>
                      <SelectItem value="3">High</SelectItem>
                      <SelectItem value="4">Critical</SelectItem>
                      <SelectItem value="5">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Preview & Test */}
            {rule.conditions.length > 0 && (
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Rule Preview & Test</h3>
                  <Button onClick={testRule} disabled={isTestingRule} size="sm">
                    <TestTube className="h-4 w-4 mr-2" />
                    {isTestingRule ? 'Testing...' : 'Test Rule'}
                  </Button>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-3 mb-4">
                  <p className="text-sm font-mono">
                    Alert when: {rule.conditions.map((c, i) => (
                      <span key={c.id}>
                        {i > 0 && ` ${rule.logicOperator} `}
                        {c.type} {c.operator} {Array.isArray(c.value) ? c.value.join(', ') : c.value}
                        {c.currency && ` ${c.currency}`}
                        {c.unit && ` ${c.unit}`}
                      </span>
                    ))}
                  </p>
                </div>

                {previewResults.length > 0 && (
                  <div className="space-y-2">
                    <Label>Test Results:</Label>
                    {previewResults.map((result, i) => (
                      <div key={i} className="text-sm p-2 bg-muted/30 rounded">
                        {result}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleSave} className="flex-1">
                <Save className="h-4 w-4 mr-2" />
                {editingRule ? 'Update Rule' : 'Create Rule'}
              </Button>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};