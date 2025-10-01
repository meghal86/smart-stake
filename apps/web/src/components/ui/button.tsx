import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const buttonVariants = {
  primary: 'bg-teal-600 hover:bg-teal-700 text-white font-medium transition-colors',
  secondary: 'border border-slate-600 hover:bg-slate-700 text-white font-medium transition-colors bg-transparent',
  tertiary: 'text-slate-400 hover:text-white font-medium transition-colors bg-transparent border-none'
};

const buttonSizes = {
  sm: 'px-2 py-1 text-xs rounded',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-xl'
};

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}: ButtonProps) {
  return (
    <button
      className={`min-w-[44px] min-h-[44px] flex items-center justify-center ${buttonVariants[variant]} ${buttonSizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}