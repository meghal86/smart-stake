import { supabase } from '@/integrations/supabase/client';

export interface AutomationPolicy {
  id: string;
  policy_type: 'auto_revoke' | 'allowlist' | 'denylist' | 'threshold';
  policy_data: Record<string, unknown>;
  enabled: boolean;
}

export interface AutomationStatus {
  id: string;
  smart_wallet_address: string;
  status: 'active' | 'paused' | 'disabled';
  automation_type: 'revoke' | 'maintenance';
  gas_policy: 'sponsored' | 'user_pays' | 'subscription';
  policies: AutomationPolicy[];
}

export class GuardianAutomationService {
  static async getAutomationStatus(userId: string): Promise<AutomationStatus | null> {
    try {
      const { data, error } = await supabase
        .from('guardian_automations')
        .select(`
          *,
          guardian_automation_policies(*)
        `)
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      return {
        id: data.id,
        smart_wallet_address: data.smart_wallet_address,
        status: data.status,
        automation_type: data.automation_type,
        gas_policy: data.gas_policy,
        policies: data.guardian_automation_policies || []
      };
    } catch (error) {
      console.error('Error fetching automation status:', error);
      return null;
    }
  }

  static async enableAutomation(userId: string, smartWalletAddress: string, eoaAddress: string) {
    try {
      const { data: automation, error: automationError } = await supabase
        .from('guardian_automations')
        .insert({
          user_id: userId,
          smart_wallet_address: smartWalletAddress,
          eoa_address: eoaAddress,
          status: 'active',
          automation_type: 'revoke',
          gas_policy: 'sponsored'
        })
        .select()
        .single();

      if (automationError) throw automationError;

      // Create default policies
      const { error: policiesError } = await supabase
        .from('guardian_automation_policies')
        .insert([
          {
            automation_id: automation.id,
            policy_type: 'auto_revoke',
            policy_data: { enabled: true },
            enabled: true
          },
          {
            automation_id: automation.id,
            policy_type: 'threshold',
            policy_data: { min_trust_score: 3.0 },
            enabled: true
          }
        ]);

      if (policiesError) throw policiesError;

      return automation;
    } catch (error) {
      console.error('Error enabling automation:', error);
      throw error;
    }
  }

  static async updateAutomationStatus(automationId: string, status: 'active' | 'paused' | 'disabled') {
    try {
      const { error } = await supabase
        .from('guardian_automations')
        .update({ status })
        .eq('id', automationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating automation status:', error);
      throw error;
    }
  }

  static async updatePolicy(policyId: string, policyData: Record<string, unknown>, enabled: boolean) {
    try {
      const { error } = await supabase
        .from('guardian_automation_policies')
        .update({ policy_data: policyData, enabled })
        .eq('id', policyId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating policy:', error);
      throw error;
    }
  }

  static async proposeAutomation(params: {
    userId: string;
    contractAddress: string;
    tokenAddress: string;
    triggerReason: string;
    trustScoreBefore: number;
  }) {
    try {
      const response = await supabase.functions.invoke('guardian-automation-propose', {
        body: {
          user_id: params.userId,
          contract_address: params.contractAddress,
          token_address: params.tokenAddress,
          trigger_reason: params.triggerReason,
          trust_score_before: params.trustScoreBefore
        }
      });

      if (response.error) throw response.error;
      return response.data;
    } catch (error) {
      console.error('Error proposing automation:', error);
      throw error;
    }
  }

  static async getAutomationLogs(userId: string, limit = 50) {
    try {
      const { data, error } = await supabase
        .from('guardian_automation_logs')
        .select(`
          *,
          guardian_automations!inner(user_id)
        `)
        .eq('guardian_automations.user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching automation logs:', error);
      return [];
    }
  }
}