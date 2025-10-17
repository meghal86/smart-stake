'use client';

import React, { useState } from 'react';

interface CinematicChipProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  active?: boolean;
  glowing?: boolean;
}

const CinematicChip: React.FC<CinematicChipProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  active = false,
  glowing = false
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getVariantStyles = () => {
    const variants = {
      primary: {
        background: active || isHovered
          ? 'linear-gradient(135deg, #1CA9FF 0%, #00D3C7 50%, #6B5FFF 100%)'
          : 'linear-gradient(135deg, rgba(28, 169, 255, 0.3) 0%, rgba(0, 211, 199, 0.2) 50%, rgba(107, 95, 255, 0.3) 100%)',
        border: '2px solid rgba(28, 169, 255, 0.6)',
        color: active || isHovered ? '#060D1F' : '#1CA9FF',
        glow: '0 0 40px rgba(28, 169, 255, 0.8)'
      },
      secondary: {
        background: active || isHovered
          ? 'linear-gradient(135deg, #6B5FFF 0%, #9C88FF 100%)'
          : 'linear-gradient(135deg, rgba(107, 95, 255, 0.3) 0%, rgba(156, 136, 255, 0.2) 100%)',
        border: '2px solid rgba(107, 95, 255, 0.6)',
        color: active || isHovered ? '#FFFFFF' : '#6B5FFF',
        glow: '0 0 40px rgba(107, 95, 255, 0.8)'
      },
      danger: {
        background: active || isHovered
          ? 'linear-gradient(135deg, #FF4757 0%, #FF3742 100%)'
          : 'linear-gradient(135deg, rgba(255, 71, 87, 0.3) 0%, rgba(255, 55, 66, 0.2) 100%)',
        border: '2px solid rgba(255, 71, 87, 0.6)',
        color: active || isHovered ? '#FFFFFF' : '#FF4757',
        glow: '0 0 40px rgba(255, 71, 87, 0.8)'
      },
      success: {
        background: active || isHovered
          ? 'linear-gradient(135deg, #27E0A3 0%, #00D4AA 100%)'
          : 'linear-gradient(135deg, rgba(39, 224, 163, 0.3) 0%, rgba(0, 212, 170, 0.2) 100%)',
        border: '2px solid rgba(39, 224, 163, 0.6)',
        color: active || isHovered ? '#060D1F' : '#27E0A3',
        glow: '0 0 40px rgba(39, 224, 163, 0.8)'
      }
    };
    return variants[variant];
  };

  const getSizeStyles = () => {
    const sizes = {
      sm: { padding: '12px 20px', fontSize: '0.875rem', borderRadius: '24px', minHeight: '44px' },
      md: { padding: '16px 28px', fontSize: '1rem', borderRadius: '28px', minHeight: '48px' },
      lg: { padding: '20px 36px', fontSize: '1.125rem', borderRadius: '32px', minHeight: '52px' }
    };
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
        background: variantStyles.background,
        border: variantStyles.border,
        color: variantStyles.color,
        fontWeight: 700,
        letterSpacing: '0.02em',
        cursor: 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isPressed 
          ? 'scale(0.95) translateY(2px)' 
          : isHovered 
          ? 'scale(1.05) translateY(-4px)' 
          : 'scale(1) translateY(0)',
        boxShadow: `
          ${variantStyles.glow},
          0 ${isHovered ? '20px' : '10px'} ${isHovered ? '40px' : '20px'} rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.3),
          inset 0 -1px 0 rgba(0, 0, 0, 0.2)
        `,
        animation: glowing ? 'cinematicGlow 2s ease-in-out infinite' : 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: icon ? '12px' : '0',
        whiteSpace: 'nowrap' as const,
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(12px)'
      }}
    >
      {/* Shimmer effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: isHovered ? '-100%' : '-200%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
        transition: 'left 0.6s ease-out',
        pointerEvents: 'none'
      }} />

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
        @keyframes cinematicGlow {
          0%, 100% { 
            box-shadow: 
              0 0 30px ${variantStyles.glow.split(' ')[2]},
              0 10px 20px rgba(0, 0, 0, 0.3),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
          }
          50% { 
            box-shadow: 
              0 0 60px ${variantStyles.glow.split(' ')[2]},
              0 15px 30px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.4);
          }
        }
      `}</style>
    </button>
  );
};

export default CinematicChip;