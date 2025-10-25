/**
 * Animation Library
 * Reusable animation components and utilities for Guardian
 * Respects prefers-reduced-motion
 */
import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * Check if user prefers reduced motion
 */
export function usePrefersReducedMotion() {
  const shouldReduceMotion = useReducedMotion();
  return shouldReduceMotion;
}

/**
 * Easing Functions
 */
export const easings = {
  easeInOut: [0.4, 0, 0.2, 1],
  easeOut: [0.0, 0, 0.2, 1],
  easeIn: [0.4, 0, 1, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  spring: [0.34, 1.56, 0.64, 1],
} as const;

/**
 * Duration Presets
 */
export const durations = {
  instant: 0.1,
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  slower: 0.8,
} as const;

/**
 * Fade In Animation
 */
interface FadeInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FadeIn({ children, delay = 0, duration = durations.normal, className }: FadeInProps) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0.01 : duration,
        delay: shouldReduceMotion ? 0 : delay,
        ease: easings.easeOut,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Slide In Animation
 */
interface SlideInProps {
  children: React.ReactNode;
  direction?: 'up' | 'down' | 'left' | 'right';
  delay?: number;
  duration?: number;
  className?: string;
}

export function SlideIn({
  children,
  direction = 'up',
  delay = 0,
  duration = durations.normal,
  className,
}: SlideInProps) {
  const shouldReduceMotion = usePrefersReducedMotion();

  const directionOffset = {
    up: { x: 0, y: 20 },
    down: { x: 0, y: -20 },
    left: { x: 20, y: 0 },
    right: { x: -20, y: 0 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directionOffset[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...directionOffset[direction] }}
      transition={{
        duration: shouldReduceMotion ? 0.01 : duration,
        delay: shouldReduceMotion ? 0 : delay,
        ease: easings.easeOut,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scale In Animation (Bounce)
 */
interface ScaleInProps {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function ScaleIn({ children, delay = 0, duration = durations.slow, className }: ScaleInProps) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.3 }}
      transition={{
        duration: shouldReduceMotion ? 0.01 : duration,
        delay: shouldReduceMotion ? 0 : delay,
        ease: shouldReduceMotion ? easings.easeOut : easings.bounce,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger Children Animation
 */
interface StaggerProps {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
}

export function Stagger({ children, staggerDelay = 0.1, className }: StaggerProps) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Count Up Animation
 */
interface CountUpProps {
  from?: number;
  to: number;
  duration?: number;
  decimals?: number;
  suffix?: string;
  className?: string;
}

export function CountUp({
  from = 0,
  to,
  duration = durations.slow,
  decimals = 0,
  suffix = '',
  className,
}: CountUpProps) {
  const [count, setCount] = useState(from);
  const shouldReduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setCount(to);
      return;
    }

    const startTime = Date.now();
    const diff = to - from;

    const animate = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / (duration * 1000), 1);

      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3);

      setCount(from + diff * eased);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [from, to, duration, shouldReduceMotion]);

  return (
    <span className={className}>
      {count.toFixed(decimals)}
      {suffix}
    </span>
  );
}

/**
 * Pulse Animation
 */
interface PulseProps {
  children: React.ReactNode;
  scale?: number;
  duration?: number;
  className?: string;
}

export function Pulse({ children, scale = 1.05, duration = 2, className }: PulseProps) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <motion.div
      animate={{
        scale: shouldReduceMotion ? 1 : [1, scale, 1],
        opacity: shouldReduceMotion ? 1 : [1, 0.8, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: easings.easeInOut,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Shake Animation (for errors)
 */
interface ShakeProps {
  children: React.ReactNode;
  trigger: boolean;
  className?: string;
}

export function Shake({ children, trigger, className }: ShakeProps) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <motion.div
      animate={
        trigger && !shouldReduceMotion
          ? {
              x: [0, -10, 10, -10, 10, 0],
              transition: { duration: 0.5 },
            }
          : {}
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Shimmer Loading Effect
 */
interface ShimmerProps {
  width?: string;
  height?: string;
  className?: string;
}

export function Shimmer({ width = '100%', height = '20px', className }: ShimmerProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded bg-slate-800',
        className
      )}
      style={{ width, height }}
    >
      <motion.div
        className="absolute inset-0 -translate-x-full"
        animate={{
          translateX: ['0%', '200%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
        }}
      />
    </div>
  );
}

/**
 * Skeleton Loader
 */
interface SkeletonProps {
  count?: number;
  className?: string;
}

export function Skeleton({ count = 1, className }: SkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <Shimmer key={i} height="20px" />
      ))}
    </div>
  );
}

/**
 * Ripple Effect (Material Design style)
 */
interface RippleProps {
  color?: string;
  duration?: number;
}

export function useRipple({ color = 'rgba(255, 255, 255, 0.3)', duration = 600 }: RippleProps = {}) {
  const createRipple = (event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    const rect = button.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.style.background = color;
    circle.classList.add('ripple');

    const ripple = button.getElementsByClassName('ripple')[0];
    if (ripple) {
      ripple.remove();
    }

    button.appendChild(circle);

    setTimeout(() => {
      circle.remove();
    }, duration);
  };

  return createRipple;
}

/**
 * Page Transition Wrapper
 */
interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: shouldReduceMotion ? 0.01 : durations.normal,
        ease: easings.easeInOut,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Floating Action Button Animation
 */
interface FloatingButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function FloatingButton({ children, onClick, className }: FloatingButtonProps) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <motion.button
      onClick={onClick}
      whileHover={
        shouldReduceMotion
          ? {}
          : { scale: 1.1, boxShadow: '0 10px 40px rgba(59, 130, 246, 0.5)' }
      }
      whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
      className={cn(
        'fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-lg flex items-center justify-center text-white z-50',
        className
      )}
    >
      {children}
    </motion.button>
  );
}

/**
 * Progress Circle Animation
 */
interface ProgressCircleProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
}

export function ProgressCircle({
  percentage,
  size = 120,
  strokeWidth = 8,
  color = '#3B82F6',
  className,
}: ProgressCircleProps) {
  const shouldReduceMotion = usePrefersReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <svg width={size} height={size} className={className}>
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="rgba(255, 255, 255, 0.1)"
        strokeWidth={strokeWidth}
      />
      {/* Progress circle */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
        animate={{ strokeDashoffset: offset }}
        transition={{
          duration: shouldReduceMotion ? 0.01 : durations.slow,
          ease: easings.easeOut,
        }}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

/**
 * Toast Notification Animation
 */
export function ToastAnimation({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const shouldReduceMotion = usePrefersReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.8 }}
      transition={{
        duration: shouldReduceMotion ? 0.01 : durations.fast,
        ease: shouldReduceMotion ? easings.easeOut : easings.spring,
      }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.2}
      onDragEnd={(_, info) => {
        if (info.offset.y < -100) {
          onClose();
        }
      }}
    >
      {children}
    </motion.div>
  );
}

// Add CSS for ripple effect
const rippleStyles = `
  .ripple {
    position: absolute;
    border-radius: 50%;
    transform: scale(0);
    animation: ripple-animation 600ms linear;
    pointer-events: none;
  }

  @keyframes ripple-animation {
    to {
      transform: scale(4);
      opacity: 0;
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = rippleStyles;
  document.head.appendChild(style);
}

