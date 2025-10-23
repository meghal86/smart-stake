/**
 * Guardian Glow Buttons
 * Tesla × Apple × Airbnb inspired interactive elements
 */
import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface GlowButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'glow' | 'outlineGlow' | 'subtle';
  children: React.ReactNode;
}

const GlowButton = React.forwardRef<HTMLButtonElement, GlowButtonProps>(
  ({ className, variant = 'glow', children, ...props }, ref) => {
    const variants = {
      glow: cn(
        'relative overflow-hidden',
        'bg-gradient-to-r from-emerald-500 to-teal-500',
        'text-white font-semibold tracking-wide',
        'px-8 py-3 rounded-xl',
        'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
        'transition-shadow duration-300',
        'hover:shadow-[0_0_40px_rgba(16,185,129,0.6),0_0_10px_rgba(16,185,129,0.4)_inset]',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      ),
      outlineGlow: cn(
        'relative overflow-hidden',
        'bg-transparent border-2 border-emerald-500/50',
        'text-emerald-400 font-semibold tracking-wide',
        'px-8 py-3 rounded-xl',
        'backdrop-blur-sm',
        'transition-all duration-300',
        'hover:border-emerald-400',
        'hover:bg-emerald-500/10',
        'hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]',
        'hover:text-emerald-300',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      ),
      subtle: cn(
        'relative',
        'bg-slate-800/50 backdrop-blur-sm',
        'text-slate-300 font-medium tracking-wide',
        'px-6 py-3 rounded-xl',
        'border border-slate-700/50',
        'transition-all duration-300',
        'hover:bg-slate-700/50',
        'hover:text-white',
        'hover:border-slate-600',
        'active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed'
      ),
    };

    return (
      <motion.button
        ref={ref}
        className={cn(variants[variant], className)}
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        {...props}
      >
        {variant === 'glow' && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            animate={{
              x: ['-100%', '200%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        )}
        <span className="relative z-10">{children}</span>
      </motion.button>
    );
  }
);

GlowButton.displayName = 'GlowButton';

export { GlowButton };

