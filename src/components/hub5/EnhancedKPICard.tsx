'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnhancedKPICardProps {
  title: string
  value: string
  subtitle?: string
  badge?: string
  badgeColor?: 'green' | 'red' | 'yellow'
  tooltip: string
  lastUpdated?: string
  emoji?: string
  icon?: React.ReactNode
  meter?: number
  thermometer?: number
  onClick?: () => void
}

export function EnhancedKPICard({
  title,
  value,
  subtitle,
  badge,
  badgeColor = 'green',
  tooltip,
  lastUpdated = '2min ago',
  emoji,
  icon,
  meter,
  thermometer,
  onClick
}: EnhancedKPICardProps) {
  const badgeColors = {
    green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    yellow: 'bg-amber-500/20 text-amber-400 border-amber-500/30'
  }

  return (
    <Card 
      className="rounded-2xl shadow-md hover:shadow-lg transition-all cursor-pointer bg-slate-900/70 border-slate-700 hover:border-slate-600"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-sm font-medium text-slate-300">{title}</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-4 h-4 text-slate-500 hover:text-slate-300 transition-colors" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs bg-slate-800 border-slate-700">
                    <p className="text-sm">{tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            
            <div className="flex items-baseline gap-2">
              {emoji && <span className="text-2xl">{emoji}</span>}
              <div className="text-3xl font-bold text-white">{value}</div>
              {subtitle && <span className="text-sm text-slate-400">{subtitle}</span>}
            </div>
          </div>
          
          {icon && <div className="ml-2">{icon}</div>}
        </div>

        {badge && (
          <Badge className={cn('mb-2', badgeColors[badgeColor])}>
            {badge}
          </Badge>
        )}

        {meter !== undefined && (
          <div className="mb-2">
            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={cn(
                  'h-full transition-all duration-500',
                  meter > 70 ? 'bg-emerald-500' : meter > 40 ? 'bg-amber-500' : 'bg-red-500'
                )}
                style={{ width: `${meter}%` }}
              />
            </div>
          </div>
        )}

        {thermometer !== undefined && (
          <div className="mb-2 flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                className={cn(
                  'h-2 flex-1 rounded-full transition-all duration-300',
                  i < Math.ceil(thermometer / 20) 
                    ? thermometer > 60 ? 'bg-red-500' : thermometer > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                    : 'bg-slate-800'
                )}
              />
            ))}
          </div>
        )}

        <div className="text-xs text-slate-500">Updated {lastUpdated}</div>
      </CardContent>
    </Card>
  )
}
