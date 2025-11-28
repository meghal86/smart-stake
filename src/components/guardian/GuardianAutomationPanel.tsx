import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Settings, Activity, AlertTriangle, CheckCircle } from 'lucide-react';
import { useGuardianAutomation } from '@/hooks/useGuardianAutomation';
import { AutomationMigrationModal } from './AutomationMigrationModal';
import { AutomationSettings } from './AutomationSettings';
import { AutomationActivityFeed } from './AutomationActivityFeed';

interface GuardianAutomationPanelProps {
  className?: string;
}

export function GuardianAutomationPanel({ className = '' }: GuardianAutomationPanelProps) {
  const {
    automation,
    loading,
    hasAutomation,
    isAutomationEnabled,
    currentThreshold
  } = useGuardianAutomation();

  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'settings' | 'activity'>('overview');

  if (loading) {
    return (
      <div className={`animate-pulse space-y-4 ${className}`}>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'activity', label: 'Activity', icon: Activity }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6 text-blue-600" />
            Guardian Automation
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Automated protection for your token approvals
          </p>
        </div>
        
        {hasAutomation && (
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isAutomationEnabled ? 'bg-green-500' : 'bg-yellow-500'
            }`} />
            <span className="text-sm font-medium">
              {isAutomationEnabled ? 'Active' : 'Paused'}
            </span>
          </div>
        )}
      </div>

      {/* Main Content */}
      {!hasAutomation ? (
        /* Onboarding State */
        <div className="text-center py-12 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Enable Smart Automation</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Let Guardian automatically revoke risky token approvals without requiring your signature each time.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="font-medium text-sm">Non-custodial</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">You keep full control</div>
            </div>
            
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Shield className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="font-medium text-sm">Gasless</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">We sponsor the gas</div>
            </div>
            
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Settings className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="font-medium text-sm">Configurable</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">Set your own rules</div>
            </div>
          </div>
          
          <button
            onClick={() => setShowMigrationModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Enable Automation
          </button>
        </div>
      ) : (
        /* Active State */
        <div className="space-y-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                {isAutomationEnabled ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              <div className="font-semibold">
                {isAutomationEnabled ? 'Active' : 'Paused'}
              </div>
            </div>
            
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Threshold</span>
                <Settings className="w-4 h-4 text-gray-400" />
              </div>
              <div className="font-semibold">{currentThreshold.toFixed(1)}</div>
            </div>
            
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Gas Policy</span>
                <Shield className="w-4 h-4 text-gray-400" />
              </div>
              <div className="font-semibold capitalize">
                {automation?.gas_policy.replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as unknown)}
                    className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                      How It Works
                    </h4>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                      <li>• Guardian monitors your token approvals continuously</li>
                      <li>• When trust score drops below {currentThreshold.toFixed(1)}, automation triggers</li>
                      <li>• Risky approvals are automatically revoked (set to 0)</li>
                      <li>• You receive notifications about all actions taken</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h4 className="font-medium mb-2">Smart Wallet Address</h4>
                    <div className="font-mono text-sm break-all text-gray-600 dark:text-gray-400">
                      {automation?.smart_wallet_address}
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'settings' && <AutomationSettings />}
              {activeTab === 'activity' && <AutomationActivityFeed />}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* Migration Modal */}
      <AutomationMigrationModal
        isOpen={showMigrationModal}
        onClose={() => setShowMigrationModal(false)}
        onComplete={() => {
          setShowMigrationModal(false);
          window.location.reload();
        }}
      />
    </div>
  );
}