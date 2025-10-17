'use client';

import React, { useState, useEffect } from 'react';

interface LegendaryChipProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  icon?: React.ReactNode;
  active?: boolean;
  glowing?: boolean;
  mode?: 'novice' | 'pro' | 'simuto';
}

const LegendaryChip: React.FC<LegendaryChipProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  active = false,
  glowing = false,
  mode = 'pro'
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [glowPulse, setGlowPulse] = useState(0);

  useEffect(() => {
    if (glowing || active) {
      const interval = setInterval(() => {
        setGlowPulse(prev => (prev + 1) % 3);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [glowing, active]);

  const getVariantStyles = () => {
    const variants = {
      primary: {
        bg: active || isHovered
          ? 'linear-gradient(135deg, #1CA9FF 0%, #00D3C7 30%, #6B5FFF 70%, #9C88FF 100%)'
          : 'linear-gradient(135deg, rgba(28, 169, 255, 0.4) 0%, rgba(0, 211, 199, 0.3) 30%, rgba(107, 95, 255, 0.4) 70%, rgba(156, 136, 255, 0.3) 100%)',
        border: '2px solid rgba(28, 169, 255, 0.8)',
        color: active || isHovered ? '#060D1F' : '#1CA9FF',
        glow: '0 0 40px rgba(28, 169, 255, 0.8)',
        shadow: '0 20px 60px rgba(28, 169, 255, 0.3)'
      },
      secondary: {
        bg: active || isHovered
          ? 'linear-gradient(135deg, #6B5FFF 0%, #9C88FF 50%, #B794F6 100%)'
          : 'linear-gradient(135deg, rgba(107, 95, 255, 0.4) 0%, rgba(156, 136, 255, 0.3) 50%, rgba(183, 148, 246, 0.4) 100%)',
        border: '2px solid rgba(107, 95, 255, 0.8)',
        color: active || isHovered ? '#FFFFFF' : '#6B5FFF',
        glow: '0 0 40px rgba(107, 95, 255, 0.8)',
        shadow: '0 20px 60px rgba(107, 95, 255, 0.3)'
      },
      success: {
        bg: active || isHovered
          ? 'linear-gradient(135deg, #27E0A3 0%, #00D4AA 50%, #10B981 100%)'
          : 'linear-gradient(135deg, rgba(39, 224, 163, 0.4) 0%, rgba(0, 212, 170, 0.3) 50%, rgba(16, 185, 129, 0.4) 100%)',
        border: '2px solid rgba(39, 224, 163, 0.8)',
        color: active || isHovered ? '#060D1F' : '#27E0A3',
        glow: '0 0 40px rgba(39, 224, 163, 0.8)',
        shadow: '0 20px 60px rgba(39, 224, 163, 0.3)'
      },
      danger: {
        bg: active || isHovered
          ? 'linear-gradient(135deg, #FF4757 0%, #FF3742 50%, #EF4444 100%)'
          : 'linear-gradient(135deg, rgba(255, 71, 87, 0.4) 0%, rgba(255, 55, 66, 0.3) 50%, rgba(239, 68, 68, 0.4) 100%)',
        border: '2px solid rgba(255, 71, 87, 0.8)',
        color: active || isHovered ? '#FFFFFF' : '#FF4757',
        glow: '0 0 40px rgba(255, 71, 87, 0.8)',
        shadow: '0 20px 60px rgba(255, 71, 87, 0.3)'
      },
      warning: {
        bg: active || isHovered
          ? 'linear-gradient(135deg, #FFC107 0%, #FFB300 50%, #FF8F00 100%)'
          : 'linear-gradient(135deg, rgba(255, 193, 7, 0.4) 0%, rgba(255, 179, 0, 0.3) 50%, rgba(255, 143, 0, 0.4) 100%)',
        border: '2px solid rgba(255, 193, 7, 0.8)',
        color: active || isHovered ? '#060D1F' : '#FFC107',
        glow: '0 0 40px rgba(255, 193, 7, 0.8)',
        shadow: '0 20px 60px rgba(255, 193, 7, 0.3)'
      }
    };
    return variants[variant];
  };

  const getSizeStyles = () => {
    const sizes = {
      sm: { padding: '12px 24px', fontSize: '0.875rem', borderRadius: '24px', minHeight: '44px' },
      md: { padding: '16px 32px', fontSize: '1rem', borderRadius: '28px', minHeight: '48px' },
      lg: { padding: '20px 40px', fontSize: '1.125rem', borderRadius: '32px', minHeight: '52px' },
      xl: { padding: '24px 48px', fontSize: '1.25rem', borderRadius: '36px', minHeight: '56px' }
    };
    
    // Adjust for mode
    if (mode === 'novice') {
      sizes.md = { ...sizes.lg };
      sizes.lg = { ...sizes.xl };
    } else if (mode === 'simuto') {
      sizes.md = { ...sizes.sm };
      sizes.lg = { ...sizes.md };
    }
    
    return sizes[size];
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <button
      onClick={onClick}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => {
        setIsPressed(false);
        setIsHovered(false);
      }}
      onMouseEnter={() => setIsHovered(true)}
      style={{
        ...sizeStyles,
        background: variantStyles.bg,
        border: variantStyles.border,
        color: variantStyles.color,
        fontWeight: 800,
        letterSpacing: '0.02em',
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isPressed 
          ? 'scale(0.95) translateY(4px)' 
          : isHovered 
          ? 'scale(1.05) translateY(-8px)' 
          : 'scale(1) translateY(0)',
        boxShadow: `
          ${variantStyles.glow},
          ${variantStyles.shadow},
          inset 0 2px 0 rgba(255, 255, 255, 0.3),
          inset 0 -2px 0 rgba(0, 0, 0, 0.2)
        `,
        animation: (glowing || active) ? `legendaryGlow-${glowPulse} 2s ease-in-out infinite` : 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: icon ? '12px' : '0',
        whiteSpace: 'nowrap' as const,
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(16px) saturate(1.4)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.4)'
      }}
    >
      {/* Shimmer effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: isHovered ? '-100%' : '-200%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent)',
        transition: 'left 0.8s ease-out',
        pointerEvents: 'none'
      }} />

      {/* Particle effects */}
      {(glowing || active) && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `
            radial-gradient(2px 2px at 20% 30%, rgba(255, 255, 255, 0.8), transparent),
            radial-gradient(1px 1px at 80% 70%, rgba(255, 255, 255, 0.6), transparent),
            radial-gradient(1px 1px at 40% 80%, rgba(255, 255, 255, 0.4), transparent)
          `,
          animation: 'sparkle 3s ease-in-out infinite',
          pointerEvents: 'none'
        }} />
      )}

      {/* Content */}
      <div style={{ 
        position: 'relative', 
        zIndex: 2, 
        display: 'flex', 
        alignItems: 'center', 
        gap: icon ? '8px' : '0' 
      }}>
        {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
        {children}
      </div>

      <style>{`
        @keyframes legendaryGlow-${glowPulse} {
          0%, 100% { 
            box-shadow: 
              ${variantStyles.glow},
              ${variantStyles.shadow},
              inset 0 2px 0 rgba(255, 255, 255, 0.3);
          }
          50% { 
            box-shadow: 
              0 0 80px ${variantStyles.glow.split(' ')[2]},
              0 30px 80px ${variantStyles.shadow.split(' ')[2]},
              inset 0 2px 0 rgba(255, 255, 255, 0.5);
          }
        }
        
        @keyframes sparkle {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </button>
  );
};

export default LegendaryChip;