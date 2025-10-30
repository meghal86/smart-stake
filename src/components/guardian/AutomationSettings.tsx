import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shield, Settings, Toggle, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { GuardianAutomationService, AutomationStatus } from '@/services/guardianAutomationService';

export function AutomationSettings() {
  const { user } = useAuth();
  const [automation, setAutomation] = useState<AutomationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (user) {
      loadAutomationStatus();
    }
  }, [user]);

  const loadAutomationStatus = async () => {
    if (!user) return;

    try {
      const status = await GuardianAutomationService.getAutomationStatus(user.id);
      setAutomation(status);
    } catch (error) {
      console.error('Error loading automation status:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAutomation = async () => {
    if (!automation) return;

    setUpdating(true);
    try {
      const newStatus = automation.status === 'active' ? 'paused' : 'active';
      await GuardianAutomationService.updateAutomationStatus(automation.id, newStatus);
      setAutomation({ ...automation, status: newStatus });
    } catch (error) {
      console.error('Error toggling automation:', error);
    } finally {
      setUpdating(false);
    }
  };

  const updateThreshold = async (newThreshold: number) => {
    if (!automation) return;

    const thresholdPolicy = automation.policies.find(p => p.policy_type === 'threshold');
    if (!thresholdPolicy) return;

    setUpdating(true);
    try {
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
    } catch (error) {
      console.error('Error updating threshold:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  if (!automation) {
    return (
      <div className="text-center py-8">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
          Automation Not Enabled
        </h3>
        <p className="text-gray-500 dark:text-gray-400">
          Enable Guardian automation to automatically revoke risky approvals.
        </p>
      </div>
    );
  }

  const thresholdPolicy = automation.policies.find(p => p.policy_type === 'threshold');
  const currentThreshold = thresholdPolicy?.policy_data?.min_trust_score || 3.0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Automation Settings
        </h3>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded-full text-xs ${
            automation.status === 'active' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
          }`}>
            {automation.status}
          </span>
        </div>
      </div>

      {/* Main Toggle */}
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium mb-1">Auto-Revoke Risky Approvals</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automatically revoke token approvals when trust score drops below threshold
            </p>
          </div>
          <button
            onClick={toggleAutomation}
            disabled={updating}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              automation.status === 'active'
                ? 'bg-blue-600'
                : 'bg-gray-200 dark:bg-gray-700'
            } ${updating ? 'opacity-50' : ''}`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                automation.status === 'active' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Trust Score Threshold */}
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="mb-4">
          <h4 className="font-medium mb-1">Trust Score Threshold</h4>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Revoke approvals when trust score falls below this value
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-blue-600">{currentThreshold.toFixed(1)}</span>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <AlertTriangle className="w-4 h-4" />
              Risk Level: {currentThreshold <= 2 ? 'High' : currentThreshold <= 4 ? 'Medium' : 'Low'}
            </div>
          </div>

          <div className="space-y-2">
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={currentThreshold}
              onChange={(e) => updateThreshold(parseFloat(e.target.value))}
              disabled={updating || automation.status !== 'active'}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>1.0 (Most Sensitive)</span>
              <span>10.0 (Least Sensitive)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Gas Policy */}
      <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium mb-1">Gas Policy</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              How gas fees are handled for automated transactions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium capitalize">{automation.gas_policy.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Smart Wallet Info */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="font-medium mb-2">Smart Wallet Address</h4>
        <div className="font-mono text-sm break-all text-gray-600 dark:text-gray-400">
          {automation.smart_wallet_address}
        </div>
        <button className="mt-2 text-xs text-blue-600 hover:underline">
          View on Etherscan
        </button>
      </div>

      {/* Warning */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
              Important Security Notice
            </h4>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Automation only revokes token approvals (sets allowance to 0). Your funds remain in your control at all times. 
              You can disable automation or adjust settings anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}