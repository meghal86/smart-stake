'use client';

import React from 'react';

interface BrandHeaderProps {}

const BrandHeader: React.FC<BrandHeaderProps> = () => {
  const config = {
    title: 'AlphaWhale Intelligence',
    subtitle: 'Advanced whale tracking and market analysis',
    color: '#1CA9FF',
    emoji: '🐋'
  };

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
            fontSize: '2.25rem',
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
            fontSize: '1rem',
            fontWeight: 500,
            margin: '4px 0 0 0',
            opacity: 0.9
          }}>
            {config.subtitle}
          </p>
        </div>
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