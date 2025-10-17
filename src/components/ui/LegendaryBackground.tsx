'use client';

import React, { useEffect, useState } from 'react';

interface LegendaryBackgroundProps {
  mode?: 'novice' | 'pro' | 'simuto';
  children: React.ReactNode;
}

const LegendaryBackground: React.FC<LegendaryBackgroundProps> = ({ 
  mode = 'pro', 
  children 
}) => {
  const [animationKey, setAnimationKey] = useState(0);

  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [mode]);

  const getModeTheme = () => {
    switch (mode) {
      case 'novice':
        return {
          gradient: 'radial-gradient(circle at 20% 20%, #0A4B3C 0%, #060D1F 40%), radial-gradient(circle at 80% 80%, #1B4B36 0%, #073674 60%), linear-gradient(135deg, #060D1F 0%, #0F2A1F 50%, #073674 100%)',
          orb1: 'radial-gradient(circle, rgba(39, 224, 163, 0.4) 0%, transparent 70%)',
          orb2: 'radial-gradient(circle, rgba(28, 169, 255, 0.3) 0%, transparent 70%)',
          particles: 'rgba(39, 224, 163, 0.6)',
          shimmer: 'linear-gradient(45deg, transparent 30%, rgba(39, 224, 163, 0.1) 50%, transparent 70%)'
        };
      case 'simuto':
        return {
          gradient: 'radial-gradient(circle at 30% 30%, #2D1B69 0%, #060D1F 40%), radial-gradient(circle at 70% 70%, #4A1942 0%, #073674 60%), linear-gradient(135deg, #0A0A0F 0%, #1A0A2E 50%, #16213E 100%)',
          orb1: 'radial-gradient(circle, rgba(107, 95, 255, 0.5) 0%, transparent 70%)',
          orb2: 'radial-gradient(circle, rgba(255, 71, 87, 0.4) 0%, transparent 70%)',
          particles: 'rgba(107, 95, 255, 0.7)',
          shimmer: 'linear-gradient(45deg, transparent 30%, rgba(107, 95, 255, 0.15) 50%, transparent 70%)'
        };
      default:
        return {
          gradient: 'radial-gradient(circle at 25% 25%, #1B3A5C 0%, #060D1F 40%), radial-gradient(circle at 75% 75%, #2D4A6B 0%, #073674 60%), linear-gradient(135deg, #060D1F 0%, #0F1B3C 50%, #073674 100%)',
          orb1: 'radial-gradient(circle, rgba(28, 169, 255, 0.4) 0%, transparent 70%)',
          orb2: 'radial-gradient(circle, rgba(107, 95, 255, 0.3) 0%, transparent 70%)',
          particles: 'rgba(28, 169, 255, 0.6)',
          shimmer: 'linear-gradient(45deg, transparent 30%, rgba(28, 169, 255, 0.08) 50%, transparent 70%)'
        };
    }
  };

  const theme = getModeTheme();

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      background: theme.gradient,
      overflow: 'hidden'
    }}>
      {/* Floating orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '15%',
        width: '300px',
        height: '300px',
        background: theme.orb1,
        borderRadius: '50%',
        animation: `floatOrb1-${animationKey} 20s ease-in-out infinite`,
        filter: 'blur(40px)'
      }} />
      
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: theme.orb2,
        borderRadius: '50%',
        animation: `floatOrb2-${animationKey} 25s ease-in-out infinite reverse`,
        filter: 'blur(60px)'
      }} />

      {/* Shimmer waves */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: theme.shimmer,
        backgroundSize: '400% 400%',
        animation: `shimmerWave-${animationKey} 15s ease-in-out infinite`,
        opacity: 0.6
      }} />

      {/* Particle field */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          radial-gradient(2px 2px at 20px 30px, ${theme.particles}, transparent),
          radial-gradient(2px 2px at 40px 70px, ${theme.particles}, transparent),
          radial-gradient(1px 1px at 90px 40px, ${theme.particles}, transparent),
          radial-gradient(1px 1px at 130px 80px, rgba(255, 255, 255, 0.3), transparent),
          radial-gradient(2px 2px at 160px 30px, ${theme.particles}, transparent),
          radial-gradient(1px 1px at 200px 90px, ${theme.particles}, transparent)
        `,
        backgroundRepeat: 'repeat',
        backgroundSize: '250px 150px',
        animation: `particleDrift-${animationKey} 30s linear infinite`,
        opacity: 0.4
      }} />

      {/* Depth layers */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(ellipse at 50% 0%, rgba(28, 169, 255, 0.1) 0%, transparent 50%),
          radial-gradient(ellipse at 0% 100%, rgba(107, 95, 255, 0.08) 0%, transparent 50%),
          radial-gradient(ellipse at 100% 50%, rgba(39, 224, 163, 0.06) 0%, transparent 50%)
        `,
        animation: `depthShift-${animationKey} 40s ease-in-out infinite`
      }} />

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 10 }}>
        {children}
      </div>

      <style>{`
        @keyframes floatOrb1-${animationKey} {
          0%, 100% { 
            transform: translate(0, 0) scale(1);
          }
          25% { 
            transform: translate(50px, -30px) scale(1.1);
          }
          50% { 
            transform: translate(-20px, 40px) scale(0.9);
          }
          75% { 
            transform: translate(30px, 20px) scale(1.05);
          }
        }
        
        @keyframes floatOrb2-${animationKey} {
          0%, 100% { 
            transform: translate(0, 0) scale(1);
          }
          33% { 
            transform: translate(-40px, -50px) scale(1.2);
          }
          66% { 
            transform: translate(60px, 30px) scale(0.8);
          }
        }
        
        @keyframes shimmerWave-${animationKey} {
          0% { 
            background-position: -400% -400%;
          }
          50% { 
            background-position: 0% 0%;
          }
          100% { 
            background-position: 400% 400%;
          }
        }
        
        @keyframes particleDrift-${animationKey} {
          0% { 
            transform: translateY(0px) translateX(0px);
          }
          100% { 
            transform: translateY(-150px) translateX(100px);
          }
        }
        
        @keyframes depthShift-${animationKey} {
          0%, 100% { 
            opacity: 0.6;
            transform: scale(1);
          }
          50% { 
            opacity: 0.8;
            transform: scale(1.05);
          }
        }
        
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
          }
        }
      `}</style>
    </div>
  );
};

export default LegendaryBackground;