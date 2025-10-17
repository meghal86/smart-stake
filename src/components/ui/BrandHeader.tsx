'use client';

import React from 'react';

interface BrandHeaderProps {
  mode?: 'novice' | 'pro';
  onModeChange?: (mode: 'novice' | 'pro') => void;
}

const BrandHeader: React.FC<BrandHeaderProps> = ({ 
  mode = 'pro', 
  onModeChange 
}) => {
  const getModeConfig = () => {
    switch (mode) {
      case 'novice':
        return {
          title: 'AlphaWhale Explorer',
          subtitle: 'Discover crypto whales with confidence',
          color: '#27E0A3',
          emoji: '🌊'
        };

      default:
        return {
          title: 'AlphaWhale Intelligence',
          subtitle: 'Advanced whale tracking and market analysis',
          color: '#1CA9FF',
          emoji: '🐋'
        };
    }
  };

  const config = getModeConfig();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '32px 0',
      borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      marginBottom: '40px'
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div style={{
          fontSize: '3rem',
          filter: `drop-shadow(0 0 20px ${config.color}80)`,
          animation: 'gentleFloat 6s ease-in-out infinite'
        }}>
          {config.emoji}
        </div>
        
        <div>
          <h1 style={{
            fontSize: mode === 'novice' ? '2.5rem' : '2.25rem',
            fontWeight: 800,
            background: `linear-gradient(135deg, ${config.color} 0%, #F0F6FF 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            margin: 0,
            letterSpacing: '-0.02em'
          }}>
            {config.title}
          </h1>
          <p style={{
            color: config.color,
            fontSize: mode === 'novice' ? '1.1rem' : '1rem',
            fontWeight: 500,
            margin: '4px 0 0 0',
            opacity: 0.9
          }}>
            {config.subtitle}
          </p>
        </div>
      </div>

      {/* Mode Selector */}
      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.05)',
        borderRadius: '12px',
        padding: '4px',
        gap: '4px'
      }}>
        {(['novice', 'pro'] as const).map((modeType) => (
          <button
            key={modeType}
            onClick={() => onModeChange?.(modeType)}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              background: mode === modeType ? config.color : 'transparent',
              color: mode === modeType ? '#FFFFFF' : '#B0B0B0',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '80px'
            }}
          >
            {modeType.charAt(0).toUpperCase() + modeType.slice(1)}
          </button>
        ))}
      </div>

      <style>{`
        @keyframes gentleFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
      `}</style>
    </div>
  );
};

export default BrandHeader;