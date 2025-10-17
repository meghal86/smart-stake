'use client';

import React from 'react';

interface CinematicBackgroundProps {
  mode?: 'novice' | 'pro' | 'simuto';
  children: React.ReactNode;
}

const CinematicBackground: React.FC<CinematicBackgroundProps> = ({ 
  mode = 'pro', 
  children 
}) => {
  const getModeGradient = () => {
    switch (mode) {
      case 'novice':
        return {
          primary: 'radial-gradient(circle at 20% 30%, #1CA9FF 0%, transparent 50%)',
          secondary: 'radial-gradient(circle at 80% 70%, #27E0A3 0%, transparent 50%)',
          base: 'linear-gradient(135deg, #060D1F 0%, #0A1B3D 50%, #073674 100%)'
        };
      case 'simuto':
        return {
          primary: 'radial-gradient(circle at 30% 20%, #6B5FFF 0%, transparent 40%)',
          secondary: 'radial-gradient(circle at 70% 80%, #FF4757 0%, transparent 40%)',
          base: 'linear-gradient(135deg, #0A0A0F 0%, #1A0A2E 50%, #16213E 100%)'
        };
      default:
        return {
          primary: 'radial-gradient(circle at 25% 25%, #1CA9FF 0%, transparent 50%)',
          secondary: 'radial-gradient(circle at 75% 75%, #6B5FFF 0%, transparent 50%)',
          base: 'linear-gradient(135deg, #060D1F 0%, #0F1B3C 50%, #073674 100%)'
        };
    }
  };

  const gradients = getModeGradient();

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      background: gradients.base,
      overflow: 'hidden'
    }}>
      {/* Animated gradient orbs */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          ${gradients.primary},
          ${gradients.secondary}
        `,
        animation: 'orbFloat 20s ease-in-out infinite',
        opacity: 0.6
      }} />

      {/* Shimmer layer */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.03) 50%, transparent 70%)',
        backgroundSize: '200% 200%',
        animation: 'shimmerFlow 12s ease-in-out infinite'
      }} />

      {/* Parallax particles */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          radial-gradient(2px 2px at 20px 30px, rgba(28, 169, 255, 0.3), transparent),
          radial-gradient(2px 2px at 40px 70px, rgba(107, 95, 255, 0.2), transparent),
          radial-gradient(1px 1px at 90px 40px, rgba(39, 224, 163, 0.3), transparent),
          radial-gradient(1px 1px at 130px 80px, rgba(255, 255, 255, 0.1), transparent),
          radial-gradient(2px 2px at 160px 30px, rgba(28, 169, 255, 0.2), transparent)
        `,
        backgroundRepeat: 'repeat',
        backgroundSize: '200px 100px',
        animation: 'particleFloat 25s linear infinite',
        opacity: 0.4
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {children}
      </div>

      <style>{`
        @keyframes orbFloat {
          0%, 100% { 
            transform: translate(0, 0) scale(1);
            opacity: 0.6;
          }
          25% { 
            transform: translate(20px, -30px) scale(1.1);
            opacity: 0.8;
          }
          50% { 
            transform: translate(-10px, 20px) scale(0.9);
            opacity: 0.7;
          }
          75% { 
            transform: translate(30px, 10px) scale(1.05);
            opacity: 0.9;
          }
        }
        
        @keyframes shimmerFlow {
          0% { 
            background-position: -200% -200%;
            opacity: 0.3;
          }
          50% { 
            background-position: 0% 0%;
            opacity: 0.6;
          }
          100% { 
            background-position: 200% 200%;
            opacity: 0.3;
          }
        }
        
        @keyframes particleFloat {
          0% { 
            transform: translateY(0px) translateX(0px);
          }
          100% { 
            transform: translateY(-100px) translateX(50px);
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CinematicBackground;