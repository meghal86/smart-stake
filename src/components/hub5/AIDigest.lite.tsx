'use client'

import { useState } from 'react'
import { useAnalytics } from '@/hooks/useAnalytics'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Brain, Clock, Share, MessageCircle, Hash } from 'lucide-react'
import { Link } from 'react-router-dom'

type QueryKind = 'explain' | 'changed' | 'next' | null

interface AIDigestLiteProps {
  userMode?: 'novice' | 'pro' | 'auto'
  isLoading?: boolean
}

export default function AIDigestLite({ userMode = 'auto', isLoading = false }: AIDigestLiteProps) {
  const [kind, setKind] = useState<QueryKind>(null)
  const { track } = useAnalytics()

  const handleClick = (queryKind: QueryKind) => {
    setKind(queryKind)
    track('card_click', { card: 'ai_digest', kind: queryKind })
  }

  const handleShare = (platform: 'twitter' | 'telegram' | 'discord') => {
    const text = getContent(true)
    const url = window.location.href
    
    if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
    } else if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank')
    } else if (platform === 'discord') {
      // Copy to clipboard for Discord
      navigator.clipboard.writeText(`${text} ${url}`)
      // Could show toast notification here
    }
    
    track('cta_click', { label: `Share Digest ${platform}`, platform, content: 'ai_digest' })
  }

  const getContent = (forShare = false) => {
    const isNovice = userMode === 'novice'
    
    const noviceContent = {
      'explain': "🐋 Whales are buying big! $2.3B flowing in means bullish signal. Big players are loading up on Bitcoin and Ethereum - usually means prices go up soon.",
      'changed': "📈 This week: More whale wallets appeared (12% more!), Ethereum staking hit records (23%), and $1.8B moved into DeFi lending. All good signs!",
      'next': "🎯 What to do: Watch Bitcoin at $45K (key level), Ethereum unlocks next week (could move price), check out AAVE and Compound for yields.",
      'default': "🤖 AI is watching the whales for you! Click below to see what the big players are doing."
    }
    
    const proContent = {
      'explain': "Market shows bullish whale activity with $2.3B in net inflows. Large holders are accumulating BTC and ETH while reducing stablecoin positions, suggesting confidence in near-term price action.",
      'changed': "Key changes: BTC whale addresses increased 12% this week, ETH staking ratio hit new highs at 23%, and DeFi TVL grew by $1.8B with concentrated activity in lending protocols.",
      'next': "Recommended actions: Monitor BTC $45K resistance level, watch for ETH staking unlock events next week, and consider DeFi yield opportunities in AAVE and Compound.",
      'default': "AI analyzing current market conditions and whale behavior patterns. Click a button below to get specific insights."
    }
    
    const content = isNovice ? noviceContent : proContent
    const text = content[kind || 'default']
    return forShare ? `🐋 AlphaWhale AI: ${text}` : text
  }

  return (
    <Card className="relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse" />
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse">
              Today's Story
            </h3>
          </div>
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => handleShare('twitter')}
              className="h-8 w-8 p-0 hover:bg-blue-50 animate-pulse"
              aria-label="Share to Twitter"
            >
              <Share className="w-4 h-4 text-blue-600" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => handleShare('telegram')}
              className="h-8 w-8 p-0 hover:bg-blue-50"
              aria-label="Share to Telegram"
            >
              <MessageCircle className="w-4 h-4 text-blue-600" />
            </Button>
            <Button 
              size="sm" 
              variant="ghost"
              onClick={() => handleShare('discord')}
              className="h-8 w-8 p-0 hover:bg-blue-50"
              aria-label="Copy for Discord"
            >
              <Hash className="w-4 h-4 text-blue-600" />
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button 
              size="sm" 
              variant={kind === 'explain' ? 'default' : 'outline'}
              onClick={() => handleClick('explain')}
              disabled={isLoading}
              aria-label="Explain current market conditions"
            >
              {userMode === 'novice' ? '📚 Explain' : 'Explain'}
            </Button>
            <Button 
              size="sm" 
              variant={kind === 'changed' ? 'default' : 'outline'}
              onClick={() => handleClick('changed')}
              disabled={isLoading}
              aria-label="Show what changed recently"
            >
              {userMode === 'novice' ? '📈 Changes' : 'What changed'}
            </Button>
            <Button 
              size="sm" 
              variant={kind === 'next' ? 'default' : 'outline'}
              onClick={() => handleClick('next')}
              disabled={isLoading}
              aria-label="Get recommended actions"
            >
              {userMode === 'novice' ? '🎯 Do next' : 'Do next'}
            </Button>
          </div>

          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span>Fetching whales… 🐋 Hold tight.</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {getContent()}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
            <div className="flex items-center gap-4">
              <span>Confidence ~70–80%</span>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Data updated ~1–5 min</span>
              </div>
            </div>
            <Link to="/alerts" className="text-blue-600 hover:underline">
              Create alert
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}