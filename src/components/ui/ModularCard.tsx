'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';

interface ModularCardProps {
  title: string;
  children: React.ReactNode;
  mode?: 'novice' | 'pro';
  updating?: boolean;
  onExplain?: () => void;
  priority?: 'high' | 'medium' | 'low';
  category?: 'intelligence' | 'signals' | 'data' | 'action';
}

const ModularCard: React.FC<ModularCardProps> = ({ 
  title, 
  children, 
  mode = 'pro', 
  updating = false,
  onExplain,
  priority = 'medium',
  category = 'data'
}) => {
  const getCategoryColor = () => {
    switch (category) {
      case 'intelligence': return '#1CA9FF';
      case 'signals': return '#27E0A3';
      case 'action': return '#FFC107';
      default: return '#6B5FFF';
    }
  };

  const getPriorityStyles = () => {
    switch (priority) {
      case 'high': return { borderWidth: '2px', shadow: '0 8px 32px rgba(28, 169, 255, 0.2)' };
      case 'low': return { borderWidth: '1px', shadow: '0 4px 16px rgba(0, 0, 0, 0.1)' };
      default: return { borderWidth: '1px', shadow: '0 6px 24px rgba(0, 0, 0, 0.15)' };
    }
  };

  const getModeSpacing = () => {
    switch (mode) {
      case 'novice': return { padding: '32px', gap: '24px' };
      default: return { padding: '24px', gap: '16px' };
    }
  };

  const categoryColor = getCategoryColor();
  const priorityStyles = getPriorityStyles();
  const spacing = getModeSpacing();

  return (
    <div style={{
      background: `
        linear-gradient(145deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.05) 100%),
        radial-gradient(circle at 30% 20%, ${categoryColor}20 0%, transparent 60%)
      `,
      backdropFilter: 'blur(40px) saturate(1.8)',
      WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
      border: `2px solid rgba(255, 255, 255, 0.2)`,
      borderLeft: `6px solid ${categoryColor}`,
      borderRadius: mode === 'novice' ? '32px' : '24px',
      padding: spacing.padding,
      boxShadow: `
        0 20px 60px rgba(0, 0, 0, 0.4),
        0 0 40px ${categoryColor}30,
        inset 0 2px 0 rgba(255, 255, 255, 0.2),
        inset 0 -2px 0 rgba(0, 0, 0, 0.1)
      `,
      transition: 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative' as const,
      overflow: 'hidden',
      transform: 'translateZ(0)',
      ...(updating && {
        borderColor: categoryColor,
        boxShadow: `
          0 25px 80px rgba(0, 0, 0, 0.5),
          0 0 60px ${categoryColor}80,
          inset 0 2px 0 rgba(255, 255, 255, 0.3)
        `,
        animation: 'cinematicPulse 2s ease-in-out infinite'
      })
    }}>
      {/* Shimmer overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: updating ? '-100%' : '-200%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.6), transparent)',
        transition: 'left 1.5s ease-out',
        pointerEvents: 'none',
        zIndex: 1
      }} />
      
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.gap,
        position: 'relative',
        zIndex: 2
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '10px',
            height: '10px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${categoryColor} 0%, ${categoryColor}80 100%)`,
            boxShadow: `
              0 0 12px ${categoryColor}80,
              inset 0 1px 0 rgba(255, 255, 255, 0.3)
            `,
            animation: updating ? 'categoryPulse 2s ease-in-out infinite' : 'none'
          }} />
          <h3 style={{
            fontSize: mode === 'novice' ? '1.25rem' : '1.1rem',
            fontWeight: 600,
            color: '#F0F6FF',
            margin: 0
          }}>
            {title}
          </h3>
        </div>
        
        {onExplain && (
          <button
            onClick={onExplain}
            style={{
              background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              padding: '10px',
              color: '#F0F6FF',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              minHeight: '44px',
              minWidth: '44px',
              backdropFilter: 'blur(10px)',
              boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1) translateY(-2px)';
              e.currentTarget.style.boxShadow = `0 8px 25px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.3)`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1) translateY(0)';
              e.currentTarget.style.boxShadow = 'inset 0 1px 0 rgba(255, 255, 255, 0.2)';
            }}
          >
            <HelpCircle size={16} />
          </button>
        )}
      </div>
      
      {/* Content */}
      <div style={{
        fontSize: mode === 'novice' ? '1rem' : '0.95rem',
        lineHeight: '1.5',
        color: '#E2E8F0',
        position: 'relative',
        zIndex: 2
      }}>
        {children}
      </div>
      
      <style>{`
        @keyframes categoryPulse {
          0%, 100% { 
            box-shadow: 
              0 0 12px ${categoryColor}80,
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
          }
          50% { 
            box-shadow: 
              0 0 20px ${categoryColor},
              inset 0 1px 0 rgba(255, 255, 255, 0.4);
          }
        }
        
        @keyframes cinematicPulse {
          0%, 100% { 
            box-shadow: 
              0 20px 60px rgba(0, 0, 0, 0.4),
              0 0 40px ${categoryColor}30,
              inset 0 2px 0 rgba(255, 255, 255, 0.2);
          }
          50% { 
            box-shadow: 
              0 25px 80px rgba(0, 0, 0, 0.5),
              0 0 80px ${categoryColor}80,
              inset 0 2px 0 rgba(255, 255, 255, 0.3);
          }
        }
      `}</style>
    </div>
  );
};

export default ModularCard;