'use client'

import { useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Home, Search, Bell, Eye, Brain } from 'lucide-react'
import { trackEvent } from '@/lib/telemetry'
import { useGate } from '@/hooks/useGate'

const tabs = [
  { id: 'home', label: 'Home', icon: Home, href: '/', gated: undefined },
  { id: 'predictions', label: 'Predictions', icon: Brain, href: '/hub2/predictions', gated: undefined },
  { id: 'explore', label: 'Explore', icon: Search, href: '/signals', gated: undefined },
  { id: 'alerts', label: 'Alerts', icon: Bell, href: '/alerts', gated: 'alerts_advanced' },
  { id: 'watch', label: 'Watch', icon: Eye, href: '/portfolio', gated: 'watchlist' }
] as const

export function AppFooterNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const pathname = location.pathname
  const { canAccess, showUpgrade } = useGate()

  const handleTabClick = (tab: typeof tabs[number]) => {
    trackEvent('card_click', { id: 'footer_nav', tab: tab.id })

    if (tab.gated && !canAccess(tab.gated)) {
      showUpgrade(tab.gated)
      return
    }

    if (tab.href.includes('#')) {
      const element = document.getElementById(tab.href.split('#')[1])
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' })
      }
    } else {
      navigate(tab.href)
    }
  }

  const isActive = (tab: typeof tabs[number]) => {
    if (tab.id === 'home') return pathname === '/'
    if (tab.id === 'explore') return pathname === '/signals'
    return pathname.startsWith(tab.href.split('#')[0])
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-t border-slate-200/40 dark:border-slate-800 md:hidden">
      <div className="flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = isActive(tab)
          
          return (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => handleTabClick(tab)}
              className={`flex flex-col items-center gap-1 px-3 py-2 h-auto min-h-[44px] ${
                active 
                  ? 'text-cyan-600 dark:text-cyan-400' 
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{tab.label}</span>
              {tab.gated && !canAccess(tab.gated) && (
                <div className="w-1 h-1 bg-amber-500 rounded-full" />
              )}
            </Button>
          )
        })}
      </div>
    </nav>
  )
}