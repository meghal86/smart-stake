import { useState, useEffect } from 'react';
import { Bell, Clock, Info, CheckCircle, XCircle, AlertCircle, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { supabase } from '@/integrations/supabase/client';

// Alert configuration interface
interface AlertConfig {
  type: string;
  threshold: number;
  cooldown: number; // Minutes between alerts
  hysteresis: number; // Percentage buffer to prevent flapping
  deliveryMethod: string;
  whaleAddress?: string;
}

// Alert delivery log entry
interface DeliveryLog {
  id: string;
  timestamp: string;
  status: 'sent' | 'failed' | 'pending';
  method: string;
  message: string;
  error?: string;
}

// Tooltip content for alert settings
const tooltips = {
  threshold: "The value that triggers the alert (e.g., transaction amount in ETH)",
  cooldown: "Minimum time between alerts to prevent spam. Longer cooldowns reduce noise.",
  hysteresis: "Buffer percentage to prevent repeated alerts when values fluctuate near threshold",
  deliveryMethod: "How you want to receive alert notifications"
};

// Alert type configurations with defaults
const alertTypes = {
  large_withdrawal: { label: 'Large Withdrawal', defaultThreshold: 100, unit: 'ETH' },
  large_deposit: { label: 'Large Deposit', defaultThreshold: 100, unit: 'ETH' },
  activity_spike: { label: 'Activity Spike', defaultThreshold: 10, unit: 'tx/hour' },
  balance_change: { label: 'Balance Change', defaultThreshold: 5, unit: '%' }
};

// Delivery status icon component
const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'sent': return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
    case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
    default: return <AlertCircle className="h-4 w-4 text-meta" />;
  }
};

export const CustomAlertCreator = ({ whaleAddress }: { whaleAddress?: string }) => {
  // Alert configuration state
  const [config, setConfig] = useState<AlertConfig>({
    type: 'large_withdrawal',
    threshold: 100,
    cooldown: 60, // 1 hour default
    hysteresis: 5, // 5% buffer
    deliveryMethod: 'email',
    whaleAddress
  });

  // UI state
  const [deliveryLogs, setDeliveryLogs] = useState<DeliveryLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // Fetch delivery logs on component mount
  useEffect(() => {
    fetchDeliveryLogs();
  }, [whaleAddress]);

  // Fetch alert delivery history
  const fetchDeliveryLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('alert_notifications')
        .select('*')
        .eq('whale_address', whaleAddress || '')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Transform data to match DeliveryLog interface
      const logs: DeliveryLog[] = (data || []).map(log => ({
        id: log.id,
        timestamp: log.created_at,
        status: log.status,
        method: log.delivery_method,
        message: log.message,
        error: log.error_message
      }));

      setDeliveryLogs(logs);
    } catch (error) {
      console.error('Failed to fetch delivery logs:', error);
    }
  };

  // Create new alert
  const createAlert = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('alert_rules')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          whale_address: config.whaleAddress,
          alert_type: config.type,
          threshold_value: config.threshold,
          cooldown_minutes: config.cooldown,
          hysteresis_percent: config.hysteresis,
          delivery_method: config.deliveryMethod,
          active: true
        });

      if (error) throw error;

      // Refresh logs after creating alert
      await fetchDeliveryLogs();
      
      // Reset form
      setConfig(prev => ({
        ...prev,
        threshold: alertTypes[config.type as keyof typeof alertTypes].defaultThreshold
      }));

    } catch (error) {
      console.error('Failed to create alert:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get current alert type config
  const currentAlertType = alertTypes[config.type as keyof typeof alertTypes];

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Alert Configuration Form */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Create Custom Alert</h3>
          </div>

          <div className="space-y-6">
            {/* Alert Type Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="alert-type">Alert Type</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Choose what type of whale activity to monitor</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select 
                value={config.type} 
                onValueChange={(value) => setConfig(prev => ({ 
                  ...prev, 
                  type: value,
                  threshold: alertTypes[value as keyof typeof alertTypes].defaultThreshold
                }))}
              >
                <SelectTrigger id="alert-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(alertTypes).map(([key, type]) => (
                    <SelectItem key={key} value={key}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Threshold Setting */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="threshold">Threshold ({currentAlertType.unit})</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tooltips.threshold}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="threshold"
                type="number"
                value={config.threshold}
                onChange={(e) => setConfig(prev => ({ ...prev, threshold: Number(e.target.value) }))}
                placeholder={`Enter ${currentAlertType.unit.toLowerCase()}`}
              />
            </div>

            {/* Cooldown Slider */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Cooldown Period</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tooltips.cooldown}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="px-3">
                <Slider
                  value={[config.cooldown]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, cooldown: value }))}
                  max={1440} // 24 hours
                  min={5}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>5 min</span>
                  <span className="font-medium">
                    {config.cooldown < 60 
                      ? `${config.cooldown} minutes`
                      : `${Math.round(config.cooldown / 60)} hours`
                    }
                  </span>
                  <span>24 hours</span>
                </div>
              </div>
            </div>

            {/* Hysteresis Slider */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label>Hysteresis Buffer</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tooltips.hysteresis}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <div className="px-3">
                <Slider
                  value={[config.hysteresis]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, hysteresis: value }))}
                  max={20}
                  min={0}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>0%</span>
                  <span className="font-medium">{config.hysteresis}% buffer</span>
                  <span>20%</span>
                </div>
              </div>
            </div>

            {/* Delivery Method */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="delivery-method">Delivery Method</Label>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{tooltips.deliveryMethod}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <Select 
                value={config.deliveryMethod} 
                onValueChange={(value) => setConfig(prev => ({ ...prev, deliveryMethod: value }))}
              >
                <SelectTrigger id="delivery-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="push">Push Notification</SelectItem>
                  <SelectItem value="webhook">Webhook</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={createAlert} 
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Create Alert
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowLogs(!showLogs)}
              >
                View Logs
              </Button>
            </div>
          </div>
        </Card>

        {/* Delivery Logs */}
        {showLogs && (
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold">Alert Delivery Log</h4>
              <Button variant="ghost" size="sm" onClick={fetchDeliveryLogs}>
                Refresh
              </Button>
            </div>

            {deliveryLogs.length > 0 ? (
              <div className="space-y-3">
                {deliveryLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <StatusIcon status={log.status} />
                      <div>
                        <p className="text-sm font-medium">{log.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString()} • {log.method}
                        </p>
                        {log.error && (
                          <p className="text-xs text-red-600 mt-1">{log.error}</p>
                        )}
                      </div>
                    </div>
                    <Badge 
                      variant={
                        log.status === 'sent' ? 'default' : 
                        log.status === 'failed' ? 'destructive' : 
                        'secondary'
                      }
                    >
                      {log.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No alert deliveries yet</p>
                <p className="text-sm">Create an alert to see delivery status here</p>
              </div>
            )}
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};