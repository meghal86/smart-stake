import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  Shield, 
  RefreshCw, 
  Wrench, 
  TrendingUp,
  Plus,
  Brain,
  Sun,
  Moon,
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
import { WalletScopeHeader } from '@/components/guardian/WalletScopeHeader';
import AddWalletModal from '@/components/guardian/AddWalletModal';
import { useGuardianScan } from '@/hooks/useGuardianScan';
import { useWalletRegistry } from '@/hooks/useWalletRegistry';
import { chainIdToName } from '@/config/wagmi';
import { buildDemoGuardianScanResult, requestGuardianScan } from '@/services/guardianService';
import { toast } from 'sonner';
import { FooterNav } from '@/components/layout/FooterNav';
import {
  ContextualGuideDrawer,
  type GuardianGuideContext,
} from '@/components/copilot/ContextualGuideDrawer';

// Contexts
import { useUserModeContext } from '@/contexts/UserModeContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useWallet as useWalletContext } from '@/contexts/WalletContext';

interface WalletScanSummary {
  trustScore?: number;
  riskCount?: number;
  lastScan?: string;
}

function formatFreshness(isoTimestamp?: string) {
  if (!isoTimestamp) return 'No completed scan yet';

  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000));

  if (diffMinutes < 1) return 'Updated just now';
  if (diffMinutes < 60) return `Updated ${diffMinutes}m ago`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `Updated ${diffHours}h ago`;

  return `Updated ${Math.floor(diffHours / 24)}d ago`;
}

function buildLinePath(points: number[], width: number, height: number) {
  if (points.length === 0) return '';

  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = Math.max(max - min, 1);

  return points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const y = height - ((point - min) / range) * height;
      return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function buildAreaPath(points: number[], width: number, height: number) {
  const linePath = buildLinePath(points, width, height);
  if (!linePath) return '';
  return `${linePath} L ${width} ${height} L 0 ${height} Z`;
}


export function GuardianEnhanced() {
  const { address, isConnected, chain } = useAccount();
  const { setActiveWallet: setContextActiveWallet, activeWallet: contextActiveWallet } = useWalletContext();
  const { wallets: registryWallets } = useWalletRegistry();
  const { mode, setMode, isBeginner, isExpert } = useUserModeContext();
  const notifications = useNotificationContext();
  const { actualTheme, setTheme } = useTheme();
  const isDarkTheme = actualTheme === 'dark';
  const setIsDarkTheme = (dark: boolean) => setTheme(dark ? 'dark' : 'light');
  const pageShellClass = isDarkTheme ? 'bg-[#030303] text-[#f5f2ea]' : 'bg-[#f3f1ed] text-[#111111]';
  const pageOverlayClass = isDarkTheme
    ? 'from-[#17345e]/10 via-transparent to-[#1b2d22]/8'
    : 'from-[#ffffff] via-transparent to-[#e9edf5]/32';
  const panelClass = isDarkTheme
    ? 'border border-white/8 bg-[#0a0a0a] text-[#f5f2ea] shadow-[0_20px_60px_rgba(0,0,0,0.22)]'
    : 'border border-black/8 bg-white/88 text-[#111111] shadow-[0_16px_40px_rgba(0,0,0,0.04)]';
  const mutedPanelClass = isDarkTheme
    ? 'border border-white/6 bg-[#0d0d0d]'
    : 'border border-black/6 bg-[#f8f7f4]';
  const chipClass = isDarkTheme
    ? 'border border-white/10 bg-[#111111] text-[#9f9b93]'
    : 'border border-black/8 bg-[#f2f1ed] text-[#7a766e]';
  const bodyTextClass = isDarkTheme ? 'text-[#a5a198]' : 'text-[#66635d]';
  const mutedTextClass = isDarkTheme ? 'text-[#7b776e]' : 'text-[#8c877f]';
  const titleTextClass = isDarkTheme ? 'text-[#f7f3ec]' : 'text-[#111111]';
  const accentTextClass = isDarkTheme ? 'text-[#8ab4ff]' : 'text-[#345ba6]';
  const accentPanelClass = isDarkTheme
    ? 'border border-[#2e4f8f] bg-[#101929] text-[#d9e5ff]'
    : 'border border-[#c9d7f3] bg-[#edf3ff] text-[#345ba6]';
  const deepPanelClass = isDarkTheme
    ? 'bg-[#050505] text-[#f7f3ec]'
    : 'bg-[#111111] text-[#f7f3ec]';
  const heroPanelClass = isDarkTheme
    ? 'border border-white/8 bg-[#080808] text-[#f7f3ec] shadow-[0_24px_70px_rgba(0,0,0,0.24)]'
    : 'border border-black/8 bg-white text-[#111111] shadow-[0_24px_60px_rgba(0,0,0,0.05)]';
  const sunnyPanelClass = isDarkTheme
    ? 'border border-[#314f85] bg-gradient-to-br from-[#21365c] to-[#2b4675] text-[#f5f8ff]'
    : 'border border-[#d8e2f3] bg-gradient-to-br from-[#708bc0] to-[#4a6394] text-white';
  const selectedRowClass = isDarkTheme
    ? 'bg-[#111111] border border-white/10'
    : 'bg-white border border-black/10';
  const idleRowClass = isDarkTheme
    ? 'bg-[#0b0b0b] hover:bg-[#111111]'
    : 'bg-[#f7f6f3] hover:bg-white';
  const headerClass = isDarkTheme
    ? 'border-white/6 bg-[#050505]/92'
    : 'border-black/8 bg-[#f3f1ed]/92';
  const warningPanelClass = isDarkTheme
    ? 'border border-[#5d5034] bg-[#17130b] text-[#e5cf93]'
    : 'border border-[#e4d5a9] bg-[#faf5df] text-[#8e7231]';
  const dangerPanelClass = isDarkTheme
    ? 'border border-[#5a3a40] bg-[#150d0f] text-[#ddb8bf]'
    : 'border border-[#ecd1d6] bg-[#fbf1f4] text-[#a66372]';
  const ctaButtonClass = 'rounded-2xl px-4 py-3 text-sm font-semibold transition hover:translate-y-[-1px]';
  const primaryButtonClass = `${ctaButtonClass} bg-white text-black hover:bg-[#ece9e2] dark:bg-white dark:text-black dark:hover:bg-[#e9e5de]`;
  const secondaryButtonClass = `${ctaButtonClass} border ${isDarkTheme ? 'border-white/10 bg-[#0f0f0f] text-[#f0ece4] hover:bg-[#151515]' : 'border-black/10 bg-white text-[#44423d] hover:bg-[#f3f1ed]'}`;
  const scoreIndicatorClass = (score?: number | null) => {
    if (score == null) return 'bg-gray-400';
    if (score >= 80) return isDarkTheme ? 'bg-[#4c7fd7]' : 'bg-[#4c7fd7]';
    if (score >= 60) return isDarkTheme ? 'bg-[#d8b56c]' : 'bg-[#c79d46]';
    return isDarkTheme ? 'bg-[#b88d95]' : 'bg-[#8a6469]';
  };
  const scoreTextClass = (score?: number | null) => {
    if (score == null) return 'text-gray-400';
    if (score >= 80) return isDarkTheme ? 'text-[#9fc0ff]' : 'text-[#345ba6]';
    if (score >= 60) return isDarkTheme ? 'text-[#e5cf93]' : 'text-[#8e7231]';
    return isDarkTheme ? 'text-[#d6b9be]' : 'text-[#8a6469]';
  };
  const [activeTab, setActiveTab] = useState('Scan');
  const [demoMode, setDemoMode] = useState(false);
  const [demoAddress, setDemoAddress] = useState<string | null>(null);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [showOnboard, setShowOnboard] = useState(false);
  const [showAddWalletModal, setShowAddWalletModal] = useState(false);
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [showGuideDrawer, setShowGuideDrawer] = useState(false);
  const [activeWalletIndex, setActiveWalletIndex] = useState(0);
  const [walletScanSummaries, setWalletScanSummaries] = useState<Record<string, WalletScanSummary>>({});

  const wallets = useMemo(() => {
    const byAddress = new Map<string, {
      address: string;
      label: string;
      trustScore?: number;
      riskCount?: number;
      lastScan?: string;
    }>();

    registryWallets.forEach((wallet) => {
      const key = wallet.address.toLowerCase();
      const summary = walletScanSummaries[key];
      const storedScores = wallet.guardian_scores && typeof wallet.guardian_scores === 'object'
        ? Object.values(wallet.guardian_scores as Record<string, unknown>).find((value) => typeof value === 'number')
        : undefined;

      byAddress.set(key, {
        address: wallet.address,
        label: wallet.label || `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}`,
        trustScore: summary?.trustScore ?? (typeof storedScores === 'number' ? storedScores : undefined),
        riskCount: summary?.riskCount,
        lastScan: summary?.lastScan,
      });
    });

    return Array.from(byAddress.values());
  }, [registryWallets, walletScanSummaries]);

  // Get network name
  const networkName = chain?.id ? chainIdToName[chain.id] || 'ethereum' : 'ethereum';
  
  // Get active wallet safely
  const activeWallet = wallets.length > 0 ? wallets[activeWalletIndex] : null;
  const activeAddress = demoMode ? demoAddress : (activeWallet?.address || address);
  const isActive = demoMode ? !!demoAddress : (!!activeWallet || isConnected);

  // Switch wallet handler
  const handleSwitchWallet = (index: number) => {
    const nextWallet = wallets[index];
    setActiveWalletIndex(index);
    setShowWalletDropdown(false);
    if (nextWallet) {
      setContextActiveWallet(nextWallet.address);
    }
  };

  const handleWalletAdded = useCallback((wallet: { address: string }) => {
    const normalized = wallet.address.toLowerCase();
    const index = registryWallets.findIndex(w => w.address.toLowerCase() === normalized);
    if (index >= 0) {
      setActiveWalletIndex(index);
      setContextActiveWallet(wallet.address);
    } else if (registryWallets.length > 0) {
      setActiveWalletIndex(registryWallets.length - 1);
    }
  }, [registryWallets, setContextActiveWallet]);

  useEffect(() => {
    if (wallets.length === 0) {
      setActiveWalletIndex(0);
      return;
    }

    if (contextActiveWallet) {
      const contextIndex = wallets.findIndex((wallet) => wallet.address.toLowerCase() === contextActiveWallet.toLowerCase());
      if (contextIndex >= 0 && contextIndex !== activeWalletIndex) {
        setActiveWalletIndex(contextIndex);
        return;
      }
    }

    if (activeWalletIndex >= wallets.length) {
      const nextIndex = Math.max(wallets.length - 1, 0);
      if (nextIndex !== activeWalletIndex) {
        setActiveWalletIndex(nextIndex);
      }
    }
  }, [wallets, activeWalletIndex, contextActiveWallet]);

  // Update wallet data after scan
  // Guardian scan hook
  const {
    data: liveScanResult,
    isLoading,
    error: scanError,
    rescan,
    isRescanning
  } = useGuardianScan({
    walletAddress: activeAddress || undefined,
    network: networkName,
    enabled: isActive && !!activeAddress,
    scope: 'explicit',
  });

  // Achievement state (simplified)
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);



  const demoScanResult = useMemo(() => {
    if (!demoMode || !activeAddress) return undefined;
    return buildDemoGuardianScanResult(activeAddress);
  }, [demoMode, activeAddress]);

  const scanResult = demoScanResult ?? liveScanResult;

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
      
      setWalletScanSummaries((prev) => ({
        ...prev,
        [activeAddress.toLowerCase()]: {
          trustScore: scanResult.trustScorePercent,
          riskCount: flagCount,
          lastScan: scanResult.scannedAt,
        },
      }));
      
      if (!demoMode && flagCount === 0) {
        toast.success('✅ All Clear! Your wallet is secure');
        awardXP(100, 'Perfect security score');
      } else if (!demoMode) {
        toast.warning(`⚠️ Found ${flagCount} potential ${flagCount === 1 ? 'risk' : 'risks'}`);
      }
      
      if (!demoMode) {
        awardXP(50, 'Completed security scan');
      }
    }
  }, [scanResult, activeAddress, demoMode]);

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
    if (demoMode) {
      toast.success('Demo scan refreshed.');
      return;
    }

    try {
      await rescan();
      toast.success('Rescan complete!');
      awardXP(25, 'Rescanned wallet');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Rescan failed. Please try again.');
    }
  };

  const handleScanAllWallets = async () => {
    if (wallets.length === 0 || demoMode) return;

    toast.info(`Scanning ${wallets.length} wallet${wallets.length === 1 ? '' : 's'}...`);

    try {
      const results = await Promise.all(
        wallets.map(async (wallet) => {
          const result = await requestGuardianScan({
            walletAddress: wallet.address,
            network: networkName,
          });

          return {
            address: wallet.address.toLowerCase(),
            summary: {
              trustScore: result.trustScorePercent,
              riskCount: result.flags.length,
              lastScan: result.scannedAt,
            },
          };
        })
      );

      setWalletScanSummaries((prev) => {
        const next = { ...prev };
        results.forEach(({ address, summary }) => {
          next[address] = summary;
        });
        return next;
      });

      toast.success('Scan all complete.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to scan all wallets right now.');
    }
  };





  const activeSummary = activeAddress ? walletScanSummaries[activeAddress.toLowerCase()] : undefined;
  const lastUpdatedLabel = formatFreshness(scanResult?.scannedAt || activeSummary?.lastScan);
  const freshnessDetail = lastUpdatedLabel.startsWith('Updated ')
    ? lastUpdatedLabel.slice('Updated '.length)
    : lastUpdatedLabel;
  const trustScore = scanResult?.trustScorePercent ?? null;
  const flagCount = scanResult?.flags?.length ?? 0;
  const healthBand = trustScore === null
    ? 'Scan required'
    : trustScore >= 85
      ? 'Bright'
      : trustScore >= 70
        ? 'Steady'
        : 'Needs a lift';
  const healthHeadline = trustScore === null
    ? 'Start with one easy check-in.'
    : trustScore >= 85
      ? 'Everything looks clear for today.'
      : trustScore >= 70
        ? 'A couple of things want a quick tidy-up.'
        : 'A short cleanup will make this wallet feel lighter.';
  const healthMessage = trustScore === null
    ? 'Run a first scan and Guardian will turn this into a simple daily read instead of a wall of security jargon.'
    : flagCount === 0
      ? 'No active issues were found in the latest pass. You can move with more confidence and refresh after new approvals or contract interactions.'
      : `${flagCount} active ${flagCount === 1 ? 'issue is' : 'issues are'} shaping today’s reading. Start with the biggest one and the rest gets easier fast.`;
  const primaryCareAction = trustScore === null
    ? 'Run first scan'
    : flagCount === 0
      ? 'Keep the good streak'
      : flagCount > 2
        ? 'Start a quick tidy-up'
        : 'Review the next best fix';
  const approvalRiskCount = scanResult?.flags?.filter((flag) => flag.type.toLowerCase().includes('approval')).length ?? 0;
  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    const salutation = hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening';
    const subject = activeWallet?.label || (activeAddress ? `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}` : 'there');
    return `${salutation}, ${subject}`;
  }, [activeAddress, activeWallet?.label]);
  const guideContext = useMemo<GuardianGuideContext>(
    () => ({
      walletLabel: activeWallet?.label || (activeAddress ? `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}` : 'Current wallet'),
      trustScore,
      flagCount,
      approvalRiskCount,
      freshnessLabel: freshnessDetail,
      primaryAction: primaryCareAction,
      isDemo: demoMode,
    }),
    [activeWallet?.label, activeAddress, trustScore, flagCount, approvalRiskCount, freshnessDetail, primaryCareAction, demoMode]
  );
  const trendPoints = useMemo(() => {
    const base = trustScore ?? 68;
    const dip = Math.max(4, flagCount * 3);
    return [
      Math.min(98, base + 4),
      Math.min(98, base + 3),
      Math.min(98, base + 3),
      Math.max(24, base - dip + 2),
      Math.max(24, base - dip - 2),
      Math.max(24, base - dip),
      Math.min(98, base - 1),
      Math.min(98, base),
      Math.min(98, base),
    ];
  }, [flagCount, trustScore]);
  const trendLinePath = useMemo(() => buildLinePath(trendPoints, 720, 180), [trendPoints]);
  const trendAreaPath = useMemo(() => buildAreaPath(trendPoints, 720, 180), [trendPoints]);
  const topFindings = useMemo(() => (scanResult?.flags || []).slice(0, 4), [scanResult?.flags]);
  const topApprovals = useMemo(() => (scanResult?.approvals || []).slice(0, 4), [scanResult?.approvals]);

  // Welcome screen (not connected)
  if (!isActive && !demoMode) {
    return (
      <div className="min-h-screen relative overflow-hidden transition-colors duration-500 bg-white dark:bg-gradient-to-b dark:from-[#0A0E1A] dark:to-[#111827] bg-gradient-to-b from-[#FFFFFF] to-[#F9FAFB] text-slate-900 dark:text-[#1B1F29]">
        {/* Whale Pulse Background Animation - Theme Aware */}
        <motion.div
          className="absolute inset-0 pointer-events-none dark:block hidden"
          animate={{
            background: [
              'radial-gradient(circle at 30% 40%, rgba(0,245,160,0.08) 0%, transparent 50%)',
              'radial-gradient(circle at 70% 60%, rgba(123,97,255,0.06) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 30%, rgba(0,245,160,0.04) 0%, transparent 50%)',
              'radial-gradient(circle at 30% 70%, rgba(123,97,255,0.08) 0%, transparent 50%)',
              'radial-gradient(circle at 30% 40%, rgba(0,245,160,0.08) 0%, transparent 50%)'
            ]
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute inset-0 pointer-events-none dark:hidden block"
          animate={{
            background: [
              'radial-gradient(circle at 30% 40%, rgba(94,125,118,0.08) 0%, transparent 50%)',
              'radial-gradient(circle at 70% 60%, rgba(143,177,167,0.05) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 30%, rgba(94,125,118,0.05) 0%, transparent 50%)',
              'radial-gradient(circle at 30% 70%, rgba(143,177,167,0.07) 0%, transparent 50%)',
              'radial-gradient(circle at 30% 40%, rgba(94,125,118,0.08) 0%, transparent 50%)'
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
          className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${headerClass}`}
          style={{
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
          }}
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          <div className="max-w-screen-xl mx-auto px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src="/header.png" alt="Logo" className="w-8 h-8" />
                <Shield className={`w-6 h-6 ${accentTextClass}`} />
                <div>
                  <h1 className={`text-xl font-semibold tracking-tight transition-colors duration-300 ${titleTextClass}`}>
                    Guardian
                  </h1>
                  <p className={`text-xs leading-snug ${bodyTextClass}`}>
                    Clean wallet oversight with no dashboard noise.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <DisabledTooltipButton
                  onClick={() => setIsDarkTheme(!isDarkTheme)}
                  className={`p-2 rounded-lg transition-all duration-200 ${
                    isDarkTheme ? 'bg-[#252d2e] hover:bg-[#2d3839]' : 'bg-[#eef2ee] hover:bg-[#e4ebe6]'
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

        <main className="px-4 pt-32 pb-28 max-w-6xl mx-auto relative z-10">
          <motion.div
            className={`grid gap-8 rounded-[32px] p-6 md:grid-cols-[1.15fr_0.85fr] md:p-8 ${panelClass}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-[20px] ${accentPanelClass}`}>
                  <Shield className="h-7 w-7" />
                </div>
                <div>
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${mutedTextClass}`}>
                    Guardian
                  </p>
                  <h2 className={`text-4xl font-semibold tracking-tight ${titleTextClass}`} style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}>
                    Welcome to Guardian
                  </h2>
                </div>
              </div>

              <p className={`max-w-xl text-base leading-7 ${bodyTextClass}`}>
                One quiet surface, one honest reading, one next step. The goal is clarity, not decoration.
              </p>

              <div className="flex flex-wrap gap-3">
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <DisabledTooltipButton
                      onClick={openConnectModal}
                      className={primaryButtonClass}
                      aria-label="Connect your wallet to start security scan"
                    >
                      Connect Wallet
                    </DisabledTooltipButton>
                  )}
                </ConnectButton.Custom>
                <DisabledTooltipButton
                  onClick={handleDemoMode}
                  className={secondaryButtonClass}
                  variant="outline"
                  aria-label="Try Guardian demo mode with sample wallet data"
                >
                  Try Demo Mode
                </DisabledTooltipButton>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['Overview first', 'Lead with the state of the wallet before the details.'],
                  ['Minimal chrome', 'Thin borders, restrained color, and clean hierarchy.'],
                  ['Fast action', 'Find the one thing to do next without hunting.'],
                ].map(([title, description]) => (
                  <div key={title} className={`rounded-[22px] p-4 ${mutedPanelClass}`}>
                    <p className={`text-sm font-semibold ${titleTextClass}`}>{title}</p>
                    <p className={`mt-2 text-sm leading-6 ${bodyTextClass}`}>{description}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className={`flex flex-col justify-between rounded-[28px] p-6 ${deepPanelClass}`}>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[#c7d5d1]">
                  Reference Direction
                </p>
                <h3 className="mt-3 text-3xl font-semibold tracking-tight" style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}>
                  Closer to Origin than a crypto app
                </h3>
                <p className="mt-4 text-sm leading-7 text-[#d6dfdc]">
                  Clean black surfaces, editorial headlines, subtle utility cards, and almost no ornamental color.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  ['Quiet signal', 'A single trustworthy reading with freshness and confidence.'],
                  ['Useful rail', 'Small side cards that add context without clutter.'],
                  ['Structured depth', 'Large primary surface, compact secondary surfaces.'],
                ].map(([title, description]) => (
                  <div key={title} className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="mt-2 text-sm leading-6 text-[#d6dfdc]">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </main>
        
        <FooterNav />
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${pageShellClass}`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${pageOverlayClass} pointer-events-none`} />
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
          background: [
            'radial-gradient(circle at 14% 18%, rgba(67,103,170,0.18) 0%, transparent 34%), radial-gradient(circle at 84% 16%, rgba(80,96,140,0.14) 0%, transparent 32%)',
            'radial-gradient(circle at 78% 30%, rgba(67,103,170,0.16) 0%, transparent 40%), radial-gradient(circle at 22% 78%, rgba(37,54,89,0.18) 0%, transparent 28%)',
            'radial-gradient(circle at 45% 12%, rgba(43,58,94,0.12) 0%, transparent 36%), radial-gradient(circle at 72% 72%, rgba(80,96,140,0.14) 0%, transparent 30%)',
            'radial-gradient(circle at 14% 18%, rgba(67,103,170,0.18) 0%, transparent 34%), radial-gradient(circle at 84% 16%, rgba(80,96,140,0.14) 0%, transparent 32%)'
          ],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      
      {/* Header */}
        <motion.header
        className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-colors duration-300 ${headerClass}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="max-w-screen-xl mx-auto px-4 py-4 flex flex-col gap-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <img src="/header.png" alt="Logo" className="w-8 h-8" />
              <div className="flex items-center gap-2">
                <h1 className={`text-2xl font-semibold tracking-tight transition-colors duration-300 ${titleTextClass}`} style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}>
                  Guardian
                </h1>
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                >
                  <Brain className={`w-4 h-4 ${accentTextClass}`} />
                </motion.div>
              </div>
              
              {/* Multi-Wallet Dropdown */}
              {(wallets.length > 0 || activeAddress) && (
                <div className="relative">
                  <DisabledTooltipButton
                    onClick={() => setShowWalletDropdown(!showWalletDropdown)}
                    className={`flex items-center gap-2 rounded-2xl px-3 py-2 transition-all duration-300 ${secondaryButtonClass}`}
                    variant="outline"
                    size="sm"
                    aria-label="Select active wallet for security scan"
                  >
                    <Wallet className="w-3 h-3" />
                    <span className="text-xs font-mono">
                      {activeAddress ? `${activeAddress.slice(0, 6)}...${activeAddress.slice(-4)}` : 'No Wallet'}
                    </span>
                    {activeWallet?.trustScore && (
                      <span className={`w-2 h-2 rounded-full ${scoreIndicatorClass(activeWallet.trustScore)}`} />
                    )}
                    <ChevronDown className="w-3 h-3" />
                  </DisabledTooltipButton>
                  
                  {/* Wallet Dropdown */}
                  {showWalletDropdown && (
                    <div className={`fixed inset-x-4 top-[88px] mt-2 rounded-[24px] z-50 lg:absolute lg:inset-x-auto lg:left-0 lg:top-full lg:w-80 ${panelClass}`}>
                      <div className="p-3">
                        <h3 className={`text-sm font-semibold mb-3 ${titleTextClass}`}>
                          My Wallets
                        </h3>
                        
                        {wallets.map((wallet, index) => (
                          <InteractiveDiv
                            key={wallet.address}
                            onClick={() => handleSwitchWallet(index)}
                            className={`w-full flex items-center justify-between p-2 rounded-lg mb-2 transition-all ${
                              index === activeWalletIndex
                                ? selectedRowClass
                                : idleRowClass
                            }`}
                            ariaLabel={`Switch to wallet ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)} with trust score ${wallet.trustScore || 'unknown'}`}
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${scoreIndicatorClass(wallet.trustScore)}`} />
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
                                <p className={`text-xs font-semibold ${scoreTextClass(wallet.trustScore)}`}>
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
                            setShowWalletDropdown(false);
                            setShowAddWalletModal(true);
                          }}
                            className={`w-full flex items-center gap-2 p-2 rounded-2xl border-2 border-dashed transition-all ${
                              isDarkTheme
                                ? 'border-[#3b4546] text-[#b9c8c3] hover:border-[#8fb1a7] hover:text-[#9ec0b3]'
                                : 'border-[#d8dfdb] text-[#60726f] hover:border-[#8fb1a7] hover:text-[#5e7d76]'
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
            
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              {demoMode && (
                <DisabledTooltipButton
                  onClick={handleExitDemo}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${warningPanelClass}`}
                  variant="ghost"
                  size="sm"
                  aria-label="Exit demo mode and return to normal Guardian interface"
                >
                  Demo Mode (Exit)
                </DisabledTooltipButton>
              )}
              
              <p className={`text-xs uppercase tracking-[0.18em] transition-colors duration-300 ${mutedTextClass}`}>
                {lastUpdatedLabel}
              </p>
              
              <div className="flex flex-wrap items-center gap-2">
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
                
                <div className="flex flex-wrap gap-2 text-sm">
                  <DisabledTooltipButton 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowAddWalletModal(true);
                    }}
                    className={`flex items-center gap-1 ${secondaryButtonClass}`}
                    variant="outline"
                    size="sm"
                    aria-label="Add a new wallet to Guardian for security monitoring"
                  >
                    <Plus className="w-3 h-3" />
                    Add Wallet
                  </DisabledTooltipButton>
                  <DisabledTooltipButton 
                    onClick={demoMode ? handleExitDemo : handleDemoMode}
                    className={demoMode ? primaryButtonClass : secondaryButtonClass}
                    variant={demoMode ? "default" : "outline"}
                    size="sm"
                    aria-label={demoMode ? "Exit demo mode" : "Enter demo mode with sample wallet data"}
                  >
                    {demoMode ? 'Exit Demo' : 'Demo'}
                  </DisabledTooltipButton>
                  {!isConnected && !demoMode && wallets.length === 0 && (
                    <ConnectButton.Custom>
                      {({ openConnectModal }) => (
                        <DisabledTooltipButton
                          onClick={openConnectModal}
                          className={`flex items-center gap-1 ${secondaryButtonClass}`}
                          variant="outline"
                          size="sm"
                          aria-label="Connect your wallet to Guardian"
                        >
                          Connect
                        </DisabledTooltipButton>
                      )}
                    </ConnectButton.Custom>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row - Filter Tabs */}
          <nav className={`flex items-center gap-2 overflow-x-auto scrollbar-none rounded-full p-1 ${mutedPanelClass}`}>
            {['Scan', 'Risks', 'Alerts', 'History'].map((tab) => (
              <DisabledTooltipButton
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative rounded-full px-4 py-2 transition-all duration-200 ${
                  activeTab === tab
                    ? isDarkTheme
                      ? 'bg-[#8fb1a7] text-[#12201d]'
                      : 'bg-[#344745] text-[#eef3f0]'
                    : mutedTextClass
                }`}
                variant="ghost"
                size="sm"
                aria-label={`Switch to ${tab} tab`}
              >
                {tab}
              </DisabledTooltipButton>
            ))}
          </nav>
        </div>
      </motion.header>

      <main className="px-4 pt-44 pb-28 max-w-6xl mx-auto space-y-6 relative z-10 lg:pt-32">
        {!!scanError && !demoMode && (
          <div className={`rounded-[24px] px-4 py-4 ${dangerPanelClass}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">Guardian scan unavailable</p>
                <p className="text-sm opacity-90">
                  {scanError instanceof Error ? scanError.message : 'We could not refresh this wallet right now.'}
                </p>
              </div>
              <DisabledTooltipButton
                onClick={handleRescan}
                className="shrink-0 rounded-full border border-current/20 px-3 py-1 text-sm font-medium hover:bg-current/10"
                variant="ghost"
                size="sm"
              >
                Retry
              </DisabledTooltipButton>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'Risks' && <RisksTab walletAddress={activeAddress || undefined} />}
        {activeTab === 'Alerts' && <AlertsTab walletAddress={activeAddress || undefined} />}
        {activeTab === 'History' && <HistoryTab walletAddress={activeAddress || undefined} />}
        
        {/* Scan Tab Content */}
        {activeTab === 'Scan' && (
        <>
        <div className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${mutedTextClass}`}>
                Guardian Overview
              </p>
              <h2 className={`mt-2 text-3xl font-semibold tracking-tight ${titleTextClass}`} style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}>
                {greeting}
              </h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {['Overview', 'Health', 'Exposure'].map((item, index) => (
                <div
                  key={item}
                  className={`shrink-0 rounded-2xl px-4 py-2 text-sm ${
                    index === 0 ? primaryButtonClass : secondaryButtonClass
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <WalletScopeHeader 
            walletAddress={activeAddress || undefined} 
            walletLabel={activeWallet?.label}
          />
        </div>
        
        <motion.section
          className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_340px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <div className={`overflow-hidden rounded-[34px] p-6 md:p-8 ${heroPanelClass}`}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="max-w-2xl">
                <p className={`text-[11px] font-semibold uppercase tracking-[0.28em] ${mutedTextClass}`}>
                  Wallet Health
                </p>
                <h2 className={`mt-3 text-4xl md:text-5xl font-semibold tracking-tight ${titleTextClass}`} style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}>
                  {healthHeadline}
                </h2>
                <p className={`mt-4 max-w-xl text-base leading-7 ${bodyTextClass}`}>
                  {healthMessage}
                </p>
              </div>

              <div className={`rounded-[28px] px-5 py-4 ${trustScore === null ? chipClass : trustScore >= 85 ? accentPanelClass : trustScore >= 70 ? warningPanelClass : dangerPanelClass}`}>
                <p className="text-[11px] uppercase tracking-[0.24em]">Status</p>
                <p className="mt-2 text-2xl font-semibold">{healthBand}</p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className={`rounded-[24px] p-5 ${deepPanelClass}`}>
                <p className={`text-[11px] uppercase tracking-[0.22em] ${isDarkTheme ? 'text-[#f7dec2]' : 'text-[#9d6d57]'}`}>Health Score</p>
                <p className="mt-3 text-5xl font-bold tracking-tight text-[#eef3f0] sm:text-6xl">{trustScore ?? '--'}</p>
              </div>
              <div className={`rounded-[24px] p-5 ${mutedPanelClass}`}>
                <p className={`text-[11px] uppercase tracking-[0.22em] ${mutedTextClass}`}>Last Check-In</p>
                <p className={`mt-3 text-2xl font-semibold ${titleTextClass}`}>{freshnessDetail}</p>
                <p className={`mt-2 text-sm ${bodyTextClass}`}>Most recent full wallet reading.</p>
              </div>
              <div className={`rounded-[24px] p-5 ${mutedPanelClass}`}>
                <p className={`text-[11px] uppercase tracking-[0.22em] ${mutedTextClass}`}>Open Items</p>
                <p className={`mt-3 text-2xl font-semibold ${titleTextClass}`}>{flagCount}</p>
                <p className={`mt-2 text-sm ${bodyTextClass}`}>{flagCount === 0 ? 'Nothing urgent right now.' : `${flagCount} items are shaping today’s reading.`}</p>
              </div>
            </div>

            <div className={`mt-6 overflow-hidden rounded-[28px] ${mutedPanelClass}`}>
              <div className="flex items-center justify-between px-5 py-4">
                <div>
                  <p className={`text-[11px] uppercase tracking-[0.22em] ${mutedTextClass}`}>Health Trend</p>
                  <p className={`mt-1 text-sm ${bodyTextClass}`}>A clean view of the recent posture swing.</p>
                </div>
                <div className={`rounded-full px-3 py-1 text-xs ${chipClass}`}>{demoMode ? 'Demo trajectory' : 'Latest pass'}</div>
              </div>
              <div className="relative h-[220px] px-3 pb-3 sm:px-4">
                <svg viewBox="0 0 720 180" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
                  <defs>
                    <linearGradient id="guardian-health-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={isDarkTheme ? '#4c7fd7' : '#5f83c2'} stopOpacity="0.28" />
                      <stop offset="100%" stopColor={isDarkTheme ? '#4c7fd7' : '#5f83c2'} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={trendAreaPath} fill="url(#guardian-health-area)" />
                  <path
                    d={trendLinePath}
                    fill="none"
                    stroke={isDarkTheme ? '#8ab4ff' : '#345ba6'}
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                </svg>
                <div className={`absolute inset-x-3 bottom-4 flex items-center justify-center gap-1 sm:gap-2 ${mutedTextClass}`}>
                  {['1W', '1M', '3M', 'YTD', 'ALL'].map((item, index) => (
                    <span
                      key={item}
                      className={`rounded-xl px-2 py-1 text-[11px] sm:px-3 sm:text-xs ${index === 0 ? chipClass : ''}`}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className={`rounded-[30px] p-6 ${sunnyPanelClass}`}>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.26em] ${isDarkTheme ? 'text-white/72' : 'text-white/78'}`}>Next Best Move</p>
              <h3 className="mt-3 text-3xl font-semibold tracking-tight" style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}>
                {primaryCareAction}
              </h3>
              <p className="mt-3 text-sm leading-7 text-white/82">
                {flagCount === 0
                  ? 'You are in maintenance mode. Keep this feeling by refreshing after new approvals or contract interactions.'
                  : 'Guardian is surfacing the easiest way to improve today’s reading. Start with the highest-impact item and the rest gets lighter.'}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <DisabledTooltipButton
                  onClick={() => setActiveTab(flagCount > 0 ? 'Risks' : 'Scan')}
                  className={primaryButtonClass}
                  aria-label="Review detected security risks in this wallet"
                >
                  {flagCount > 0 ? 'Review fixes' : 'Refresh now'}
                </DisabledTooltipButton>
                <DisabledTooltipButton
                  onClick={handleRescan}
                  className={secondaryButtonClass}
                  variant="ghost"
                  aria-label="Re-scan active wallet for updated risk analysis"
                >
                  Open details
                </DisabledTooltipButton>
              </div>
            </div>

            <div className={`rounded-[24px] p-5 ${mutedPanelClass}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${mutedTextClass}`}>Right Now</p>
                  <p className={`mt-2 text-lg font-semibold ${titleTextClass}`}>{activeWallet?.label || 'Current Wallet'}</p>
                  <p className={`mt-1 text-sm ${bodyTextClass}`}>
                    {demoMode ? 'Sample wallet data for exploration.' : 'A personal view for the wallet you are actively caring for.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <motion.span 
                    animate={{ opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className={`rounded-full px-3 py-1 text-xs font-medium ${demoMode ? warningPanelClass : accentPanelClass}`}
                  >
                    {demoMode ? 'Demo Wallet' : isConnected ? 'Wallet Connected' : 'No Wallet Connected'}
                  </motion.span>
                  {isLoading && (
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                      <RefreshCw className={`w-4 h-4 ${accentTextClass}`} />
                    </motion.div>
                  )}
                </div>
              </div>
              {activeAddress && (
                <p className={`mt-4 text-sm font-mono ${titleTextClass}`}>
                  {activeAddress.slice(0, 6)}...{activeAddress.slice(-4)}
                </p>
              )}
            </div>

            <div className={`rounded-[24px] p-5 ${panelClass}`}>
              <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${mutedTextClass}`}>Briefing</p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className={bodyTextClass}>Confidence</span>
                  <span className={titleTextClass}>{scanResult?.confidence ?? '--'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={bodyTextClass}>Approvals tracked</span>
                  <span className={titleTextClass}>{(scanResult?.approvals || []).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={bodyTextClass}>Network</span>
                  <span className={titleTextClass}>{networkName}</span>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Multi-Wallet Portfolio Overview */}
        {wallets.length > 1 && (
          <motion.div
            className={`rounded-[28px] p-5 ${panelClass}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={`text-lg font-semibold tracking-tight transition-colors duration-300 ${titleTextClass}`} style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}>
                  Your Wallets
                </h3>
                <p className={`text-xs uppercase tracking-[0.18em] transition-colors duration-300 ${mutedTextClass}`}>
                  {wallets.length} wallets • Avg: {Math.round(wallets.filter(w => w.trustScore).reduce((acc, w) => acc + (w.trustScore || 0), 0) / wallets.filter(w => w.trustScore).length) || '--'}% health
                </p>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold transition-colors duration-300 ${accentTextClass}`}>
                  {wallets.reduce((acc, w) => acc + (w.riskCount || 0), 0)}
                </div>
                <div className={`text-xs uppercase tracking-[0.18em] transition-colors duration-300 ${mutedTextClass}`}>
                  Open Items
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              {wallets.map((wallet, index) => (
                <div
                  key={wallet.address}
                  className={`flex flex-col gap-4 p-4 rounded-[22px] transition-all lg:flex-row lg:items-center lg:justify-between ${
                    index === activeWalletIndex
                      ? selectedRowClass
                      : idleRowClass
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${scoreIndicatorClass(wallet.trustScore)}`} />
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
                  
                  <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4 lg:w-auto lg:flex lg:items-center lg:gap-4">
                    <div className="text-left sm:text-center">
                      <p className={`text-sm font-semibold ${scoreTextClass(wallet.trustScore)}`}>
                        {wallet.trustScore || '--'}
                      </p>
                      <p className={`text-xs transition-colors duration-300 ${
                        isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Health
                      </p>
                    </div>
                    
                    <div className="text-left sm:text-center">
                      <p className={`text-sm font-semibold transition-colors duration-300 ${
                        isDarkTheme ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        {wallet.riskCount ?? '--'}
                      </p>
                      <p className={`text-xs transition-colors duration-300 ${
                        isDarkTheme ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Items
                      </p>
                    </div>
                    
                    <div className="text-left sm:text-center">
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
                        if (index !== activeWalletIndex) {
                          handleSwitchWallet(index);
                          return;
                        }
                        handleRescan();
                      }}
                      className={secondaryButtonClass}
                      variant="ghost"
                      size="sm"
                      aria-label={`Scan wallet ${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)} for security risks`}
                    >
                      Refresh →
                    </DisabledTooltipButton>
                  </div>
                </div>
              ))}
            </div>
            
            {wallets.length > 1 && (
              <DisabledTooltipButton
                onClick={() => {
                  handleScanAllWallets();
                }}
                className={`mt-4 w-full ${primaryButtonClass}`}
                aria-label={`Scan all ${wallets.length} wallets for security risks`}
              >
                Refresh All Wallets
              </DisabledTooltipButton>
            )}
          </motion.div>
        )}

        {/* Wallet Health Card */}
        <motion.div
          className={`rounded-[32px] p-6 ${panelClass}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <h2 className={`text-sm font-medium tracking-[0.22em] uppercase transition-colors duration-300 ${mutedTextClass}`}>
                Today’s Read
              </h2>
              <DisabledTooltipButton
                onClick={() => setShowGuideDrawer(true)}
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs ${accentPanelClass}`}
                variant="ghost"
                size="sm"
                aria-label="Open Guardian AI guide for this wallet"
              >
                <Brain className="w-3 h-3" /> Guardian AI
              </DisabledTooltipButton>
            </div>
            <DisabledTooltipButton 
              onClick={() => setShowLearnMore(!showLearnMore)}
              className={`text-xs transition-colors duration-300 ${mutedTextClass}`}
              variant="ghost"
              size="sm"
              aria-label={showLearnMore ? 'Hide trust score details' : 'Learn more about trust score calculation'}
            >
              {showLearnMore ? 'Hide details' : 'ⓘ Learn More'}
            </DisabledTooltipButton>
          </div>
          <div className="mt-4 grid gap-6 md:grid-cols-[0.8fr_1.2fr] md:items-end">
            <div className={`rounded-[28px] p-6 ${deepPanelClass}`}>
              <p className={`text-[11px] uppercase tracking-[0.22em] ${isDarkTheme ? 'text-[#f7dec2]' : 'text-[#9d6d57]'}`}>Current Reading</p>
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 120 }}
                className="mt-3 block text-5xl font-bold tracking-tight text-[#eef3f0] sm:text-7xl"
              >
                {trustScore ?? '--'}
              </motion.span>
            </div>
            <div>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className={`text-2xl font-semibold leading-snug ${trustScore === null ? titleTextClass : accentTextClass}`}
                style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
              >
                {trustScore === null
                  ? 'Scan required'
                  : trustScore >= 80
                    ? 'Feeling good'
                    : trustScore >= 60
                      ? 'A little attention helps'
                      : 'A reset is worth it'}
              </motion.p>
              <p className={`text-sm leading-7 mt-3 transition-colors duration-300 ${bodyTextClass}`}>
                {trustScore === null
                  ? 'No completed scan yet'
                  : flagCount === 0
                    ? 'No risks detected'
                    : `${flagCount} risks detected`} • {freshnessDetail}
                {demoMode && (
                  <span className={`ml-2 rounded-full px-2 py-1 text-xs font-medium ${warningPanelClass}`}>
                    DEMO DATA
                  </span>
                )}
                {wallets.length > 1 && (
                  <span className={`ml-2 rounded-full px-2 py-1 text-xs font-medium ${chipClass}`}>
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
            className={`overflow-hidden rounded-[24px] p-4 mt-2 text-sm ${mutedPanelClass} ${bodyTextClass}`}
          >
            <p className={`mb-2 text-base font-semibold ${accentTextClass}`}>What is wallet health?</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>It combines approvals, mixer activity, and contract reputation into one simple reading.</li>
              <li>Higher score = calmer wallet and less drain risk.</li>
              <li>Guardian refreshes this reading over time so you can spot drift early.</li>
            </ul>
            <div className={`mt-2 text-xs ${mutedTextClass}`}>
              <a href="/guardian/learn" className={`underline ${accentTextClass}`}>
                Read more →
              </a>
            </div>
          </motion.div>
        </motion.div>

        {/* Care Areas */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${accentPanelClass}`}>
              Focus Areas
            </span>
            <div className={`h-px flex-1 transition-colors duration-300 ${isDarkTheme ? 'bg-[#36413f]' : 'bg-[#d8dfdb]'}`} />
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
                  desc: activeRisks.length === 0 ? "Everything looks quiet right now" : `${activeRisks.length} ${activeRisks.length === 1 ? 'issue' : 'issues'} detected • Best place to start improving today’s read`, 
                  icon: <Wrench className='w-5 h-5 text-[#8b7d57]'/>,
                  cta: activeRisks.length > 0 ? "Review Risks" : null 
                },
                { 
                  title: "Token Approvals", 
                  value: approvalRisks.length > 0 ? `${approvalRisks.length} unlimited` : "None", 
                  desc: approvalRisks.length > 0 ? "Some apps still have broad token access" : "No unlimited approvals found", 
                  icon: <Shield className='w-5 h-5 text-blue-400'/>, 
                  cta: approvalRisks.length > 0 ? "Review Approvals" : null 
                },
                { 
                  title: "Mixer Exposure", 
                  value: mixerRisks.length > 0 ? "High" : "Low", 
                  desc: mixerRisks.length > 0 ? "This wallet touched patterns that increase caution" : "No suspicious mixer interactions", 
                  icon: mixerRisks.length > 0 ? <AlertTriangle className='w-5 h-5 text-red-400'/> : <CheckCircle className={`w-5 h-5 ${accentTextClass}`}/>,
                  cta: null 
                },
              ];
              
              return cards.map((card, index) => (
                <motion.div
                  key={card.title}
                  whileHover={{ scale: 1.02, y: -2, boxShadow: "0 8px 25px rgba(0,0,0,0.15)" }}
                  transition={{ 
                    type: "spring", 
                    stiffness: 150, 
                    damping: 15,
                    delay: 0.2 + index * 0.1 
                  }}
                  className={`relative min-h-[230px] flex flex-col justify-between rounded-[28px] p-5 overflow-hidden ${panelClass}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none opacity-50" />
                  <div className="flex items-center gap-2 mb-2">
                    {card.icon}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h3 className={`font-semibold underline decoration-dotted cursor-help transition-colors duration-300 ${titleTextClass}`}>
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
                    <p className={`text-2xl font-bold mb-1 tracking-tight transition-colors duration-300 ${titleTextClass}`}>
                      {card.value}
                    </p>
                    <p className={`text-sm mb-4 leading-7 transition-colors duration-300 ${bodyTextClass}`}>
                      {card.desc}
                    </p>
                  </div>
                  {card.cta && (
                    <DisabledTooltipButton 
                      data-guardian-button="true"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveTab('Risks');
                      }}
                      className={`mt-auto w-full ${primaryButtonClass}`}
                      aria-label="Review detected security risks in this wallet"
                    >
                      {card.cta} →
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
              handleRescan();
            }}
            className={`flex items-center gap-2 ${primaryButtonClass}`}
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
            {wallets.length > 1 ? 'Refresh This Wallet' : 'Refresh Wallet'}
          </DisabledTooltipButton>
        </motion.div>
        </>
        )}
      </main>
      
      <FooterNav />
      
      {/* Onboarding Modal */}
      <Dialog open={showOnboard} onOpenChange={setShowOnboard}>
        <DialogContent className={`max-w-md text-center ${panelClass}`}>
          <DialogHeader>
            <DialogTitle className={`text-2xl font-semibold flex items-center justify-center gap-2 ${titleTextClass}`}>
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                🛡️
              </motion.div>
              Welcome to Guardian
            </DialogTitle>
          </DialogHeader>
          <p className={`mt-2 text-sm ${bodyTextClass}`}>
            Guardian scans your wallet for hidden risks — like old approvals or shady contracts.
            Everything runs read-only; no funds ever move without your consent.
          </p>
          <DisabledTooltipButton
            onClick={() => {
              setShowOnboard(false);
              localStorage.setItem('guardian_onboard_seen', '1');
            }}
            className={`mt-4 ${primaryButtonClass}`}
            aria-label="Start your first Guardian security scan"
          >
            🚀 Run My First Scan
          </DisabledTooltipButton>
        </DialogContent>
      </Dialog>
      
      {/* Add Wallet Modal */}
      <AddWalletModal
        isOpen={showAddWalletModal}
        onClose={() => setShowAddWalletModal(false)}
        onWalletAdded={handleWalletAdded}
      />
      <ContextualGuideDrawer
        isOpen={showGuideDrawer}
        onClose={() => setShowGuideDrawer(false)}
        kind="guardian"
        context={guideContext}
      />
    </div>
  );
}

export default GuardianEnhanced;
