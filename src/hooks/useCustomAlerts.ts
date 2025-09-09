import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AlertCondition {
  type: 'amount' | 'chain' | 'token' | 'whale_tag' | 'direction' | 'time_window';
  operator: string;
  value: any;
  currency?: string;
  unit?: string;
}

export interface AlertRule {
  id?: string;
  name: string;
  description?: string;
  conditions: AlertCondition[];
  logic_operator: 'AND' | 'OR' | 'NOR';
  time_window_hours?: number;
  frequency_limit?: number;
  delivery_channels: {
    push?: boolean;
    email?: boolean;
    sms?: boolean;
    webhook?: boolean;
  };
  webhook_url?: string;
  priority: number;
  is_active: boolean;
  times_triggered?: number;
  last_triggered_at?: string;
}

export interface AlertTemplate {
  id: string;
  name: string;
  description: string;
  category: 'whale' | 'defi' | 'security' | 'trading';
  template_conditions: AlertCondition[];
  default_logic_operator: string;
  suggested_delivery_channels: any;
  is_premium: boolean;
  popularity_score: number;
}

export function useCustomAlerts() {
  const { user } = useAuth();
  const [rules, setRules] = useState<AlertRule[]>([]);
  const [templates, setTemplates] = useState<AlertTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's alert rules
  const fetchRules = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alert_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRules(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch alert templates
  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alert_templates')
        .select('*')
        .order('popularity_score', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create new alert rule
  const createRule = async (rule: Omit<AlertRule, 'id'>) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('alert_rules')
      .insert([{ ...rule, user_id: user.id }])
      .select()
      .single();

    if (error) throw error;
    
    setRules(prev => [data, ...prev]);
    return data;
  };

  // Update alert rule
  const updateRule = async (id: string, updates: Partial<AlertRule>) => {
    const { data, error } = await supabase
      .from('alert_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    setRules(prev => prev.map(rule => rule.id === id ? data : rule));
    return data;
  };

  // Delete alert rule
  const deleteRule = async (id: string) => {
    const { error } = await supabase
      .from('alert_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    setRules(prev => prev.filter(rule => rule.id !== id));
  };

  // Toggle rule active status
  const toggleRule = async (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;

    return updateRule(id, { is_active: !rule.is_active });
  };

  // Duplicate rule
  const duplicateRule = async (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;

    const { id: _, times_triggered, last_triggered_at, ...ruleData } = rule;
    return createRule({
      ...ruleData,
      name: `${rule.name} (Copy)`,
      is_active: false
    });
  };

  useEffect(() => {
    if (user) {
      fetchRules();
    }
    fetchTemplates();
  }, [user]);

  return {
    rules,
    templates,
    loading,
    error,
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    duplicateRule,
    refetch: fetchRules
  };
}