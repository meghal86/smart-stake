/**
 * Hook for managing saved opportunities
 * 
 * Provides functionality to fetch, save, and unsave opportunities.
 * Persists across sessions via database.
 * 
 * Requirements:
 * - 5.8: Save functionality that persists across sessions
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { createClient } from '@supabase/supabase-js';

interface SavedOpportunity {
  id: string;
  opportunity_id: string;
  saved_at: string;
  opportunity?: {
    id: string;
    slug: string;
    title: string;
    protocol_name: string;
    protocol_logo: string;
    type: string;
    trust_score: number;
    trust_level: string;
  };
}

export function useSavedOpportunities() {
  const { user, isAuthenticated } = useAuth();
  const [savedOpportunities, setSavedOpportunities] = useState<SavedOpportunity[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Initialize Supabase client
  const getSupabaseClient = useCallback(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    return createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: user?.access_token ? { Authorization: `Bearer ${user.access_token}` } : {},
      },
    });
  }, [user?.access_token]);

  // Fetch saved opportunities
  const fetchSavedOpportunities = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setSavedOpportunities([]);
      setSavedIds(new Set());
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      
      const { data, error: fetchError } = await supabase
        .from('saved_opportunities')
        .select(`
          id,
          opportunity_id,
          saved_at,
          opportunity:opportunities (
            id,
            slug,
            title,
            protocol_name,
            protocol_logo,
            type,
            trust_score,
            trust_level
          )
        `)
        .eq('user_id', user.id)
        .order('saved_at', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      setSavedOpportunities(data || []);
      setSavedIds(new Set((data || []).map(s => s.opportunity_id)));

    } catch (err: any) {
      console.error('Failed to fetch saved opportunities:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user, getSupabaseClient]);

  // Check if an opportunity is saved
  const isSaved = useCallback((opportunityId: string): boolean => {
    return savedIds.has(opportunityId);
  }, [savedIds]);

  // Add opportunity to saved list (optimistic update)
  const addToSaved = useCallback((opportunityId: string) => {
    setSavedIds(prev => new Set([...prev, opportunityId]));
  }, []);

  // Remove opportunity from saved list (optimistic update)
  const removeFromSaved = useCallback((opportunityId: string) => {
    setSavedIds(prev => {
      const next = new Set(prev);
      next.delete(opportunityId);
      return next;
    });
  }, []);

  // Refresh saved opportunities
  const refresh = useCallback(() => {
    fetchSavedOpportunities();
  }, [fetchSavedOpportunities]);

  // Fetch on mount and when auth changes
  useEffect(() => {
    fetchSavedOpportunities();
  }, [fetchSavedOpportunities]);

  // Subscribe to realtime changes
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const supabase = getSupabaseClient();
    
    const channel = supabase
      .channel('saved_opportunities_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'saved_opportunities',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Refresh on any change
          fetchSavedOpportunities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user, getSupabaseClient, fetchSavedOpportunities]);

  return {
    savedOpportunities,
    savedIds,
    isLoading,
    error,
    isSaved,
    addToSaved,
    removeFromSaved,
    refresh,
  };
}
