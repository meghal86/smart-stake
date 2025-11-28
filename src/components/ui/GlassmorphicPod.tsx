'use client';

import React, { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface GlassmorphicPodProps {
  title: string;
  children: React.ReactNode;
  mode?: 'novice' | 'pro' | 'simuto';
  updating?: boolean;
  onExplain?: () => void;
  variant?: 'pill' | 'circle' | 'rounded';
  alert?: boolean;
}

const GlassmorphicPod: React.FC<GlassmorphicPodProps> = ({ 
  title, 
  children, 
  mode = 'pro', 
  updating = false,
  onExplain,
  variant = 'pill',
  alert = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [shimmerActive, setShimmerActive] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (updating) {
      setPulseKey(prev => prev + 1);
      setShimmerActive(true);
      const timer = setTimeout(() => setShimmerActive(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [updating]);

  useEffect(() => {
    if (alert) {
      const interval = setInterval(() => {
        setShimmerActive(true);
        setTimeout(() => setShimmerActive(false), 1000);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [alert]);

  const getModeStyles = () => {
    switch (mode) {
      case 'novice':
        return {
          size: { padding: '40px 48px', minHeight: '280px', fontSize: '1.2rem' },
          colors: {
            bg: 'linear-gradient(145deg, rgba(39, 224, 163, 0.15) 0%, rgba(28, 169, 255, 0.1) 50%, rgba(255, 255, 255, 0.08) 100%)',
            border: alert ? 'rgba(255, 193, 7, 0.8)' : 'rgba(39, 224, 163, 0.4)',
            glow: alert ? '0 0 40px rgba(255, 193, 7, 0.6)' : '0 0 30px rgba(39, 224, 163, 0.5)',
            shimmer: 'linear-gradient(90deg, transparent, rgba(39, 224, 163, 0.6), transparent)'
          }
        };
      case 'simuto':
        return {
          size: { padding: '20px 24px', minHeight: '140px', fontSize: '0.9rem' },
          colors: {
            bg: 'linear-gradient(145deg, rgba(107, 95, 255, 0.18) 0%, rgba(255, 71, 87, 0.12) 50%, rgba(255, 255, 255, 0.08) 100%)',
            border: alert ? 'rgba(255, 71, 87, 0.9)' : 'rgba(107, 95, 255, 0.5)',
            glow: alert ? '0 0 50px rgba(255, 71, 87, 0.8)' : '0 0 35px rgba(107, 95, 255, 0.6)',
            shimmer: 'linear-gradient(90deg, transparent, rgba(107, 95, 255, 0.8), transparent)'
          }
        };
      default:
        return {
          size: { padding: '32px 40px', minHeight: '200px', fontSize: '1rem' },
          colors: {
            bg: 'linear-gradient(145deg, rgba(28, 169, 255, 0.16) 0%, rgba(107, 95, 255, 0.12) 50%, rgba(255, 255, 255, 0.1) 100%)',
            border: alert ? 'rgba(255, 193, 7, 0.8)' : 'rgba(28, 169, 255, 0.4)',
            glow: alert ? '0 0 45px rgba(255, 193, 7, 0.7)' : '0 0 32px rgba(28, 169, 255, 0.5)',
            shimmer: 'linear-gradient(90deg, transparent, rgba(28, 169, 255, 0.7), transparent)'
          }
        };
    }
  };

  const getVariantStyles = () => {
    const base = getModeStyles();
    switch (variant) {
      case 'circle': {
        const size = mode === 'novice' ? '300px' : mode === 'simuto' ? '180px' : '240px';
        return {
          ...base,
          shape: {
            width: size,
            height: size,
            borderRadius: '50%',
            display: 'flex',
            flexDirection: 'column' as const,
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center' as const
          }
        };
      }
      case 'rounded':
        return {
          ...base,
          shape: { borderRadius: '24px' }
        };
      default:
        return {
          ...base,
          shape: { borderRadius: mode === 'novice' ? '48px' : mode === 'simuto' ? '20px' : '36px' }
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      style={{
        ...styles.size,
        ...styles.shape,
        background: styles.colors.bg,
        backdropFilter: 'blur(32px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(32px) saturate(1.8)',
        border: `2px solid ${styles.colors.border}`,
        boxShadow: `
          ${styles.colors.glow},
          0 32px 80px rgba(0, 0, 0, 0.4),
          inset 0 2px 0 rgba(255, 255, 255, 0.3),
          inset 0 -2px 0 rgba(0, 0, 0, 0.1)
        `,
        transform: isHovered ? 'translateY(-12px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: updating || alert ? `legendaryPulse-${pulseKey} 2s ease-in-out infinite` : 'none',
        position: 'relative' as const,
        overflow: 'hidden',
        cursor: 'pointer'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Shimmer overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: shimmerActive ? '-100%' : '-200%',
        width: '100%',
        height: '100%',
        background: styles.colors.shimmer,
        transition: 'left 1.5s ease-out',
        pointerEvents: 'none',
        zIndex: 1
      }} />

      {/* Noise texture */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
          radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.05) 0%, transparent 50%)
        `,
        opacity: 0.6,
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: mode === 'novice' ? '32px' : mode === 'simuto' ? '16px' : '24px',
        position: 'relative',
        zIndex: 2
      }}>
        <h3 style={{
          fontSize: mode === 'novice' ? '1.6rem' : mode === 'simuto' ? '1.1rem' : '1.3rem',
          fontWeight: 900,
          background: mode === 'novice' 
            ? 'linear-gradient(135deg, #27E0A3 0%, #F0F6FF 100%)'
            : mode === 'simuto'
            ? 'linear-gradient(135deg, #6B5FFF 0%, #FF4757 50%, #F0F6FF 100%)'
            : 'linear-gradient(135deg, #1CA9FF 0%, #6B5FFF 50%, #F0F6FF 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 30px rgba(240, 246, 255, 0.5)',
          margin: 0,
          letterSpacing: '0.02em'
        }}>
          {title}
        </h3>
        
        {onExplain && (
          <button
            onClick={onExplain}
            style={{
              background: `linear-gradient(135deg, ${styles.colors.border} 0%, rgba(255, 255, 255, 0.2) 100%)`,
              border: `1px solid ${styles.colors.border}`,
              borderRadius: '16px',
              padding: '12px',
              color: '#F0F6FF',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minHeight: '48px',
              minWidth: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(8px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)';
              e.currentTarget.style.boxShadow = `0 0 20px ${styles.colors.border}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <HelpCircle size={20} />
          </button>
        )}
      </div>
      
      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        fontSize: styles.size.fontSize,
        lineHeight: mode === 'novice' ? '1.8' : '1.6',
        color: '#E2E8F0'
      }}>
        {children}
      </div>

      <style>{`
        @keyframes legendaryPulse-${pulseKey} {
          0%, 100% { 
            box-shadow: 
              ${styles.colors.glow},
              0 32px 80px rgba(0, 0, 0, 0.4),
              inset 0 2px 0 rgba(255, 255, 255, 0.3);
            border-color: ${styles.colors.border};
          }
          50% { 
            box-shadow: 
              0 0 60px ${styles.colors.border},
              0 40px 100px rgba(0, 0, 0, 0.5),
              inset 0 2px 0 rgba(255, 255, 255, 0.4);
            border-color: rgba(255, 255, 255, 0.6);
          }
        }
      `}</style>
    </div>
  );
};

export default GlassmorphicPod;