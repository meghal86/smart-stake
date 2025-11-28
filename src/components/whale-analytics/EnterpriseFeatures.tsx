import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Bell, Download, Share2, Settings, Plus, Trash2, Eye, Filter, UserCheck, CheckCircle, ChevronDown, Users } from 'lucide-react';

interface WhaleData {
  id: string;
  address: string;
  riskScore: number;
  type: string;
  signals: string[];
  activity?: {
    volume24h: string;
  };
}

interface CustomRule {
  id: string;
  name: string;
  conditions: {
    riskThreshold: number;
    whaleType?: string;
    signals?: string[];
  };
  actions: {
    notify: boolean;
    channels: string[];
  };
  isActive: boolean;
}

interface EnterpriseProps {
  whales: WhaleData[];
  onTriggerAlert: (whale: WhaleData, rule: CustomRule) => void;
}

export const EnterpriseFeatures = ({ whales, onTriggerAlert }: EnterpriseProps) => {
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState<string | null>(null);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [newRule, setNewRule] = useState({ name: '', threshold: '', type: '', channels: [] as string[] });
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [customRules, setCustomRules] = useState<CustomRule[]>([
    {
      id: '1',
      name: 'Critical Risk Alert',
      conditions: { riskThreshold: 9 },
      actions: { notify: true, channels: ['email', 'sms'] },
      isActive: true
    }
  ]);

  const shareWithTeam = (data: unknown, title: string) => {
    const shareData = {
      title: `WhalePlus: ${title}`,
      text: `High-risk whale analysis from WhalePlus`,
      url: window.location.href
    };
    
    if (navigator.share) {
      navigator.share(shareData);
    } else {
      const shareText = `${shareData.title}\n${shareData.text}\n${shareData.url}`;
      navigator.clipboard.writeText(shareText);
      alert('Share link copied to clipboard!');
    }
  };

  const downloadReport = (format: 'csv' | 'json', data: WhaleData[]) => {
    const timestamp = new Date().toISOString().split('T')[0];
    
    if (format === 'csv') {
      const csvContent = data.map(w => 
        `${w.address},${w.type},${w.riskScore},${w.signals.join(';')}`
      ).join('\n');
      const blob = new Blob([`Address,Type,Risk Score,Signals\n${csvContent}`], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whale-report-${timestamp}.csv`;
      a.click();
    } else {
      const report = {
        generated_at: new Date().toISOString(),
        total_whales: data.length,
        high_risk_count: data.filter(w => w.riskScore >= 7).length,
        whales: data
      };
      const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `whale-report-${timestamp}.json`;
      a.click();
    }
  };

  const checkRules = (whale: WhaleData) => {
    customRules.forEach(rule => {
      if (!rule.isActive) return;
      
      let triggered = false;
      
      if (rule.conditions.riskThreshold && whale.riskScore >= rule.conditions.riskThreshold) {
        triggered = true;
      }
      
      if (rule.conditions.whaleType && whale.type !== rule.conditions.whaleType) {
        triggered = false;
      }
      
      if (rule.conditions.signals && !rule.conditions.signals.some(s => whale.signals.includes(s))) {
        triggered = false;
      }
      
      if (triggered) {
        onTriggerAlert(whale, rule);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Action Bar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-semibold">Enterprise Actions</h3>
          <div className="flex flex-wrap gap-2">
            <div className="relative group">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => downloadReport('csv', whales)}
                className="focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Export data as CSV file
              </div>
            </div>
            <div className="relative group">
              <Button variant="outline" size="sm" onClick={() => downloadReport('json', whales)}>
                <Download className="h-4 w-4 mr-2" />
                JSON
              </Button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Export detailed JSON report
              </div>
            </div>
            <div className="relative group">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => shareWithTeam(whales, 'Whale Analysis')}
                className="shadow-md hover:shadow-lg transition-shadow bg-gradient-to-r from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 border-cyan-200 text-cyan-700"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Send alert to team workspace
              </div>
            </div>
            <div className="relative group">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowRuleBuilder(!showRuleBuilder)}
                className="bg-teal-50 hover:bg-teal-100 border-teal-300 text-teal-800 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all"
              >
                <Settings className="h-4 w-4 mr-2" />
                Rules
              </Button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Edit risk detection parameters
              </div>
            </div>
            <div className="relative group">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowAuditLogs(!showAuditLogs)}
                className="bg-slate-50 hover:bg-slate-100 border-slate-300 text-slate-800 shadow-md hover:shadow-lg focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all"
              >
                <Eye className="h-4 w-4 mr-2" />
                Audit
              </Button>
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                Download compliance logs
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Custom Risk Rules */}
      {showRuleBuilder && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium">Custom Risk Rules</h4>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </div>
          
          <div className="space-y-3">
            {customRules.map(rule => (
              <div key={rule.id} className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <div>
                      <div className="font-medium">{rule.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Risk ≥ {rule.conditions.riskThreshold} → {rule.actions.channels.join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setEditingRule(editingRule === rule.id ? null : rule.id)}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-600">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                {editingRule === rule.id && (
                  <div className="p-3 bg-slate-50 rounded border">
                    <h6 className="font-medium mb-2">Edit Rule</h6>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs font-medium mb-1 block">Rule Name</label>
                        <Input 
                          value={rule.name} 
                          onChange={(e) => {
                            const updated = customRules.map(r => 
                              r.id === rule.id ? {...r, name: e.target.value} : r
                            );
                            setCustomRules(updated);
                          }}
                          className="text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium mb-1 block">Risk Threshold</label>
                        <Select 
                          value={rule.conditions.riskThreshold.toString()} 
                          onValueChange={(value) => {
                            const updated = customRules.map(r => 
                              r.id === rule.id ? {...r, conditions: {...r.conditions, riskThreshold: parseInt(value)}} : r
                            );
                            setCustomRules(updated);
                          }}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="7">High Risk (7+)</SelectItem>
                            <SelectItem value="8">Very High Risk (8+)</SelectItem>
                            <SelectItem value="9">Critical Risk (9+)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" onClick={() => setEditingRule(null)}>Save</Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingRule(null)}>Cancel</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-muted/20 rounded">
            <h5 className="font-medium mb-3">Create New Rule</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Rule Name</label>
                <Input 
                  placeholder="e.g., High Risk Trader Alert" 
                  value={newRule.name}
                  onChange={(e) => setNewRule({...newRule, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Risk Threshold</label>
                <Select value={newRule.threshold} onValueChange={(value) => setNewRule({...newRule, threshold: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select threshold" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">High Risk (7+)</SelectItem>
                    <SelectItem value="8">Very High Risk (8+)</SelectItem>
                    <SelectItem value="9">Critical Risk (9+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Whale Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any Type</SelectItem>
                    <SelectItem value="trader">Trader</SelectItem>
                    <SelectItem value="hodler">Hodler</SelectItem>
                    <SelectItem value="liquidity_provider">LP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Alert Channels</label>
                <div className="flex gap-2">
                  <Badge variant="outline" className="cursor-pointer">Email</Badge>
                  <Badge variant="outline" className="cursor-pointer">Push</Badge>
                  <Badge variant="outline" className="cursor-pointer">SMS</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button 
                size="sm" 
                onClick={() => {
                  if (newRule.name && newRule.threshold) {
                    const rule: CustomRule = {
                      id: Date.now().toString(),
                      name: newRule.name,
                      conditions: { riskThreshold: parseInt(newRule.threshold) },
                      actions: { notify: true, channels: newRule.channels.length > 0 ? newRule.channels : ['email'] },
                      isActive: true
                    };
                    setCustomRules([...customRules, rule]);
                    setNewRule({ name: '', threshold: '', type: '', channels: [] });
                    alert('Rule created successfully!');
                  } else {
                    alert('Please fill in rule name and threshold');
                  }
                }}
              >
                Create Rule
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setNewRule({ name: '', threshold: '', type: '', channels: [] })}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Audit Logs */}
      {showAuditLogs && (
        <Card className="p-4">
          <h4 className="font-medium mb-4">Audit Logs</h4>
          <div className="space-y-2">
            {[
              { time: '2h ago', action: 'Alert Sent', details: 'High risk whale 0x1234...5678 triggered SMS alert', severity: 'high' },
              { time: '4h ago', action: 'Rule Created', details: 'Custom rule "Critical Risk Alert" created', severity: 'medium' },
              { time: '6h ago', action: 'Export', details: 'Whale data exported as JSON by user', severity: 'low' },
              { time: '1d ago', action: 'Alert Sent', details: 'Escalating risk pattern detected for 0x9876...4321', severity: 'high' }
            ].map((log, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted/20 rounded">
                <div className="flex items-center gap-3">
                  <Badge variant={log.severity === 'high' ? 'destructive' : log.severity === 'medium' ? 'default' : 'secondary'}>
                    {log.action}
                  </Badge>
                  <span className="text-sm">{log.details}</span>
                </div>
                <span className="text-xs text-muted-foreground">{log.time}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Active Alerts */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h4 className="font-medium">Active Alerts</h4>
            <Badge variant="destructive" className="animate-pulse">{whales.filter(w => w.riskScore >= 7).length}</Badge>
          </div>
          <div className="flex gap-2">
            <div className="relative group">
              <Button 
                variant="outline" 
                size="sm"
                className="hover:bg-blue-50 hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              >
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
              <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                Filter alerts by risk/pattern
              </div>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          {whales.filter(w => w.riskScore >= 7).map(whale => {
            const isCritical = whale.riskScore >= 9;
            return (
              <div key={whale.id} className="space-y-2">
                <div 
                  className={`flex items-center justify-between p-3 rounded border ${
                    isCritical 
                      ? 'bg-red-100 border-red-300 animate-pulse' 
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={`h-4 w-4 ${isCritical ? 'text-red-700' : 'text-red-600'}`} />
                    <div>
                      <div className="font-medium">{whale.address}</div>
                      <div className="text-sm text-muted-foreground">
                        Risk Score: {whale.riskScore}/10 • {whale.signals.join(', ')}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative group">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setShowAssignModal(whale.id)}
                        className="hover:bg-blue-50 hover:border-blue-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                      >
                        <UserCheck className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                      <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Assign to team member
                      </div>
                    </div>
                    <div className="relative group">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => checkRules(whale)}
                        className={`shadow-md hover:shadow-lg focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all ${
                          isCritical ? 'animate-pulse bg-red-50 border-red-400 hover:bg-red-100 text-red-800' : 'hover:bg-orange-50 hover:border-orange-300 text-orange-800'
                        }`}
                      >
                        <Bell className="h-4 w-4 mr-1" />
                        Alert
                      </Button>
                      <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Send immediate alert
                      </div>
                    </div>
                    <div className="relative group">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setExpandedAlert(expandedAlert === whale.id ? null : whale.id)}
                        className="hover:bg-slate-50 hover:border-slate-300 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 transition-all"
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${expandedAlert === whale.id ? 'rotate-180' : ''}`} />
                      </Button>
                      <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        View risk breakdown
                      </div>
                    </div>
                    <div className="relative group">
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="hover:bg-green-50 hover:border-green-300 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all text-green-800"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <div className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        Mark as resolved
                      </div>
                    </div>
                  </div>
                </div>
                {expandedAlert === whale.id && (
                  <div className="p-3 bg-slate-50 rounded border-l-4 border-blue-500">
                    <h5 className="font-medium mb-2">Risk Breakdown</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Transaction Volume:</span>
                        <span className="ml-2 font-medium">{whale.activity?.volume24h || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Pattern Changes:</span>
                        <span className="ml-2 font-medium">3 in 24h</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Risk Factors:</span>
                        <span className="ml-2 font-medium">{whale.signals.length} active</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Confidence:</span>
                        <span className="ml-2 font-medium">94%</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        {/* Assignment Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="w-full max-w-md mx-4 p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium">Assign Alert</h4>
                <Button variant="ghost" size="sm" onClick={() => setShowAssignModal(null)}>×</Button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium mb-2 block">Team Member</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="john">John Smith (Security Lead)</SelectItem>
                      <SelectItem value="sarah">Sarah Chen (Risk Analyst)</SelectItem>
                      <SelectItem value="mike">Mike Johnson (Compliance)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Priority</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Set priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="high">🔴 High Priority</SelectItem>
                      <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                      <SelectItem value="low">🟢 Low Priority</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => setShowAssignModal(null)}>Assign</Button>
                  <Button variant="outline" size="sm" onClick={() => setShowAssignModal(null)}>Cancel</Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
};