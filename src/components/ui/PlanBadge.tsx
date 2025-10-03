import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export type PlanTier = 'lite' | 'pro' | 'premium' | 'institutional'

interface PlanBadgeProps {
  plan: PlanTier
  onClick?: () => void
  className?: string
}

const planConfig: Record<PlanTier, { color: string; label: string }> = {
  lite: { color: '#22d3ee', label: 'Lite' },
  pro: { color: '#10b981', label: 'Pro' },
  premium: { color: '#0ea5e9', label: 'Premium' },
  institutional: { color: '#a78bfa', label: 'Enterprise' }
}

export default function PlanBadge({ plan, onClick, className }: PlanBadgeProps) {
  const config = planConfig[plan]
  
  return (
    <Link 
      to="/plans" 
      onClick={onClick}
      aria-label="Manage plan"
      className={cn(
        "rounded-full px-2 py-1 text-xs font-medium transition-all hover:scale-105",
        className
      )}
      style={{ 
        backgroundColor: `${config.color}22`, 
        color: config.color, 
        border: `1px solid ${config.color}55` 
      }}
    >
      {config.label}
    </Link>
  )
}