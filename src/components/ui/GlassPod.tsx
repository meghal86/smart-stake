'use client';

import React, { useState } from 'react';
import { Card } from './card';
import { Button } from './button';
import { HelpCircle } from 'lucide-react';

interface GlassPodProps {
  title: string;
  children: React.ReactNode;
  mode?: 'novice' | 'pro' | 'simuto';
  updating?: boolean;
  onExplain?: () => void;
}

const GlassPod: React.FC<GlassPodProps> = ({ 
  title, 
  children, 
  mode = 'pro', 
  updating = false,
  onExplain 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const getCardSize = () => {
    switch (mode) {
      case 'novice': return { padding: '32px', minHeight: '200px' };
      case 'simuto': return { padding: '16px', minHeight: '120px' };
      default: return { padding: '24px', minHeight: '160px' };
    }
  };

  const cardStyle = getCardSize();

  return (
    <Card 
      style={{
        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.06) 100%)',
        backdropFilter: 'blur(24px)',
        border: updating ? '2px solid rgba(28, 169, 255, 0.6)' : '1px solid rgba(28, 169, 255, 0.2)',
        boxShadow: `
          0 12px 40px rgba(0, 0, 0, 0.4),
          inset 0 1px 0 rgba(255, 255, 255, 0.15),
          ${updating ? '0 0 30px rgba(28, 169, 255, 0.4)' : '0 0 0 transparent'}
        `,
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isHovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
        animation: updating ? 'podPulse 2s ease-in-out infinite' : 'none',
        margin: '16px 0',
        ...cardStyle
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: mode === 'novice' ? '24px' : '16px'
      }}>
        <h3 style={{
          fontSize: mode === 'novice' ? '1.5rem' : mode === 'simuto' ? '1rem' : '1.25rem',
          fontWeight: 700,
          color: '#F0F6FF',
          textShadow: '0 0 15px rgba(240, 246, 255, 0.3)',
          margin: 0
        }}>
          {title}
        </h3>
        
        {onExplain && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onExplain}
            style={{
              background: 'rgba(28, 169, 255, 0.1)',
              border: '1px solid rgba(28, 169, 255, 0.3)',
              color: '#1CA9FF',
              padding: '8px'
            }}
          >
            <HelpCircle className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      <div style={{ 
        fontSize: mode === 'novice' ? '1.1rem' : mode === 'simuto' ? '0.9rem' : '1rem',
        lineHeight: mode === 'novice' ? '1.6' : '1.4'
      }}>
        {children}
      </div>
      
      <style>{`
        @keyframes podPulse {
          0%, 100% { 
            box-shadow: 
              0 12px 40px rgba(0, 0, 0, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.15),
              0 0 20px rgba(28, 169, 255, 0.3);
          }
          50% { 
            box-shadow: 
              0 16px 50px rgba(0, 0, 0, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.2),
              0 0 40px rgba(28, 169, 255, 0.6);
          }
        }
      `}</style>
    </Card>
  );
};

export default GlassPod;