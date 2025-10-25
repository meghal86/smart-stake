/**
 * Glassmorphism UI Components
 * Beautiful frosted-glass effect components for Guardian
 */
import React, { forwardRef, HTMLAttributes, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * Glass Card - Main card component with frosted glass effect
 */
export interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'hover' | 'accent' | 'danger';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', blur = 'md', children, ...props }, ref) => {
    const blurClass = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
      xl: 'backdrop-blur-xl',
    }[blur];

    const variantClass = {
      default: 'bg-white/5 border-white/10 hover:border-white/20',
      hover: 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-blue-500/30 hover:shadow-[0_0_40px_rgba(59,130,246,0.2)]',
      accent: 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/50',
      danger: 'bg-red-500/10 border-red-500/30 hover:border-red-500/50',
    }[variant];

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border transition-all duration-300',
          blurClass,
          variantClass,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = 'GlassCard';

/**
 * Glass Panel - Full-width panel with glass effect
 */
export interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export const GlassPanel = forwardRef<HTMLDivElement, GlassPanelProps>(
  ({ className, elevated = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'backdrop-blur-xl bg-white/5 border-white/10 rounded-3xl transition-all duration-300',
          elevated && 'shadow-[0_8px_32px_rgba(0,0,0,0.12)]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassPanel.displayName = 'GlassPanel';

/**
 * Glass Button - Button with glass effect
 */
export interface GlassButtonProps extends HTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}

export const GlassButton = forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ className, variant = 'primary', size = 'md', disabled, children, ...props }, ref) => {
    const sizeClass = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    }[size];

    const variantClass = {
      primary:
        'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-[0_0_30px_rgba(59,130,246,0.4)]',
      secondary:
        'bg-white/10 border border-white/20 hover:bg-white/15 backdrop-blur-md text-slate-100',
      ghost:
        'bg-transparent hover:bg-white/5 backdrop-blur-md text-slate-300 hover:text-slate-100',
    }[variant];

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed',
          'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900',
          sizeClass,
          variantClass,
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);
GlassButton.displayName = 'GlassButton';

/**
 * Glass Input - Input field with glass effect
 */
export interface GlassInputProps extends HTMLAttributes<HTMLInputElement> {
  type?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, type = 'text', disabled, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          'w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10',
          'backdrop-blur-md text-slate-100 placeholder:text-slate-500',
          'focus:outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20',
          'transition-all duration-300',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        {...props}
      />
    );
  }
);
GlassInput.displayName = 'GlassInput';

/**
 * Glass Badge - Small badge with glass effect
 */
export interface GlassBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
}

export const GlassBadge = forwardRef<HTMLSpanElement, GlassBadgeProps>(
  ({ className, variant = 'default', children, ...props }, ref) => {
    const variantClass = {
      default: 'bg-slate-500/20 border-slate-500/30 text-slate-300',
      success: 'bg-green-500/20 border-green-500/30 text-green-400',
      warning: 'bg-amber-500/20 border-amber-500/30 text-amber-400',
      danger: 'bg-red-500/20 border-red-500/30 text-red-400',
      info: 'bg-blue-500/20 border-blue-500/30 text-blue-400',
    }[variant];

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold',
          'backdrop-blur-md border',
          variantClass,
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);
GlassBadge.displayName = 'GlassBadge';

/**
 * Glass Modal Backdrop - Backdrop with glass effect
 */
export interface GlassBackdropProps extends HTMLAttributes<HTMLDivElement> {
  visible?: boolean;
}

export const GlassBackdrop = forwardRef<HTMLDivElement, GlassBackdropProps>(
  ({ className, visible = true, children, ...props }, ref) => {
    if (!visible) return null;

    return (
      <div
        ref={ref}
        className={cn(
          'fixed inset-0 z-50',
          'bg-black/40 backdrop-blur-sm',
          'transition-all duration-300',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassBackdrop.displayName = 'GlassBackdrop';

/**
 * Glass Navigation - Top nav bar with glass effect
 */
export interface GlassNavProps extends HTMLAttributes<HTMLElement> {
  sticky?: boolean;
}

export const GlassNav = forwardRef<HTMLElement, GlassNavProps>(
  ({ className, sticky = true, children, ...props }, ref) => {
    return (
      <nav
        ref={ref}
        className={cn(
          'backdrop-blur-xl bg-slate-900/80 border-b border-white/10',
          sticky && 'sticky top-0 z-40',
          'transition-all duration-300',
          className
        )}
        {...props}
      >
        {children}
      </nav>
    );
  }
);
GlassNav.displayName = 'GlassNav';

/**
 * Glass Sidebar - Side panel with glass effect
 */
export interface GlassSidebarProps extends HTMLAttributes<HTMLDivElement> {
  position?: 'left' | 'right';
  width?: string;
}

export const GlassSidebar = forwardRef<HTMLDivElement, GlassSidebarProps>(
  ({ className, position = 'left', width = '280px', children, ...props }, ref) => {
    return (
      <aside
        ref={ref}
        className={cn(
          'backdrop-blur-xl bg-slate-900/50 border-white/10',
          position === 'left' ? 'border-r' : 'border-l',
          'transition-all duration-300',
          className
        )}
        style={{ width }}
        {...props}
      >
        {children}
      </aside>
    );
  }
);
GlassSidebar.displayName = 'GlassSidebar';

/**
 * Glass Progress Bar - Progress with glass effect
 */
export interface GlassProgressProps extends HTMLAttributes<HTMLDivElement> {
  value: number; // 0-100
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export const GlassProgress = forwardRef<HTMLDivElement, GlassProgressProps>(
  ({ className, value, variant = 'default', ...props }, ref) => {
    const variantClass = {
      default: 'bg-gradient-to-r from-blue-500 to-purple-600',
      success: 'bg-gradient-to-r from-green-500 to-emerald-600',
      warning: 'bg-gradient-to-r from-amber-500 to-orange-600',
      danger: 'bg-gradient-to-r from-red-500 to-rose-600',
    }[variant];

    return (
      <div
        ref={ref}
        className={cn(
          'h-2 w-full rounded-full overflow-hidden',
          'bg-white/10 backdrop-blur-md',
          className
        )}
        {...props}
      >
        <div
          className={cn('h-full transition-all duration-500 ease-out', variantClass)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    );
  }
);
GlassProgress.displayName = 'GlassProgress';

/**
 * Glass Tooltip - Tooltip with glass effect
 */
export interface GlassTooltipProps extends HTMLAttributes<HTMLDivElement> {
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const GlassTooltip = forwardRef<HTMLDivElement, GlassTooltipProps>(
  ({ className, content, position = 'top', children, ...props }, ref) => {
    const [visible, setVisible] = useState(false);

    const positionClass = {
      top: '-top-2 left-1/2 -translate-x-1/2 -translate-y-full',
      bottom: '-bottom-2 left-1/2 -translate-x-1/2 translate-y-full',
      left: 'top-1/2 -left-2 -translate-x-full -translate-y-1/2',
      right: 'top-1/2 -right-2 translate-x-full -translate-y-1/2',
    }[position];

    return (
      <div
        ref={ref}
        className="relative inline-block"
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        {...props}
      >
        {children}
        
        {visible && (
          <div
            className={cn(
              'absolute z-50 px-3 py-2 rounded-lg',
              'backdrop-blur-xl bg-slate-900/95 border border-white/20',
              'text-sm text-slate-100 whitespace-nowrap',
              'shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
              'animate-in fade-in slide-in-from-top-2 duration-200',
              positionClass,
              className
            )}
          >
            {content}
          </div>
        )}
      </div>
    );
  }
);
GlassTooltip.displayName = 'GlassTooltip';

/**
 * Glass Divider - Subtle divider line
 */
export const GlassDivider = forwardRef<HTMLHRElement, HTMLAttributes<HTMLHRElement>>(
  ({ className, ...props }, ref) => {
    return (
      <hr
        ref={ref}
        className={cn('border-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent', className)}
        {...props}
      />
    );
  }
);
GlassDivider.displayName = 'GlassDivider';

