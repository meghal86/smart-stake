// Motion tokens for consistent micro-animations
export const motionTokens = {
  fast: '120ms ease-out',
  normal: '200ms ease-in-out', 
  slow: '300ms ease-in-out',
} as const;

export const animations = {
  // Confidence bars - data charging effect
  confidenceFill: 'animate-[width_300ms_ease-out]',
  
  // Buy-side badge - market heartbeat
  marketPulse: 'animate-pulse duration-2000',
  
  // Button interactions - physicality cue
  buttonRipple: 'active:scale-95 transition-transform duration-75',
  buttonLift: 'hover:translate-y-[-2px] transition-transform duration-120',
  
  // Inline CTA - discoverability
  fadeInOnHover: 'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
  
  // Live indicator - system vitality
  breathingPulse: 'animate-[pulse_2s_ease-in-out_infinite] opacity-60',
} as const;

export const motionClasses = {
  // Smooth transitions
  smooth: `transition-all ${motionTokens.normal}`,
  fast: `transition-all ${motionTokens.fast}`,
  slow: `transition-all ${motionTokens.slow}`,
  
  // Hover states
  hoverLift: 'hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200',
  hoverScale: 'hover:scale-105 transition-transform duration-200',
} as const;