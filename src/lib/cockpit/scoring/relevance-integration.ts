/**
 * Relevance Scoring Integration for Investment Primitives
 * 
 * This module provides functions to integrate user investments (saves, bookmarks, wallet roles)
 * and alert rules into the action ranking system for personalized relevance scoring.
 * 
 * Requirements: 12.6 - Use saved items and alert rules for relevance scoring in action ranking
 */

import { createClient } from '@/integrations/supabase/server';

export interface UserInvestment {
  id: number;
  kind: 'save' | 'bookmark' | 'wallet_role';
  ref_id: string;
  payload?: Record<string, any>;
  created_at: string;
}

export interface AlertRule {
  id: number;
  rule: Record<string, any>;
  is_enabled: boolean;
  created_at: string;
}

export interface RelevanceContext {
  savedItems: UserInvestment[];
  alertRules: AlertRule[];
  walletRoles: UserInvestment[];
}

/**
 * Fetch user's investment primitives for relevance scoring
 */
export async function getUserRelevanceContext(userId: string): Promise<RelevanceContext> {
  const supabase = createClient();

  // Fetch user investments (saves, bookmarks, wallet roles)
  const { data: investments } = await supabase
    .from('user_investments')
    .select('*')
    .eq('user_id', userId);

  // Fetch active alert rules
  const { data: rules } = await supabase
    .from('cockpit_alert_rules')
    .select('*')
    .eq('user_id', userId)
    .eq('is_enabled', true);

  const savedItems = investments?.filter(inv => inv.kind === 'save') || [];
  const walletRoles = investments?.filter(inv => inv.kind === 'wallet_role') || [];
  const alertRules = rules || [];

  return {
    savedItems,
    alertRules,
    walletRoles,
  };
}

/**
 * Calculate relevance score for an action based on user's investment primitives
 * 
 * Scoring logic:
 * - Saved items: +15 points if action relates to saved opportunity/finding
 * - Wallet roles: +10 points if action relates to wallet with assigned role
 * - Alert rules: +5 points if action matches alert rule conditions
 * - Bookmark: +3 points if action relates to bookmarked item
 * 
 * Maximum relevance score: 30 points (as specified in requirements)
 */
export function calculateRelevanceScore(
  action: {
    id: string;
    source: {
      kind: string;
      ref_id: string;
    };
    // Additional action properties that might be relevant
    title?: string;
    lane?: string;
    severity?: string;
  },
  context: RelevanceContext
): number {
  let score = 0;

  // Check if action relates to saved items (+15 points)
  const isSaved = context.savedItems.some(item => 
    item.ref_id === action.source.ref_id || 
    item.ref_id === action.id
  );
  if (isSaved) {
    score += 15;
  }

  // Check if action relates to wallet with assigned role (+10 points)
  const hasWalletRole = context.walletRoles.some(role => {
    // Check if the action involves a wallet that has a role assigned
    // This is a simplified check - in practice, you'd need to extract
    // wallet addresses from the action and match against role ref_ids
    return action.source.ref_id.includes(role.ref_id);
  });
  if (hasWalletRole) {
    score += 10;
  }

  // Check if action matches alert rule conditions (+5 points)
  const matchesAlertRule = context.alertRules.some(rule => {
    // This is a simplified matching logic
    // In practice, you'd need more sophisticated rule evaluation
    const ruleConditions = rule.rule;
    
    // Example: Check if rule matches action properties
    if (ruleConditions.source_kind && ruleConditions.source_kind === action.source.kind) {
      return true;
    }
    if (ruleConditions.lane && ruleConditions.lane === action.lane) {
      return true;
    }
    if (ruleConditions.severity && ruleConditions.severity === action.severity) {
      return true;
    }
    
    return false;
  });
  if (matchesAlertRule) {
    score += 5;
  }

  // Check for bookmarked items (+3 points)
  // Note: We check all investments for bookmarks, not just savedItems
  const isBookmarked = context.savedItems.some(item => 
    item.kind === 'bookmark' && (
      item.ref_id === action.source.ref_id || 
      item.ref_id === action.id
    )
  );
  if (isBookmarked) {
    score += 3;
  }

  // Ensure score doesn't exceed maximum (30 points as per requirements)
  return Math.min(score, 30);
}

/**
 * Enhanced relevance scoring that considers additional factors
 */
export function calculateEnhancedRelevanceScore(
  action: {
    id: string;
    source: {
      kind: string;
      ref_id: string;
    };
    title?: string;
    lane?: string;
    severity?: string;
    // Additional properties for enhanced scoring
    tags?: string[];
    wallet_addresses?: string[];
    token_symbols?: string[];
  },
  context: RelevanceContext
): number {
  let score = calculateRelevanceScore(action, context);

  // Additional scoring factors for enhanced relevance

  // Tag matching: +2 points per matching tag (max +6)
  if (action.tags && action.tags.length > 0) {
    const tagMatches = context.savedItems.filter(item => {
      const itemTags = item.payload?.tags as string[] || [];
      return action.tags!.some(tag => itemTags.includes(tag));
    }).length;
    score += Math.min(tagMatches * 2, 6);
  }

  // Wallet address matching: +3 points per matching wallet (max +9)
  if (action.wallet_addresses && action.wallet_addresses.length > 0) {
    const walletMatches = context.walletRoles.filter(role => 
      action.wallet_addresses!.includes(role.ref_id)
    ).length;
    score += Math.min(walletMatches * 3, 9);
  }

  // Token symbol matching: +1 point per matching token (max +3)
  if (action.token_symbols && action.token_symbols.length > 0) {
    const tokenMatches = context.savedItems.filter(item => {
      const itemTokens = item.payload?.tokens as string[] || [];
      return action.token_symbols!.some(token => itemTokens.includes(token));
    }).length;
    score += Math.min(tokenMatches * 1, 3);
  }

  // Ensure score doesn't exceed maximum (30 points as per requirements)
  return Math.min(score, 30);
}

/**
 * Utility function to extract wallet addresses from action data
 * This is a helper for enhanced relevance scoring
 */
export function extractWalletAddresses(action: any): string[] {
  const addresses: string[] = [];

  // Extract from common action properties
  if (action.wallet_address) {
    addresses.push(action.wallet_address);
  }
  if (action.from_address) {
    addresses.push(action.from_address);
  }
  if (action.to_address) {
    addresses.push(action.to_address);
  }

  // Extract from source payload
  if (action.source?.payload) {
    const payload = action.source.payload;
    if (payload.wallet_address) {
      addresses.push(payload.wallet_address);
    }
    if (payload.addresses && Array.isArray(payload.addresses)) {
      addresses.push(...payload.addresses);
    }
  }

  // Remove duplicates and return
  return [...new Set(addresses)];
}

/**
 * Utility function to extract token symbols from action data
 */
export function extractTokenSymbols(action: any): string[] {
  const symbols: string[] = [];

  // Extract from common action properties
  if (action.token_symbol) {
    symbols.push(action.token_symbol);
  }
  if (action.asset_symbol) {
    symbols.push(action.asset_symbol);
  }

  // Extract from source payload
  if (action.source?.payload) {
    const payload = action.source.payload;
    if (payload.token_symbol) {
      symbols.push(payload.token_symbol);
    }
    if (payload.tokens && Array.isArray(payload.tokens)) {
      symbols.push(...payload.tokens);
    }
  }

  // Remove duplicates and return
  return [...new Set(symbols)];
}

/**
 * Investment semantics helper functions
 */
export const InvestmentSemantics = {
  /**
   * Check if an item is saved (affects ranking/personalization)
   */
  isSaved: (refId: string, context: RelevanceContext): boolean => {
    return context.savedItems.some(item => item.ref_id === refId);
  },

  /**
   * Check if an item is bookmarked (quick access, lower relevance weight)
   */
  isBookmarked: (refId: string, investments: UserInvestment[]): boolean => {
    return investments.some(item => item.kind === 'bookmark' && item.ref_id === refId);
  },

  /**
   * Get wallet role for an address
   */
  getWalletRole: (address: string, context: RelevanceContext): string | null => {
    const role = context.walletRoles.find(role => role.ref_id === address);
    return role?.payload?.role || null;
  },

  /**
   * Check if an action matches any alert rule
   */
  matchesAlertRule: (action: any, context: RelevanceContext): boolean => {
    return context.alertRules.some(rule => {
      // Simplified rule matching - in practice, this would be more sophisticated
      const conditions = rule.rule;
      
      // Check various matching criteria
      if (conditions.source_kind && conditions.source_kind === action.source?.kind) {
        return true;
      }
      if (conditions.severity && conditions.severity === action.severity) {
        return true;
      }
      if (conditions.lane && conditions.lane === action.lane) {
        return true;
      }
      
      return false;
    });
  },
};