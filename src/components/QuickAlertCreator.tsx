import { useState } from 'react';
import { Bell, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DisabledTooltipButton } from '@/components/ui/disabled-tooltip-button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface QuickAlertCreatorProps {
  whaleAddress: string;
  currentBalance: number;
  riskScore: number;
  onClose: () => void;
}

export const QuickAlertCreator = ({ whaleAddress, currentBalance, riskScore, onClose }: QuickAlertCreatorProps) => {
  const [alertType, setAlertType] = useState('balance_change');
  const [threshold, setThreshold] = useState(currentBalance * 0.1); // 10% change default
  const [loading, setLoading] = useState(false);

  const alertTypes = {
    balance_change: { label: 'Balance Change', unit: '%', defaultValue: 10 },
    large_withdrawal: { label: 'Large Withdrawal', unit: 'ETH', defaultValue: currentBalance * 0.05 },
    large_deposit: { label: 'Large Deposit', unit: 'ETH', defaultValue: currentBalance * 0.05 },
    risk_increase: { label: 'Risk Score Increase', unit: 'points', defaultValue: 10 }
  };

  const createAlert = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('alert_rules')
        .insert({
          user_id: user.id,
          name: `${alertTypes[alertType as keyof typeof alertTypes].label} Alert`,
          conditions: [{
            type: 'amount',
            operator: 'gte',
            value: threshold
          }],
          logic_operator: 'AND',
          delivery_channels: { email: true },
          whale_address: whaleAddress,
          hysteresis_percent: 5,
          is_active: true
        });

      if (error) throw error;
      onClose();
    } catch (error) {
      console.error('Failed to create alert:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 border-blue-200 bg-blue-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-blue-900">Quick Alert</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium text-blue-900 mb-2 block">Alert Type</label>
          <Select value={alertType} onValueChange={setAlertType}>
            <SelectTrigger>
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

        <div>
          <label className="text-sm font-medium text-blue-900 mb-2 block">
            Threshold ({alertTypes[alertType as keyof typeof alertTypes].unit})
          </label>
          <Input
            type="number"
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            placeholder="Enter threshold"
          />
        </div>

        <div className="flex gap-2">
          <DisabledTooltipButton 
            onClick={createAlert} 
            disabled={loading} 
            className="flex-1"
            disabledTooltip={loading ? "Creating alert..." : undefined}
          >
            {loading ? 'Creating...' : 'Create Alert'}
          </DisabledTooltipButton>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Card>
  );
};