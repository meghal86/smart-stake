'use client';

import React from 'react';
import { Button } from './button';
import { Moon, Sun } from 'lucide-react';

interface LegendaryFooterProps {
  theme?: 'dark' | 'light';
  onThemeToggle?: () => void;
}

const LegendaryFooter: React.FC<LegendaryFooterProps> = ({ 
  theme = 'dark', 
  onThemeToggle 
}) => (
  <footer style={{
    position: 'sticky',
    bottom: 0,
    zIndex: 100,
    background: 'linear-gradient(145deg, rgba(6, 13, 31, 0.95) 0%, rgba(7, 54, 116, 0.95) 100%)',
    backdropFilter: 'blur(20px)',
    borderTop: '1px solid rgba(28, 169, 255, 0.2)',
    padding: '16px 24px',
    boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.3)'
  }}>
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '16px'
    }}>
      {/* Brand & Copyright */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        color: '#7F9BBF',
        fontSize: '0.875rem'
      }}>
        <span style={{
          fontSize: '1.5rem',
          filter: 'drop-shadow(0 0 10px rgba(28, 169, 255, 0.4))'
        }}>
          🐋
        </span>
        <span>© 2024 AlphaWhale Intelligence</span>
        <span style={{ opacity: 0.6 }}>|</span>
        <span style={{ opacity: 0.8 }}>Master the DeFi Waves</span>
      </div>

      {/* Build Info & Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px'
      }}>
        {/* Build Version */}
        <div style={{
          background: 'rgba(28, 169, 255, 0.1)',
          border: '1px solid rgba(28, 169, 255, 0.2)',
          borderRadius: '12px',
          padding: '4px 12px',
          fontSize: '0.75rem',
          color: '#1CA9FF',
          fontFamily: 'monospace'
        }}>
          v5.2.1-legendary
        </div>

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onThemeToggle}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#F0F6FF',
            padding: '8px',
            borderRadius: '8px',
            minHeight: '36px',
            minWidth: '36px'
          }}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </Button>

        {/* Status Indicator */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#27E0A3',
          fontSize: '0.875rem'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: '#27E0A3',
            boxShadow: '0 0 10px rgba(39, 224, 163, 0.5)',
            animation: 'statusPulse 2s ease-in-out infinite'
          }} />
          <span>Live</span>
        </div>
      </div>
    </div>

    <style>{`
      @keyframes statusPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(1.2); }
      }
    `}</style>
  </footer>
);

export default LegendaryFooter;