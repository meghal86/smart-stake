'use client';

import React, { useState, useEffect } from 'react';

interface WhaleHeroProps {
  animate?: boolean;
  mode?: 'novice' | 'pro' | 'simuto';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const WhaleHero: React.FC<WhaleHeroProps> = ({ 
  animate = true, 
  mode = 'pro',
  size = 'lg'
}) => {
  const [glowIntensity, setGlowIntensity] = useState(0.6);
  
  useEffect(() => {
    if (animate) {
      const interval = setInterval(() => {
        setGlowIntensity(prev => prev === 0.6 ? 1.2 : 0.6);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [animate]);

  const getSizeStyles = () => {
    const sizes = {
      sm: { fontSize: '2rem', width: '60px', height: '60px' },
      md: { fontSize: '3rem', width: '80px', height: '80px' },
      lg: { fontSize: '4rem', width: '100px', height: '100px' },
      xl: { fontSize: '6rem', width: '140px', height: '140px' }
    };
    return sizes[size];
  };

  const getModeColors = () => {
    switch (mode) {
      case 'novice': return {
        primary: 'rgba(39, 224, 163, 0.8)',
        secondary: 'rgba(28, 169, 255, 0.6)',
        glow: '0 0 60px rgba(39, 224, 163, 0.8)'
      };
      case 'simuto': return {
        primary: 'rgba(107, 95, 255, 0.9)',
        secondary: 'rgba(255, 71, 87, 0.7)',
        glow: '0 0 80px rgba(107, 95, 255, 0.9)'
      };
      default: return {
        primary: 'rgba(28, 169, 255, 0.8)',
        secondary: 'rgba(107, 95, 255, 0.6)',
        glow: '0 0 60px rgba(28, 169, 255, 0.8)'
      };
    }
  };

  const sizeStyles = getSizeStyles();
  const colors = getModeColors();

  return (
    <div style={{
      position: 'relative',
      display: 'inline-block',
      ...sizeStyles
    }}>
      {/* Outer glow ring */}
      <div style={{
        position: 'absolute',
        top: '-20px',
        left: '-20px',
        right: '-20px',
        bottom: '-20px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${colors.primary} 0%, transparent 70%)`,
        animation: animate ? 'pulseRing 3s ease-in-out infinite' : 'none',
        opacity: glowIntensity
      }} />
      
      {/* Inner shimmer ring */}
      <div style={{
        position: 'absolute',
        top: '-10px',
        left: '-10px',
        right: '-10px',
        bottom: '-10px',
        borderRadius: '50%',
        background: `conic-gradient(from 0deg, ${colors.secondary}, ${colors.primary}, ${colors.secondary})`,
        animation: animate ? 'spinShimmer 4s linear infinite' : 'none',
        opacity: 0.4
      }} />
      
      {/* Whale emoji */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        fontSize: sizeStyles.fontSize,
        filter: `drop-shadow(${colors.glow})`,
        animation: animate ? 'legendaryFloat 6s ease-in-out infinite' : 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        cursor: 'pointer',
        transition: 'all 0.3s ease'
      }}>
        🐋
      </div>

      <style>{`
        @keyframes legendaryFloat {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg) scale(1);
          }
          25% { 
            transform: translateY(-8px) rotate(1deg) scale(1.05);
          }
          50% { 
            transform: translateY(-12px) rotate(0deg) scale(1.1);
          }
          75% { 
            transform: translateY(-8px) rotate(-1deg) scale(1.05);
          }
        }
        
        @keyframes pulseRing {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.6;
          }
          50% { 
            transform: scale(1.2);
            opacity: 1;
          }
        }
        
        @keyframes spinShimmer {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default WhaleHero;