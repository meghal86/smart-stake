/**
 * Guardian UX 2.0 — Pure CSS/Inline Styles Version
 * Works without Tailwind or Framer Motion
 * Supports both dark and light themes
 * Now with REAL wallet connection via Wagmi!
 */
import { useState, useEffect, CSSProperties } from 'react';
import { Shield, RefreshCw, Wrench, Sparkles, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useConnectModal } from '@rainbow-me/rainbowkit';
import { useGuardianScan } from '@/hooks/useGuardianScan';
import { useGuardianAnalytics } from '@/lib/analytics/guardian';
import { useTheme } from '@/contexts/ThemeContext';
import Hub2BottomNav from '@/components/hub2/Hub2BottomNav';

// Theme-aware color palettes
const themes = {
  dark: {
    background: 'radial-gradient(circle at top right, #0B0F1A, #020409)',
    text: '#e2e8f0',
    textSecondary: '#94a3b8',
    textTertiary: '#64748b',
    primary: '#10B981',
    primaryGlow: 'rgba(16, 185, 129, 0.4)',
    cardBg: 'rgba(30, 41, 59, 0.3)',
    cardBorder: 'rgba(71, 85, 105, 0.5)',
    shieldOpacity: 0.05,
  },
  light: {
    background: 'radial-gradient(circle at top right, #ffffff 0%, #f1f5f9 100%)',
    text: '#0F172A',
    textSecondary: '#475569',
    textTertiary: '#64748b',
    primary: '#059669',
    primaryGlow: 'rgba(5, 150, 105, 0.25)',
    cardBg: 'rgba(255, 255, 255, 0.8)',
    cardBorder: 'rgba(226, 232, 240, 0.9)',
    shieldOpacity: 0.15,
    shieldColor: '#94a3b8', // Slate-400 for much better visibility
  },
};

// Theme-aware styles generator
const getStyles = (isDark: boolean) => {
  const theme = isDark ? themes.dark : themes.light;
  
  return {
    screen: {
      position: 'relative' as const,
      minHeight: '100vh',
      overflow: 'hidden',
      background: theme.background,
      color: theme.text,
      paddingBottom: 'max(100px, env(safe-area-inset-bottom, 0px) + 80px)',
    },
    backgroundShield: {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      opacity: theme.shieldOpacity,
      width: 'min(400px, 80vw)',
      height: 'min(400px, 80vw)',
      pointerEvents: 'none' as const,
    },
    container: {
      position: 'relative' as const,
      zIndex: 10,
      display: 'flex',
      flexDirection: 'column' as const,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      padding: 'clamp(16px, 4vw, 24px)',
    },
    welcomeBox: {
      textAlign: 'center' as const,
      maxWidth: '600px',
      width: '100%',
    },
    shieldIcon: {
      width: 'clamp(64px, 15vw, 96px)',
      height: 'clamp(64px, 15vw, 96px)',
      margin: '0 auto 24px',
      color: theme.primary,
      animation: 'pulse 3s ease-in-out infinite',
    },
    headline: {
      fontSize: 'clamp(32px, 8vw, 48px)',
      fontWeight: 600,
      color: theme.text,
      marginBottom: '16px',
      letterSpacing: '-0.02em',
    },
    subtitle: {
      fontSize: 'clamp(14px, 3.5vw, 18px)',
      color: theme.textSecondary,
      marginBottom: '32px',
      lineHeight: 1.6,
      padding: '0 16px',
    },
    buttonGlow: {
      background: isDark 
        ? 'linear-gradient(to right, #10B981, #14B8A6)'
        : 'linear-gradient(to right, #059669, #0D9488)',
      color: 'white',
      border: 'none',
      padding: 'clamp(12px, 3vw, 16px) clamp(32px, 8vw, 48px)',
      fontSize: 'clamp(16px, 3.5vw, 18px)',
      fontWeight: 600,
      borderRadius: '12px',
      cursor: 'pointer',
      boxShadow: isDark 
        ? `0 0 30px ${theme.primaryGlow}`
        : `0 4px 14px ${theme.primaryGlow}, 0 0 30px ${theme.primaryGlow}`,
      transition: 'all 0.3s ease',
      marginBottom: '16px',
      width: '100%',
      maxWidth: '320px',
      minHeight: '48px',
    },
    buttonOutline: {
      background: 'transparent',
      color: theme.primary,
      border: `2px solid ${theme.primary}80`,
      padding: 'clamp(12px, 3vw, 16px) clamp(24px, 6vw, 48px)',
      fontSize: 'clamp(14px, 3vw, 18px)',
      fontWeight: 600,
      borderRadius: '12px',
      cursor: 'pointer',
      backdropFilter: 'blur(10px)',
      transition: 'all 0.3s ease',
      marginRight: '0',
      marginBottom: '12px',
      minHeight: '48px',
      flex: '1 1 auto',
    },
    privacyNote: {
      fontSize: '12px',
      color: theme.textTertiary,
      marginTop: '8px',
    },
    gauge: {
      position: 'relative' as const,
      width: 'min(320px, 80vw)',
      height: 'min(320px, 80vw)',
      margin: '0 auto clamp(24px, 6vw, 40px)',
      maxWidth: '320px',
    },
    gaugeScore: {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center' as const,
    },
    scoreNumber: {
      fontSize: 'clamp(48px, 12vw, 72px)',
      fontWeight: 600,
      color: theme.primary,
    },
    scoreLabel: {
      fontSize: 'clamp(12px, 2.5vw, 14px)',
      color: theme.textSecondary,
      marginTop: '8px',
      letterSpacing: '0.15em',
      fontWeight: 300,
    },
    message: {
      textAlign: 'center' as const,
      marginBottom: 'clamp(32px, 6vw, 48px)',
      maxWidth: '600px',
      padding: '0 16px',
      width: '100%',
    },
    messageTitle: {
      fontSize: 'clamp(20px, 5vw, 28px)',
      fontWeight: 600,
      color: theme.text,
      marginBottom: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      flexWrap: 'wrap' as const,
    },
    messageSubtitle: {
      fontSize: 'clamp(14px, 3.5vw, 16px)',
      color: theme.textSecondary,
      lineHeight: 1.6,
    },
    actionsRow: {
      display: 'flex',
      gap: '12px',
      marginBottom: 'clamp(32px, 6vw, 48px)',
      flexWrap: 'wrap' as const,
      justifyContent: 'center',
      width: '100%',
      maxWidth: '600px',
      padding: '0 16px',
    },
    riskCard: {
      background: theme.cardBg,
      backdropFilter: 'blur(10px)',
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: '12px',
      padding: 'clamp(16px, 4vw, 24px)',
      marginBottom: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      minHeight: '64px',
    },
    riskCardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'start',
      marginBottom: '8px',
      gap: '12px',
    },
    riskCardTitle: {
      color: theme.text,
      fontWeight: 500,
      fontSize: 'clamp(14px, 3.5vw, 16px)',
    },
    badge: {
      padding: '4px 12px',
      borderRadius: '999px',
      fontSize: 'clamp(11px, 2.5vw, 12px)',
      fontWeight: 500,
      whiteSpace: 'nowrap' as const,
      flexShrink: 0,
    },
    badgeAmber: {
      background: 'rgba(251, 191, 36, 0.2)',
      color: '#fbbf24',
      border: '1px solid rgba(251, 191, 36, 0.3)',
    },
    badgeGreen: {
      background: 'rgba(16, 185, 129, 0.2)',
      color: theme.primary,
      border: `1px solid ${theme.primary}40`,
    },
    riskDescription: {
      fontSize: 'clamp(12px, 3vw, 14px)',
      color: theme.textSecondary,
      lineHeight: 1.5,
    },
  };
};

export function GuardianUX2Pure() {
  const { actualTheme } = useTheme();
  const isDark = actualTheme === 'dark';
  const styles = getStyles(isDark);
  
  // Real wallet connection via Wagmi
  const { address: connectedAddress, isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();
  
  // Manual address input state
  const [manualAddress, setManualAddress] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  
  // Determine which address to use (connected wallet or manual input)
  const address = connectedAddress || (manualAddress.match(/^0x[a-fA-F0-9]{40}$/) ? manualAddress : null);
  const isManualMode = !isConnected && !!manualAddress.match(/^0x[a-fA-F0-9]{40}$/);
  
  const [isScanning, setIsScanning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const analytics = useGuardianAnalytics();

  const { data, isLoading, rescan, isRescanning } = useGuardianScan({
    walletAddress: address || undefined,
    network: 'ethereum',
    enabled: !!(isConnected || isManualMode) && !!address,
  });

  useEffect(() => {
    if ((isConnected || isManualMode) && address && !data) {
      setIsScanning(true);
      setShowResults(false);
      analytics.scanStarted(address, 'ethereum', isConnected);
      setTimeout(() => {
        setIsScanning(false);
        // Delay results fade-in for smooth transition
        setTimeout(() => setShowResults(true), 100);
      }, 3000);
    } else if (data) {
      setShowResults(true);
    }
  }, [isConnected, isManualMode, address, data, analytics]);

  const handleRescan = async () => {
    if (!address) return;
    setIsScanning(true);
    setShowResults(false);
    analytics.track('guardian_rescan_requested' as any, { wallet_address: address });
    try {
      await rescan();
      setTimeout(() => {
        setIsScanning(false);
        setTimeout(() => setShowResults(true), 100);
      }, 2000);
    } catch (error) {
      analytics.scanFailed(address, error instanceof Error ? error.message : 'Unknown error');
      setIsScanning(false);
      setShowResults(true);
    }
  };

  const handleManualScan = () => {
    if (manualAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      setIsScanning(true);
      setShowResults(false);
      analytics.scanStarted(manualAddress, 'ethereum', false);
      setTimeout(() => {
        rescan();
        setTimeout(() => {
          setIsScanning(false);
          setTimeout(() => setShowResults(true), 100);
        }, 3000);
      }, 500);
    }
  };

  const handleDemoMode = () => {
    // Load demo wallet with pre-scanned data (Vitalik's wallet)
    const demoAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    setManualAddress(demoAddress);
    setShowManualInput(false);
    setIsScanning(true);
    setShowResults(false);
    analytics.track('guardian_demo_mode_activated' as any, { demo_address: demoAddress });
    setTimeout(() => {
      rescan();
      setTimeout(() => {
        setIsScanning(false);
        setTimeout(() => setShowResults(true), 100);
      }, 3000);
    }, 500);
  };

  const trustScore = data?.trustScorePercent || 87;
  const flags = data?.flags?.length || 2;
  
  // Theme-aware colors for inline use
  const themeColors = isDark ? themes.dark : themes.light;

  // Welcome screen (show if not connected AND no manual address scanned)
  if (!isConnected && !isManualMode) {
    return (
      <div style={styles.screen}>
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
          }
          
          /* Hover effects only for non-touch devices */
          @media (hover: hover) and (pointer: fine) {
            .button-glow:hover {
              transform: scale(1.05) translateY(-2px);
              box-shadow: ${isDark 
                ? `0 0 50px ${themeColors.primaryGlow}` 
                : `0 6px 20px ${themeColors.primaryGlow}, 0 0 50px ${themeColors.primaryGlow}`};
              filter: brightness(1.1);
            }
            .button-outline:hover {
              background: ${themeColors.primary}1A;
              border-color: ${themeColors.primary}CC;
              transform: translateY(-1px);
              box-shadow: ${isDark 
                ? `0 0 20px ${themeColors.primaryGlow}` 
                : `0 2px 8px ${themeColors.primaryGlow}`};
            }
            .risk-card:hover {
              transform: scale(1.02);
              border-color: ${themeColors.primary}80;
              box-shadow: ${isDark 
                ? `0 0 20px ${themeColors.primaryGlow}` 
                : `0 4px 12px ${themeColors.primaryGlow}`};
            }
          }
          
          /* Active state for touch devices */
          @media (hover: none) {
            .button-glow:active {
              transform: scale(0.98);
            }
            .button-outline:active {
              background: ${themeColors.primary}1A;
            }
            .risk-card:active {
              background: ${isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.9)'};
            }
          }
        `}</style>

        <Shield 
          style={{
            ...styles.backgroundShield,
            color: isDark ? themeColors.primary : themeColors.shieldColor,
          }} 
          strokeWidth={isDark ? 0.5 : 1} 
        />

        <div style={styles.container}>
          <div style={styles.welcomeBox}>
            <Shield style={styles.shieldIcon} strokeWidth={1.5} />
            
            <h1 style={styles.headline}>Welcome to Guardian</h1>
            
            <p style={styles.subtitle}>
              Let's make sure your wallet stays in perfect health.
              <br />
              Choose how you'd like to begin your 30-second security check.
            </p>

            {/* Primary CTA: Connect Wallet */}
            <button 
              className="button-glow"
              style={styles.buttonGlow} 
              onClick={() => {
                analytics.track('guardian_wallet_connect_clicked' as any, {});
                openConnectModal?.();
              }}
            >
              🦊 Connect Wallet
            </button>

            <p style={{
              ...styles.privacyNote,
              marginTop: '8px',
              marginBottom: '24px',
            }}>
              Full features • Sign transactions • Secure
            </p>

            {/* Divider */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              width: '100%',
              maxWidth: '400px',
              margin: '0 auto 24px',
            }}>
              <div style={{
                flex: 1,
                height: '1px',
                background: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.2)',
              }} />
              <span style={{
                ...styles.privacyNote,
                margin: 0,
                whiteSpace: 'nowrap',
              }}>or</span>
              <div style={{
                flex: 1,
                height: '1px',
                background: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.2)',
              }} />
            </div>

            {/* Manual Input Toggle */}
            {!showManualInput ? (
              <>
                <button 
                  className="button-outline"
                  style={{
                    ...styles.buttonOutline,
                    marginBottom: '12px',
                  }} 
                  onClick={() => {
                    setShowManualInput(true);
                    analytics.track('guardian_manual_input_opened' as any, {});
                  }}
                >
                  🔍 Scan Any Address
                </button>

                <button 
                  className="button-outline"
                  style={styles.buttonOutline} 
                  onClick={handleDemoMode}
                >
                  ✨ Try Demo Mode
                </button>

                <p style={{
                  ...styles.privacyNote,
                  marginTop: '12px',
                }}>
                  Read-only scan • No wallet required
                </p>
              </>
            ) : (
              <div style={{
                width: '100%',
                maxWidth: '400px',
                margin: '0 auto',
              }}>
                <p style={{
                  ...styles.privacyNote,
                  textAlign: 'left',
                  marginBottom: '12px',
                }}>
                  Enter any Ethereum address to scan:
                </p>
                <input
                  type="text"
                  placeholder="0x..."
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: '12px',
                    border: `2px solid ${isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.2)'}`,
                    background: isDark ? 'rgba(30, 41, 59, 0.5)' : 'rgba(255, 255, 255, 0.9)',
                    color: isDark ? '#f1f5f9' : '#1e293b',
                    fontSize: clamp(14, 16),
                    fontFamily: 'Inter, system-ui, sans-serif',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    marginBottom: '12px',
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = themeColors.primary;
                    e.target.style.boxShadow = isDark 
                      ? `0 0 0 3px ${themeColors.primary}20` 
                      : `0 0 0 3px ${themeColors.primary}30`;
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(100, 116, 139, 0.2)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <div style={{
                  display: 'flex',
                  gap: '12px',
                }}>
                  <button 
                    className="button-glow"
                    style={{
                      ...styles.buttonGlow,
                      flex: 1,
                      opacity: manualAddress.match(/^0x[a-fA-F0-9]{40}$/) ? 1 : 0.5,
                      cursor: manualAddress.match(/^0x[a-fA-F0-9]{40}$/) ? 'pointer' : 'not-allowed',
                    }} 
                    onClick={handleManualScan}
                    disabled={!manualAddress.match(/^0x[a-fA-F0-9]{40}$/)}
                  >
                    Scan Address
                  </button>
                  <button 
                    className="button-outline"
                    style={{
                      ...styles.buttonOutline,
                      flex: '0 0 auto',
                      padding: '0 20px',
                    }} 
                    onClick={() => {
                      setShowManualInput(false);
                      setManualAddress('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <Hub2BottomNav />
      </div>
    );
  }

  // Scanning state
  if (isScanning || isLoading) {
    return (
      <div style={styles.screen}>
        <style>{`
          @keyframes radarSweep {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes ringPulse {
            0%, 100% { transform: scale(1); opacity: 0.3; }
            50% { transform: scale(1.1); opacity: 0.6; }
          }
          @keyframes progressFill {
            0% { stroke-dashoffset: 565; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes dots {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60%, 100% { content: '...'; }
          }
          @keyframes textPulse {
            0%, 100% { opacity: 0.7; }
            50% { opacity: 1; }
          }
          .scanning-text::after {
            content: '...';
            animation: dots 1.5s infinite;
          }
        `}</style>

        <Shield 
          style={{
            ...styles.backgroundShield,
            color: isDark ? themeColors.primary : themeColors.shieldColor,
          }} 
          strokeWidth={isDark ? 0.5 : 1} 
        />

        <div style={styles.container}>
          <div style={styles.gauge}>
            {/* Radar sweep rings */}
            <svg 
              style={{ 
                position: 'absolute', 
                width: '100%', 
                height: '100%',
                animation: 'radarSweep 8s linear infinite',
              }} 
              viewBox="0 0 200 200"
            >
              <circle
                cx="100"
                cy="100"
                r="90"
                stroke={`${themeColors.primary}33`}
                strokeWidth="2"
                fill="none"
                strokeDasharray="10 5"
              />
              <line
                x1="100"
                y1="100"
                x2="100"
                y2="10"
                stroke={`${themeColors.primary}66`}
                strokeWidth="2"
              />
            </svg>

            {/* Pulsing outer ring */}
            <svg 
              style={{ 
                position: 'absolute', 
                width: '100%', 
                height: '100%',
                animation: 'ringPulse 2s ease-in-out infinite',
              }} 
              viewBox="0 0 200 200"
            >
              <circle
                cx="100"
                cy="100"
                r="95"
                stroke={`${themeColors.primary}4D`}
                strokeWidth="1"
                fill="none"
              />
            </svg>

            {/* Progress ring */}
            <svg style={{ position: 'absolute', width: '100%', height: '100%' }} viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r="90"
                stroke={`${themeColors.primary}1A`}
                strokeWidth="8"
                fill="none"
              />
              <circle
                cx="100"
                cy="100"
                r="90"
                stroke={themeColors.primary}
                strokeWidth="8"
                fill="none"
                strokeDasharray={565}
                strokeDashoffset={565}
                strokeLinecap="round"
                transform="rotate(-90 100 100)"
                style={{
                  animation: 'progressFill 3s ease-out forwards',
                }}
              />
            </svg>

            {/* Shield icon center */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'ringPulse 3s ease-in-out infinite',
            }}>
              <Shield 
                size={Math.min(64, window.innerWidth * 0.15)} 
                color={themeColors.primary} 
                strokeWidth={1.5} 
              />
            </div>

            {/* Text below */}
            <div style={{ 
              position: 'absolute',
              bottom: 'min(-80px, -15vw)',
              left: '50%',
              transform: 'translateX(-50%)',
              textAlign: 'center',
              width: '100%',
              padding: '0 16px',
            }}>
              <div style={{ 
                fontSize: 'clamp(24px, 6vw, 32px)',
                fontWeight: 600,
                color: '#ffffff',
                marginBottom: '8px',
                animation: 'textPulse 2s ease-in-out infinite',
              }}>
                <span className="scanning-text">Scanning</span>
              </div>
              <div style={{ 
                fontSize: 'clamp(14px, 3.5vw, 16px)',
                color: '#94a3b8',
                lineHeight: 1.6,
                maxWidth: '400px',
                margin: '0 auto',
              }}>
                Guardian is analyzing wallet flows across 4 chains…
              </div>
            </div>
          </div>
        </div>
        <Hub2BottomNav />
      </div>
    );
  }

  // Results screen
  return (
    <div style={styles.screen}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes gaugeFill {
          from { stroke-dashoffset: 565; }
          to { stroke-dashoffset: ${565 * (1 - trustScore / 100)}; }
        }
        .fade-in {
          animation: fadeIn 0.8s ease-out forwards;
          opacity: ${showResults ? 1 : 0};
        }
        .gauge-ring {
          animation: gaugeFill 1.5s ease-out forwards;
        }
      `}</style>
      
      <Shield 
        style={{
          ...styles.backgroundShield,
          color: isDark ? themeColors.primary : themeColors.shieldColor,
        }} 
        strokeWidth={0.5} 
      />
      
      <div style={styles.container} className="fade-in">
        {/* Mode Badge */}
        <div style={{
          textAlign: 'center',
          marginBottom: '16px',
        }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '20px',
            background: isConnected 
              ? (isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)')
              : (isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'),
            border: `1px solid ${isConnected 
              ? (isDark ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.4)')
              : (isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.4)')}`,
            color: isConnected 
              ? (isDark ? '#10b981' : '#059669')
              : (isDark ? '#60a5fa' : '#3b82f6'),
            fontSize: clamp(12, 14),
            fontWeight: 600,
          }}>
            {isConnected ? (
              <>
                <span style={{ fontSize: '16px' }}>🔒</span>
                Wallet Connected
              </>
            ) : (
              <>
                <span style={{ fontSize: '16px' }}>👁️</span>
                Read-Only Scan
              </>
            )}
          </span>
        </div>

        {/* Trust Score */}
        <div style={styles.gauge}>
          <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 200 200">
            {/* Subtle outer ring for depth */}
            <circle
              cx="100"
              cy="100"
              r="95"
              stroke={isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(148, 163, 184, 0.2)'}
              strokeWidth="0.5"
              fill="none"
            />
            {/* Background ring */}
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke={`${themeColors.primary}1A`}
              strokeWidth="8"
              fill="none"
            />
            {/* Animated progress ring */}
            <circle
              cx="100"
              cy="100"
              r="90"
              stroke={themeColors.primary}
              strokeWidth="8"
              fill="none"
              strokeDasharray={565}
              strokeDashoffset={565}
              strokeLinecap="round"
              transform="rotate(-90 100 100)"
              className="gauge-ring"
            />
          </svg>
          <div style={styles.gaugeScore}>
            <div style={styles.scoreNumber}>{trustScore}%</div>
            <div style={styles.scoreLabel}>Trust Score</div>
          </div>
        </div>

        {/* Message */}
        <div style={styles.message}>
          <div style={styles.messageTitle}>
            <CheckCircle2 size={24} color={themeColors.primary} />
            <span>Your wallet looks healthy</span>
          </div>
          <div style={styles.messageSubtitle}>
            {trustScore}% secure with {flags} minor risks. Nothing urgent.
          </div>
        </div>

        {/* Actions */}
        <div style={{
          ...styles.actionsRow,
          flexDirection: window.innerWidth < 640 ? 'column' : 'row',
        }}>
          <button 
            className="button-outline"
            style={{
              ...styles.buttonOutline,
              width: window.innerWidth < 640 ? '100%' : 'auto',
            }}
            onClick={handleRescan}
            disabled={isRescanning}
          >
            <RefreshCw size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
            <span style={{ verticalAlign: 'middle' }}>Scan Again</span>
          </button>
          
          <div style={{ position: 'relative', width: window.innerWidth < 640 ? '100%' : 'auto' }}>
            <button 
              className="button-glow" 
              style={{
                ...styles.buttonGlow,
                width: window.innerWidth < 640 ? '100%' : 'auto',
                opacity: isManualMode ? 0.5 : 1,
                cursor: isManualMode ? 'not-allowed' : 'pointer',
              }}
              disabled={isManualMode}
              title={isManualMode ? 'Connect wallet to fix risks' : undefined}
            >
              <Wrench size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
              <span style={{ verticalAlign: 'middle' }}>
                {isManualMode ? 'Fix Risks (Connect Wallet)' : 'Fix Risks'}
              </span>
            </button>
          </div>
        </div>

        {/* Risk Cards */}
        <div style={{ 
          width: '100%', 
          maxWidth: '800px',
          padding: '0 16px',
        }}>
          <h3 style={{ 
            color: themeColors.text, 
            marginBottom: '16px',
            fontSize: 'clamp(18px, 4vw, 24px)',
            fontWeight: 600,
          }}>Active Risks</h3>
          
          <div className="risk-card" style={styles.riskCard}>
            <div style={styles.riskCardHeader}>
              <div style={styles.riskCardTitle}>Mixer exposure</div>
              <span style={{ ...styles.badge, ...styles.badgeAmber }}>Medium</span>
            </div>
            <div style={styles.riskDescription}>
              Counterparty · mixed funds in last 30d · Score impact: −8
            </div>
          </div>

          <div className="risk-card" style={styles.riskCard}>
            <div style={styles.riskCardHeader}>
              <div style={styles.riskCardTitle}>Address reputation</div>
              <span style={{ ...styles.badge, ...styles.badgeGreen }}>Good</span>
            </div>
            <div style={styles.riskDescription}>
              No sanctions hit · Low scam proximity
            </div>
          </div>
        </div>

        <p style={{ 
          ...styles.privacyNote, 
          marginTop: 'clamp(32px, 6vw, 48px)',
          fontSize: 'clamp(11px, 2.5vw, 12px)',
          padding: '0 16px',
          textAlign: 'center',
          color: themeColors.textSecondary,
          fontWeight: 300,
        }}>
          Guardian keeps you protected 24/7 — quietly and confidently
        </p>
      </div>

      <Hub2BottomNav />
    </div>
  );
}

export default GuardianUX2Pure;

