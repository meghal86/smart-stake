'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ExternalLink, Zap, TrendingUp, Fish, BarChart3 } from 'lucide-react'

export function LegacyAppLauncher() {
  const legacyRoutes = [
    {
      name: 'Market Hub',
      path: '/market/hub',
      icon: <BarChart3 className="w-5 h-5" />,
      description: 'Real-time whale intelligence dashboard'
    },
    {
      name: 'Whale Analytics', 
      path: '/whales',
      icon: <Fish className="w-5 h-5" />,
      description: 'Track whale behavior and movements'
    },
    {
      name: 'Alerts',
      path: '/alerts', 
      icon: <Zap className="w-5 h-5" />,
      description: 'Custom whale alert management'
    },
    {
      name: 'Portfolio',
      path: '/portfolio',
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Portfolio tracking and analysis'
    }
  ]

  const openLegacyApp = (path: string = '') => {
    window.open(`http://localhost:8080${path}`, '_blank')
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <ExternalLink className="w-5 h-5" />
        <h3 className="text-lg font-semibold">Legacy App Access</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {legacyRoutes.map((route) => (
          <Button
            key={route.path}
            variant="outline"
            className="h-auto p-4 flex items-start gap-3 text-left"
            onClick={() => openLegacyApp(route.path)}
          >
            <div className="text-primary">{route.icon}</div>
            <div>
              <div className="font-medium">{route.name}</div>
              <div className="text-xs text-muted-foreground">{route.description}</div>
            </div>
            <ExternalLink className="w-4 h-4 ml-auto text-muted-foreground" />
          </Button>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t">
        <Button 
          onClick={() => openLegacyApp()}
          className="w-full"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Open Full Legacy App
        </Button>
      </div>
    </Card>
  )
}