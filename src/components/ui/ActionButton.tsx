'use client';

import React from 'react';

interface ActionButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: 'linear-gradient(135deg, #1CA9FF 0%, #00D3C7 30%, #6B5FFF 70%, #9C88FF 100%)',
          color: '#FFFFFF',
          border: 'none',
          boxShadow: `
            0 0 40px rgba(28, 169, 255, 0.8),
            0 12px 40px rgba(0, 0, 0, 0.4),
            inset 0 2px 0 rgba(255, 255, 255, 0.3)
          `,
          animation: 'buttonGlow 3s ease-in-out infinite'
        };
      case 'secondary':
        return {
          background: `
            linear-gradient(145deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.08) 100%),
            radial-gradient(circle at 30% 30%, rgba(28, 169, 255, 0.15) 0%, transparent 70%)
          `,
          color: '#F0F6FF',
          border: '1px solid rgba(255, 255, 255, 0.4)',
          boxShadow: `
            inset 0 2px 0 rgba(255, 255, 255, 0.25),
            0 8px 25px rgba(0, 0, 0, 0.3),
            0 0 20px rgba(28, 169, 255, 0.2)
          `
        };
      default:
        return {
          background: `
            linear-gradient(145deg, rgba(28, 169, 255, 0.15) 0%, rgba(28, 169, 255, 0.05) 100%),
            radial-gradient(circle at 50% 50%, rgba(28, 169, 255, 0.12) 0%, transparent 70%)
          `,
          color: '#1CA9FF',
          border: '1px solid rgba(28, 169, 255, 0.6)',
          boxShadow: `
            inset 0 1px 0 rgba(28, 169, 255, 0.3),
            0 0 25px rgba(28, 169, 255, 0.4),
            0 6px 20px rgba(0, 0, 0, 0.2)
          `
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm': return { padding: '8px 16px', fontSize: '0.875rem', minHeight: '36px' };
      case 'lg': return { padding: '16px 32px', fontSize: '1.125rem', minHeight: '52px' };
      default: return { padding: '12px 24px', fontSize: '1rem', minHeight: '44px' };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        ...sizeStyles,
        ...variantStyles,
        borderRadius: '16px',
        fontWeight: 700,
        cursor: loading ? 'not-allowed' : 'pointer',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: icon ? '8px' : '0',
        opacity: loading ? 0.7 : 1,
        position: 'relative',
        overflow: 'hidden',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        textShadow: variant === 'primary' ? '0 1px 2px rgba(0, 0, 0, 0.3)' : 'none'
      }}
      onMouseEnter={(e) => {
        if (!loading) {
          e.currentTarget.style.transform = 'translateY(-8px) scale(1.05)';
          e.currentTarget.style.boxShadow = `
            0 25px 60px rgba(0, 0, 0, 0.4),
            0 0 80px rgba(28, 169, 255, 0.8),
            inset 0 2px 0 rgba(255, 255, 255, 0.4)
          `;
          e.currentTarget.style.filter = 'brightness(1.2) saturate(1.3)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = variantStyles.boxShadow || 'none';
        e.currentTarget.style.filter = 'brightness(1) saturate(1)';
      }}
    >
      {/* Shimmer effect */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: loading ? '-100%' : '-200%',
        width: '100%',
        height: '100%',
        background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
        transition: 'left 0.6s ease-out',
        pointerEvents: 'none'
      }} />
      
      {loading ? (
        <div style={{
          width: '18px',
          height: '18px',
          border: '2px solid rgba(255, 255, 255, 0.3)',
          borderTop: '2px solid currentColor',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
      ) : (
        <>
          {icon && <span style={{ position: 'relative', zIndex: 2 }}>{icon}</span>}
          <span style={{ position: 'relative', zIndex: 2 }}>{children}</span>
        </>
      )}
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes buttonGlow {
          0%, 100% { 
            box-shadow: 
              0 0 40px rgba(28, 169, 255, 0.8),
              0 12px 40px rgba(0, 0, 0, 0.4),
              inset 0 2px 0 rgba(255, 255, 255, 0.3);
          }
          50% { 
            box-shadow: 
              0 0 60px rgba(28, 169, 255, 1),
              0 15px 50px rgba(0, 0, 0, 0.5),
              inset 0 2px 0 rgba(255, 255, 255, 0.4);
          }
        }
      `}</style>
    </button>
  );
};

export default ActionButton;