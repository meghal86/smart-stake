'use client';

import React, { useState } from 'react';
import { Button } from './button';

interface ActionChipProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  active?: boolean;
}

const ActionChip: React.FC<ActionChipProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon,
  active = false
}) => {
  const [isClicked, setIsClicked] = useState(false);
  
  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          background: active 
            ? 'linear-gradient(135deg, #FF4757 0%, #FF3742 100%)'
            : 'linear-gradient(135deg, rgba(255, 71, 87, 0.2) 0%, rgba(255, 71, 87, 0.1) 100%)',
          border: '1px solid rgba(255, 71, 87, 0.4)',
          color: active ? '#FFFFFF' : '#FF4757',
          boxShadow: active ? '0 0 25px rgba(255, 71, 87, 0.5)' : '0 0 15px rgba(255, 71, 87, 0.2)'
        };
      case 'secondary':
        return {
          background: active
            ? 'linear-gradient(135deg, #6B5FFF 0%, #9C88FF 100%)'
            : 'linear-gradient(135deg, rgba(107, 95, 255, 0.2) 0%, rgba(107, 95, 255, 0.1) 100%)',
          border: '1px solid rgba(107, 95, 255, 0.4)',
          color: active ? '#FFFFFF' : '#6B5FFF',
          boxShadow: active ? '0 0 25px rgba(107, 95, 255, 0.5)' : '0 0 15px rgba(107, 95, 255, 0.2)'
        };
      default:
        return {
          background: active
            ? 'linear-gradient(135deg, #1CA9FF 0%, #00D3C7 100%)'
            : 'linear-gradient(135deg, rgba(28, 169, 255, 0.2) 0%, rgba(28, 169, 255, 0.1) 100%)',
          border: '1px solid rgba(28, 169, 255, 0.4)',
          color: active ? '#060D1F' : '#1CA9FF',
          boxShadow: active ? '0 0 25px rgba(28, 169, 255, 0.5)' : '0 0 15px rgba(28, 169, 255, 0.2)'
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return { padding: '8px 16px', fontSize: '0.875rem', borderRadius: '20px' };
      case 'lg':
        return { padding: '16px 32px', fontSize: '1.125rem', borderRadius: '28px' };
      default:
        return { padding: '12px 24px', fontSize: '1rem', borderRadius: '24px' };
    }
  };

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => setIsClicked(false), 200);
    onClick?.();
  };

  return (
    <Button
      onClick={handleClick}
      style={{
        ...getVariantStyles(),
        ...getSizeStyles(),
        fontWeight: 600,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isClicked ? 'scale(0.95)' : 'scale(1)',
        animation: active ? 'chipGlow 2s ease-in-out infinite' : 'none',
        display: 'inline-flex',
        alignItems: 'center',
        gap: icon ? '8px' : '0',
        whiteSpace: 'nowrap',
        minHeight: '44px', // Accessibility: minimum touch target
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px) scale(1.05)';
        e.currentTarget.style.boxShadow = '0 8px 30px rgba(28, 169, 255, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0) scale(1)';
        e.currentTarget.style.boxShadow = getVariantStyles().boxShadow;
      }}
    >
      {icon && <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>}
      {children}
      
      <style>{`
        @keyframes chipGlow {
          0%, 100% { 
            box-shadow: 0 0 20px rgba(28, 169, 255, 0.3);
          }
          50% { 
            box-shadow: 0 0 35px rgba(28, 169, 255, 0.6);
          }
        }
      `}</style>
    </Button>
  );
};

export default ActionChip;