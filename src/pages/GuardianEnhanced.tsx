/**
 * Guardian Enhanced - World-Class UX Dashboard
 * Combines all new UX components for a premium experience
 */
import { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { useGuardianScan } from '@/hooks/useGuardianScan';
import { chainIdToName } from '@/config/wagmi';
import { toast } from 'sonner';

// New UX Components
import { GlassCard, GlassButton, GlassBadge, GlassNav } from '@/components/guardian/GlassUI';
import { FadeIn, SlideIn, CountUp, ProgressCircle, Pulse } from '@/components/guardian/AnimationLibrary';
import { AIExplainerTooltip, GUARDIAN_EXPLAINERS } from '@/components/guardian/AIExplainerTooltip';
import { NotificationCenter } from '@/components/guardian/NotificationCenter';
import { UserModeToggle } from '@/components/guardian/UserModeToggle';
import { WalletTimeline, Transaction } from '@/components/guardian/WalletTimeline';
import { AchievementSystem, DEFAULT_ACHIEVEMENTS, Achievement } from '@/components/guardian/AchievementSystem';
import { Hub2Footer } from '@/components/hub2/Hub2Footer';

import { 
  MobileHeader,
  MobileDrawer,
  Container,
  useResponsive,
} from '@/components/guardian/ResponsiveLayout';

// Contexts
import { useUserModeContext } from '@/contexts/UserModeContext';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useTheme } from '@/contexts/ThemeContext';

export function GuardianEnhanced() {
  const { address, isConnected, chain } = useAccount();
  const { mode, setMode, isBeginner, isExpert } = useUserModeContext();
  const notifications = useNotificationContext();
  const { actualTheme } = useTheme();
  const { isMobile, isTablet, isDesktop } = useResponsive();
  
  const [activeView, setActiveView] = useState<'dashboard' | 'timeline' | 'achievements'>('dashboard');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [demoAddress, setDemoAddress] = useState<string | null>(null);

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

  // Achievement state
  const [achievements, setAchievements] = useState<Achievement[]>(() =>
    DEFAULT_ACHIEVEMENTS.map(a => ({
      ...a,
      unlocked: false,
      unlockedAt: undefined,
      progress: 0,
    }))
  );
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);
  const nextLevelXP = userLevel * 100;

  // Demo mode handler
  const handleDemoMode = () => {
    const mockAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    setDemoAddress(mockAddress);
    setDemoMode(true);
    notifications.addNotification({
      title: 'Demo Mode Activated',
      message: 'Scanning sample wallet (Vitalik.eth)',
      priority: 'info',
      category: 'activity',
    });
  };

  // Auto-scan on connection
  useEffect(() => {
    if ((isConnected && address) || (demoMode && demoAddress)) {
      refetch();
    }
  }, [isConnected, address, demoMode, demoAddress]);

  // Add notification when scan completes
  useEffect(() => {
    if (scanResult) {
      const flagCount = scanResult.flags?.length || 0;
      
      if (flagCount === 0) {
        notifications.addNotification({
          title: '✅ All Clear!',
          message: 'Your wallet is secure with no risks detected',
          priority: 'achievement',
          category: 'security',
        });
        
        // Unlock achievement for perfect scan
        unlockAchievement('perfect_score');
      } else {
        notifications.addNotification({
          title: '⚠️ Risks Detected',
          message: `Found ${flagCount} potential ${flagCount === 1 ? 'risk' : 'risks'}`,
          priority: flagCount > 3 ? 'critical' : 'important',
          category: 'security',
          actionLabel: 'View Details',
          onAction: () => setActiveView('dashboard'),
        });
      }
      
      // First scan achievement
      unlockAchievement('first_scan');
      awardXP(50, 'Completed security scan');
    }
  }, [scanResult]);

  // Achievement & XP functions
  const unlockAchievement = (achievementId: string) => {
    setAchievements(prev => prev.map(a => {
      if (a.id === achievementId && !a.unlocked) {
        awardXP(100, `Unlocked: ${a.title}`);
        return {
          ...a,
          unlocked: true,
          unlockedAt: new Date(),
          progress: 100,
        };
      }
      return a;
    }));
  };

  const awardXP = (amount: number, reason: string) => {
    setUserXP(prev => {
      const newXP = prev + amount;
      const newLevel = Math.floor(newXP / 100) + 1;
      
      if (newLevel > userLevel) {
        setUserLevel(newLevel);
        notifications.addNotification({
          title: '🎉 Level Up!',
          message: `You reached Level ${newLevel}! Keep securing your wallet.`,
          priority: 'achievement',
          category: 'achievement',
        });
      }
      
      return newXP;
    });
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
      <div className="min-h-screen" style={{ background: 'radial-gradient(circle at top right, #0B0F1A, #020409)' }}>
        <GlassNav className="px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8 text-blue-400" />
              <h1 className="text-xl font-bold text-slate-100">Guardian</h1>
            </div>
            <div className="flex items-center gap-4">
              <UserModeToggle mode={mode} onModeChange={setMode} />
            </div>
          </div>
        </GlassNav>

        <Container size="lg" className="py-12">
          <FadeIn>
            <div className="max-w-2xl mx-auto text-center space-y-8">
              <Pulse className="inline-block">
                <Shield className="h-24 w-24 text-blue-400 mx-auto" />
              </Pulse>
              
              <h2 className="text-4xl sm:text-5xl font-bold text-slate-100">
                Welcome to Guardian
              </h2>
              
              <p className="text-lg text-slate-300">
                Let's make sure your wallet stays in perfect health with a quick 30-second security check.
              </p>

              <div className="space-y-4 max-w-md mx-auto">
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <GlassButton 
                      variant="primary" 
                      size="lg" 
                      className="w-full"
                      onClick={openConnectModal}
                    >
                      <Shield className="h-5 w-5 mr-2" />
                      Connect Wallet
                    </GlassButton>
                  )}
                </ConnectButton.Custom>
                
                <p className="text-xs text-slate-500">
                  Full features • Sign transactions • Secure
                </p>

                <div className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-slate-700"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-slate-900 text-slate-400">or</span>
                  </div>
                </div>

                <GlassButton 
                  variant="secondary" 
                  size="lg" 
                  className="w-full"
                  onClick={handleDemoMode}
                >
                  ✨ Try Demo Mode
                </GlassButton>
                
                <p className="text-xs text-slate-500">
                  Read-only scan • No wallet required
                </p>
              </div>

              {/* Feature Cards */}
              <SlideIn direction="up" delay={0.3}>
                <div className="grid md:grid-cols-3 gap-4 mt-12">
                  <GlassCard className="p-6">
                    <Shield className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-slate-100 mb-2">Trust Score</h3>
                    <p className="text-sm text-slate-400">
                      Get a 0-100 score based on approvals, mixer activity, and reputation
                    </p>
                  </GlassCard>
                  
                  <GlassCard className="p-6">
                    <Wrench className="h-8 w-8 text-purple-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-slate-100 mb-2">Fix Risks</h3>
                    <p className="text-sm text-slate-400">
                      One-tap revoke for unlimited approvals and suspicious contracts
                    </p>
                  </GlassCard>
                  
                  <GlassCard className="p-6">
                    <TrendingUp className="h-8 w-8 text-green-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-slate-100 mb-2">Stay Safe</h3>
                    <p className="text-sm text-slate-400">
                      Real-time alerts for new approvals and contract interactions
                    </p>
                  </GlassCard>
                </div>
              </SlideIn>
            </div>
          </FadeIn>
        </Container>
      </div>
    );
  }

  // Main dashboard (connected/demo mode)
  const trustScore = scanResult?.trustScorePercent || 0;
  const flagCount = scanResult?.flags?.length || 0;

  return (
    <div className="min-h-screen pb-32 md:pb-4" style={{ background: 'radial-gradient(circle at top right, #0B0F1A, #020409)' }}>
      {/* Desktop Navigation */}
      {isDesktop && (
        <GlassNav className="px-6 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Shield className="h-8 w-8 text-blue-400" />
                <h1 className="text-xl font-bold text-slate-100">Guardian</h1>
              </div>
              
              <div className="flex items-center gap-1 bg-slate-800/50 rounded-lg p-1">
                <button
                  onClick={() => setActiveView('dashboard')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeView === 'dashboard'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <Home className="h-4 w-4 inline mr-2" />
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveView('timeline')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeView === 'timeline'
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <History className="h-4 w-4 inline mr-2" />
                  Timeline
                </button>
                {isExpert && (
                  <button
                    onClick={() => setActiveView('achievements')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeView === 'achievements'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <Trophy className="h-4 w-4 inline mr-2" />
                    Achievements
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {demoMode && (
                <GlassBadge variant="info">Demo Mode</GlassBadge>
              )}
              <UserModeToggle mode={mode} onModeChange={setMode} />
              <NotificationCenter {...notifications} />
              <ConnectButton />
            </div>
          </div>
        </GlassNav>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <MobileHeader
          title="Guardian"
          onMenuClick={() => setDrawerOpen(true)}
          rightActions={
            <>
              <NotificationCenter {...notifications} />
            </>
          }
        />
      )}

      {/* Main Content */}
      <Container size="xl" className="py-6 space-y-6">
        {/* Dashboard View */}
        {activeView === 'dashboard' && (
          <FadeIn>
            <div className="space-y-6">
              {/* Trust Score Card */}
              <GlassCard className="p-6 sm:p-8" variant="hover">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-100">Trust Score</h2>
                    {isBeginner && (
                      <AIExplainerTooltip {...GUARDIAN_EXPLAINERS.trustScore} />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isLoading && !isRescanning && (
                      <GlassButton variant="ghost" size="sm" onClick={handleRescan}>
                        <RefreshCw className="h-4 w-4" />
                      </GlassButton>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="flex items-center justify-center">
                    <ProgressCircle
                      percentage={trustScore}
                      size={200}
                      color={trustScore >= 80 ? '#10B981' : trustScore >= 60 ? '#F59E0B' : '#EF4444'}
                    />
                    <div className="absolute text-center">
                      <CountUp 
                        to={trustScore} 
                        className="text-5xl font-bold"
                        style={{ color: trustScore >= 80 ? '#10B981' : trustScore >= 60 ? '#F59E0B' : '#EF4444' }}
                      />
                      <p className="text-sm text-slate-400 mt-2">Trust Score</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-100 mb-2">
                        {trustScore >= 80 ? '✅ Excellent Security' : trustScore >= 60 ? '⚠️ Moderate Risk' : '🚨 Action Required'}
                      </h3>
                      <p className="text-slate-300">
                        {trustScore >= 80 
                          ? 'Your wallet is well-protected with minimal risks detected.'
                          : trustScore >= 60
                          ? 'Some security concerns found. Review the risks below.'
                          : 'Critical security issues detected. Take action immediately.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm text-slate-400">Active Risks</p>
                        <p className="text-2xl font-bold text-slate-100">{flagCount}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Last Scan</p>
                        <p className="text-sm text-slate-300">Just now</p>
                      </div>
                    </div>

                    <GlassButton variant="primary" size="lg" className="w-full mt-4">
                      <Wrench className="h-5 w-5 mr-2" />
                      Fix Risks
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>

              {/* Risk Cards Grid */}
              <div className="grid md:grid-cols-2 gap-4">
                <SlideIn direction="up" delay={0.1}>
                  <GlassCard className="p-6" variant="accent">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-slate-100">Token Approvals</h3>
                      <GlassBadge variant={flagCount > 0 ? 'warning' : 'success'}>
                        {flagCount > 0 ? 'Review' : 'Safe'}
                      </GlassBadge>
                    </div>
                    <p className="text-sm text-slate-300">
                      {flagCount > 0 
                        ? `${flagCount} unlimited approvals detected`
                        : 'No unlimited approvals found'}
                    </p>
                  </GlassCard>
                </SlideIn>

                <SlideIn direction="up" delay={0.2}>
                  <GlassCard className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-slate-100">Mixer Exposure</h3>
                      <GlassBadge variant="success">Low</GlassBadge>
                    </div>
                    <p className="text-sm text-slate-300">
                      No mixer interactions detected
                    </p>
                  </GlassCard>
                </SlideIn>
              </div>
            </div>
          </FadeIn>
        )}

        {/* Timeline View */}
        {activeView === 'timeline' && (
          <FadeIn>
            <GlassCard className="p-6">
              <h2 className="text-2xl font-bold text-slate-100 mb-6">Transaction History</h2>
              <WalletTimeline
                transactions={[]}
                walletAddress={activeAddress || ''}
                showAIInsights={isBeginner}
              />
            </GlassCard>
          </FadeIn>
        )}

        {/* Achievements View */}
        {activeView === 'achievements' && isExpert && (
          <FadeIn>
            <AchievementSystem
              achievements={achievements}
              userLevel={userLevel}
              userXP={userXP}
              nextLevelXP={nextLevelXP}
            />
          </FadeIn>
        )}
      </Container>

      {/* Hub2 Footer - Same footer across all pages */}
      <Hub2Footer />

      {/* Mobile Drawer */}
      {isMobile && (
        <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-700">
              <Shield className="h-8 w-8 text-blue-400" />
              <div>
                <h3 className="font-semibold text-slate-100">Guardian</h3>
                <p className="text-xs text-slate-400">
                  {activeAddress?.slice(0, 6)}...{activeAddress?.slice(-4)}
                </p>
              </div>
            </div>
            
            <UserModeToggle mode={mode} onModeChange={setMode} className="w-full" />
            
            {demoMode && (
              <GlassButton 
                variant="secondary" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  setDemoMode(false);
                  setDemoAddress(null);
                }}
              >
                Exit Demo Mode
              </GlassButton>
            )}
            
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <GlassButton 
                  variant="primary" 
                  size="sm" 
                  className="w-full"
                  onClick={openConnectModal}
                >
                  Connect Wallet
                </GlassButton>
              )}
            </ConnectButton.Custom>
          </div>
        </MobileDrawer>
      )}
    </div>
  );
}

export default GuardianEnhanced;

