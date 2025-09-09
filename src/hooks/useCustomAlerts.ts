import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  timesTriggered?: number;
  lastTriggeredAt?: string;
  createdAt?: string;
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

export const useCustomAlerts = () => {
  const { user } = useAuth();
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [history, setHistory] = useState<AlertHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch alert rules
  const fetchRules = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('alert_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Alert rules table not found, using empty state:', error.message);
        setRules([]);
        return;
      }

      const formattedRules = data?.map(rule => ({
        id: rule.id,
        name: rule.name,
        description: rule.description || '',
        conditions: rule.conditions || [],
        logicOperator: rule.logic_operator as 'AND' | 'OR' | 'NOR',
        timeWindowHours: rule.time_window_hours,
        frequencyLimit: rule.frequency_limit,
        deliveryChannels: rule.delivery_channels || { push: true, email: false, sms: false, webhook: false },
        webhookUrl: rule.webhook_url,
        priority: rule.priority || 1,
        isActive: rule.is_active,
        timesTriggered: rule.times_triggered || 0,
        lastTriggeredAt: rule.last_triggered_at,
        createdAt: rule.created_at
      })) || [];

      setRules(formattedRules);
    } catch (err) {
      console.log('Error fetching alert rules:', err);
      setRules([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  // Fetch alert history
  const fetchHistory = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('alert_rule_history')
        .select(`
          id,
          alert_rule_id,
          matched_conditions,
          delivery_status,
          triggered_at,
          alert_rules!inner(name)
        `)
        .eq('user_id', user.id)
        .order('triggered_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedHistory = data?.map(item => ({
        id: item.id,
        ruleId: item.alert_rule_id,
        ruleName: (item.alert_rules as any)?.name || 'Unknown Rule',
        triggeredAt: item.triggered_at,
        matchedConditions: item.matched_conditions,
        deliveryStatus: item.delivery_status || {}
      })) || [];

      setHistory(formattedHistory);
    } catch (err) {
      console.error('Failed to fetch alert history:', err);
    }
  };

  // Create new alert rule
  const createRule = async (rule: AlertRule): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('alert_rules')
        .insert({
          user_id: user.id,
          name: rule.name,
          description: rule.description,
          conditions: rule.conditions,
          logic_operator: rule.logicOperator,
          time_window_hours: rule.timeWindowHours,
          frequency_limit: rule.frequencyLimit,
          delivery_channels: rule.deliveryChannels,
          webhook_url: rule.webhookUrl,
          priority: rule.priority,
          is_active: rule.isActive
        });

      if (error) throw error;

      await fetchRules();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert rule');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update alert rule
  const updateRule = async (id: string, rule: AlertRule): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('alert_rules')
        .update({
          name: rule.name,
          description: rule.description,
          conditions: rule.conditions,
          logic_operator: rule.logicOperator,
          time_window_hours: rule.timeWindowHours,
          frequency_limit: rule.frequencyLimit,
          delivery_channels: rule.deliveryChannels,
          webhook_url: rule.webhookUrl,
          priority: rule.priority,
          is_active: rule.isActive
        })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchRules();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update alert rule');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete alert rule
  const deleteRule = async (id: string): Promise<boolean> => {
    if (!user) return false;

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('alert_rules')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchRules();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete alert rule');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Toggle rule active status
  const toggleRuleStatus = async (id: string, isActive: boolean): Promise<boolean> => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('alert_rules')
        .update({ is_active: isActive })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchRules();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle rule status');
      return false;
    }
  };

  // Test alert rule
  const testRule = async (rule: AlertRule): Promise<{ success: boolean; message: string }> => {
    try {
      // Simulate rule testing with mock data
      const mockAlert = {
        id: 'test-alert',
        from_addr: '0x1234567890abcdef1234567890abcdef12345678',
        to_addr: '0xabcdef1234567890abcdef1234567890abcdef12',
        amount_usd: 2500000,
        token: 'ETH',
        chain: 'ethereum',
        tx_hash: '0xtest',
        detected_at: new Date().toISOString()
      };

      // Simple condition evaluation for testing
      let wouldTrigger = false;
      const matchedConditions: string[] = [];

      for (const condition of rule.conditions) {
        let matches = false;

        switch (condition.type) {
          case 'amount':
            if (condition.operator === 'gte' && mockAlert.amount_usd >= (condition.value as number)) {
              matches = true;
              matchedConditions.push(`Amount ≥ $${condition.value.toLocaleString()}`);
            }
            break;
          case 'token':
            if (condition.operator === 'eq' && mockAlert.token.toLowerCase() === (condition.value as string).toLowerCase()) {
              matches = true;
              matchedConditions.push(`Token = ${condition.value}`);
            }
            break;
          case 'chain':
            if (condition.operator === 'eq' && mockAlert.chain.toLowerCase() === (condition.value as string).toLowerCase()) {
              matches = true;
              matchedConditions.push(`Chain = ${condition.value}`);
            }
            break;
        }

        if (rule.logicOperator === 'AND' && !matches) {
          wouldTrigger = false;
          break;
        } else if (rule.logicOperator === 'OR' && matches) {
          wouldTrigger = true;
        } else if (rule.logicOperator === 'AND') {
          wouldTrigger = true;
        }
      }

      if (rule.logicOperator === 'NOR') {
        wouldTrigger = matchedConditions.length === 0;
      }

      return {
        success: true,
        message: wouldTrigger 
          ? `✅ Rule would trigger! Matched: ${matchedConditions.join(', ')}`
          : `❌ Rule would not trigger with current conditions`
      };
    } catch (err) {
      return {
        success: false,
        message: 'Failed to test rule'
      };
    }
  };

  useEffect(() => {
    if (user) {
      fetchRules();
      fetchHistory();
    }
  }, [user]);

  return {
    rules,
    history,
    loading,
    error,
    createRule,
    updateRule,
    deleteRule,
    toggleRuleStatus,
    testRule,
    fetchRules,
    fetchHistory
  };
};