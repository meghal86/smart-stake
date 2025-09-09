import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Plus, 
  Edit, 
  Copy, 
  Trash2, 
  Play, 
  Pause, 
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertRuleBuilder } from './AlertRuleBuilder';
import { useCustomAlerts } from '@/hooks/useCustomAlerts';

interface AlertRule {
  id: string;
  name: string;
  description: string;
  conditions: any[];
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
  timesTriggered: number;
  lastTriggeredAt?: string;
  createdAt: string;
}

interface AlertHistory {
  id: string;
  ruleId: string;
  ruleName: string;
  triggeredAt: string;
  matchedConditions: any;
  deliveryStatus: {
    push?: 'sent' | 'failed' | 'not_configured';
    email?: 'sent' | 'failed' | 'not_configured';
    sms?: 'sent' | 'failed' | 'not_configured';
    webhook?: 'sent' | 'failed' | 'not_configured';
  };
}

interface AlertDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AlertDashboard = ({ isOpen, onClose }: AlertDashboardProps) => {
  const { rules, history, createRule, updateRule, deleteRule, toggleRuleStatus, loading } = useCustomAlerts();
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);
  const [activeTab, setActiveTab] = useState('active');
  const [sortBy, setSortBy] = useState('recent');



  const handleSaveRule = async (rule: AlertRule) => {
    let success = false;
    if (editingRule && editingRule.id) {
      success = await updateRule(editingRule.id, rule);
    } else {
      success = await createRule(rule);
    }
    
    if (success) {
      setEditingRule(null);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    await toggleRuleStatus(id, !currentStatus);
  };

  const duplicateRule = async (rule: AlertRule) => {
    const newRule = {
      ...rule,
      name: `${rule.name} (Copy)`,
      id: undefined,
      timesTriggered: 0,
      lastTriggeredAt: undefined
    };
    await createRule(newRule);
  };

  const handleDeleteRule = async (id: string) => {
    if (confirm('Are you sure you want to delete this alert rule?')) {
      await deleteRule(id);
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-gray-100 text-gray-800';
      case 2: return 'bg-blue-100 text-blue-800';
      case 3: return 'bg-yellow-100 text-yellow-800';
      case 4: return 'bg-orange-100 text-orange-800';
      case 5: return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityLabel = (priority: number) => {
    const labels = { 1: 'Low', 2: 'Normal', 3: 'High', 4: 'Critical', 5: 'Emergency' };
    return labels[priority as keyof typeof labels] || 'Normal';
  };

  const getDeliveryStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-3 w-3 text-green-600" />;
      case 'failed': return <AlertTriangle className="h-3 w-3 text-red-600" />;
      default: return <Clock className="h-3 w-3 text-gray-400" />;
    }
  };

  const sortRules = (rulesList: AlertRule[]) => {
    switch (sortBy) {
      case 'priority': return [...rulesList].sort((a, b) => b.priority - a.priority);
      case 'name': return [...rulesList].sort((a, b) => a.name.localeCompare(b.name));
      case 'triggered': return [...rulesList].sort((a, b) => (b.timesTriggered || 0) - (a.timesTriggered || 0));
      default: return [...rulesList].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    }
  };

  const activeRules = sortRules(rules.filter(r => r.isActive));
  const inactiveRules = sortRules(rules.filter(r => !r.isActive));
  const recentlyTriggered = rules.filter(r => r.lastTriggeredAt && 
    new Date(r.lastTriggeredAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  );

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">My Alert Rules</h2>
                <p className="text-muted-foreground">Manage your custom on-chain alert rules</p>
              </div>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recent">Recent</SelectItem>
                    <SelectItem value="priority">Priority</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="triggered">Most Used</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => setShowRuleBuilder(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Rule
                </Button>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="active">
                  Active ({activeRules.length})
                </TabsTrigger>
                <TabsTrigger value="inactive">
                  Inactive ({inactiveRules.length})
                </TabsTrigger>
                <TabsTrigger value="triggered">
                  Recently Fired ({recentlyTriggered.length})
                </TabsTrigger>
                <TabsTrigger value="history">
                  History ({history.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="active" className="space-y-4">
                {activeRules.length === 0 ? (
                  <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Active Rules</h3>
                    <p className="text-muted-foreground mb-4">Create your first alert rule to start monitoring</p>
                    <Button onClick={() => setShowRuleBuilder(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Alert Rule
                    </Button>
                  </div>
                ) : (
                  activeRules.map(rule => (
                    <Card key={rule.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{rule.name}</h3>
                            <Badge className={getPriorityColor(rule.priority)}>
                              {getPriorityLabel(rule.priority)}
                            </Badge>
                            <Badge variant="outline" className="text-green-600">
                              <Activity className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          </div>
                          
                          {rule.description && (
                            <p className="text-sm text-muted-foreground mb-3">{rule.description}</p>
                          )}
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Triggered {rule.timesTriggered} times</span>
                            {rule.lastTriggeredAt && (
                              <span>Last: {new Date(rule.lastTriggeredAt).toLocaleDateString()}</span>
                            )}
                            <div className="flex items-center gap-1">
                              Delivery:
                              {rule.deliveryChannels.push && <Badge variant="outline" className="text-xs">Push</Badge>}
                              {rule.deliveryChannels.email && <Badge variant="outline" className="text-xs">Email</Badge>}
                              {rule.deliveryChannels.sms && <Badge variant="outline" className="text-xs">SMS</Badge>}
                              {rule.deliveryChannels.webhook && <Badge variant="outline" className="text-xs">Webhook</Badge>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.isActive}
                            onCheckedChange={() => handleToggleStatus(rule.id!, rule.isActive)}
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingRule(rule);
                              setShowRuleBuilder(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => duplicateRule(rule)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteRule(rule.id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="inactive" className="space-y-4">
                {inactiveRules.map(rule => (
                  <Card key={rule.id} className="p-4 opacity-60">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold">{rule.name}</h3>
                          <Badge variant="outline" className="text-gray-600">
                            <Pause className="h-3 w-3 mr-1" />
                            Paused
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Triggered {rule.timesTriggered} times before pausing
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleRuleStatus(rule.id)}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Activate
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="triggered" className="space-y-4">
                {recentlyTriggered.map(rule => (
                  <Card key={rule.id} className="p-4 border-l-4 border-l-yellow-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{rule.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Last triggered: {rule.lastTriggeredAt && new Date(rule.lastTriggeredAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Recently Fired
                      </Badge>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="history" className="space-y-4">
                {history.map(item => (
                  <Card key={item.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.ruleName}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {new Date(item.triggeredAt).toLocaleString()}
                        </p>
                        <div className="text-xs text-muted-foreground">
                          Matched: {JSON.stringify(item.matchedConditions)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {Object.entries(item.deliveryStatus).map(([channel, status]) => (
                          <div key={channel} className="flex items-center gap-1">
                            {getDeliveryStatusIcon(status)}
                            <span className="text-xs capitalize">{channel}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </div>
        </Card>
      </div>

      <AlertRuleBuilder
        isOpen={showRuleBuilder}
        onClose={() => {
          setShowRuleBuilder(false);
          setEditingRule(null);
        }}
        onSave={handleSaveRule}
        editingRule={editingRule}
      />
    </>
  );
};