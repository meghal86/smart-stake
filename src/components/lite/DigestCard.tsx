'use client'

import { useState, useEffect } from 'react'
import { trackEvent } from '@/lib/telemetry'
import { useAuth } from '@/contexts/AuthContext'
import { useOnboardingTipsStore } from '@/stores/useOnboardingTipsStore'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronUp, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { motion } from 'framer-motion'

interface DigestCardProps {
  mode?: 'novice' | 'pro' | 'auto'
  demoMode?: boolean
  onDigestShared?: (shared: boolean) => void
}

export default function DigestCard({ mode, demoMode, onDigestShared }: DigestCardProps = {}) {
  const { user } = useAuth()
  const userId = user?.id
  const { copilotTipDismissed, hydrated, celebrateGraduation, dismissCopilotTip, hydrateFromStorage } = useOnboardingTipsStore()
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [confidence, setConfidence] = useState(87)
  const [confidenceAnimated, setConfidenceAnimated] = useState(0)
  const [whaleData, setWhaleData] = useState<any>(null)
  const [loading, setLoading] = useState(true)


  // Hydrate store on mount
  useEffect(() => {
    hydrateFromStorage(userId)
  }, [userId, hydrateFromStorage])

  // Load live whale data
  useEffect(() => {
    async function loadWhaleData() {
      try {
        const { supabase } = await import('@/integrations/supabase/client')
        const { data, error } = await supabase.functions.invoke('whale-alerts')
        
        if (error) {
          console.error('❌ Whale Alert API failed:', error)
          setLoading(false)
          return
        }
        
        if (data?.transactions && data.transactions.length > 0) {
          setWhaleData(data)
          setConfidence(Math.min(95, 70 + data.transactions.length))
          console.log('✅ Loaded', data.transactions.length, 'whale transactions')
        }
        setLoading(false)
      } catch (err) {
        console.error('❌ Failed to load whale data:', err)
        setLoading(false)
      }
    }
    loadWhaleData()
  }, [])

  // Animate confidence meter on load
  useEffect(() => {
    const timer = setTimeout(() => {
      setConfidenceAnimated(confidence)
    }, 500)
    return () => clearTimeout(timer)
  }, [confidence])

  // Show tip logic
  const showCopilotTip = hydrated && !copilotTipDismissed && (mode === 'novice' || demoMode)

  useEffect(() => {
    if (showCopilotTip) {
      trackEvent('tip_shown', { source: 'digest', plan: 'lite' })
    }
  }, [showCopilotTip])

  const onDismissTip = async () => {
    await dismissCopilotTip(userId)
    trackEvent('tip_dismissed', { source: 'digest', plan: 'lite' })
  }

  const handleToggle = () => {
    const newState = !isExpanded
    setIsExpanded(newState)
    trackEvent('digest_toggle', { state: newState ? 'expanded' : 'collapsed' })
    
    if (newState) {
      trackEvent('digest_confidence_view', { confidence })
    }
  }

  const handleAction = async (action: string) => {
    trackEvent('cta_click', { label: `digest_${action}`, plan: 'lite' })
    
    if (action === 'do_next' && showCopilotTip) {
      await dismissCopilotTip(userId)
      trackEvent('tip_dismissed', { source: 'digest', plan: 'lite', via: 'donext' })
    }
    
    // Trigger digest shared event for contextual upgrade pulse
    if (action === 'share' && onDigestShared) {
      onDigestShared(true)
    }
  }

  return (
    <section className="relative">
      {/* Copilot Tip Overlay */}
      {showCopilotTip && (
        <div role="status" className="absolute -top-2 left-0 right-0 z-10 mb-2">
          <div className={`bg-amber-300 dark:bg-amber-200/90 text-black rounded-md px-3 py-2 shadow-lg text-sm motion-safe:animate-tip-fade-in ${celebrateGraduation ? 'motion-safe:animate-graduation' : ''}`}>
            Tip: Tap 'Do Next' to get a personal action from Copilot.
            <button 
              onClick={onDismissTip}
              className="ml-2 hover:text-black/70 transition-colors"
              aria-label="Dismiss tip"
            >
              ❌
            </button>
          </div>
        </div>
      )}
      
      {/* Graduation Celebration */}
      {celebrateGraduation && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20 pointer-events-none">
          {/* Checkmark */}
          <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center motion-safe:animate-check-glow">
            <div className="w-3 h-1.5 border-l-2 border-b-2 border-white transform rotate-45 translate-x-0.5 -translate-y-0.5" />
          </div>
          
          {/* Mini confetti */}
          <div className="absolute inset-0">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-green-400 rounded-full motion-safe:animate-confetti"
                style={{
                  left: `${30 + i * 15}%`,
                  top: '50%',
                  animationDelay: `${i * 150}ms`,
                  animationDuration: '1000ms'
                }}
              />
            ))}
          </div>
        </div>
      )}
      
      <h3 className="aw-section-title text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
        <Sparkles className={`size-4 ${isExpanded ? 'motion-safe:animate-breathe' : 'animate-pulse'}`} aria-hidden />
        Today's Story
      </h3>
      
      <Card className="aw-card aw-shadow">
        <CardContent className="p-4">
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            {/* Collapsed View - Teaser */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white animate-pulse" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-1">
                    AI is watching whales for you...
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
                    {loading ? 'Loading live whale data...' : 
                     whaleData ? `${whaleData.transactions.length} whale transactions detected. ${whaleData.transactions[0]?.symbol} movement of $${(whaleData.transactions[0]?.amount_usd / 1000000).toFixed(1)}M` :
                     'Major accumulation detected across 3 whale clusters. Smart money is positioning for the next move.'}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-1">
                      <span>Confidence:</span>
                      <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full transition-all duration-1000 ease-out"
                          style={{ width: `${confidenceAnimated}%` }}
                        />
                      </div>
                      <span>{confidence}%</span>
                    </div>
                    <span>•</span>
                    <span>{loading ? 'Loading...' : whaleData ? 'Live data' : 'Updated 5 min ago'}</span>
                  </div>
                </div>
              </div>

              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleToggle}
                  className="w-full justify-between text-cyan-500 hover:text-cyan-600"
                >
                  <span>{isExpanded ? 'Show Less' : 'Expand'}</span>
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </div>

            {/* Expanded Content */}
            <CollapsibleContent asChild>
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="space-y-4 mt-4"
              >
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">What Changed</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      3 major whale wallets accumulated 2,847 BTC in the last 6 hours. 
                      This represents $127M in fresh capital entering the market.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">Do Next</h4>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      Monitor for continuation patterns. Set alerts for whale movement above $50M. 
                      Consider position sizing if momentum continues.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAction('explain')}
                  className="flex-1"
                >
                  Explain
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAction('what_changed')}
                  className="flex-1"
                >
                  What Changed
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleAction('do_next')}
                  className="flex-1 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Do Next
                </Button>
              </div>
              </motion.div>
            </CollapsibleContent>
          </Collapsible>
        </CardContent>
      </Card>
    </section>
  )
}