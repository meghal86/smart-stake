import { useRef } from 'react'

export function usePulseOn<T extends HTMLElement>(reasons: string[]) {
  const ref = useRef<T>(null)
  const last = useRef(0)
  
  return {
    ref,
    pulse: (reason: string) => {
      const now = Date.now()
      if (now - last.current < 30000) return // Throttle to 30s
      
      if (reasons.includes(reason) && ref.current) {
        ref.current.classList.add('motion-safe:animate-microPulse')
        setTimeout(() => {
          ref.current?.classList.remove('motion-safe:animate-microPulse')
        }, 950)
        last.current = now
      }
    }
  }
}