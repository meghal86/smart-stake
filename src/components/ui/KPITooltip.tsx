'use client'

import { useState, useRef, useEffect } from 'react'
import { trackEvent } from '@/lib/telemetry'
import { Info } from 'lucide-react'

interface KPITooltipProps {
  source: 'kpi_whale_pressure' | 'kpi_market_sentiment' | 'kpi_risk_index'
  tooltip: string
  children: React.ReactNode
}

export default function KPITooltip({ source, tooltip, children }: KPITooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const buttonRef = useRef<HTMLButtonElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const tooltipId = `tooltip-${source}`

  useEffect(() => {
    if (isOpen && buttonRef.current && tooltipRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      
      // Position below the button, centered
      const left = buttonRect.left + (buttonRect.width / 2) - (tooltipRect.width / 2)
      const top = buttonRect.bottom + 8
      
      setPosition({ top, left })
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    const handleClickOutside = (e: MouseEvent) => {
      if (isOpen && tooltipRef.current && !tooltipRef.current.contains(e.target as Node) && 
          buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleToggle = () => {
    const newState = !isOpen
    setIsOpen(newState)
    
    if (newState) {
      trackEvent('tooltip_open', { source })
    }
  }

  return (
    <div className="relative inline-block">
      <div className="flex items-center gap-2">
        {children}
        <button
          ref={buttonRef}
          onClick={handleToggle}
          onKeyDown={(e) => e.key === 'Enter' && handleToggle()}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded"
          aria-label={`Info about ${source.replace('kpi_', '').replace('_', ' ')}`}
          aria-describedby={isOpen ? tooltipId : undefined}
          aria-expanded={isOpen}
        >
          <Info className="h-3 w-3" />
        </button>
      </div>

      {isOpen && (
        <div
          ref={tooltipRef}
          id={tooltipId}
          role="tooltip"
          className="fixed z-50 text-xs px-2 py-1 rounded-md border shadow-sm bg-zinc-900 text-white dark:bg-zinc-800 max-w-xs"
          style={{ top: position.top, left: position.left }}
        >
          {tooltip}
          <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-zinc-900 dark:bg-zinc-800 rotate-45 border-l border-t border-gray-200 dark:border-gray-700" />
        </div>
      )}
    </div>
  )
}