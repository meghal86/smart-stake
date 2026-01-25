/**
 * Policy Configuration Service
 * 
 * Manages user-specific policy configurations for the Portfolio Policy Engine.
 * Handles loading, saving, and validation of policy settings.
 */

import { createClient } from '@/lib/supabase/server';
import type { PolicyEngineConfig } from '@/types/portfolio';
import { DEFAULT_POLICY_CONFIG, PolicyEngine } from '@/lib/portfolio/PolicyEngine';

export interface UserPolicyPreferences {
  user_id: string;
  max_gas_usd: number;
  block_new_contracts_days: number;
  block_infinite_approvals_to_unknown: boolean;
  require_simulation_for_value_over_usd: number;
  confidence_threshold: number;
  allowed_slippage_percent: number;
  max_daily_transaction_count: number;
  updated_at: string;
}

/**
 * Policy Configuration Service
 */
export class PolicyConfigService {
  private supabase = createClient();

  /**
   * Load user policy configuration from database
   */
  async loadUserPolicyConfig(userId: string): Promise<PolicyEngineConfig> {
    try {
      const { data, error } = await this.supabase
        .from('portfolio_policy_prefs')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        // Return default configuration if no user preferences found
        return DEFAULT_POLICY_CONFIG;
      }

      return {
        maxGasUsd: data.max_gas_usd,
        blockNewContractsDays: data.block_new_contracts_days,
        blockInfiniteApprovalsToUnknown: data.block_infinite_approvals_to_unknown,
        requireSimulationForValueOverUsd: data.require_simulation_for_value_over_usd,
        confidenceThreshold: data.confidence_threshold,
        allowedSlippagePercent: data.allowed_slippage_percent,
        maxDailyTransactionCount: data.max_daily_transaction_count
      };
    } catch (error) {
      console.error('Error loading user policy config:', error);
      return DEFAULT_POLICY_CONFIG;
    }
  }

  /**
   * Save user policy configuration to database
   */
  async saveUserPolicyConfig(
    userId: string, 
    config: Partial<PolicyEngineConfig>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Validate configuration
      const validation = PolicyEngine.validateConfig(config);
      if (!validation.valid) {
        return {
          success: false,
          error: `Invalid configuration: ${validation.errors.join(', ')}`
        };
      }

      // Load current config to merge with updates
      const currentConfig = await this.loadUserPolicyConfig(userId);
      const mergedConfig = { ...currentConfig, ...config };

      // Upsert policy preferences
      const { error } = await this.supabase
        .from('portfolio_policy_prefs')
        .upsert({
          user_id: userId,
          max_gas_usd: mergedConfig.maxGasUsd,
          block_new_contracts_days: mergedConfig.blockNewContractsDays,
          block_infinite_approvals_to_unknown: mergedConfig.blockInfiniteApprovalsToUnknown,
          require_simulation_for_value_over_usd: mergedConfig.requireSimulationForValueOverUsd,
          confidence_threshold: mergedConfig.confidenceThreshold,
          allowed_slippage_percent: mergedConfig.allowedSlippagePercent,
          max_daily_transaction_count: mergedConfig.maxDailyTransactionCount,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving user policy config:', error);
        return {
          success: false,
          error: 'Failed to save policy configuration'
        };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in saveUserPolicyConfig:', error);
      return {
        success: false,
        error: 'Internal error saving policy configuration'
      };
    }
  }

  /**
   * Reset user policy configuration to defaults
   */
  async resetUserPolicyConfig(userId: string): Promise<{ success: boolean; error?: string }> {
    return this.saveUserPolicyConfig(userId, DEFAULT_POLICY_CONFIG);
  }

  /**
   * Get daily transaction count for user (for policy enforcement)
   */
  async getDailyTransactionCount(userId: string, date?: Date): Promise<number> {
    try {
      const targetDate = date || new Date();
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const { data, error } = await this.supabase
        .from('intent_plans')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('created_at', startOfDay.toISOString())
        .lte('created_at', endOfDay.toISOString());

      if (error) {
        console.error('Error getting daily transaction count:', error);
        return 0;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error in getDailyTransactionCount:', error);
      return 0;
    }
  }

  /**
   * Check if user has exceeded daily transaction limit
   */
  async checkDailyTransactionLimit(userId: string): Promise<{
    exceeded: boolean;
    current: number;
    limit: number;
  }> {
    const config = await this.loadUserPolicyConfig(userId);
    const current = await this.getDailyTransactionCount(userId);
    
    return {
      exceeded: current >= config.maxDailyTransactionCount,
      current,
      limit: config.maxDailyTransactionCount
    };
  }
}

/**
 * Default policy configuration service instance
 */
export const policyConfigService = new PolicyConfigService();