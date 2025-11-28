/**
 * Guardian UX 2.0 — Tesla × Apple × Airbnb
 * Living trust experience with precision, craft, and emotion
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, RefreshCw, Wrench, Sparkles, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { TrustGauge } from '@/components/guardian/TrustGauge';
import { GlowButton } from '@/components/ui/button-glow';
import { useGuardianScan } from '@/hooks/useGuardianScan';
import { useGuardianAnalytics } from '@/lib/analytics/guardian';
import { Hub2Footer } from '@/components/hub2/Hub2Footer';

// Simple wallet connection - works with existing setup
const useWallet = () => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = () => {
    // For demo purposes - in production this would connect to actual wallet
    const mockAddress = '0xA6bF1D4E9c34d12BfC5e8A946f912e7cC42D2D9C';
    setAddress(mockAddress);
    setIsConnected(true);
    console.log('Wallet connected:', mockAddress);
  };

  return { address, isConnected, connect };
};

export function GuardianUX2() {
  const { address, isConnected, connect } = useWallet();
  const [isScanning, setIsScanning] = useState(false);
  const [scanStartTime, setScanStartTime] = useState<number | null>(null);
  const analytics = useGuardianAnalytics();

  const { data, isLoading, rescan, isRescanning } = useGuardianScan({
    walletAddress: address || undefined,
    network: 'ethereum',
    enabled: isConnected && !!address,
  });

  // Auto-scan on connect
  useEffect(() => {
    if (isConnected && address && !data) {
      setIsScanning(true);
      setScanStartTime(Date.now());
      analytics.scanStarted(address, 'ethereum', true);
      setTimeout(() => setIsScanning(false), 3000);
    }
  }, [isConnected, address, data, analytics]);

  // Track scan completion
  useEffect(() => {
    if (data && scanStartTime) {
      const duration = Date.now() - scanStartTime;
      analytics.scanCompleted(
        address || '',
        data.trustScorePercent || 0,
        data.confidence || 0.8,
        data.flags?.length || 0,
        data.flags?.filter((f: unknown) => f.severity === 'high').length || 0,
        duration
      );
      setScanStartTime(null);
    }
  }, [data, scanStartTime, address, analytics]);

  const handleRescan = async () => {
    if (!address) return;
    setIsScanning(true);
    setScanStartTime(Date.now());
    analytics.track('guardian_rescan_requested' as unknown, { wallet_address: address });
    try {
      await rescan();
      setTimeout(() => setIsScanning(false), 2000);
    } catch (error) {
      analytics.scanFailed(address, error instanceof Error ? error.message : 'Unknown error');
      setIsScanning(false);
    }
  };

  const trustScore = data?.trustScorePercent || 87;
  const confidence = data?.confidence || 0.85;
  const flags = data?.flags?.length || 2;
  const criticalFlags = data?.flags?.filter((f: unknown) => f.severity === 'high').length || 0;

  const getEmotionalMessage = (score: number, flagCount: number) => {
    if (score >= 90 && flagCount === 0) {
      return {
        title: 'Your wallet looks pristine',
        subtitle: `${score}% secure with zero risks detected. You are in perfect health.`,
        icon: CheckCircle2,
        color: 'text-emerald-400',
      };
    }
    if (score >= 80) {
      return {
        title: 'Your wallet looks healthy',
        subtitle: `${score}% secure with ${flagCount} minor ${flagCount === 1 ? 'risk' : 'risks'}. Nothing urgent.`,
        icon: CheckCircle2,
        color: 'text-emerald-400',
      };
    }
    if (score >= 60) {
      return {
        title: 'A few things need attention',
        subtitle: `${score}% secure. ${flagCount} ${flagCount === 1 ? 'approval' : 'approvals'} might need review — we will guide you.`,
        icon: AlertTriangle,
        color: 'text-amber-400',
      };
    }
    return {
      title: 'Let us secure your wallet together',
      subtitle: `${score}% secure. ${criticalFlags} critical ${criticalFlags === 1 ? 'risk' : 'risks'} detected. We are here to help.`,
      icon: AlertTriangle,
      color: 'text-red-400',
    };
  };

  const message = getEmotionalMessage(trustScore, flags);
  const MessageIcon = message.icon;

  // Welcome screen
  if (!isConnected) {
    return (
      <div 
        className="relative min-h-screen overflow-hidden" 
        style={{
          background: 'radial-gradient(circle at top right, #0B0F1A, #020409)',
          minHeight: '100vh',
        }}
      >
        {/* TEST MARKER - REMOVE AFTER CONFIRMING */}
        <div style={{
          position: 'fixed',
          top: 10,
          right: 10,
          background: 'lime',
          color: 'black',
          padding: '8px 16px',
          borderRadius: '4px',
          fontWeight: 'bold',
          zIndex: 9999,
        }}>
          GuardianUX2 LOADED ✓
        </div>
        
        {/* Background shield */}
        <Shield
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5"
          size={400}
          strokeWidth={0.5}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 pb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-lg"
          >
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            >
              <Shield className="w-24 h-24 mx-auto mb-6 text-emerald-400" strokeWidth={1.5} />
            </motion.div>

            <h1 className="text-4xl md:text-5xl font-semibold text-white mb-4 tracking-tight">
              Welcome to Guardian
            </h1>
            <p className="text-lg text-slate-400 mb-8 leading-relaxed">
              Let us make sure your wallet stays in perfect health.
              <br />
              Connect to begin your 30-second security check.
            </p>

            <GlowButton 
              onClick={connect} 
              className="mb-4"
              disabled={isConnected}
            >
              {isConnected ? 'Wallet Connected' : 'Connect Wallet'}
            </GlowButton>

            <p className="text-xs text-slate-500 tracking-wide">
              No private keys will be accessed
            </p>
          </motion.div>
        </div>

        <Hub2Footer />
      </div>
    );
  }

  // Main Guardian screen
  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,_#0B0F1A,_#020409)]">
      {/* Animated background gradient with slow drift */}
      <motion.div
        className="absolute inset-0 opacity-20"
        style={{
          background: 'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
        }}
        animate={{
          background: [
            'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 60% 40%, rgba(16, 185, 129, 0.12) 0%, transparent 50%)',
            'radial-gradient(circle at 40% 60%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)',
          ],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Background shield */}
      <Shield
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5"
        size={600}
        strokeWidth={0.5}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 pt-12 pb-32">
        {/* Trust Gauge Hero */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <TrustGauge score={trustScore} confidence={confidence} isScanning={isScanning || isLoading} />
        </motion.div>

        {/* Emotional Message with extra breathing room */}
        <AnimatePresence mode="wait">
          {!isScanning && !isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-12 mt-8 max-w-md"
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <MessageIcon className={`w-5 h-5 ${message.color}`} />
                <h2 className="text-2xl font-semibold text-white tracking-tight">{message.title}</h2>
              </div>
              <p className="text-slate-400 leading-relaxed">{message.subtitle}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-12"
        >
          <GlowButton
            onClick={handleRescan}
            disabled={isRescanning || isScanning || !address}
            variant="outlineGlow"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRescanning ? 'animate-spin' : ''}`} />
            Scan Again
          </GlowButton>

          {flags > 0 && (
            <GlowButton
              onClick={() => {
                analytics.revokeModalOpened(flags);
                // TODO: Open revoke modal
                console.log('Opening revoke modal for', flags, 'risks');
              }}
              variant="glow"
            >
              <Wrench className="w-4 h-4 mr-2" />
              Fix Risks
            </GlowButton>
          )}

          <GlowButton 
            variant="subtle"
            onClick={() => {
              // TODO: Open Guardian AI chat
              console.log('Opening Guardian AI chat');
            }}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Ask Guardian AI
          </GlowButton>
        </motion.div>

        {/* Risk Cards */}
        <AnimatePresence>
          {!isScanning && !isLoading && flags > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="w-full max-w-2xl space-y-4"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Info className="w-5 h-5 text-emerald-400" />
                Active Risks
              </h3>

              {/* Risk cards with severity-based hover effects */}
              <motion.div
                className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 cursor-pointer"
                whileHover={{ 
                  scale: 1.02,
                  borderColor: 'rgba(251, 191, 36, 0.5)',
                  boxShadow: '0 0 20px rgba(251, 191, 36, 0.1)',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-white font-medium">Mixer exposure</h4>
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    Medium
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  Counterparty · mixed funds in last 30d · Score impact: −8
                </p>
              </motion.div>

              <motion.div
                className="bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-6 cursor-pointer"
                whileHover={{ 
                  scale: 1.02,
                  borderColor: 'rgba(16, 185, 129, 0.5)',
                  boxShadow: '0 0 20px rgba(16, 185, 129, 0.1)',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-white font-medium">Address reputation</h4>
                  <span className="text-xs px-2 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Good
                  </span>
                </div>
                <p className="text-sm text-slate-400">
                  No sanctions hit · Low scam proximity
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subtle footer copy with shield watermark */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="relative mt-12 max-w-md"
        >
          <Shield
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 -z-10"
            size={48}
            strokeWidth={0.5}
          />
          <p className="text-xs text-slate-600 text-center relative z-10">
            Guardian keeps you protected 24/7 — quietly and confidently
          </p>
        </motion.div>
      </div>

      {/* Hub2 Footer - Same footer across all pages */}
      <Hub2Footer />
    </div>
  );
}

export default GuardianUX2;

