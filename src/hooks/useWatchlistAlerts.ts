import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface WatchlistAlert {
  id?: string;
  triggerType: string;
  entityType: 'chain' | 'cluster' | 'address';
  entityId: string;
  operator: 'greater_than' | 'less_than' | 'equals' | 'change_percent';
  threshold: number;
  timeWindow?: string;
  isActive?: boolean;
}

export function useWatchlistAlerts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch user's alerts
  const { data: alerts, isLoading } = useQuery({
    queryKey: ['watchlist-alerts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase.functions.invoke('watchlist-alerts', {
        body: { action: 'list' }
      });
      
      if (error) throw error;
      return data.alerts || [];
    },
    enabled: !!user,
    refetchInterval: 60000, // Refresh every minute
  });

  // Create alert mutation
  const createAlert = useMutation({
    mutationFn: async (alertConfig: WatchlistAlert) => {
      const { data, error } = await supabase.functions.invoke('watchlist-alerts', {
        body: { 
          action: 'create',
          alertConfig 
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist-alerts'] });
      toast({
        title: "Alert Created",
        description: "Your watchlist alert has been created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Alert",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  // Update alert mutation
  const updateAlert = useMutation({
    mutationFn: async (alertConfig: WatchlistAlert) => {
      const { data, error } = await supabase.functions.invoke('watchlist-alerts', {
        body: { 
          action: 'update',
          alertConfig 
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist-alerts'] });
      toast({
        title: "Alert Updated",
        description: "Your watchlist alert has been updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Update Alert",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  // Delete alert mutation
  const deleteAlert = useMutation({
    mutationFn: async (alertId: string) => {
      const { data, error } = await supabase.functions.invoke('watchlist-alerts', {
        body: { 
          action: 'delete',
          alertConfig: { id: alertId }
        }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist-alerts'] });
      toast({
        title: "Alert Deleted",
        description: "Your watchlist alert has been deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Alert",
        description: error.message || "Something went wrong",
        variant: "destructive"
      });
    }
  });

  // Check alerts mutation (manual trigger)
  const checkAlerts = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('watchlist-alerts', {
        body: { action: 'check' }
      });
      
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data.triggeredCount > 0) {
        toast({
          title: "Alerts Triggered",
          description: `${data.triggeredCount} of your watchlist alerts were triggered`,
        });
      }
    }
  });

  return {
    alerts: alerts || [],
    isLoading,
    createAlert: createAlert.mutate,
    updateAlert: updateAlert.mutate,
    deleteAlert: deleteAlert.mutate,
    checkAlerts: checkAlerts.mutate,
    isCreating: createAlert.isPending,
    isUpdating: updateAlert.isPending,
    isDeleting: deleteAlert.isPending,
    isChecking: checkAlerts.isPending
  };
}

// Helper hook for quick alert creation
export function useQuickAlert() {
  const { createAlert } = useWatchlistAlerts();
  
  const createChainRiskAlert = (chain: string, threshold: number) => {
    createAlert({
      triggerType: 'chain_risk_threshold',
      entityType: 'chain',
      entityId: chain,
      operator: 'greater_than',
      threshold,
      timeWindow: '24h'
    });
  };

  const createClusterFlowAlert = (clusterId: string, threshold: number) => {
    createAlert({
      triggerType: 'cluster_net_flow',
      entityType: 'cluster',
      entityId: clusterId,
      operator: 'greater_than',
      threshold,
      timeWindow: '24h'
    });
  };

  const createAddressBalanceAlert = (address: string, threshold: number, operator: 'greater_than' | 'less_than' = 'greater_than') => {
    createAlert({
      triggerType: 'address_balance',
      entityType: 'address',
      entityId: address,
      operator,
      threshold,
      timeWindow: '24h'
    });
  };

  return {
    createChainRiskAlert,
    createClusterFlowAlert,
    createAddressBalanceAlert
  };
}