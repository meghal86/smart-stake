'use client';

import React, { useState, useEffect } from 'react';
import { HelpCircle } from 'lucide-react';

interface CinematicPodProps {
  title: string;
  children: React.ReactNode;
  mode?: 'novice' | 'pro' | 'simuto';
  updating?: boolean;
  onExplain?: () => void;
  variant?: 'pill' | 'circle' | 'square';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const CinematicPod: React.FC<CinematicPodProps> = ({ 
  title, 
  children, 
  mode = 'pro', 
  updating = false,
  onExplain,
  variant = 'pill',
  size = 'md'
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    if (updating) {
      setPulseKey(prev => prev + 1);
    }
  }, [updating]);

  const getSizeStyles = () => {
    const sizes = {
      sm: { padding: '16px 20px', minHeight: '120px', borderRadius: '20px' },
      md: { padding: '24px 32px', minHeight: '160px', borderRadius: '28px' },
      lg: { padding: '32px 40px', minHeight: '200px', borderRadius: '36px' },
      xl: { padding: '40px 48px', minHeight: '280px', borderRadius: '44px' }
    };
    
    if (variant === 'circle') {
      const circleSize = size === 'sm' ? '140px' : size === 'lg' ? '220px' : size === 'xl' ? '300px' : '180px';
      return {
        width: circleSize,
        height: circleSize,
        borderRadius: '50%',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column' as const,
        justifyContent: 'center',
        alignItems: 'center',
        textAlign: 'center' as const
      };
    }
    
    return sizes[size];
  };

  const getModeIntensity = () => {
    switch (mode) {
      case 'novice': return { blur: '32px', glow: '0 0 60px', scale: 1.05 };
      case 'simuto': return { blur: '16px', glow: '0 0 30px', scale: 1.02 };
      default: return { blur: '24px', glow: '0 0 40px', scale: 1.03 };
    }
  };

  const intensity = getModeIntensity();
  const sizeStyles = getSizeStyles();

  return (
    <div
      style={{
        ...sizeStyles,
        background: `
          radial-gradient(circle at 30% 20%, rgba(28, 169, 255, 0.15) 0%, transparent 50%),
          radial-gradient(circle at 70% 80%, rgba(107, 95, 255, 0.12) 0%, transparent 50%),
          linear-gradient(145deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.08) 100%)
        `,
        backdropFilter: `blur(${intensity.blur}) saturate(1.2)`,
        border: updating 
          ? '2px solid rgba(28, 169, 255, 0.8)' 
          : isHovered 
          ? '2px solid rgba(28, 169, 255, 0.4)'
          : '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: `
          ${intensity.glow} rgba(28, 169, 255, ${updating ? 0.6 : isHovered ? 0.3 : 0.1}),
          0 20px 60px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.3),
          inset 0 -1px 0 rgba(0, 0, 0, 0.2)
        `,
        transform: isHovered ? `translateY(-8px) scale(${intensity.scale})` : 'translateY(0) scale(1)',
        transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        animation: updating ? `cinematicPulse-${pulseKey} 2s ease-in-out infinite` : 'none',
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
        left: '-100%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
        animation: isHovered ? 'shimmerSweep 1.5s ease-out' : 'none',
        pointerEvents: 'none'
      }} />

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: variant === 'circle' ? '12px' : '20px',
        position: 'relative',
        zIndex: 2
      }}>
        <h3 style={{
          fontSize: mode === 'novice' ? '1.4rem' : mode === 'simuto' ? '1rem' : '1.2rem',
          fontWeight: 800,
          background: 'linear-gradient(135deg, #F0F6FF 0%, #1CA9FF 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textShadow: '0 0 20px rgba(240, 246, 255, 0.5)',
          margin: 0,
          letterSpacing: '0.02em'
        }}>
          {title}
        </h3>
        
        {onExplain && (
          <button
            onClick={onExplain}
            style={{
              background: 'rgba(28, 169, 255, 0.2)',
              border: '1px solid rgba(28, 169, 255, 0.4)',
              borderRadius: '12px',
              padding: '8px',
              color: '#1CA9FF',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              minHeight: '44px',
              minWidth: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(28, 169, 255, 0.3)';
              e.currentTarget.style.transform = 'scale(1.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(28, 169, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <HelpCircle size={16} />
          </button>
        )}
      </div>
      
      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 2,
        fontSize: mode === 'novice' ? '1.1rem' : mode === 'simuto' ? '0.9rem' : '1rem',
        lineHeight: mode === 'novice' ? '1.7' : '1.5',
        color: '#E2E8F0'
      }}>
        {children}
      </div>

      <style>{`
        @keyframes cinematicPulse-${pulseKey} {
          0%, 100% { 
            box-shadow: 
              0 0 40px rgba(28, 169, 255, 0.3),
              0 20px 60px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
          }
          50% { 
            box-shadow: 
              0 0 80px rgba(28, 169, 255, 0.8),
              0 25px 70px rgba(0, 0, 0, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.4);
          }
        }
        
        @keyframes shimmerSweep {
          0% { left: -100%; }
          100% { left: 100%; }
        }
      `}</style>
    </div>
  );
};

export default CinematicPod;