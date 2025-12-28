'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  Shield, 
  RefreshCw, 
  Wrench, 
  Clock, 
  TrendingUp,
  Award,
  History,
  Settings,
  Home,
  Trophy,
  User,
  Plus,
  Brain,
  Sun,
  Moon,
  Activity,
  CheckCircle,
  AlertTriangle,
  Wallet,
  ChevronDown,
  Sparkles
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DisabledTooltipButton } from '@/components/ui/disabled-tooltip-button';
import { InteractiveDiv } from '@/components/ui/interactive-div';
import { RisksTab } from '@/components/guardian/RisksTab';
import { AlertsTab } from '@/components/guardian/AlertsTab';
import { HistoryTab } from '@/components/guardian/HistoryTab';
import { FixRiskModal } from '@/components/guardian/FixRiskModal';
import AddWalletModal from '@/components/guardian/AddWalletModal';
import { useGuardianScan } from '@/hooks/useGuardianScan';
import { chainIdToName } from '@/config/wagmi';
import { toast } from 'sonner';
import { FooterNav } from '@/components/layout/FooterNav';

// Contexts
import { useUserModeContext } from '@/contexts/UserModeContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useWallet as useWalletContext } from '@/contexts/WalletContext';
import type { GuardianWallet } from '@/contexts/WalletContext';


export function GuardianEnhanced() {
  const { address, isConnected, chain } = useAccount();
  const { mode, setMode, isBeginner, isExpert } = useUserModeContext();
  const notifications = useNotificationContext();
  const { actualTheme } = useTheme();
  
  const [activeView, setActiveView] = useState<'dashboard' | 'timeline' | 'achievements'>('dashboard');
  const [activeTab, setActiveTab] = useState('Scan');
  const [isDarkTheme, setIsDarkTheme] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [demoAddress, setDemoAddress] = useState<string | null>(null);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [showOnboard, setShowOnboard] = useState(false);
  const [showFixModal, setShowFixModal] = useState(false);
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [activeWalletIndex, setActiveWalletIndex] = useState(0);
  const walletContext = useWalletContext();
  const guardianWallets = walletContext?.wallets ?? [];
  const updateWallet = walletContext?.updateWallet ?? (() => undefined);
  const refreshWallets = walletContext?.refreshWallets ?? (() => undefined);

  const wallets = useMemo(() => guardianWallets.map(wallet => ({
    address: wallet.address,
    label: wallet.alias || wallet.ens_name || wallet.short,
    trustScore: wallet.trust_score ?? undefined,
    riskCount: wallet.risk_count ?? undefined,
    lastScan: wallet.last_scan ?? undefined,
  })), [guardianWallets]);

  // Get network name
  const networkName = chain?.id ? chainIdToName[chain.id] || 'ethereum' : 'ethereum';
  
  // Get active wallet safely
  const activeWallet = wallets.length > 0 ? wallets[activeWalletIndex] : null;
  const activeAddress = demoMode ? demoAddress : (activeWallet?.address || address);
  const isActive = demoMode ? !!demoAddress : (!!activeWallet || isConnected);

  // Switch wallet handler
  const handleSwitchWallet = (index: number) => {
    setActiveWalletIndex(index);
    setShowWalletDropdown(false);
  };

  // Enhanced wallet handler with API integration
  const handleWalletAdded = useCallback((wallet: GuardianWallet) => {
    const normalized = wallet.address.toLowerCase();
    const index = guardianWallets.findIndex(w => w.address.toLowerCase() === normalized);
    if (index >= 0) {
      setActiveWalletIndex(index);
    } else if (guardianWallets.length > 0) {
      setActiveWalletIndex(guardianWallets.length - 1);
    }
  }, [guardianWallets]);

  const updateWalletData = useCallback((address: string, data: { trustScore?: number; riskCount?: number }) => {
    updateWallet(address.toLowerCase(), {
      trust_score: data.trustScore,
      risk_count: data.riskCount,
      last_scan: new Date().toISOString(),
    });
  }, [updateWallet]);

  useEffect(() => {
    if (guardianWallets.length === 0) {
      setActiveWalletIndex(0);
      return;
    }

    if (activeWalletIndex >= guardianWallets.length) {
      const nextIndex = Math.max(guardianWallets.length - 1, 0);
      if (nextIndex !== activeWalletIndex) {
        setActiveWalletIndex(nextIndex);
      }
    }
  }, [guardianWallets.length, activeWalletIndex]);

  // Update wallet data after scan
  // Guardian scan hook
  const { data: scanResult, isLoading, refetch, rescan, isRescanning } = useGuardianScan({
    walletAddress: activeAddress || undefined,
    network: networkName,
    enabled: isActive && !!activeAddress,
  });

  // Achievement state (simplified)
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);



  // Auto-scan on connection
  useEffect(() => {
    if ((isConnected && address) || (demoMode && demoAddress)) {
      refetch();
    }
  }, [isConnected, address, demoMode, demoAddress]);

  // First-time onboarding
  useEffect(() => {
    if (!localStorage.getItem('guardian_onboard_seen')) {
      setShowOnboard(true);
    }
  }, []);

  // Add notification when scan completes and update wallet data
  useEffect(() => {
    if (scanResult && activeAddress) {
      const flagCount = scanResult.flags?.length || 0;
      
      // Update wallet data
      updateWalletData(activeAddress, {
        trustScore: scanResult.trustScorePercent,
        riskCount: flagCount
      });
      
      if (flagCount === 0) {
        toast.success('✅ All Clear! Your wallet is secure');
        awardXP(100, 'Perfect security score');
      } else {
        toast.warning(`⚠️ Found ${flagCount} potential ${flagCount === 1 ? 'risk' : 'risks'}`);
      }
      
      awardXP(50, 'Completed security scan');
    }
  }, [scanResult, activeAddress]);

  // Exit demo mode handler
  const handleExitDemo = () => {
    setDemoMode(false);
    setDemoAddress(null);
    toast.success('Demo Mode Exited');
  };

  // Debug modal state
  useEffect(() => {
    console.log('showAddWalletModal changed to:', showAddWalletModal);
  }, [showAddWalletModal]);

  // Simplified XP function
  const awardXP = (amount: number, reason: string) => {
    setUserXP(prev => prev + amount);
  };

  // Demo mode handler
  const handleDemoMode = () => {
    const mockAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    setDemoAddress(mockAddress);
    setDemoMode(true);
    toast.success('Demo Mode Activated - Scanning Vitalik.eth');
  };

  const handleRescan = async () => {
    if (!activeAddress) return;
    try {
      await rescan();
      await refreshWallets();
      toast.success('Rescan complete!');
      awardXP(25, 'Rescanned wallet');
    } catch (error) {
      toast.error('Rescan failed. Please try again.');
    }
  };





  // Welcome screen (not connected)
  if (!isActive && !demoMode) {
    return (
      <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${
        isDarkTheme 
          ? 'bg-gradient-to-b from-[#0A0E1A] to-[#111827]' 
          : 'bg-gradient-to-b from-[#FFFFFF] to-[#F9FAFB] text-[#1B1F29]'
      }`}>
        {/* Whale Pulse Background Animation */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: isDarkTheme ? [
              'radial-gradient(circle at 30% 40%, rgba(0,245,160,0.08) 0%, transparent 50%)',
              'radial-gradient(circle at 70% 60%, rgba(123,97,255,0.06) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 30%, rgba(0,245,160,0.04) 0%, transparent 50%)',
              'radial-gradient(circle at 30% 70%, rgba(123,97,255,0.08) 0%, transparent 50%)',
              'radial-gradient(circle at 30% 40%, rgba(0,245,160,0.08) 0%, transparent 50%)'
            ] : [
              'radial-gradient(circle at 30% 40%, rgba(0,245,160,0.03) 0%, transparent 50%)',
              'radial-gradient(circle at 70% 60%, rgba(123,97,255,0.02) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 30%, rgba(0,245,160,0.02) 0%, transparent 50%)',
              'radial-gradient(circle at 30% 70%, rgba(123,97,255,0.03) 0%, transparent 50%)',
              'radial-gradient(circle at 30% 40%, rgba(0,245,160,0.03) 0%, transparent 50%)'
            ]
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Header */}
        <motion.header
          className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
            isDarkTheme 
              ? 'bg-[rgba(16,18,30,0.75)] border-[rgba(255,255,255,0.08)]' 
              : 'bg-[rgba(255,255,255,0.85)] border-[rgba(0,0,0,0.08)]'
          }`}
          style={{
            boxShadow: isDarkTheme 
              ? 'none'
              : '0 2px 8px rgba(0,0,0,0.04)'
          }}
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="max-w-screen-xl mx-auto px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/header.png" alt="Logo" className="w-8 h-8" />
                <Shield className="w-6 h-6 text-[#00C9A7]" />
                <div>
                  <h1 className={`text-xl font-semibold tracking-tight transition-colors duration-300 ${
                    isDarkTheme ? 'text-white' : 'text-[#1B1F29]'
                  }`}>
                    Guardian
                  </h1>
                  <p className="text-xs text-[#7C8896] dark:text-gray-400 leading-snug">
                    Your AI-powered safety layer for DeFi.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <DisabledTooltipButton
                  onClick={() => setIsDarkTheme(!isDarkTheme)}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isDarkTheme 
                      ? 'bg-white/10 hover:bg-white/15' 
                      : 'bg-gray-100/80 hover:bg-gray-200/80'
                  }`}
                  variant="ghost"
                  size="sm"
                  aria-label={`Switch to ${isDarkTheme ? 'light' : 'dark'} theme`}
                >
                  {isDarkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </DisabledTooltipButton>
              </div>
            </div>
          </div>
        </motion.header>

        <main className="px-4 pt-32 pb-28 max-w-2xl mx-auto relative z-10">
          <motion.div
            className={`backdrop-blur-xl rounded-2xl p-6 border transition-colors duration-300 ${
              isDarkTheme 
                ? 'bg-[rgba(255,255,255,0.05)] border-white/10' 
                : 'bg-[rgba(255,255,255,0.85)] border-[rgba(0,0,0,0.06)]'
            }`}
            style={{
              boxShadow: isDarkTheme 
                ? '0 4px 30px rgba(0,0,0,0.25), 0 1px 0 rgba(255,255,255,0.1)'
                : '0 4px 20px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.9)'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-8 h-8 text-[#00F5A0]" />
              <div>
                <h2 className={`text-2xl font-bold transition-colors duration-300 ${
                  isDarkTheme ? 'text-[#E4E8F3]' : 'text-[#1B1F29]'
                }`}>
                  Welcome to Guardian
                </h2>
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkTheme ? 'text-gray-400' : 'text-[#7C8896]'
                }`}>
                  Let's make sure your wallet stays in perfect health with a quick 30-second security scan
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6 relative z-10">
              <ConnectButton.Custom>
                {({ openConnectModal }) => (
                  <DisabledTooltipButton 
                    onClick={openConnectModal}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] text-white font-medium shadow-md hover:opacity-90 transition relative z-20"
                    aria-label="Connect your wallet to start security scan"
                  >
                    Connect Wallet
                  </DisabledTooltipButton>
                )}
              </ConnectButton.Custom>
              <DisabledTooltipButton 
                onClick={handleDemoMode}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg border transition-all duration-300 relative z-20 ${
                  isDarkTheme
                    ? 'border-[rgba(255,255,255,0.1)] text-gray-300 hover:bg-[rgba(255,255,255,0.05)]'
                    : 'border-[rgba(0,0,0,0.08)] text-[#444C56] hover:bg-gray-100'
                }`}
                variant="outline"
                aria-label="Try Guardian demo mode with sample wallet data"
              >
                ✨ Try Demo Mode
              </DisabledTooltipButton>
            </div>

            <div className={`flex flex-col sm:flex-row justify-between text-xs transition-colors duration-300 ${
              isDarkTheme ? 'text-gray-500' : 'text-[#7C8896]'
            }`}>
              <span>Full features • Sign transactions • Secure</span>
              <span>Read-only scan • No wallet required</span>
            </div>
          </motion.div>

          {/* Feature Cards */}
          <div className="grid sm:grid-cols-3 gap-6 mt-6">
            {[
              {
                title: "Trust Score",
                desc: "Get a 0–100 score based on approvals, mixer activity, and reputation.",
                icon: <Shield className="w-5 h-5 text-[#00F5A0]" />,
              },
              {
                title: "Fix Risks",
                desc: "One-tap revoke for unlimited approvals and suspicious contracts.",
                icon: <Wrench className="w-5 h-5 text-[#7B61FF]" />,
              },
              {
                title: "Stay Safe",
                desc: "Real-time alerts for new approvals and contract interactions.",
                icon: <TrendingUp className="w-5 h-5 text-amber-400" />,
              },
            ].map((card, index) => (
              <motion.div
                key={card.title}
                className={`backdrop-blur-xl rounded-2xl p-4 border transition-colors duration-300 ${
                  isDarkTheme 
                    ? 'bg-[rgba(255,255,255,0.05)] border-white/10' 
                    : 'bg-[rgba(255,255,255,0.85)] border-[rgba(0,0,0,0.06)]'
                }`}
                style={{
                  boxShadow: isDarkTheme 
                    ? '0 4px 30px rgba(0,0,0,0.25)'
                    : '0 4px 20px rgba(0,0,0,0.08)'
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <div className="flex items-center gap-2 mb-2">
                  {card.icon}
                  <h3 className={`font-semibold transition-colors duration-300 ${
                    isDarkTheme ? 'text-[#E4E8F3]' : 'text-[#1B1F29]'
                  }`}>
                    {card.title}
                  </h3>
                </div>
                <p className={`text-sm transition-colors duration-300 ${
                  isDarkTheme ? 'text-gray-400' : 'text-[#444C56]'
                }`}>
                  {card.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </main>
        
        <FooterNav />
      </div>
    );
  }

  // Main dashboard (connected/demo mode)
  const trustScore = scanResult?.trustScorePercent || 87;
  const flagCount = scanResult?.flags?.length || 2;

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${
      isDarkTheme 
        ? 'bg-gradient-to-b from-[#0A0E1A] to-[#111827]' 
        : 'bg-gradient-to-b from-[#FFFFFF] to-[#F9FAFB] text-[#1B1F29]'
    }`}>
      {/* Whale Pulse Background Animation */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: isDarkTheme ? [
            'radial-gradient(circle at 30% 40%, rgba(0,245,160,0.08) 0%, transparent 50%)',
            'radial-gradient(circle at 70% 60%, rgba(123,97,255,0.06) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 30%, rgba(0,245,160,0.04) 0%, transparent 50%)',
            'radial-gradient(circle at 30% 70%, rgba(123,97,255,0.08) 0%, transparent 50%)',
            'radial-gradient(circle at 30% 40%, rgba(0,245,160,0.08) 0%, transparent 50%)'
          ] : [
            'radial-gradient(circle at 30% 40%, rgba(0,245,160,0.03) 0%, transparent 50%)',
            'radial-gradient(circle at 70% 60%, rgba(123,97,255,0.02) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 30%, rgba(0,245,160,0.02) 0%, transparent 50%)',
            'radial-gradient(circle at 30% 70%, rgba(123,97,255,0.03) 0%, transparent 50%)',
            'radial-gradient(circle at 30% 40%, rgba(0,245,160,0.03) 0%, transparent 50%)'
          ]
        }}
        transition={{
          duration: 9,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Header */}
      <motion.header
        className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
          isDarkTheme 
            ? 'bg-[rgba(16,18,30,0.75)] border-[rgba(255,255,255,0.08)]' 
            : 'bg-[rgba(255,255,255,0.85)] border-[rgba(0,0,0,0.08)]'
        }`}
        style={{
          boxShadow: isDarkTheme 
            ? 'none'
            : '0 2px 8px rgba(0,0,0,0.04)'
        }}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/header.png" alt="Logo" className="w-8 h-8" />
              <div className="flex items-center gap-2">
                <h1 className={`text-xl font-semibold transition-colors duration-300 ${
                  isDarkTheme ? 'text-white' : 'text-[#1B1F29]'
                }`}>
                  Guardian
                </h1>
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                  <Brain className="w-4 h-4 text-[#00F5A0]" />
                </motion.div>
              </div>
              
              {/* Multi-Wallet Dropdown */}
              {(wallets.length > 0 || activeAddress) && (
                <div className="relative">
                  <DisabledTooltipButton
                    onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                    className={`flex items-center gap-2 px-3 py-1 rounded-lg border transition-all duration-300 ${
                      isDarkTheme
                        ? 'border-[rgba(255,255,255,0.1)] text-gray-300 hover:bg-[rgba(255,255,255,0.05)]'
                        : 'border-[rgba(0,0,0,0.08)] text-[#444C56] hover:bg-gray-100'
                    }`}
                    variant="outline"
                    size="sm"
                    aria-label="Select active wallet for security scan"
                  >
                    <Wallet className="w-3 h-3" />
                    <span className="text-xs font-mono">
                      {activeAddress ? `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}` : 'No Wallet'}
                    </span>
                    {activeWallet?.trustScore && (
                      <span className={`w-2 h-2 rounded-full ${
                        activeWallet.trustScore >= 80 ? 'bg-[#00C9A7]' :
                        activeWallet.trustScore >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                      }`} />
                    )}
                    <ChevronDown className="w-3 h-3" />
                  </DisabledTooltipButton>
                  
                  {/* Wallet Dropdown */}
                  {showWalletDropdown && (
                    <div className={`absolute top-full left-0 mt-2 w-80 rounded-xl border shadow-lg z-50 ${
                      isDarkTheme
                        ? 'bg-[rgba(16,18,30,0.95)] border-[rgba(255,255,255,0.1)]'
                        : 'bg-white border-[rgba(0,0,0,0.08)]'
                    }`}>
                      <div className="p-3">
                        <h3 className={`text-sm font-semibold mb-3 ${
                          isDarkTheme ? 'text-white' : 'text-[#1B1F29]'
                        }`}>
                          My Wallets
                        </h3>
                        
                        {wallets.map((wallet, index) => (
                          <InteractiveDiv
                            key={wallet.address}
                            onClick={() => handleSwitchWallet(index)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg mb-2 transition-all ${
                              index === activeWalletIndex
                                ? 'bg-[#00C9A7]/10 border border-[#00C9A7]/30'
                                : isDarkTheme
                                  ? 'hover:bg-white/5'
                                  : 'hover:bg-gray-50'
                            }`}
                            ariaLabel={`Switch to wallet ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)} with trust score ${wallet.trustScore || 'unknown'}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${
                                wallet.trustScore ? (
                                  wallet.trustScore >= 80 ? 'bg-[#00C9A7]' :
                                  wallet.trustScore >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                                ) : 'bg-gray-400'
                              }`} />
                              <div className="text-left">
                                <p className={`text-xs font-mono ${
                                  isDarkTheme ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                                </p>
                                <p className={`text-xs ${
                                  isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {wallet.label}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              {wallet.trustScore && (
                                <p className={`text-xs font-semibold ${
                                  wallet.trustScore >= 80 ? 'text-[#00C9A7]' :
                                  wallet.trustScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                  {wallet.trustScore}
                                </p>
                              )}
                              {wallet.riskCount !== undefined && (
                                <p className={`text-xs ${
                                  isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                  {wallet.riskCount} risks
                                </p>
                              )}
                            </div>
                          </InteractiveDiv>
                        ))}
                        
                        <DisabledTooltipButton
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Add Wallet dropdown button clicked');
                            setShowWalletDropdown(false);
                            setShowAddWalletModal(true);
                          }}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg border-2 border-dashed transition-all ${
                            isDarkTheme
                              ? 'border-gray-600 text-gray-400 hover:border-[#00C9A7] hover:text-[#00C9A7]'
                              : 'border-gray-300 text-gray-500 hover:border-[#00C9A7] hover:text-[#00C9A7]'
                          }`}
                          variant="outline"
                          aria-label="Add a new wallet to Guardian for security monitoring"
                        >
                          <Plus className="w-4 h-4" />
                          <span className="text-sm">Add Wallet</span>
                        </DisabledTooltipButton>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {demoMode && (
                <DisabledTooltipButton
                  onClick={handleExitDemo}
                  className={`px-2 py-1 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity ${
                    isDarkTheme ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                  }`}
                  variant="ghost"
                  size="sm"
                  aria-label="Exit demo mode and return to normal Guardian interface"
                >
                  Demo Mode (Exit)
                </DisabledTooltipButton>
              )}
              
              <p className={`text-xs transition-colors duration-300 ${
                isDarkTheme ? 'text-gray-400' : 'text-[#7C8896]'
              }`}>
                Updated just now
              </p>
              
              <div className="flex items-center gap-3">
                <DisabledTooltipButton
                  onClick={() => setIsDarkTheme(!isDarkTheme)}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isDarkTheme 
                      ? 'bg-white/10 hover:bg-white/15' 
                      : 'bg-gray-100/80 hover:bg-gray-200/80'
                  }`}
                  variant="ghost"
                  size="sm"
                  aria-label={`Switch to ${isDarkTheme ? 'light' : 'dark'} theme`}
                >
                  {isDarkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </DisabledTooltipButton>
                
                <div className="flex gap-2 text-sm">
                  <DisabledTooltipButton 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('Add Wallet button clicked, current state:', showAddWalletModal);
                      setShowAddWalletModal(true);
                      console.log('Set showAddWalletModal to true');
                      alert('Add Wallet button clicked! Check console.');
                    }}
                    className={`px-3 py-1 rounded-lg border transition-all duration-300 flex items-center gap-1 ${
                      isDarkTheme
                        ? 'border-[rgba(255,255,255,0.1)] text-gray-300 hover:bg-[rgba(255,255,255,0.05)]'
                        : 'border-[rgba(0,0,0,0.08)] text-[#444C56] hover:bg-gray-100'
                    }`}
                    variant="outline"
                    size="sm"
                    aria-label="Add a new wallet to Guardian for security monitoring"
                  >
                    <Plus className="w-3 h-3" />
                    Add Wallet
                  </DisabledTooltipButton>
                  <DisabledTooltipButton 
                    onClick={demoMode ? handleExitDemo : handleDemoMode}
                    className={`px-3 py-1 rounded-lg border transition-all duration-300 ${
                      demoMode
                        ? 'bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] text-white font-medium shadow-sm'
                        : isDarkTheme
                          ? 'border-[rgba(255,255,255,0.1)] text-gray-300 hover:bg-[rgba(255,255,255,0.05)]'
                          : 'border-[rgba(0,0,0,0.08)] text-[#444C56] hover:bg-gray-100'
                    }`}
                    variant={demoMode ? "default" : "outline"}
                    size="sm"
                    aria-label={demoMode ? "Exit demo mode" : "Enter demo mode with sample wallet data"}
                  >
                    {demoMode ? 'Exit Demo' : 'Demo'}
                  </DisabledTooltipButton>
                  <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                      <DisabledTooltipButton 
                        onClick={openConnectModal}
                        className={`px-3 py-1 rounded-lg border transition-all duration-300 flex items-center gap-1 ${
                          isConnected && !demoMode
                            ? 'bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] text-white font-medium shadow-sm'
                            : isDarkTheme
                              ? 'border-[rgba(255,255,255,0.1)] text-gray-300 hover:bg-[rgba(255,255,255,0.05)]'
                              : 'border-[rgba(0,0,0,0.08)] text-[#444C56] hover:bg-gray-100'
                        }`}
                        variant={isConnected && !demoMode ? "default" : "outline"}
                        size="sm"
                        aria-label={isConnected ? "Wallet is connected" : "Connect your wallet to Guardian"}
                      >
                        {isConnected ? 'Connected' : 'Connect'}
                        {isConnected && !demoMode && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          >
                            <Activity className="w-3 h-3" />
                          </motion.div>
                        )}
                      </DisabledTooltipButton>
                    )}
                  </ConnectButton.Custom>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row - Filter Tabs */}
          <nav className={`flex items-center gap-6 overflow-x-auto scrollbar-none text-sm transition-colors duration-300 ${
            isDarkTheme ? 'text-gray-300' : 'text-[#444C56]'
          }`}>
            {['Scan', 'Risks', 'Alerts', 'History'].map((tab) => (
              <DisabledTooltipButton
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-2 py-1 transition-all duration-200 ${
                  activeTab === tab ? 'text-[#00C9A7]' : ''
                }`}
                variant="ghost"
                size="sm"
                aria-label={`Switch to ${tab} tab`}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00C9A7] to-[#7B61FF]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </DisabledTooltipButton>
            ))}
          </nav>
        </div>
      </motion.header>

      <main className="px-4 pt-32 pb-28 max-w-2xl mx-auto space-y-6 relative z-10">
        {/* Tab Content */}
        {activeTab === 'Risks' && <RisksTab walletAddress={activeAddress || undefined} />}
        {activeTab === 'Alerts' && <AlertsTab walletAddress={activeAddress || undefined} />}
        {activeTab === 'History' && <HistoryTab walletAddress={activeAddress || undefined} />}
        
        {/* Scan Tab Content */}
        {activeTab === 'Scan' && (
        <>
        {/* Wallet Status Card */}
        <motion.div
          className={`backdrop-blur-xl rounded-2xl p-4 border transition-colors duration-300 ${
            isDarkTheme 
              ? 'bg-[rgba(255,255,255,0.05)] border-white/10' 
              : 'bg-[rgba(255,255,255,0.85)] border-[rgba(0,0,0,0.06)]'
          }`}
          style={{
            boxShadow: isDarkTheme 
              ? '0 4px 30px rgba(0,0,0,0.25), 0 1px 0 rgba(255,255,255,0.1)'
              : '0 4px 20px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.9)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-[#00F5A0]" />
              <div>
                <div className="flex items-center gap-2">
                  <motion.span 
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="relative bg-[#00C9A7]/10 text-[#00C9A7] px-2 py-1 rounded-lg text-xs font-medium before:absolute before:inset-0 before:rounded-lg before:animate-ping before:bg-[#00C9A7]/20"
                  >
                    {demoMode ? 'Demo Wallet' : isConnected ? 'Wallet Connected' : 'No Wallet Connected'}
                  </motion.span>
                </div>
                {activeAddress && (
                  <p className={`text-xs font-mono transition-colors duration-300 ${
                    isDarkTheme ? 'text-[#00C9A7]' : 'text-[#00C9A7]'
                  }`}>
                    {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
                  </p>
                )}
              </div>
            </div>
            {isLoading && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1 }}
              >
                <RefreshCw className="w-4 h-4 text-[#00F5A0]" />
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Multi-Wallet Portfolio Overview */}
        {wallets.length > 1 && (
          <motion.div
            className={`backdrop-blur-xl rounded-2xl p-4 border transition-colors duration-300 ${
              isDarkTheme 
                ? 'bg-[rgba(255,255,255,0.05)] border-white/10' 
                : 'bg-[rgba(255,255,255,0.85)] border-[rgba(0,0,0,0.06)]'
            }`}
            style={{
              boxShadow: isDarkTheme 
                ? '0 4px 30px rgba(0,0,0,0.25), 0 1px 0 rgba(255,255,255,0.1)'
                : '0 4px 20px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.9)'
            }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-sm font-semibold transition-colors duration-300 ${
                  isDarkTheme ? 'text-[#E4E8F3]' : 'text-[#1B1F29]'
                }`}>
                  🧭 Your Wallets at a Glance
                </h3>
                <p className={`text-xs transition-colors duration-300 ${
                  isDarkTheme ? 'text-gray-400' : 'text-[#7C8896]'
                }`}>
                  {wallets.length} wallets • Avg: {Math.round(wallets.filter(w => w.trustScore).reduce((acc, w) => acc + (w.trustScore || 0), 0) / wallets.filter(w => w.trustScore).length) || '--'}% trust
                </p>
              </div>
              <div className="text-right">
                <div className={`text-lg font-bold transition-colors duration-300 ${
                  isDarkTheme ? 'text-[#00C9A7]' : 'text-[#00C9A7]'
                }`}>
                  {wallets.reduce((acc, w) => acc + (w.riskCount || 0), 0)}
                </div>
                <div className={`text-xs transition-colors duration-300 ${
                  isDarkTheme ? 'text-gray-400' : 'text-[#7C8896]'
                }`}>
                  Total Risks
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              {wallets.map((wallet, index) => (
                <div
                  key={wallet.address}
                  className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                    index === activeWalletIndex
                      ? 'bg-[#00C9A7]/10 border border-[#00C9A7]/30'
                      : isDarkTheme
                        ? 'bg-white/5 hover:bg-white/10'
                        : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      wallet.trustScore ? (
                        wallet.trustScore >= 80 ? 'bg-[#00C9A7]' :
                        wallet.trustScore >= 60 ? 'bg-yellow-400' : 'bg-red-400'
                      ) : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className={`text-sm font-mono transition-colors duration-300 ${
                        isDarkTheme ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                      </p>
                      <p className={`text-xs transition-colors duration-300 ${
                        isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {wallet.label}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className={`text-sm font-semibold ${
                        wallet.trustScore ? (
                          wallet.trustScore >= 80 ? 'text-[#00C9A7]' :
                          wallet.trustScore >= 60 ? 'text-yellow-400' : 'text-red-400'
                        ) : 'text-gray-400'
                      }`}>
                        {wallet.trustScore || '--'}
                      </p>
                      <p className={`text-xs transition-colors duration-300 ${
                        isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Trust
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className={`text-sm font-semibold transition-colors duration-300 ${
                        isDarkTheme ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {wallet.riskCount ?? '--'}
                      </p>
                      <p className={`text-xs transition-colors duration-300 ${
                        isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Risks
                      </p>
                    </div>
                    
                    <div className="text-center">
                      <p className={`text-xs transition-colors duration-300 ${
                        isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {wallet.lastScan ? new Date(wallet.lastScan).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Never'}
                      </p>
                      <p className={`text-xs transition-colors duration-300 ${
                        isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Last Scan
                      </p>
                    </div>
                    
                    <DisabledTooltipButton
                      onClick={() => {
                        setActiveWalletIndex(index);
                        handleRescan();
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        isDarkTheme
                          ? 'bg-[#00C9A7]/20 text-[#00C9A7] hover:bg-[#00C9A7]/30'
                          : 'bg-[#00C9A7]/10 text-[#00C9A7] hover:bg-[#00C9A7]/20'
                      }`}
                      variant="ghost"
                      size="sm"
                      aria-label={`Scan wallet ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)} for security risks`}
                    >
                      Scan →
                    </DisabledTooltipButton>
                  </div>
                </div>
              ))}
            </div>
            
            {wallets.length > 1 && (
              <DisabledTooltipButton
                onClick={() => {
                  // Scan all wallets
                  toast.success(`Scanning ${wallets.length} wallets...`);
                }}
                className="w-full mt-4 py-2 rounded-lg bg-gradient-to-r from-[#00C9A7] to-[#7B61FF] text-white font-medium hover:opacity-90 transition-all duration-200"
                aria-label={`Scan all ${wallets.length} wallets for security risks`}
              >
                Scan All Wallets
              </DisabledTooltipButton>
            )}
          </motion.div>
        )}

        {/* Trust Score Card */}
        <motion.div
          className={`backdrop-blur-xl rounded-2xl p-6 border transition-colors duration-300 ${
            isDarkTheme 
              ? 'bg-[rgba(255,255,255,0.05)] border-white/10' 
              : 'bg-[rgba(255,255,255,0.85)] border-[rgba(0,0,0,0.06)]'
          }`}
          style={{
            boxShadow: isDarkTheme 
              ? '0 4px 30px rgba(0,0,0,0.25), 0 1px 0 rgba(255,255,255,0.1)'
              : '0 4px 20px rgba(0,0,0,0.08), 0 1px 0 rgba(255,255,255,0.9)'
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className={`text-sm font-medium tracking-wide uppercase transition-colors duration-300 ${
                isDarkTheme ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Trust Score
              </h2>
              <DisabledTooltipButton
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-[#00C9A7]/10 text-[#00C9A7] hover:bg-[#00C9A7]/20 transition"
                variant="ghost"
                size="sm"
                aria-label="View AI-generated security digest for this wallet"
              >
                <Brain className="w-3 h-3" /> Digest
              </DisabledTooltipButton>
            </div>
            <DisabledTooltipButton 
              onClick={() => setShowLearnMore(!showLearnMore)}
              className={`text-xs hover:text-[#00C9A7] transition-colors duration-300 ${
                isDarkTheme ? 'text-gray-400' : 'text-[#7C8896]'
              }`}
              variant="ghost"
              size="sm"
              aria-label={showLearnMore ? 'Hide trust score details' : 'Learn more about trust score calculation'}
            >
              {showLearnMore ? 'Hide details' : 'ⓘ Learn More'}
            </DisabledTooltipButton>
          </div>
          <div className="flex items-center gap-3 mt-3 mb-4">
            <div className="relative">
              <motion.div
                className="absolute inset-0 bg-[#00C9A7] rounded-full blur-md opacity-20"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              />
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 120 }}
                className="relative text-6xl md:text-7xl font-bold text-[#00C9A7] tracking-tight"
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {trustScore}
                </motion.span>
              </motion.span>
            </div>
            <div>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-lg font-semibold text-[#00C9A7] leading-snug"
              >
                {trustScore >= 80 ? 'Excellent Security' : trustScore >= 60 ? 'Moderate Risk' : 'Action Required'}
              </motion.p>
              <p className={`text-xs leading-snug mt-1 transition-colors duration-300 ${
                isDarkTheme ? 'text-gray-300' : 'text-[#7C8896]'
              }`}>
                {flagCount === 0 ? 'No risks detected' : `${flagCount} risks detected`} • Last scan just now
                {!scanResult && (
                  <span className="ml-2 px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 rounded text-xs font-medium">
                    DEMO
                  </span>
                )}
                {wallets.length > 1 && (
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-xs font-medium ${
                    isDarkTheme ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                  }`}>
                    Portfolio Avg: {Math.round(wallets.filter(w => w.trustScore).reduce((acc, w) => acc + (w.trustScore || 0), 0) / wallets.filter(w => w.trustScore).length) || '--'}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {/* Learn More Drawer */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: showLearnMore ? 1 : 0, height: showLearnMore ? "auto" : 0 }}
            transition={{ duration: 0.3 }}
            className={`overflow-hidden rounded-xl p-4 mt-2 text-sm ${
              isDarkTheme 
                ? 'bg-[rgba(16,18,30,0.65)] text-gray-300' 
                : 'bg-[rgba(255,255,255,0.85)] text-gray-700'
            }`}
          >
            <p className="mb-2 text-base font-semibold text-[#00C9A7]">🧠 What is Trust Score?</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Measures wallet safety based on approvals, mixers, and contract reputation.</li>
              <li>Higher score = safer wallet and lower drain risk.</li>
              <li>Guardian re-scans automatically every 24 hours.</li>
            </ul>
            <div className={`mt-2 text-xs ${
              isDarkTheme ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <a href="/guardian/learn" className="underline hover:text-[#00C9A7]">
                Read more →
              </a>
            </div>
          </motion.div>
        </motion.div>

        {/* Risk Summary Grid */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-[#00C9A7]/10 text-[#00C9A7] px-2 py-0.5 rounded-lg text-xs font-medium">
              Detected Risks
            </span>
            <div className={`h-px flex-1 transition-colors duration-300 ${
              isDarkTheme ? 'bg-white/10' : 'bg-black/10'
            }`} />
          </div>
          <div className="grid sm:grid-cols-3 gap-4 items-stretch">
            {(() => {
              const activeRisks = scanResult?.flags || [];
              const approvalRisks = activeRisks.filter(flag => flag.type.toLowerCase().includes('approval'));
              const mixerRisks = activeRisks.filter(flag => flag.type.toLowerCase().includes('mixer'));
              
              const cards = [
                { 
                  title: "Active Risks", 
                  value: activeRisks.length.toString(), 
                  desc: activeRisks.length === 0 ? "No issues detected" : `${activeRisks.length} ${activeRisks.length === 1 ? 'issue' : 'issues'} detected • Fix with one tap`, 
                  icon: <Wrench className='w-5 h-5 text-[#7B61FF]'/>, 
                  cta: activeRisks.length > 0 ? "Fix Risks" : null 
                },
                { 
                  title: "Token Approvals", 
                  value: approvalRisks.length > 0 ? `${approvalRisks.length} unlimited` : "None", 
                  desc: approvalRisks.length > 0 ? "Approvals found across contracts" : "No unlimited approvals found", 
                  icon: <Shield className='w-5 h-5 text-blue-400'/>, 
                  cta: approvalRisks.length > 0 ? "Review" : null 
                },
                { 
                  title: "Mixer Exposure", 
                  value: mixerRisks.length > 0 ? "High" : "Low", 
                  desc: mixerRisks.length > 0 ? "Suspicious mixer interactions detected" : "No suspicious mixer interactions", 
                  icon: mixerRisks.length > 0 ? <AlertTriangle className='w-5 h-5 text-red-400'/> : <CheckCircle className='w-5 h-5 text-[#00C9A7]'/>, 
                  cta: null 
                },
              ];
              
              return cards.map((card, index) => (
                <motion.div
                  key={card.title}
                  whileHover={{ scale: 1.02, y: -2, boxShadow: "0 8px 25px rgba(0,0,0,0.15)" }}
                  transition={{ type: "spring", stiffness: 150, damping: 15 }}
                  className={`relative min-h-[230px] flex flex-col justify-between backdrop-blur-xl rounded-2xl p-5 border overflow-hidden ${
                    isDarkTheme 
                      ? 'bg-[rgba(20,22,40,0.8)] border-[rgba(255,255,255,0.05)]' 
                      : 'bg-[rgba(255,255,255,0.85)] border-[rgba(0,0,0,0.06)]'
                  }`}
                  style={{
                    boxShadow: isDarkTheme 
                      ? '0 4px 20px rgba(0,0,0,0.3)'
                      : '0 4px 20px rgba(0,0,0,0.08)'
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
                  <div className="flex items-center gap-2 mb-2">
                    {card.icon}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h3 className={`font-semibold underline decoration-dotted cursor-help transition-colors duration-300 ${
                            isDarkTheme ? 'text-[#E4E8F3]' : 'text-[#1B1F29]'
                          }`}>
                            {card.title}
                          </h3>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs text-xs">
                          {card.title === 'Active Risks' && 'Security issues that need your attention to improve wallet safety.'}
                          {card.title === 'Token Approvals' && 'When you connect to DeFi apps, they can spend tokens on your behalf. Guardian checks if any still have unlimited access.'}
                          {card.title === 'Mixer Exposure' && 'Checks if your wallet has interacted with privacy mixers that could flag it as high-risk.'}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div>
                    <p className={`text-2xl font-bold mb-1 tracking-tight transition-colors duration-300 ${
                      isDarkTheme ? 'text-gray-200' : 'text-[#1B1F29]'
                    }`}>
                      {card.value}
                    </p>
                    <p className={`text-sm mb-4 leading-snug transition-colors duration-300 ${
                      isDarkTheme ? 'text-[#AAB3C0]' : 'text-[#444C56]'
                    }`}>
                      {card.desc}
                    </p>
                  </div>
                  {card.cta && (
                    <DisabledTooltipButton 
                      data-guardian-button="true"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Fix risks button clicked:', card.cta);
                        if (card.cta === 'Fix Risks') {
                          setShowFixModal(true);
                        } else {
                          setActiveTab('Risks');
                        }
                      }}
                      className="w-full py-2 rounded-lg bg-gradient-to-r from-[#00B894] to-[#7B61FF] text-white font-semibold hover:opacity-90 transition-all duration-200 mt-auto"
                      aria-label={card.cta === 'Fix Risks' ? 'Fix detected security risks in this wallet' : 'Review token approvals for this wallet'}
                    >
                      {card.cta === 'Fix Risks' && wallets.length > 1 ? 'Fix Risks in Selected Wallet' : card.cta} →
                    </DisabledTooltipButton>
                  )}
                </motion.div>
              ));
            })()}
          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          className="flex justify-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <DisabledTooltipButton 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Rescan button clicked');
              handleRescan();
            }}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#00C9A7] via-[#4D8CFF] to-[#7B61FF] text-white font-medium shadow-md hover:opacity-90 hover:shadow-[0_0_15px_rgba(0,201,167,0.4)] transition-all duration-200 flex items-center gap-2"
            aria-label="Re-scan active wallet for updated risk analysis"
          >
            <motion.div
              animate={isRescanning ? { rotate: 360 } : { scale: [1, 1.1, 1] }}
              transition={{ 
                repeat: isRescanning ? Infinity : Infinity, 
                duration: isRescanning ? 1 : 2,
                ease: "easeInOut"
              }}
            >
              <Shield className="w-4 h-4" />
            </motion.div>
            {wallets.length > 1 ? 'Re-Scan This Wallet' : 'Re-Scan Wallet'}
          </DisabledTooltipButton>
        </motion.div>
        </>
        )}
      </main>
      
      {/* Fix Risk Modal */}
      {showFixModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-gray-200 border border-[rgba(255,255,255,0.1)] rounded-2xl p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-[#00C9A7] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Fix Detected Risks
              </h2>
              <DisabledTooltipButton
                onClick={() => setShowFixModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
                variant="ghost"
                size="sm"
                aria-label="Close fix risks modal"
              >
                ✕
              </DisabledTooltipButton>
            </div>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {(scanResult?.flags || []).map((flag) => (
                <div
                  key={flag.id}
                  className="bg-[rgba(20,22,40,0.8)] rounded-xl p-4 border border-[rgba(255,255,255,0.08)]"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-white">{flag.type}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          flag.severity === 'high' ? 'text-red-400 bg-red-500/20' :
                          flag.severity === 'medium' ? 'text-yellow-400 bg-yellow-500/20' :
                          'text-green-400 bg-green-500/20'
                        }`}>
                          {flag.severity}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400">
                        {flag.details || 'Security risk detected'}
                      </p>
                    </div>
                    
                    <DisabledTooltipButton
                      onClick={async () => {
                        try {
                          // Show loading state
                          console.log('Initiating revoke for:', flag.type);
                          
                          // In a real implementation, this would:
                          // 1. Get the token contract address from the flag
                          // 2. Call the token's approve() function with 0 amount
                          // 3. Wait for transaction confirmation
                          // 4. Update the UI
                          
                          // For now, simulate the process
                          alert(`This would revoke the ${flag.type} approval.\n\nIn production, this would:\n1. Open your wallet\n2. Ask you to sign a transaction\n3. Pay gas fees to revoke the approval\n4. Update your trust score`);
                          
                          // Simulate success
                          console.log('Revoke completed for:', flag.id);
                          
                        } catch (error) {
                          console.error('Revoke failed:', error);
                          alert('Revoke failed. Please try again.');
                        }
                      }}
                      className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#00C9A7] to-[#7B61FF] text-white text-sm font-medium hover:opacity-90 transition"
                      size="sm"
                      aria-label={`Revoke ${flag.type} approval to improve wallet security`}
                    >
                      Revoke
                    </DisabledTooltipButton>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-gray-700/40">
              <p className="text-sm text-gray-400">
                {(scanResult?.flags || []).length} risk{(scanResult?.flags || []).length !== 1 ? 's' : ''} detected
              </p>
              <div className="flex gap-2">
                <DisabledTooltipButton
                  onClick={() => setShowFixModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700/50 transition"
                  variant="outline"
                  aria-label="Close fix risks modal without making changes"
                >
                  Close
                </DisabledTooltipButton>
                <DisabledTooltipButton
                  onClick={async () => {
                    try {
                      const riskCount = (scanResult?.flags || []).length;
                      
                      if (confirm(`Are you sure you want to revoke all ${riskCount} approvals?\n\nThis will:\n- Open ${riskCount} wallet transactions\n- Cost gas fees for each transaction\n- Improve your wallet security`)) {
                        
                        // In production, this would batch revoke all approvals
                        alert(`This would revoke all ${riskCount} approvals.\n\nEach revoke requires:\n1. Wallet signature\n2. Gas fees\n3. Blockchain confirmation`);
                        
                        // Close modal and rescan
                        setShowFixModal(false);
                        handleRescan();
                      }
                    } catch (error) {
                      console.error('Bulk revoke failed:', error);
                      alert('Bulk revoke failed. Please try again.');
                    }
                  }}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#00C9A7] to-[#7B61FF] text-white font-medium hover:opacity-90 transition"
                  aria-label="Revoke all detected security risks at once"
                >
                  Revoke All
                </DisabledTooltipButton>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <FooterNav />
      
      {/* Onboarding Modal */}
      <Dialog open={showOnboard} onOpenChange={setShowOnboard}>
        <DialogContent className="max-w-md text-center bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-gray-200 border-[rgba(255,255,255,0.1)]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold text-[#00C9A7] flex items-center justify-center gap-2">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                🛡️
              </motion.div>
              Welcome to Guardian
            </DialogTitle>
          </DialogHeader>
          <p className="mt-2 text-sm text-gray-400">
            Guardian scans your wallet for hidden risks — like old approvals or shady contracts.
            Everything runs read-only; no funds ever move without your consent.
          </p>
          <DisabledTooltipButton
            onClick={() => {
              setShowOnboard(false);
              localStorage.setItem('guardian_onboard_seen', '1');
            }}
            className="mt-4 bg-gradient-to-r from-[#00C9A7] to-[#7B61FF] px-4 py-2 rounded-xl text-white font-medium hover:opacity-90 transition"
            aria-label="Start your first Guardian security scan"
          >
            🚀 Run My First Scan
          </DisabledTooltipButton>
        </DialogContent>
      </Dialog>
      
      {/* Add Wallet Modal */}
      <AddWalletModal
        isOpen={showAddWalletModal}
        onClose={() => {
          console.log('Closing AddWalletModal');
          setShowAddWalletModal(false);
        }}
        onWalletAdded={handleWalletAdded}
      />
    </div>
  );
}

export default GuardianEnhanced;
