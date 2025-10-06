import { cn } from '@/lib/utils'

// Motion utility classes with prefers-reduced-motion support
export const motionClasses = {
  shimmer: 'bg-[linear-gradient(110deg,transparent,rgba(255,255,255,.25),transparent)] [background-size:200%_100%] motion-safe:animate-[shimmer_2.5s_linear_infinite]',
  pulseGentle: 'motion-safe:animate-[gentlePulse_1.8s_ease-in-out_infinite]',
  slideIn: 'motion-safe:animate-[slideIn_240ms_ease-out]',
  springCollapse: 'motion-safe:transition-all motion-safe:duration-300 motion-safe:ease-out'
}

export function getMotionClass(type: keyof typeof motionClasses, className?: string) {
  return cn(motionClasses[type], className)
}

// Check if user prefers reduced motion
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}