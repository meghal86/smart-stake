import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/useToast';

interface Alert {
  id: string;
  type: 'risk_threshold' | 'large_transaction' | 'sanctions_match' | 'defi_health';
  walletAddress: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  acknowledged: boolean;
}

interface AlertRule {
  id: string;
  type: string;
  condition: string;
  threshold: number;
  isActive: boolean;
  walletAddress?: string;
}

export function useRealTimeAlerts(walletAddress?: string) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [rules, setRules] = useState<AlertRule[]>([]);
  const { toast } = useToast();

  // Simulate real-time alert monitoring
  useEffect(() => {
    if (!walletAddress) return;

    const checkAlerts = () => {
      // Simulate random alerts for demo
      const shouldTrigger = Math.random() < 0.1; // 10% chance every check
      
      if (shouldTrigger) {
        const alertTypes = [
          {
            type: 'large_transaction' as const,
            message: `Large transaction detected: $2.5M transfer`,
            severity: 'high' as const
          },
          {
            type: 'risk_threshold' as const,
            message: `Risk score increased to 8.2/10`,
            severity: 'medium' as const
          },
          {
            type: 'defi_health' as const,
            message: `DeFi health factor dropped to 1.3`,
            severity: 'critical' as const
          }
        ];

        const randomAlert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
        
        const newAlert: Alert = {
          id: `alert_${Date.now()}`,
          type: randomAlert.type,
          walletAddress,
          message: randomAlert.message,
          severity: randomAlert.severity,
          timestamp: new Date(),
          acknowledged: false
        };

        setAlerts(prev => [newAlert, ...prev.slice(0, 9)]); // Keep last 10 alerts

        // Show toast notification
        toast({
          title: `${randomAlert.severity.toUpperCase()} Alert`,
          description: randomAlert.message,
          variant: randomAlert.severity === 'critical' ? 'destructive' : 'default'
        });
      }
    };

    // Check for alerts every 10 seconds
    const interval = setInterval(checkAlerts, 10000);
    return () => clearInterval(interval);
  }, [walletAddress, toast]);

  const acknowledgeAlert = useCallback((alertId: string) => {
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === alertId 
          ? { ...alert, acknowledged: true }
          : alert
      )
    );
  }, []);

  const clearAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  const clearAllAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const addRule = useCallback((rule: Omit<AlertRule, 'id'>) => {
    const newRule: AlertRule = {
      ...rule,
      id: `rule_${Date.now()}`
    };
    setRules(prev => [...prev, newRule]);
  }, []);

  const removeRule = useCallback((ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
  }, []);

  const toggleRule = useCallback((ruleId: string) => {
    setRules(prev => 
      prev.map(rule => 
        rule.id === ruleId 
          ? { ...rule, isActive: !rule.isActive }
          : rule
      )
    );
  }, []);

  return {
    alerts,
    rules,
    acknowledgeAlert,
    clearAlert,
    clearAllAlerts,
    addRule,
    removeRule,
    toggleRule,
    unacknowledgedCount: alerts.filter(a => !a.acknowledged).length
  };
}