import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { AlertRuleBuilder } from './AlertRuleBuilder';
import { useCustomAlerts, AlertRule } from '@/hooks/useCustomAlerts';
import { 
  X, 
  Edit, 
  Copy, 
  Trash2, 
  Play, 
  Pause, 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Plus
} from 'lucide-react';

interface AlertDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AlertDashboard({ isOpen, onClose }: AlertDashboardProps) {
  const { rules, loading, createRule, updateRule, deleteRule, toggleRule, duplicateRule } = useCustomAlerts();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState<AlertRule | null>(null);

  const activeRules = rules.filter(rule => rule.is_active);
  const inactiveRules = rules.filter(rule => !rule.is_active);
  const recentlyTriggered = rules.filter(rule => 
    rule.last_triggered_at && 
    new Date(rule.last_triggered_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  );

  const handleSaveRule = async (ruleData: Omit<AlertRule, 'id'>) => {
    if (editingRule) {
      await updateRule(editingRule.id!, ruleData);
    } else {
      await createRule(ruleData);
    }
    setShowBuilder(false);
    setEditingRule(null);
  };

  const handleEditRule = (rule: AlertRule) => {
    setEditingRule(rule);
    setShowBuilder(true);
  };

  const handleDeleteRule = async (id: string) => {
    if (confirm('Are you sure you want to delete this alert rule?')) {
      await deleteRule(id);
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return 'bg-gray-500';
      case 2: return 'bg-blue-500';
      case 3: return 'bg-green-500';
      case 4: return 'bg-orange-500';
      case 5: return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatConditions = (conditions: unknown[]) => {
    return conditions.map(c => {
      if (c.type === 'amount') {
        return `${c.operator === 'gte' ? '≥' : c.operator === 'lte' ? '≤' : '='} ${c.value.toLocaleString()} ${c.currency}`;
      }
      return `${c.type} ${c.operator} ${c.value}`;
    }).join(', ');
  };

  if (!isOpen) return null;

  if (showBuilder) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">
                {editingRule ? 'Edit Alert Rule' : 'Create Alert Rule'}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setShowBuilder(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <AlertRuleBuilder
              initialRule={editingRule || undefined}
              onSave={handleSaveRule}
              onCancel={() => setShowBuilder(false)}
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Alert Dashboard</h2>
                <p className="text-sm text-muted-foreground">Manage your custom alert rules</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowBuilder(true)} className="bg-[#14B8A6] hover:bg-[#0F9488]">
                <Plus className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="active">
                Active ({activeRules.length})
              </TabsTrigger>
              <TabsTrigger value="inactive">
                Inactive ({inactiveRules.length})
              </TabsTrigger>
              <TabsTrigger value="recent">
                Recent ({recentlyTriggered.length})
              </TabsTrigger>
              <TabsTrigger value="history">
                History
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 max-h-[calc(90vh-250px)] overflow-y-auto">
              <TabsContent value="active" className="space-y-4">
                {activeRules.length === 0 ? (
                  <div className="text-center py-12">
                    <Zap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Active Rules</h3>
                    <p className="text-muted-foreground mb-4">Create your first alert rule to start monitoring</p>
                    <Button onClick={() => setShowBuilder(true)} className="bg-[#14B8A6] hover:bg-[#0F9488]">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Alert Rule
                    </Button>
                  </div>
                ) : (
                  activeRules.map((rule) => (
                    <Card key={rule.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{rule.name}</h3>
                            <div className={`w-2 h-2 rounded-full ${getPriorityColor(rule.priority)}`} />
                            <Badge variant="outline" className="text-xs">
                              {rule.logic_operator}
                            </Badge>
                            {rule.is_active && (
                              <Badge className="bg-green-500 text-white text-xs">
                                <Play className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            )}
                          </div>
                          
                          {rule.description && (
                            <p className="text-sm text-muted-foreground mb-2">{rule.description}</p>
                          )}
                          
                          <div className="text-xs text-muted-foreground">
                            <p>Conditions: {formatConditions(rule.conditions)}</p>
                            <p>Triggered: {rule.times_triggered || 0} times</p>
                            {rule.last_triggered_at && (
                              <p>Last: {new Date(rule.last_triggered_at).toLocaleString()}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Switch
                            checked={rule.is_active}
                            onCheckedChange={() => toggleRule(rule.id!)}
                          />
                          <Button size="sm" variant="ghost" onClick={() => handleEditRule(rule)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => duplicateRule(rule.id!)}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteRule(rule.id!)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="inactive" className="space-y-4">
                {inactiveRules.map((rule) => (
                  <Card key={rule.id} className="p-4 opacity-60">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{rule.name}</h3>
                          <Badge variant="secondary" className="text-xs">
                            <Pause className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Conditions: {formatConditions(rule.conditions)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() => toggleRule(rule.id!)}
                        />
                        <Button size="sm" variant="ghost" onClick={() => handleEditRule(rule)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteRule(rule.id!)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="recent" className="space-y-4">
                {recentlyTriggered.map((rule) => (
                  <Card key={rule.id} className="p-4 border-green-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{rule.name}</h3>
                          <Badge className="bg-green-500 text-white text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Recently Triggered
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Last triggered: {rule.last_triggered_at && new Date(rule.last_triggered_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="history">
                <div className="text-center py-12">
                  <Clock className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Alert History</h3>
                  <p className="text-muted-foreground">Detailed history coming soon</p>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}