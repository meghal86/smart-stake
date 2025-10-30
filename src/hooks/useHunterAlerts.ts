import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Quest } from '@/types/hunter';

export interface HunterAlert {
  id: string;
  type: 'new_quest' | 'expiring_soon' | 'reward_ready' | 'quest_update';
  title: string;
  message: string;
  questId?: string;
  quest?: Quest;
  timestamp: Date;
  isRead: boolean;
  priority: 'low' | 'medium' | 'high';
  actionLabel?: string;
  actionUrl?: string;
}

export function useHunterAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<HunterAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    loadAlerts();

    // Set up real-time subscription for new alerts
    const channel = supabase
      .channel('hunter-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'hunter_alerts',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          const newAlert = mapAlertFromDB(payload.new);
          setAlerts((prev) => [newAlert, ...prev]);
          setUnreadCount((prev) => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const loadAlerts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('hunter_alerts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mappedAlerts = (data || []).map(mapAlertFromDB);
      setAlerts(mappedAlerts);
      setUnreadCount(mappedAlerts.filter(a => !a.isRead).length);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (alertId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('hunter_alerts')
        .update({ is_read: true })
        .eq('id', alertId)
        .eq('user_id', user.id);

      if (error) throw error;

      setAlerts((prev) =>
        prev.map((alert) =>
          alert.id === alertId ? { ...alert, isRead: true } : alert
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('hunter_alerts')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setAlerts((prev) => prev.map((alert) => ({ ...alert, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all alerts as read:', error);
    }
  };

  const dismissAlert = async (alertId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('hunter_alerts')
        .delete()
        .eq('id', alertId)
        .eq('user_id', user.id);

      if (error) throw error;

      const alert = alerts.find(a => a.id === alertId);
      if (alert && !alert.isRead) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
      
      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
    } catch (error) {
      console.error('Error dismissing alert:', error);
    }
  };

  const createAlert = async (
    type: HunterAlert['type'],
    title: string,
    message: string,
    options?: {
      questId?: string;
      priority?: HunterAlert['priority'];
      actionLabel?: string;
      actionUrl?: string;
    }
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('hunter_alerts').insert({
        user_id: user.id,
        type,
        title,
        message,
        quest_id: options?.questId,
        priority: options?.priority || 'medium',
        action_label: options?.actionLabel,
        action_url: options?.actionUrl,
        is_read: false
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  return {
    alerts,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    dismissAlert,
    createAlert,
    refresh: loadAlerts
  };
}

// Helper function to map database records to HunterAlert
function mapAlertFromDB(record: any): HunterAlert {
  return {
    id: record.id,
    type: record.type,
    title: record.title,
    message: record.message,
    questId: record.quest_id,
    timestamp: new Date(record.created_at),
    isRead: record.is_read || false,
    priority: record.priority || 'medium',
    actionLabel: record.action_label,
    actionUrl: record.action_url
  };
}



