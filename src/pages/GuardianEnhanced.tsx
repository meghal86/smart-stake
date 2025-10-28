'use client';

import { useState, useEffect } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useGuardianScan } from '@/hooks/useGuardianScan';
import { chainIdToName } from '@/config/wagmi';
import { toast } from 'sonner';
import { FooterNav } from '@/components/layout/FooterNav';

// Contexts
import { useUserModeContext } from '@/contexts/UserModeContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';

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

  // Get network name
  const networkName = chain?.id ? chainIdToName[chain.id] || 'ethereum' : 'ethereum';
  
  // Use demo address if in demo mode
  const activeAddress = demoMode ? demoAddress : address;
  const isActive = demoMode ? !!demoAddress : isConnected;
  
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

  // Add notification when scan completes
  useEffect(() => {
    if (scanResult) {
      const flagCount = scanResult.flags?.length || 0;
      
      if (flagCount === 0) {
        toast.success('✅ All Clear! Your wallet is secure');
        awardXP(100, 'Perfect security score');
      } else {
        toast.warning(`⚠️ Found ${flagCount} potential ${flagCount === 1 ? 'risk' : 'risks'}`);
      }
      
      awardXP(50, 'Completed security scan');
    }
  }, [scanResult]);

  // Exit demo mode handler
  const handleExitDemo = () => {
    setDemoMode(false);
    setDemoAddress(null);
    toast.success('Demo Mode Exited');
  };

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
                <motion.button
                  onClick={() => setIsDarkTheme(!isDarkTheme)}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isDarkTheme 
                      ? 'bg-white/10 hover:bg-white/15' 
                      : 'bg-gray-100/80 hover:bg-gray-200/80'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isDarkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </motion.button>
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
                  <button 
                    onClick={openConnectModal}
                    className="w-full sm:w-auto px-4 py-2 rounded-lg bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] text-white font-medium shadow-md hover:opacity-90 transition relative z-20 cursor-pointer"
                    style={{ pointerEvents: 'auto' }}
                  >
                    Connect Wallet
                  </button>
                )}
              </ConnectButton.Custom>
              <button 
                onClick={handleDemoMode}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg border transition-all duration-300 relative z-20 cursor-pointer ${
                  isDarkTheme
                    ? 'border-[rgba(255,255,255,0.1)] text-gray-300 hover:bg-[rgba(255,255,255,0.05)]'
                    : 'border-[rgba(0,0,0,0.08)] text-[#444C56] hover:bg-gray-100'
                }`}
                style={{ pointerEvents: 'auto' }}
              >
                ✨ Try Demo Mode
              </button>
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
            
            <div className="flex items-center gap-3">
              {demoMode && (
                <button
                  onClick={handleExitDemo}
                  className={`px-2 py-1 rounded-lg text-xs font-medium hover:opacity-80 transition-opacity ${
                    isDarkTheme ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                  }`}
                >
                  Demo Mode (Exit)
                </button>
              )}
              
              <p className={`text-xs transition-colors duration-300 ${
                isDarkTheme ? 'text-gray-400' : 'text-[#7C8896]'
              }`}>
                Updated just now
              </p>
              
              <div className="flex items-center gap-3">
                <motion.button
                  onClick={() => setIsDarkTheme(!isDarkTheme)}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isDarkTheme 
                      ? 'bg-white/10 hover:bg-white/15' 
                      : 'bg-gray-100/80 hover:bg-gray-200/80'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isDarkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </motion.button>
                
                <div className="flex gap-2 text-sm">
                  <button 
                    onClick={demoMode ? handleExitDemo : handleDemoMode}
                    className={`px-3 py-1 rounded-lg border transition-all duration-300 ${
                      demoMode
                        ? 'bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] text-white font-medium shadow-sm'
                        : isDarkTheme
                          ? 'border-[rgba(255,255,255,0.1)] text-gray-300 hover:bg-[rgba(255,255,255,0.05)]'
                          : 'border-[rgba(0,0,0,0.08)] text-[#444C56] hover:bg-gray-100'
                    }`}
                  >
                    {demoMode ? 'Exit Demo' : 'Demo'}
                  </button>
                  <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                      <button 
                        onClick={openConnectModal}
                        className={`px-3 py-1 rounded-lg border transition-all duration-300 flex items-center gap-1 ${
                          isConnected && !demoMode
                            ? 'bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] text-white font-medium shadow-sm'
                            : isDarkTheme
                              ? 'border-[rgba(255,255,255,0.1)] text-gray-300 hover:bg-[rgba(255,255,255,0.05)]'
                              : 'border-[rgba(0,0,0,0.08)] text-[#444C56] hover:bg-gray-100'
                        }`}
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
                      </button>
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
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative px-2 py-1 transition-all duration-200 ${
                  activeTab === tab ? 'text-[#00C9A7]' : ''
                }`}
                whileHover={{ scale: 1.05 }}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#00C9A7] to-[#7B61FF]"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            ))}
          </nav>
        </div>
      </motion.header>

      <main className="px-4 pt-32 pb-28 max-w-2xl mx-auto space-y-6 relative z-10">
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
              <button
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs bg-[#00C9A7]/10 text-[#00C9A7] hover:bg-[#00C9A7]/20 transition"
              >
                <Brain className="w-3 h-3" /> Digest
              </button>
            </div>
            <button 
              onClick={() => setShowLearnMore(!showLearnMore)}
              className={`text-xs hover:text-[#00C9A7] transition-colors duration-300 ${
                isDarkTheme ? 'text-gray-400' : 'text-[#7C8896]'
              }`}
            >
              {showLearnMore ? 'Hide details' : 'ⓘ Learn More'}
            </button>
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
            {[
              { title: "Active Risks", value: "2", desc: "Detected issues • Fix with one tap", icon: <Wrench className='w-5 h-5 text-[#7B61FF]'/>, cta: "Fix Risks" },
              { title: "Token Approvals", value: "2 unlimited", desc: "Approvals found across contracts", icon: <Shield className='w-5 h-5 text-blue-400'/>, cta: "Review" },
              { title: "Mixer Exposure", value: "Low", desc: "No suspicious mixer interactions", icon: <CheckCircle className='w-5 h-5 text-[#00C9A7]'/>, cta: null },
            ].map((card, index) => (
            <motion.div
              key={card.title}
              whileHover={{ scale: 1.02, y: -2, boxShadow: "0 8px 25px rgba(0,0,0,0.15)" }}
              transition={{ type: "spring", stiffness: 150, damping: 15 }}
              className={`relative min-h-[230px] flex flex-col justify-between backdrop-blur-xl rounded-2xl p-5 border overflow-hidden cursor-pointer ${
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
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-2 rounded-lg bg-gradient-to-r from-[#00B894] to-[#7B61FF] text-white font-semibold hover:opacity-90 hover:shadow-[0_0_10px_rgba(0,201,167,0.4)] hover:ring-2 hover:ring-[#00C9A7]/30 transition-all duration-200 mt-auto"
                >
                  {card.cta} →
                </motion.button>
              )}
            </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <motion.div
          className="flex justify-center mt-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <button 
            onClick={handleRescan}
            className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#00C9A7] via-[#4D8CFF] to-[#7B61FF] text-white font-medium shadow-md hover:opacity-90 hover:shadow-[0_0_15px_rgba(0,201,167,0.4)] transition-all duration-200 flex items-center gap-2"
            aria-label="Re-scan wallet for updated risk analysis"
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
            Re-Scan Wallet
          </button>
        </motion.div>
      </main>
      
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
          <button
            onClick={() => {
              setShowOnboard(false);
              localStorage.setItem('guardian_onboard_seen', '1');
            }}
            className="mt-4 bg-gradient-to-r from-[#00C9A7] to-[#7B61FF] px-4 py-2 rounded-xl text-white font-medium hover:opacity-90 transition"
          >
            🚀 Run My First Scan
          </button>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default GuardianEnhanced;

