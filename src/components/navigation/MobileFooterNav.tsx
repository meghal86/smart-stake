'use client'

import { Home, BarChart3, FileText, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileFooterNavProps {
  currentPath: string
}

const navItems = [
  { path: '/lite/hub', label: 'Hub', icon: Home },
  { path: '/lite/portfolio', label: 'Portfolio', icon: BarChart3 },
  { path: '/lite/reports', label: 'Reports', icon: FileText },
  { path: '/lite/settings', label: 'Settings', icon: Settings },
]

export function MobileFooterNav({ currentPath }: MobileFooterNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border md:hidden">
      <div className="grid grid-cols-4 h-16">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = currentPath === path
          return (
            <a
              key={path}
              href={path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary")} />
              <span>{label}</span>
            </a>
          )
        })}
      </div>
    </nav>
  )
}
