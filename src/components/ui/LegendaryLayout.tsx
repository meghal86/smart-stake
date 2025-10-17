'use client';

import React from 'react';

interface LegendaryLayoutProps {
  mode?: 'novice' | 'pro';
  children: React.ReactNode;
}

const LegendaryLayout: React.FC<LegendaryLayoutProps> = ({ 
  mode = 'pro', 
  children 
}) => {
  const getModeBackground = () => {
    switch (mode) {
      case 'novice':
        return `
          radial-gradient(ellipse 120% 80% at 50% 0%, #27E0A3 0%, rgba(39, 224, 163, 0.3) 30%, transparent 70%),
          radial-gradient(ellipse 100% 60% at 0% 100%, #1CA9FF 0%, rgba(28, 169, 255, 0.2) 40%, transparent 80%),
          radial-gradient(ellipse 80% 100% at 100% 50%, #00D3C7 0%, rgba(0, 211, 199, 0.15) 50%, transparent 90%),
          linear-gradient(135deg, #0A2E3A 0%, #1B4B36 30%, #060D1F 70%, #000510 100%)
        `;

      default:
        return `
          radial-gradient(ellipse 120% 80% at 50% 0%, #1CA9FF 0%, rgba(28, 169, 255, 0.4) 30%, transparent 70%),
          radial-gradient(ellipse 100% 60% at 0% 100%, #6B5FFF 0%, rgba(107, 95, 255, 0.3) 40%, transparent 80%),
          radial-gradient(ellipse 80% 100% at 100% 50%, #00D3C7 0%, rgba(0, 211, 199, 0.2) 50%, transparent 90%),
          linear-gradient(135deg, #0A2E4B 0%, #1B3A5C 30%, #060D1F 70%, #000510 100%)
        `;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: getModeBackground(),
      position: 'relative'
    }}>
      {/* Cinematic parallax layers */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle 400px at 20% 80%, ${mode === 'novice' ? 'rgba(39, 224, 163, 0.1)' : 'rgba(28, 169, 255, 0.08)'} 0%, transparent 70%),
          radial-gradient(circle 300px at 80% 20%, ${mode === 'novice' ? 'rgba(28, 169, 255, 0.08)' : 'rgba(107, 95, 255, 0.06)'} 0%, transparent 70%)
        `,
        animation: 'parallaxFloat 20s ease-in-out infinite',
        pointerEvents: 'none'
      }} />
      
      {/* Dramatic whale silhouettes */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        fontSize: '150px',
        color: mode === 'novice' ? 'rgba(39, 224, 163, 0.2)' : 'rgba(28, 169, 255, 0.15)',
        pointerEvents: 'none',
        filter: 'blur(1px)'
      }}>
        <div style={{
          position: 'absolute',
          left: '5%',
          top: '60%',
          transform: 'rotate(-15deg)',
          animation: 'whaleFloat1 25s ease-in-out infinite',
          textShadow: `0 0 40px ${mode === 'novice' ? '#27E0A3' : '#1CA9FF'}80`
        }}>🐋</div>
        <div style={{
          position: 'absolute',
          right: '10%',
          top: '20%',
          fontSize: '100px',
          transform: 'rotate(10deg) scaleX(-1)',
          animation: 'whaleFloat2 30s ease-in-out infinite reverse',
          textShadow: `0 0 30px ${mode === 'novice' ? '#1CA9FF' : '#6B5FFF'}60`
        }}>🐋</div>
        <div style={{
          position: 'absolute',
          left: '70%',
          bottom: '15%',
          fontSize: '80px',
          transform: 'rotate(-5deg)',
          animation: 'whaleFloat3 35s ease-in-out infinite',
          textShadow: `0 0 25px ${mode === 'novice' ? '#00D3C7' : '#00D3C7'}40`
        }}>🐋</div>
      </div>
      
      {/* Ocean depth layers */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `
          radial-gradient(circle at 20% 30%, ${mode === 'novice' ? 'rgba(39, 224, 163, 0.15)' : 'rgba(28, 169, 255, 0.12)'} 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, ${mode === 'novice' ? 'rgba(28, 169, 255, 0.1)' : 'rgba(107, 95, 255, 0.08)'} 0%, transparent 50%),
          linear-gradient(180deg, transparent 0%, rgba(6, 13, 31, 0.3) 100%)
        `,
        pointerEvents: 'none'
      }} />
      
      {/* Floating particles */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          radial-gradient(2px 2px at 20px 30px, rgba(28, 169, 255, 0.4), transparent),
          radial-gradient(1px 1px at 40px 70px, rgba(255, 255, 255, 0.2), transparent),
          radial-gradient(1px 1px at 90px 40px, rgba(28, 169, 255, 0.3), transparent),
          radial-gradient(2px 2px at 130px 80px, rgba(107, 95, 255, 0.2), transparent)
        `,
        backgroundRepeat: 'repeat',
        backgroundSize: '200px 100px',
        animation: 'oceanDrift 25s linear infinite',
        opacity: 0.6,
        pointerEvents: 'none'
      }} />
      
      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
      
      <style>{`
        @keyframes oceanDrift {
          0% { transform: translateY(0px) translateX(0px); }
          100% { transform: translateY(-100px) translateX(50px); }
        }
        
        @keyframes whaleFloat1 {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(-15deg);
            opacity: 0.15;
          }
          50% { 
            transform: translateY(-30px) translateX(20px) rotate(-10deg);
            opacity: 0.25;
          }
        }
        
        @keyframes whaleFloat2 {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(10deg) scaleX(-1);
            opacity: 0.12;
          }
          50% { 
            transform: translateY(-25px) translateX(-15px) rotate(15deg) scaleX(-1);
            opacity: 0.2;
          }
        }
        
        @keyframes whaleFloat3 {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(-5deg);
            opacity: 0.1;
          }
          50% { 
            transform: translateY(-20px) translateX(10px) rotate(0deg);
            opacity: 0.18;
          }
        }
        
        @keyframes parallaxFloat {
          0%, 100% { 
            transform: translateY(0px) scale(1);
          }
          50% { 
            transform: translateY(-15px) scale(1.05);
          }
        }
      `}</style>
    </div>
  );
};

export default LegendaryLayout;