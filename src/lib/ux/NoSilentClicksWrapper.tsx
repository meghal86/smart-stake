import React from 'react';

interface NoSilentClicksWrapperProps {
  children: React.ReactNode;
  fallbackAction?: () => void;
  errorMessage?: string;
}

export const NoSilentClicksWrapper: React.FC<NoSilentClicksWrapperProps> = ({ 
  children, 
  fallbackAction, 
  errorMessage 
}) => {
  return <>{children}</>;
};