import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationLog {
  id: string;
  type: string;
  title: string;
  message: string;
  channels: string[];
  results: any[];
  priority: string;
  sent_at: string;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(false);

  const sendNotification = async ({
    type,
    title,
    message,
    channels = ['email'],
    priority = 'medium',
    data = {}
  }: {
    type: string;
    title: string;
    message: string;
    channels?: string[];
    priority?: string;
    data?: Record<string, any>;
  }) => {
    if (!user) throw new Error('User not authenticated');

    const { data: result, error } = await supabase.functions.invoke('notification-delivery', {
      body: {
        userId: user.id,
        type,
        title,
        message,
        channels,
        priority,
        data
      }
    });

    if (error) throw error;
    
    // Refresh logs after sending
    await fetchLogs();
    
    return result;
  };

  const fetchLogs = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('notification_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Failed to fetch notification logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDeliveryStats = () => {
    const total = logs.length;
    const successful = logs.filter(log => 
      log.results.some(result => result.status === 'sent')
    ).length;
    const failed = logs.filter(log => 
      log.results.every(result => result.status === 'failed')
    ).length;

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? (successful / total) * 100 : 0
    };
  };

  const getChannelStats = () => {
    const channelCounts = { email: 0, sms: 0, push: 0 };
    const channelSuccess = { email: 0, sms: 0, push: 0 };

    logs.forEach(log => {
      log.results.forEach(result => {
        if (result.channel in channelCounts) {
          channelCounts[result.channel as keyof typeof channelCounts]++;
          if (result.status === 'sent') {
            channelSuccess[result.channel as keyof typeof channelSuccess]++;
          }
        }
      });
    });

    return {
      email: {
        total: channelCounts.email,
        successful: channelSuccess.email,
        rate: channelCounts.email > 0 ? (channelSuccess.email / channelCounts.email) * 100 : 0
      },
      sms: {
        total: channelCounts.sms,
        successful: channelSuccess.sms,
        rate: channelCounts.sms > 0 ? (channelSuccess.sms / channelCounts.sms) * 100 : 0
      },
      push: {
        total: channelCounts.push,
        successful: channelSuccess.push,
        rate: channelCounts.push > 0 ? (channelSuccess.push / channelCounts.push) * 100 : 0
      }
    };
  };

  useEffect(() => {
    if (user) {
      fetchLogs();
    }
  }, [user]);

  return {
    logs,
    loading,
    sendNotification,
    fetchLogs,
    getDeliveryStats,
    getChannelStats
  };
};