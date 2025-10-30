import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { GuardianAutomationService, AutomationStatus } from '@/services/guardianAutomationService';

export function useGuardianAutomation() {
  const { user } = useAuth();
  const [automation, setAutomation] = useState<AutomationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadAutomationStatus();
    } else {
      setAutomation(null);
      setLoading(false);
    }
  }, [user]);

  const loadAutomationStatus = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const status = await GuardianAutomationService.getAutomationStatus(user.id);
      setAutomation(status);
    } catch (err) {
      console.error('Error loading automation status:', err);
      setError(err instanceof Error ? err.message : 'Failed to load automation status');
    } finally {
      setLoading(false);
    }
  };

  const enableAutomation = async (smartWalletAddress: string, eoaAddress: string) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      const newAutomation = await GuardianAutomationService.enableAutomation(
        user.id,
        smartWalletAddress,
        eoaAddress
      );
      
      // Reload full status to get policies
      await loadAutomationStatus();
      return newAutomation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enable automation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const toggleAutomation = async () => {
    if (!automation) throw new Error('No automation found');

    try {
      setError(null);
      const newStatus = automation.status === 'active' ? 'paused' : 'active';
      await GuardianAutomationService.updateAutomationStatus(automation.id, newStatus);
      setAutomation({ ...automation, status: newStatus });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle automation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateThreshold = async (newThreshold: number) => {
    if (!automation) throw new Error('No automation found');

    const thresholdPolicy = automation.policies.find(p => p.policy_type === 'threshold');
    if (!thresholdPolicy) throw new Error('Threshold policy not found');

    try {
      setError(null);
      await GuardianAutomationService.updatePolicy(
        thresholdPolicy.id,
        { min_trust_score: newThreshold },
        true
      );
      
      const updatedPolicies = automation.policies.map(p =>
        p.id === thresholdPolicy.id
          ? { ...p, policy_data: { min_trust_score: newThreshold } }
          : p
      );
      
      setAutomation({ ...automation, policies: updatedPolicies });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update threshold';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const proposeAutomation = async (params: {
    contractAddress: string;
    tokenAddress: string;
    triggerReason: string;
    trustScoreBefore: number;
  }) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setError(null);
      return await GuardianAutomationService.proposeAutomation({
        userId: user.id,
        ...params
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to propose automation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const isAutomationEnabled = automation?.status === 'active';
  const hasAutomation = automation !== null;
  const currentThreshold = automation?.policies
    .find(p => p.policy_type === 'threshold')?.policy_data?.min_trust_score || 3.0;

  return {
    automation,
    loading,
    error,
    hasAutomation,
    isAutomationEnabled,
    currentThreshold,
    enableAutomation,
    toggleAutomation,
    updateThreshold,
    proposeAutomation,
    refresh: loadAutomationStatus
  };
}