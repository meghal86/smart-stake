/**
 * Insights Sheet Component
 * 
 * Full-screen overlay with:
 * - Provider status and preference controls
 * - Launcher fallback logic (top-right icon in Today Card if chrome unavailable)
 * 
 * Requirements: 8.1, 8.2, 8.6, 8.7
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Settings,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Wifi,
  WifiOff,
  Bell,
  BellOff,
  Moon,
  Sun,
  Wallet,
  ExternalLink,
  RefreshCw,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ProviderStatus } from '@/lib/cockpit/types';

// ============================================================================
// Types
// ============================================================================

interface CoverageInfo {
  wallets: number;
  chains: string[];
  lastRefresh: string;
  scanStatus: 'fresh' | 'stale' | 'missing';
}

interface PreferenceSettings {
  wallet_scope_default: 'active' | 'all';
  dnd_start_local: string;
  dnd_end_local: string;
  notif_cap_per_day: number;
}

interface InsightsSheetProps {
  /** Whether the sheet is open */
  isOpen: boolean;
  /** Callback when sheet should close */
  onClose: () => void;
  /** Provider status information */
  providerStatus: ProviderStatus;
  /** Coverage information */
  coverageInfo: CoverageInfo;
  /** Current preference settings */
  preferences: PreferenceSettings;
  /** Callback when preferences change */
  onPreferencesChange: (preferences: Partial<PreferenceSettings>) => void;
  /** Whether preferences are being saved */
  isSaving?: boolean;
  /** Error state */
  error?: string | null;
  /** Element that opened the sheet (for focus restoration) */
  triggerRef?: React.RefObject<HTMLElement>;
}

// ============================================================================
// Constants
// ============================================================================

const SHEET_VARIANTS = {
  hidden: {
    opacity: 0,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 25,
      stiffness: 300,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

const OVERLAY_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

// Provider status configuration
const PROVIDER_STATUS_CONFIG = {
  online: {
    icon: CheckCircle,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
    label: 'Online',
  },
  degraded: {
    icon: AlertTriangle,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/10',
    borderColor: 'border-amber-500/20',
    label: 'Degraded',
  },
  offline: {
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/20',
    label: 'Offline',
  },
};

// Time options for DND
const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, '0');
  return { value: `${hour}:00`, label: `${hour}:00` };
});

// Notification cap options
const NOTIF_CAP_OPTIONS = [
  { value: 1, label: '1 per day' },
  { value: 2, label: '2 per day' },
  { value: 3, label: '3 per day' },
  { value: 5, label: '5 per day' },
  { value: 10, label: '10 per day' },
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Handles escape key to close sheet
 */
const useEscapeKey = (isOpen: boolean, onClose: () => void) => {
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
};

/**
 * Restores focus to trigger element when sheet closes
 */
const useFocusRestore = (
  isOpen: boolean, 
  triggerRef?: React.RefObject<HTMLElement>
) => {
  const previousActiveElement = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    } else if (previousActiveElement.current) {
      // Restore focus to trigger element or previous active element
      const elementToFocus = triggerRef?.current || previousActiveElement.current;
      elementToFocus?.focus();
      previousActiveElement.current = null;
    }
  }, [isOpen, triggerRef]);
};

/**
 * Formats timestamp for display
 */
const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Unknown';
  }
};

// ============================================================================
// Sub-Components
// ============================================================================

const ProviderStatusCard: React.FC<{ 
  status: ProviderStatus;
  onRetry?: () => void;
}> = ({ status, onRetry }) => {
  const config = PROVIDER_STATUS_CONFIG[status.state];
  const IconComponent = config.icon;
  
  return (
    <Card className={`p-4 ${config.bgColor} border ${config.borderColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconComponent className={`w-5 h-5 ${config.color}`} />
          <div>
            <div className="text-white font-medium">{config.label}</div>
            {status.detail && (
              <div className="text-sm text-slate-300">{status.detail}</div>
            )}
          </div>
        </div>
        
        {status.state !== 'online' && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        )}
      </div>
    </Card>
  );
};

const CoverageInfoCard: React.FC<{ info: CoverageInfo }> = ({ info }) => {
  const scanStatusConfig = {
    fresh: { icon: CheckCircle, color: 'text-green-400', label: 'Fresh' },
    stale: { icon: Clock, color: 'text-amber-400', label: 'Stale' },
    missing: { icon: XCircle, color: 'text-red-400', label: 'Missing' },
  };
  
  const scanConfig = scanStatusConfig[info.scanStatus];
  const ScanIcon = scanConfig.icon;
  
  return (
    <Card className="p-4 bg-white/5 border border-white/10">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Wallets</span>
          <span className="text-white font-medium">{info.wallets}</span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Chains</span>
          <div className="flex gap-1">
            {info.chains.map((chain) => (
              <Badge key={chain} variant="outline" className="text-xs">
                {chain}
              </Badge>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Last Refresh</span>
          <span className="text-white font-medium">
            {formatTimestamp(info.lastRefresh)}
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Scan Status</span>
          <div className="flex items-center gap-2">
            <ScanIcon className={`w-4 h-4 ${scanConfig.color}`} />
            <span className="text-white font-medium">{scanConfig.label}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

const PreferenceSection: React.FC<{
  title: string;
  description?: string;
  children: React.ReactNode;
}> = ({ title, description, children }) => (
  <div className="space-y-3">
    <div>
      <h4 className="text-white font-medium">{title}</h4>
      {description && (
        <p className="text-sm text-slate-300">{description}</p>
      )}
    </div>
    {children}
  </div>
);

// ============================================================================
// Main Component
// ============================================================================

export const InsightsSheet: React.FC<InsightsSheetProps> = ({
  isOpen,
  onClose,
  providerStatus,
  coverageInfo,
  preferences,
  onPreferencesChange,
  isSaving = false,
  error = null,
  triggerRef,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [localPreferences, setLocalPreferences] = useState(preferences);
  
  // Custom hooks
  useEscapeKey(isOpen, onClose);
  useFocusRestore(isOpen, triggerRef);
  
  // Update local preferences when props change
  useEffect(() => {
    setLocalPreferences(preferences);
  }, [preferences]);
  
  // Prevent body scroll when sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  // Handle preference changes
  const handlePreferenceChange = (key: keyof PreferenceSettings, value: string | number) => {
    const newPreferences = { ...localPreferences, [key]: value };
    setLocalPreferences(newPreferences);
    onPreferencesChange({ [key]: value });
  };
  
  // Handle DND toggle
  const handleDndToggle = (enabled: boolean) => {
    if (enabled) {
      handlePreferenceChange('dnd_start_local', '22:00');
      handlePreferenceChange('dnd_end_local', '08:00');
    } else {
      // Disable DND by setting same start/end time
      handlePreferenceChange('dnd_start_local', '00:00');
      handlePreferenceChange('dnd_end_local', '00:00');
    }
  };
  
  const isDndEnabled = localPreferences.dnd_start_local !== localPreferences.dnd_end_local;
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            variants={OVERLAY_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          
          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            variants={SHEET_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="insights-title"
          >
            <Card className="
              w-full max-w-2xl max-h-[90vh] overflow-hidden
              bg-slate-900/95 backdrop-blur-md border border-white/10
              shadow-2xl
            ">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  <h2 id="insights-title" className="text-xl font-semibold text-white">
                    Insights & Settings
                  </h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="w-8 h-8 p-0 hover:bg-white/10"
                  aria-label="Close insights"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Content */}
              <div className="overflow-y-auto flex-1 p-6 space-y-6">
                {error && (
                  <Card className="p-4 bg-red-500/10 border border-red-500/20">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <div className="text-red-100">{error}</div>
                    </div>
                  </Card>
                )}
                
                {/* Provider Status */}
                <section>
                  <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
                  <ProviderStatusCard status={providerStatus} />
                </section>
                
                {/* Coverage Information */}
                <section>
                  <h3 className="text-lg font-semibold text-white mb-4">Coverage</h3>
                  <CoverageInfoCard info={coverageInfo} />
                </section>
                
                <Separator className="bg-white/10" />
                
                {/* Preferences */}
                <section>
                  <h3 className="text-lg font-semibold text-white mb-4">Preferences</h3>
                  <div className="space-y-6">
                    {/* Wallet Scope */}
                    <PreferenceSection
                      title="Default Wallet Scope"
                      description="Choose which wallets to include by default"
                    >
                      <Select
                        value={localPreferences.wallet_scope_default}
                        onValueChange={(value: 'active' | 'all') => 
                          handlePreferenceChange('wallet_scope_default', value)
                        }
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active wallet only</SelectItem>
                          <SelectItem value="all">All wallets</SelectItem>
                        </SelectContent>
                      </Select>
                    </PreferenceSection>
                    
                    {/* Do Not Disturb */}
                    <PreferenceSection
                      title="Do Not Disturb"
                      description="Quiet hours for notifications"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="dnd-toggle" className="text-white">
                            Enable quiet hours
                          </Label>
                          <Switch
                            id="dnd-toggle"
                            checked={isDndEnabled}
                            onCheckedChange={handleDndToggle}
                          />
                        </div>
                        
                        {isDndEnabled && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-sm text-slate-300">Start time</Label>
                              <Select
                                value={localPreferences.dnd_start_local}
                                onValueChange={(value) => 
                                  handlePreferenceChange('dnd_start_local', value)
                                }
                              >
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIME_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label className="text-sm text-slate-300">End time</Label>
                              <Select
                                value={localPreferences.dnd_end_local}
                                onValueChange={(value) => 
                                  handlePreferenceChange('dnd_end_local', value)
                                }
                              >
                                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {TIME_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        )}
                      </div>
                    </PreferenceSection>
                    
                    {/* Notification Cap */}
                    <PreferenceSection
                      title="Notification Limit"
                      description="Maximum notifications per day"
                    >
                      <Select
                        value={localPreferences.notif_cap_per_day.toString()}
                        onValueChange={(value) => 
                          handlePreferenceChange('notif_cap_per_day', parseInt(value))
                        }
                      >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {NOTIF_CAP_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value.toString()}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </PreferenceSection>
                  </div>
                </section>
                
                <Separator className="bg-white/10" />
                
                {/* Documentation Links */}
                <section>
                  <h3 className="text-lg font-semibold text-white mb-4">Documentation</h3>
                  <div className="space-y-2">
                    <Button
                      variant="ghost"
                      asChild
                      className="w-full justify-between text-white hover:bg-white/10"
                    >
                      <a href="/docs/terms" target="_blank" rel="noopener noreferrer">
                        Terms of Service
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      asChild
                      className="w-full justify-between text-white hover:bg-white/10"
                    >
                      <a href="/docs/privacy" target="_blank" rel="noopener noreferrer">
                        Privacy Policy
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                    
                    <Button
                      variant="ghost"
                      asChild
                      className="w-full justify-between text-white hover:bg-white/10"
                    >
                      <a href="/docs/help" target="_blank" rel="noopener noreferrer">
                        Help & Support
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </section>
              </div>
              
              {/* Footer */}
              {isSaving && (
                <div className="p-4 border-t border-white/10">
                  <div className="flex items-center justify-center gap-2 text-sm text-slate-300">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Saving preferences...
                  </div>
                </div>
              )}
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default InsightsSheet;