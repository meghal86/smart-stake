'use client'

import { Home, BarChart3, FileText, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DesktopSidebarNavProps {
  currentPath: string
}

const navItems = [
  { path: '/lite/hub', label: 'Hub', icon: Home },
  { path: '/lite/portfolio', label: 'Portfolio', icon: BarChart3 },
  { path: '/lite/reports', label: 'Reports', icon: FileText },
  { path: '/lite/settings', label: 'Settings', icon: Settings },
]

export function DesktopSidebarNav({ currentPath }: DesktopSidebarNavProps) {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 md:left-0 bg-background border-r border-border">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🐋</span>
            </div>
            <span className="text-xl font-bold">AlphaWhale</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const isActive = currentPath === path
            return (
              <a
                key={path}
                href={path}
                className={cn(
                  "group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className={cn("mr-3 h-5 w-5 flex-shrink-0", isActive && "text-primary-foreground")} />
                {label}
              </a>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
