import { useState } from "react";
import { useAlerts, useCreateAlert } from "@/hooks/hub2";
import Hub2Layout from "@/components/hub2/Hub2Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  Bell, 
  Plus, 
  Settings, 
  TrendingUp, 
  AlertTriangle, 
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";

const ALERT_TEMPLATES = [
  {
    id: 'sentiment_spike',
    name: 'Sentiment Spike',
    description: 'Alert when sentiment increases by 20%',
    icon: TrendingUp,
    color: 'text-green-600'
  },
  {
    id: 'risk_increase',
    name: 'Risk Increase',
    description: 'Alert when risk score increases above 7',
    icon: AlertTriangle,
    color: 'text-red-600'
  },
  {
    id: 'whale_activity',
    name: 'Whale Activity',
    description: 'Alert when whale pressure changes significantly',
    icon: Activity,
    color: 'text-blue-600'
  }
];

export default function AlertsPage() {
  const { data: alerts, isLoading } = useAlerts();
  const createAlertMutation = useCreateAlert();
  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const formatLastTriggered = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    }
  };
  const [newAlert, setNewAlert] = useState({
    name: '',
    predicate: {},
    scope: { kind: 'asset' as const, ids: [] },
    threshold: {},
    window: '24h' as const,
    channels: ['inapp'] as ('inapp'|'push'|'email')[],
    enabled: true
  });

  const handleCreateAlert = async () => {
    try {
      await createAlertMutation.mutateAsync(newAlert);
      setShowBuilder(false);
      setNewAlert({
        name: '',
        predicate: {},
        scope: { kind: 'asset', ids: [] },
        threshold: {},
        window: '24h',
        channels: ['inapp'],
        enabled: true
      });
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'sentiment_spike': return TrendingUp;
      case 'risk_increase': return AlertTriangle;
      case 'whale_activity': return Activity;
      default: return Bell;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'sentiment_spike': return 'text-green-600 bg-green-50';
      case 'risk_increase': return 'text-red-600 bg-red-50';
      case 'whale_activity': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Hub2Layout>
      <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold">Alerts</h1>
            <p className="text-muted-foreground">
              Create and manage your market alerts
            </p>
          </div>
          <Button
            onClick={() => setShowBuilder(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Alert
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold">
                    {alerts?.length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Whale Alerts</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {alerts?.filter(a => a.enabled).length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <div>
                  <div className="text-2xl font-bold">
                    {alerts?.filter(a => !a.enabled).length || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Disabled</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">24h</div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="text-sm text-muted-foreground cursor-help">Avg Response</div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs">Average time from signal detection to alert delivery</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Alert Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New Alert</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Template Selection */}
              <div>
                <label className="text-sm font-medium mb-2 block">Choose Template</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {ALERT_TEMPLATES.map((template) => (
                    <Card
                      key={template.id}
                      className={cn(
                        "cursor-pointer transition-all",
                        selectedTemplate === template.id && "ring-2 ring-primary"
                      )}
                      onClick={() => setSelectedTemplate(template.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={cn("p-2 rounded-lg", template.color)}>
                            <template.icon className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-medium">{template.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {template.description}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Alert Configuration */}
              {selectedTemplate && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Alert Name</label>
                    <Input
                      value={newAlert.name}
                      onChange={(e) => setNewAlert({ ...newAlert, name: e.target.value })}
                      placeholder="Enter alert name"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Time Window</label>
                      <Select
                        value={newAlert.window}
                        onValueChange={(value) => setNewAlert({ ...newAlert, window: value as unknown })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1h">1 Hour</SelectItem>
                          <SelectItem value="4h">4 Hours</SelectItem>
                          <SelectItem value="24h">24 Hours</SelectItem>
                          <SelectItem value="7d">7 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Scope</label>
                      <Select
                        value={newAlert.scope.kind}
                        onValueChange={(value) => setNewAlert({ 
                          ...newAlert, 
                          scope: { ...newAlert.scope, kind: value as unknown } 
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asset">Asset</SelectItem>
                          <SelectItem value="chain">Chain</SelectItem>
                          <SelectItem value="cluster">Cluster</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Notification Channels</label>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <Switch
                          checked={newAlert.channels.includes('inapp')}
                          onCheckedChange={(checked) => {
                            const channels = checked 
                              ? [...newAlert.channels, 'inapp']
                              : newAlert.channels.filter(c => c !== 'inapp');
                            setNewAlert({ ...newAlert, channels });
                          }}
                        />
                        <span className="text-sm">In-App</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <Switch
                          checked={newAlert.channels.includes('push')}
                          onCheckedChange={(checked) => {
                            const channels = checked 
                              ? [...newAlert.channels, 'push']
                              : newAlert.channels.filter(c => c !== 'push');
                            setNewAlert({ ...newAlert, channels });
                          }}
                        />
                        <span className="text-sm">Push</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <Switch
                          checked={newAlert.channels.includes('email')}
                          onCheckedChange={(checked) => {
                            const channels = checked 
                              ? [...newAlert.channels, 'email']
                              : newAlert.channels.filter(c => c !== 'email');
                            setNewAlert({ ...newAlert, channels });
                          }}
                        />
                        <span className="text-sm">Email</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newAlert.enabled}
                      onCheckedChange={(checked) => setNewAlert({ ...newAlert, enabled: checked })}
                    />
                    <span className="text-sm">Enable alert immediately</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setShowBuilder(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateAlert}
                  disabled={!selectedTemplate || !newAlert.name || createAlertMutation.isPending}
                >
                  {createAlertMutation.isPending ? 'Creating...' : 'Create Alert'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-4" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : alerts && alerts.length > 0 ? (
          alerts.map((alert) => {
            const Icon = getAlertIcon('whale_activity');
            const colorClass = getAlertColor('whale_activity');
            
            return (
              <Card key={alert.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("p-2 rounded-lg", colorClass)}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{alert.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {alert.symbol} • ${alert.amount ? (alert.amount / 1000000).toFixed(1) : 0}M
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Hash: {alert.hash?.slice(0, 8)}...{alert.hash?.slice(-8)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={alert.enabled ? "default" : "secondary"}>
                        {alert.enabled ? 'Active' : 'Disabled'}
                      </Badge>
                      <Badge variant="outline">
                        {alert.window}
                      </Badge>
                      <div className="flex gap-1">
                        {alert.channels.includes('inapp') && <Bell className="w-4 h-4 text-muted-foreground" />}
                        {alert.channels.includes('push') && <Smartphone className="w-4 h-4 text-muted-foreground" />}
                        {alert.channels.includes('email') && <Mail className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      {alert.lastTriggered && (
                        <div className="text-xs text-muted-foreground">
                          Last triggered {formatLastTriggered(alert.lastTriggered)}
                        </div>
                      )}
                      <Button size="sm" variant="ghost">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No alerts yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first alert to stay informed about market changes
            </p>
            <Button onClick={() => setShowBuilder(true)}>
              Create Alert
            </Button>
          </div>
        )}
      </div>
      </div>
    </Hub2Layout>
  );
}
