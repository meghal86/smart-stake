/**
 * useWalletLabels Hook
 * 
 * Manages user-defined labels for wallet addresses.
 * Stores labels in user_preferences.wallet_labels JSONB column.
 * 
 * Features:
 * - Get label for a specific wallet address
 * - Set/update label for a wallet address
 * - Remove label for a wallet address
 * - Get all wallet labels
 * - Optimistic updates with React Query
 * - RLS enforcement (users can only access their own labels)
 * 
 * @see .kiro/specs/hunter-screen-feed/requirements.md - Requirement 18.18
 * @see .kiro/specs/hunter-screen-feed/tasks.md - Task 51
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// ============================================================================
// Types
// ============================================================================

export interface WalletLabels {
  [address: string]: string;
}

export interface WalletLabelUpdate {
  address: string;
  label: string;
}

// ============================================================================
// Hook
// ============================================================================

export function useWalletLabels() {
  const queryClient = useQueryClient();

  // ============================================================================
  // Fetch wallet labels
  // ============================================================================

  const { data: labels = {}, isLoading, error } = useQuery<WalletLabels>({
    queryKey: ['wallet-labels'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return {};
      }

      const { data, error } = await supabase
        .from('user_preferences')
        .select('wallet_labels')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no preferences exist yet, return empty object
        if (error.code === 'PGRST116') {
          return {};
        }
        throw error;
      }

      return (data?.wallet_labels as WalletLabels) || {};
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  });

  // ============================================================================
  // Set wallet label mutation
  // ============================================================================

  const setLabelMutation = useMutation({
    mutationFn: async ({ address, label }: WalletLabelUpdate) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Normalize address to lowercase for consistency
      const normalizedAddress = address.toLowerCase();

      // Get current labels
      const { data: currentPrefs } = await supabase
        .from('user_preferences')
        .select('wallet_labels')
        .eq('user_id', user.id)
        .single();

      const currentLabels = (currentPrefs?.wallet_labels as WalletLabels) || {};
      
      // Update labels
      const updatedLabels = {
        ...currentLabels,
        [normalizedAddress]: label,
      };

      // Upsert user preferences
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          wallet_labels: updatedLabels,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) {
        throw error;
      }

      return updatedLabels;
    },
    onMutate: async ({ address, label }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['wallet-labels'] });

      // Snapshot previous value
      const previousLabels = queryClient.getQueryData<WalletLabels>(['wallet-labels']);

      // Optimistically update
      const normalizedAddress = address.toLowerCase();
      queryClient.setQueryData<WalletLabels>(['wallet-labels'], (old = {}) => ({
        ...old,
        [normalizedAddress]: label,
      }));

      return { previousLabels };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousLabels) {
        queryClient.setQueryData(['wallet-labels'], context.previousLabels);
      }
      console.error('Failed to set wallet label:', err);
    },
    onSuccess: () => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['wallet-labels'] });
    },
  });

  // ============================================================================
  // Remove wallet label mutation
  // ============================================================================

  const removeLabelMutation = useMutation({
    mutationFn: async (address: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Normalize address to lowercase for consistency
      const normalizedAddress = address.toLowerCase();

      // Get current labels
      const { data: currentPrefs } = await supabase
        .from('user_preferences')
        .select('wallet_labels')
        .eq('user_id', user.id)
        .single();

      const currentLabels = (currentPrefs?.wallet_labels as WalletLabels) || {};
      
      // Remove label
      const { [normalizedAddress]: removed, ...updatedLabels } = currentLabels;

      // Update user preferences
      const { error } = await supabase
        .from('user_preferences')
        .update({
          wallet_labels: updatedLabels,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      return updatedLabels;
    },
    onMutate: async (address) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['wallet-labels'] });

      // Snapshot previous value
      const previousLabels = queryClient.getQueryData<WalletLabels>(['wallet-labels']);

      // Optimistically update
      const normalizedAddress = address.toLowerCase();
      queryClient.setQueryData<WalletLabels>(['wallet-labels'], (old = {}) => {
        const { [normalizedAddress]: removed, ...rest } = old;
        return rest;
      });

      return { previousLabels };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousLabels) {
        queryClient.setQueryData(['wallet-labels'], context.previousLabels);
      }
      console.error('Failed to remove wallet label:', err);
    },
    onSuccess: () => {
      // Invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['wallet-labels'] });
    },
  });

  // ============================================================================
  // Helper functions
  // ============================================================================

  /**
   * Get label for a specific wallet address
   */
  const getLabel = (address: string): string | undefined => {
    const normalizedAddress = address.toLowerCase();
    return labels[normalizedAddress];
  };

  /**
   * Set label for a wallet address
   */
  const setLabel = (address: string, label: string) => {
    setLabelMutation.mutate({ address, label });
  };

  /**
   * Remove label for a wallet address
   */
  const removeLabel = (address: string) => {
    removeLabelMutation.mutate(address);
  };

  // ============================================================================
  // Return
  // ============================================================================

  return {
    labels,
    isLoading,
    error,
    getLabel,
    setLabel,
    removeLabel,
    isSettingLabel: setLabelMutation.isPending,
    isRemovingLabel: removeLabelMutation.isPending,
  };
}

