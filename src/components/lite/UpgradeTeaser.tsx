'use client'

import { useState } from 'react'
import { trackEvent } from '@/lib/telemetry'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Zap, Brain, Shield, BarChart3 } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { motion } from 'framer-motion'

export default function UpgradeTeaser() {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
    trackEvent('cta_click', { 
      label: isExpanded ? 'upgrade_teaser_collapse' : 'upgrade_teaser_expand', 
      plan: 'lite' 
    })
  }

  const handleUpgrade = () => {
    trackEvent('cta_click', { label: 'upgrade_from_teaser', plan: 'lite' })
  }

  return (
    <section>
      <Card className="aw-card aw-shadow bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border-indigo-200/50 dark:border-indigo-700/50">
        <CardContent className="p-4">
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            {/* Collapsed Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100">Unlock Pro Intelligence</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    AI Copilot • Smart Alerts • Deep Analytics
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  size="sm"
                  onClick={handleUpgrade}
                  className="aw-btn-primary"
                >
                  Upgrade
                </Button>
                
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleToggle}
                    className="text-indigo-500 hover:text-indigo-600 md:hidden"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>

            {/* Desktop: Always show features */}
            <div className="hidden md:grid md:grid-cols-3 md:gap-4 md:mt-4">
              <FeatureCard 
                icon={<Brain className="h-5 w-5" />}
                title="AI Copilot"
                description="Get personalized insights and trading suggestions"
              />
              <FeatureCard 
                icon={<Shield className="h-5 w-5" />}
                title="Smart Alerts"
                description="Advanced whale movement notifications"
              />
              <FeatureCard 
                icon={<BarChart3 className="h-5 w-5" />}
                title="Deep Analytics"
                description="Institutional-grade market intelligence"
              />
            </div>

            {/* Mobile: Collapsible features */}
            <CollapsibleContent asChild className="md:hidden">
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="grid grid-cols-1 gap-3 mt-4"
              >
                <FeatureCard 
                  icon={<Brain className="h-5 w-5" />}
                  title="AI Copilot"
                  description="Get personalized insights and trading suggestions"
                />
                <FeatureCard 
                  icon={<Shield className="h-5 w-5" />}
                  title="Smart Alerts"
                  description="Advanced whale movement notifications"
                />
                <FeatureCard 
                  icon={<BarChart3 className="h-5 w-5" />}
                  title="Deep Analytics"
                  description="Institutional-grade market intelligence"
                />
              </motion.div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </section>
  )
}

function FeatureCard({ 
  icon, 
  title, 
  description 
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-slate-900/50 rounded-xl">
      <div className="text-indigo-500 flex-shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <h4 className="font-medium text-slate-900 dark:text-slate-100 text-sm">{title}</h4>
        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{description}</p>
      </div>
    </div>
  )
}