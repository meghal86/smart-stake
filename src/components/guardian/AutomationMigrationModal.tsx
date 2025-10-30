import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface AutomationMigrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function AutomationMigrationModal({ isOpen, onClose, onComplete }: AutomationMigrationModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'intro' | 'deploying' | 'configuring' | 'complete'>('intro');
  const [smartWalletAddress, setSmartWalletAddress] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleOptIn = async () => {
    if (!user) return;

    try {
      setStep('deploying');
      setError('');

      // Deploy smart wallet (simplified - in production would use Safe SDK)
      const deployResponse = await fetch('/api/deploy-smart-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id })
      });

      if (!deployResponse.ok) {
        throw new Error('Failed to deploy smart wallet');
      }

      const { smart_wallet_address } = await deployResponse.json();
      setSmartWalletAddress(smart_wallet_address);
      setStep('configuring');

      // Create automation record
      const { error: automationError } = await supabase
        .from('guardian_automations')
        .insert({
          user_id: user.id,
          smart_wallet_address,
          eoa_address: user.user_metadata?.wallet_address || '',
          status: 'active',
          automation_type: 'revoke',
          gas_policy: 'sponsored'
        });

      if (automationError) throw automationError;

      // Create default policies
      const { data: automation } = await supabase
        .from('guardian_automations')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (automation) {
        await supabase
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
      }

      setStep('complete');
    } catch (err) {
      console.error('Migration error:', err);
      setError(err instanceof Error ? err.message : 'Migration failed');
      setStep('intro');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {step === 'intro' && (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">Enable Guardian Automation</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Let Guardian automatically revoke risky token approvals without asking you to sign each time.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Non-custodial</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">You retain full control of your funds</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Gasless revokes</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">We sponsor gas for security actions</div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <div className="font-medium text-sm">Policy-based</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">Only revokes approvals below trust score 3.0</div>
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
              >
                Maybe Later
              </button>
              <button
                onClick={handleOptIn}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
              >
                Enable Automation
              </button>
            </div>
          </div>
        )}

        {step === 'deploying' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              >
                <Zap className="w-8 h-8 text-blue-600" />
              </motion.div>
            </div>
            <h3 className="text-lg font-semibold">Deploying Smart Wallet</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Creating your automation-enabled wallet...
            </p>
          </div>
        )}

        {step === 'configuring' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Shield className="w-8 h-8 text-purple-600" />
              </motion.div>
            </div>
            <h3 className="text-lg font-semibold">Configuring Policies</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Setting up your automation preferences...
            </p>
          </div>
        )}

        {step === 'complete' && (
          <div className="text-center space-y-6">
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Automation Enabled!</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Guardian can now automatically revoke risky approvals for you.
              </p>
            </div>

            {smartWalletAddress && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="text-xs text-gray-500 mb-1">Smart Wallet Address</div>
                <div className="font-mono text-xs break-all">{smartWalletAddress}</div>
                <button className="mt-2 text-xs text-blue-600 hover:underline flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  View on Etherscan
                </button>
              </div>
            )}

            <button
              onClick={() => {
                onComplete();
                onClose();
              }}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700"
            >
              Continue to Dashboard
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}