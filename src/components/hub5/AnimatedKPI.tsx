'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnimatedKPIProps {
  title: string
  value: number
  previousValue?: number
  format?: 'percentage' | 'currency' | 'number'
  icon?: React.ReactNode
  className?: string
}

export default function AnimatedKPI({ 
  title, 
  value, 
  previousValue, 
  format = 'number',
  icon,
  className 
}: AnimatedKPIProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    if (previousValue !== undefined && previousValue !== value) {
      setIsAnimating(true)
      
      // Animate value change
      const duration = 1000
      const steps = 30
      const increment = (value - previousValue) / steps
      let currentStep = 0

      const timer = setInterval(() => {
        currentStep++
        setDisplayValue(previousValue + (increment * currentStep))
        
        if (currentStep >= steps) {
          clearInterval(timer)
          setDisplayValue(value)
          setIsAnimating(false)
        }
      }, duration / steps)

      return () => clearInterval(timer)
    }
  }, [value, previousValue])

  const formatValue = (val: number) => {
    switch (format) {
      case 'percentage':
        return `${val.toFixed(1)}%`
      case 'currency':
        return `$${val.toLocaleString()}`
      default:
        return val.toFixed(0)
    }
  }

  const getChangeIndicator = () => {
    if (previousValue === undefined) return null
    
    const change = value - previousValue
    const isPositive = change > 0
    const isNegative = change < 0
    
    if (Math.abs(change) < 0.1) return null

    return (
      <div className={cn(
        "flex items-center gap-1 text-xs font-medium",
        isPositive && "text-green-600",
        isNegative && "text-red-600"
      )}>
        {isPositive && <TrendingUp className="w-3 h-3" />}
        {isNegative && <TrendingDown className="w-3 h-3" />}
        {Math.abs(change).toFixed(1)}
      </div>
    )
  }

  const hasSignificantChange = previousValue !== undefined && Math.abs(value - previousValue) > 5

  return (
    <Card className={cn(
      "transition-all duration-300",
      hasSignificantChange && "ring-2 ring-blue-500/50 shadow-lg",
      isAnimating && "animate-pulse",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {icon && <div className="text-muted-foreground">{icon}</div>}
            <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
          </div>
          {getChangeIndicator()}
        </div>
        
        <div className="flex items-baseline gap-2">
          <span className={cn(
            "text-2xl font-bold transition-colors duration-300",
            hasSignificantChange && "text-blue-600"
          )}>
            {formatValue(displayValue)}
          </span>
          
          {hasSignificantChange && (
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
          )}
        </div>
        
        {hasSignificantChange && (
          <div className="mt-2 text-xs text-blue-600 font-medium">
            Sudden change detected
          </div>
        )}
      </CardContent>
    </Card>
  )
}