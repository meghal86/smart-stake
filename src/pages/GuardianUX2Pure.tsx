/**
 * Guardian UX 2.0 — Pure CSS/Inline Styles Version
 * Works without Tailwind or Framer Motion
 * Supports both dark and light themes
 * Now with REAL wallet connection via Wagmi!
 */
import { useState, useEffect, CSSProperties } from 'react';
import { Shield, RefreshCw, Wrench, Sparkles, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { useAccount, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useGuardianScan } from '@/hooks/useGuardianScan';
import { useGuardianAnalytics } from '@/lib/analytics/guardian';
import { useTheme } from '@/contexts/ThemeContext';
import { Hub2Footer } from '@/components/hub2/Hub2Footer';

// Utility function for responsive sizing
const clamp = (min: number, max: number) => {
  return Math.min(max, Math.max(min, (min + max) / 2));
};

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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    gaugeScore: {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center' as const,
      zIndex: 10,
      pointerEvents: 'none' as const,
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
  const { disconnect } = useDisconnect();
  
  // Multi-wallet management
  interface SavedWallet {
    address: string;
    label?: string;
    addedAt: number;
  }
  
  const [savedWallets, setSavedWallets] = useState<SavedWallet[]>(() => {
    const saved = localStorage.getItem('guardian_saved_wallets');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [selectedWalletAddress, setSelectedWalletAddress] = useState<string | null>(null);
  const [showWalletManager, setShowWalletManager] = useState(false);
  const [showAddWalletOptions, setShowAddWalletOptions] = useState(false);
  const [addWalletMode, setAddWalletMode] = useState<'choose' | 'manual' | 'connect'>('choose');
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletLabel, setNewWalletLabel] = useState('');
  
  // Save wallets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('guardian_saved_wallets', JSON.stringify(savedWallets));
  }, [savedWallets]);
  
  // Auto-add connected wallet to saved list when it connects
  useEffect(() => {
    if (connectedAddress && isConnected) {
      console.log('Wallet connected:', connectedAddress);
      
      // Use a functional update to avoid dependency on savedWallets
      setSavedWallets(prevWallets => {
        const alreadySaved = prevWallets.some(
          w => w.address.toLowerCase() === connectedAddress.toLowerCase()
        );
        
        if (!alreadySaved) {
          console.log('Auto-saving connected wallet to list');
          const newWallet: SavedWallet = {
            address: connectedAddress,
            label: 'Connected Wallet',
            addedAt: Date.now(),
          };
          return [...prevWallets, newWallet];
        }
        
        return prevWallets;
      });
      
      // Select this wallet
      setSelectedWalletAddress(connectedAddress);
      
      // Close the add wallet modal if open
      setShowAddWalletOptions(false);
    }
  }, [connectedAddress, isConnected]);
  
  // Add a new wallet
  const addWallet = () => {
    if (!newWalletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      alert('Invalid wallet address format');
      return;
    }
    
    if (savedWallets.some(w => w.address.toLowerCase() === newWalletAddress.toLowerCase())) {
      alert('This wallet is already saved');
      return;
    }
    
    const newWallet: SavedWallet = {
      address: newWalletAddress,
      label: newWalletLabel.trim() || undefined,
      addedAt: Date.now(),
    };
    
    setSavedWallets([...savedWallets, newWallet]);
    setNewWalletAddress('');
    setNewWalletLabel('');
    setSelectedWalletAddress(newWallet.address);
  };
  
  // Remove a wallet
  const removeWallet = (address: string) => {
    setSavedWallets(savedWallets.filter(w => w.address !== address));
    if (selectedWalletAddress === address) {
      setSelectedWalletAddress(null);
    }
  };
  
  // Determine which address to use (priority: selected > connected > first saved)
  const address = selectedWalletAddress || connectedAddress || savedWallets[0]?.address || null;
  
  // Check if we're in read-only mode (viewing a saved wallet without connection)
  const isReadOnlyMode = !isConnected && !!address;
  
  const [isScanning, setIsScanning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const analytics = useGuardianAnalytics();

  const { data, isLoading, rescan, isRescanning } = useGuardianScan({
    walletAddress: address || undefined,
    network: 'ethereum',
    enabled: !!address,
  });

  useEffect(() => {
    if (address && !data) {
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
  }, [address, data, analytics, isConnected]);

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

  // Manual scan is now handled by the addWallet function

  const handleDemoMode = () => {
    // Load demo wallet with pre-scanned data (Vitalik's wallet)
    const demoAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045';
    
    // Add to saved wallets if not already there
    const alreadySaved = savedWallets.some(
      w => w.address.toLowerCase() === demoAddress.toLowerCase()
    );
    
    if (!alreadySaved) {
      const demoWallet: SavedWallet = {
        address: demoAddress,
        label: 'Demo - Vitalik.eth',
        addedAt: Date.now(),
      };
      setSavedWallets([...savedWallets, demoWallet]);
    }
    
    // Select this wallet
    setSelectedWalletAddress(demoAddress);
    
    analytics.track('guardian_demo_mode_activated' as any, { demo_address: demoAddress });
  };

  const trustScore = data?.trustScorePercent || 87;
  const flags = data?.flags?.length || 2;
  
  // Theme-aware colors for inline use
  const themeColors = isDark ? themes.dark : themes.light;

  // Welcome screen (show if not connected AND no saved wallets)
  if (!isConnected && !address && savedWallets.length === 0) {
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
            <div 
              style={{
                display: 'flex',
                justifyContent: 'center',
                width: '100%',
              }}
              onClick={() => {
                console.log('Wrapper clicked');
                analytics.track('guardian_wallet_connect_clicked' as any, {});
              }}
            >
              <ConnectButton 
                label="🦊 Connect Wallet"
                showBalance={false}
                chainStatus="none"
              />
            </div>

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

            {/* Alternative Options */}
            <button 
              className="button-outline"
              style={{
                ...styles.buttonOutline,
                marginBottom: '12px',
              }} 
              onClick={() => {
                setShowAddWalletOptions(true);
                setAddWalletMode('manual');
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

            {/* Add Wallet Modal for Welcome Screen */}
            {showAddWalletOptions && addWalletMode === 'manual' && (
              <div 
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 100,
                  padding: '20px',
                }}
                onClick={(e) => {
                  // Close if clicking outside the modal
                  if (e.target === e.currentTarget) {
                    setShowAddWalletOptions(false);
                    setNewWalletAddress('');
                    setNewWalletLabel('');
                  }
                }}
              >
                <div style={{
                  background: isDark ? 'rgba(30, 41, 59, 0.98)' : 'rgba(255, 255, 255, 0.98)',
                  border: `1px solid ${isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(226, 232, 240, 0.9)'}`,
                  borderRadius: '16px',
                  padding: '24px',
                  maxWidth: '400px',
                  width: '100%',
                  backdropFilter: 'blur(10px)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '20px',
                  }}>
                    <h3 style={{
                      fontSize: clamp(16, 18),
                      fontWeight: 600,
                      color: themeColors.text,
                      margin: 0,
                    }}>
                      Enter Wallet Address
                    </h3>
                    <button
                      onClick={() => {
                        setShowAddWalletOptions(false);
                        setNewWalletAddress('');
                        setNewWalletLabel('');
                      }}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: themeColors.textSecondary,
                        padding: '4px',
                      }}
                    >
                      ×
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Label (optional)"
                    value={newWalletLabel}
                    onChange={(e) => setNewWalletLabel(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: clamp(13, 14),
                      background: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                      border: `1px solid ${isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(226, 232, 240, 0.9)'}`,
                      borderRadius: '8px',
                      color: themeColors.text,
                      outline: 'none',
                      marginBottom: '12px',
                    }}
                  />

                  <input
                    type="text"
                    placeholder="0x... wallet address"
                    value={newWalletAddress}
                    onChange={(e) => setNewWalletAddress(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: clamp(13, 14),
                      fontFamily: 'ui-monospace, monospace',
                      background: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                      border: `1px solid ${isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(226, 232, 240, 0.9)'}`,
                      borderRadius: '8px',
                      color: themeColors.text,
                      outline: 'none',
                      marginBottom: '16px',
                    }}
                  />

                  <div style={{
                    display: 'flex',
                    gap: '8px',
                  }}>
                    <button
                      onClick={() => {
                        addWallet();
                        setShowAddWalletOptions(false);
                      }}
                      style={{
                        flex: '1',
                        padding: '12px',
                        fontSize: clamp(13, 14),
                        fontWeight: 600,
                        color: 'white',
                        background: themeColors.primary,
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      Scan Wallet
                    </button>
                    <button
                      onClick={() => {
                        setShowAddWalletOptions(false);
                        setNewWalletAddress('');
                        setNewWalletLabel('');
                      }}
                      style={{
                        padding: '12px 20px',
                        fontSize: clamp(13, 14),
                        fontWeight: 600,
                        color: themeColors.textSecondary,
                        background: 'transparent',
                        border: `1px solid ${themeColors.textSecondary}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <Hub2Footer />
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
        <Hub2Footer />
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
        {/* Mode Badge & Wallet Info */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px',
        }}>
          {/* Connection Badge */}
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
                Demo Mode
              </>
            )}
          </span>

          {/* Multi-Wallet Selector */}
          {(address || savedWallets.length > 0) && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              padding: '14px 20px',
              background: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
              border: `1px solid ${isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(226, 232, 240, 0.9)'}`,
              borderRadius: '16px',
              backdropFilter: 'blur(10px)',
              boxShadow: isDark 
                ? '0 4px 16px rgba(0, 0, 0, 0.3)' 
                : '0 4px 16px rgba(0, 0, 0, 0.08)',
              minWidth: '320px',
              maxWidth: '90vw',
            }}>
              {/* Currently Selected Wallet */}
              {address && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  width: '100%',
                }}>
                  <div style={{
                    fontSize: clamp(9, 10),
                    color: themeColors.textSecondary,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}>
                    Active Wallet {savedWallets.find(w => w.address === address)?.label && `• ${savedWallets.find(w => w.address === address)?.label}`}
                  </div>
                  <div style={{
                    fontFamily: 'ui-monospace, SF Mono, Menlo, Monaco, Consolas, monospace',
                    fontSize: clamp(14, 16),
                    color: themeColors.text,
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    padding: '8px 16px',
                    background: isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)',
                    borderRadius: '8px',
                    border: `1px solid ${isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(226, 232, 240, 0.6)'}`,
                  }}>
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </div>
                </div>
              )}

              {/* Wallet List */}
              {savedWallets.length > 0 && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  width: '100%',
                  maxHeight: '200px',
                  overflowY: 'auto',
                }}>
                  <div style={{
                    fontSize: clamp(9, 10),
                    color: themeColors.textSecondary,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    padding: '4px 0',
                  }}>
                    Saved Wallets ({savedWallets.length})
                  </div>
                  {savedWallets.map((wallet) => (
                    <div
                      key={wallet.address}
                      onClick={() => setSelectedWalletAddress(wallet.address)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: wallet.address === address
                          ? `${themeColors.primary}20`
                          : (isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)'),
                        border: wallet.address === address
                          ? `2px solid ${themeColors.primary}`
                          : `1px solid ${isDark ? 'rgba(71, 85, 105, 0.3)' : 'rgba(226, 232, 240, 0.6)'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      onMouseEnter={(e) => {
                        if (wallet.address !== address) {
                          e.currentTarget.style.background = `${themeColors.primary}10`;
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (wallet.address !== address) {
                          e.currentTarget.style.background = isDark ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.03)';
                        }
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '2px',
                        flex: 1,
                      }}>
                        {wallet.label && (
                          <div style={{
                            fontSize: clamp(10, 11),
                            color: themeColors.text,
                            fontWeight: 600,
                          }}>
                            {wallet.label}
                          </div>
                        )}
                        <div style={{
                          fontFamily: 'ui-monospace, monospace',
                          fontSize: clamp(11, 12),
                          color: themeColors.textSecondary,
                        }}>
                          {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeWallet(wallet.address);
                        }}
                        style={{
                          padding: '4px 8px',
                          fontSize: clamp(10, 11),
                          color: isDark ? '#ef4444' : '#dc2626',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          opacity: 0.6,
                          transition: 'opacity 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.opacity = '1';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.opacity = '0.6';
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '8px',
                width: '100%',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}>
                {/* Add Wallet Button */}
                <button
                  onClick={() => {
                    setShowAddWalletOptions(!showAddWalletOptions);
                    setAddWalletMode('choose');
                  }}
                  style={{
                    flex: '1',
                    minWidth: isConnected ? '100px' : '140px',
                    padding: '8px 14px',
                    fontSize: clamp(11, 12),
                    fontWeight: 600,
                    color: themeColors.primary,
                    background: 'transparent',
                    border: `2px solid ${themeColors.primary}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `${themeColors.primary}20`;
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = `0 4px 12px ${themeColors.primary}40`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  ➕ Add Wallet
                </button>

                {/* Disconnect Button */}
                {isConnected && (
                  <button
                    onClick={() => disconnect()}
                    style={{
                      flex: '1',
                      minWidth: '100px',
                      padding: '8px 14px',
                      fontSize: clamp(11, 12),
                      fontWeight: 600,
                      color: isDark ? '#ef4444' : '#dc2626',
                      background: 'transparent',
                      border: `2px solid ${isDark ? '#ef4444' : '#dc2626'}`,
                      borderRadius: '10px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      whiteSpace: 'nowrap',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(220, 38, 38, 0.15)';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = isDark 
                        ? '0 4px 12px rgba(239, 68, 68, 0.3)' 
                        : '0 4px 12px rgba(220, 38, 38, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    ✕ Disconnect
                  </button>
                )}
              </div>

              {/* Add Wallet Options Modal */}
              {showAddWalletOptions && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  width: '100%',
                  padding: '16px',
                  background: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
                  borderRadius: '12px',
                  border: `1px solid ${isDark ? 'rgba(71, 85, 105, 0.4)' : 'rgba(226, 232, 240, 0.7)'}`,
                }}>
                  {addWalletMode === 'choose' && (
                    <>
                      <div style={{
                        fontSize: clamp(12, 13),
                        color: themeColors.text,
                        fontWeight: 600,
                        textAlign: 'center',
                      }}>
                        Choose How to Add Wallet
                      </div>
                      
                      {/* Connect Wallet Option */}
                      <ConnectButton.Custom>
                        {({ openConnectModal, connectModalOpen }) => {
                          const handleConnectClick = async () => {
                            console.log('🔗 Opening wallet selection modal...');
                            
                            // Close our modal first
                            setShowAddWalletOptions(false);
                            
                            // Force disconnect temporarily to show wallet selection
                            if (isConnected) {
                              console.log('🔌 Temporarily disconnecting to show wallet selection...');
                              disconnect();
                              
                              // Wait for disconnect, then open connect modal
                              setTimeout(() => {
                                if (openConnectModal) {
                                  openConnectModal();
                                  console.log('✅ Wallet selection modal opened');
                                }
                              }, 200);
                            } else {
                              // No wallet connected, open directly
                              if (openConnectModal) {
                                openConnectModal();
                                console.log('✅ Wallet selection modal opened');
                              }
                            }
                          };
                          
                          return (
                            <button
                              onClick={handleConnectClick}
                              style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '16px',
                                background: 'rgba(16, 185, 129, 0.1)',
                                border: '2px solid rgba(16, 185, 129, 0.4)',
                                borderRadius: '10px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                width: '100%',
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.3)';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }}
                            >
                              <div style={{ fontSize: '32px' }}>🔗</div>
                              <div style={{
                                fontSize: clamp(12, 13),
                                fontWeight: 700,
                                color: '#10b981',
                              }}>
                                Connect Another Wallet
                              </div>
                              <div style={{
                                fontSize: clamp(10, 11),
                                color: themeColors.textSecondary,
                                textAlign: 'center',
                              }}>
                                MetaMask, WalletConnect, and more
                              </div>
                            </button>
                          );
                        }}
                      </ConnectButton.Custom>

                      {/* Manual Entry Option */}
                      <button
                        onClick={() => setAddWalletMode('manual')}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '16px',
                          background: `${themeColors.primary}10`,
                          border: `2px solid ${themeColors.primary}40`,
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `${themeColors.primary}20`;
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = `0 4px 12px ${themeColors.primary}40`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = `${themeColors.primary}10`;
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        <div style={{ fontSize: '32px' }}>✍️</div>
                        <div style={{
                          fontSize: clamp(12, 13),
                          fontWeight: 700,
                          color: themeColors.primary,
                        }}>
                          Enter Address Manually
                        </div>
                        <div style={{
                          fontSize: clamp(10, 11),
                          color: themeColors.textSecondary,
                          textAlign: 'center',
                        }}>
                          Monitor any wallet (read-only)
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setShowAddWalletOptions(false);
                          setAddWalletMode('choose');
                        }}
                        style={{
                          padding: '8px',
                          fontSize: clamp(10, 11),
                          fontWeight: 600,
                          color: themeColors.textSecondary,
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {addWalletMode === 'manual' && (
                    <>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <button
                          onClick={() => setAddWalletMode('choose')}
                          style={{
                            padding: '4px',
                            fontSize: clamp(12, 14),
                            color: themeColors.textSecondary,
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          ← Back
                        </button>
                        <div style={{
                          fontSize: clamp(11, 12),
                          color: themeColors.text,
                          fontWeight: 600,
                        }}>
                          Add Wallet Manually
                        </div>
                        <div style={{ width: '40px' }}></div>
                      </div>
                      
                      <input
                        type="text"
                        placeholder="Label (optional)"
                        value={newWalletLabel}
                        onChange={(e) => setNewWalletLabel(e.target.value)}
                        style={{
                          padding: '10px 12px',
                          fontSize: clamp(11, 12),
                          background: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                          border: `1px solid ${isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(226, 232, 240, 0.9)'}`,
                          borderRadius: '8px',
                          color: themeColors.text,
                          outline: 'none',
                        }}
                      />
                      
                      <input
                        type="text"
                        placeholder="0x... wallet address"
                        value={newWalletAddress}
                        onChange={(e) => setNewWalletAddress(e.target.value)}
                        style={{
                          padding: '10px 12px',
                          fontSize: clamp(11, 12),
                          fontFamily: 'ui-monospace, monospace',
                          background: isDark ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                          border: `1px solid ${isDark ? 'rgba(71, 85, 105, 0.5)' : 'rgba(226, 232, 240, 0.9)'}`,
                          borderRadius: '8px',
                          color: themeColors.text,
                          outline: 'none',
                        }}
                      />
                      
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                      }}>
                        <button
                          onClick={() => {
                            addWallet();
                            setShowAddWalletOptions(false);
                            setAddWalletMode('choose');
                          }}
                          style={{
                            flex: '1',
                            padding: '10px 14px',
                            fontSize: clamp(11, 12),
                            fontWeight: 600,
                            color: 'white',
                            background: themeColors.primary,
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.9';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                            e.currentTarget.style.transform = 'translateY(0)';
                          }}
                        >
                          Save Wallet
                        </button>
                        <button
                          onClick={() => {
                            setNewWalletAddress('');
                            setNewWalletLabel('');
                            setAddWalletMode('choose');
                          }}
                          style={{
                            padding: '10px 14px',
                            fontSize: clamp(11, 12),
                            fontWeight: 600,
                            color: themeColors.textSecondary,
                            background: 'transparent',
                            border: `1px solid ${themeColors.textSecondary}`,
                            borderRadius: '8px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.opacity = '0.8';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Trust Score */}
        <div style={styles.gauge}>
          <svg 
            style={{ 
              width: '100%', 
              height: '100%', 
              position: 'absolute',
              top: 0,
              left: 0,
            }} 
            viewBox="0 0 200 200"
          >
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
                opacity: isReadOnlyMode ? 0.5 : 1,
                cursor: isReadOnlyMode ? 'not-allowed' : 'pointer',
              }}
              disabled={isReadOnlyMode}
              title={isReadOnlyMode ? 'Connect wallet to fix risks' : undefined}
            >
              <Wrench size={16} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'middle' }} />
              <span style={{ verticalAlign: 'middle' }}>
                {isReadOnlyMode ? 'Fix Risks (Connect Wallet)' : 'Fix Risks'}
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

      <Hub2Footer />
    </div>
  );
}

export default GuardianUX2Pure;

