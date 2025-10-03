'use client'

import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Wallet, TrendingUp, ExternalLink } from 'lucide-react'

const mockHoldings = [
  { symbol: 'BTC', amount: '0.234', value: '$10,450', change: '+5.2%' },
  { symbol: 'ETH', amount: '1.89', value: '$4,230', change: '+2.1%' },
  { symbol: 'USDC', amount: '2,150', value: '$2,150', change: '0.0%' }
]

export default function PortfolioDemoLite() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold">Portfolio Demo</h3>
        </div>

        <div className="space-y-4">
          {/* Total Value */}
          <div className="text-center p-4 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">$16,830</div>
            <div className="flex items-center justify-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <span className="text-green-600 font-medium">+$213 today</span>
            </div>
          </div>

          {/* Top Holdings */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Top Holdings</h4>
            {mockHoldings.map((holding) => (
              <div key={holding.symbol} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{holding.symbol}</Badge>
                  <span className="text-sm">{holding.amount}</span>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{holding.value}</div>
                  <div className={`text-xs ${holding.change.startsWith('+') ? 'text-green-600' : holding.change.startsWith('-') ? 'text-red-600' : 'text-muted-foreground'}`}>
                    {holding.change}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* CTAs */}
          <div className="flex gap-2 pt-2">
            <Button size="sm" asChild className="flex-1">
              <Link to="/portfolio">
                <ExternalLink className="w-4 h-4 mr-1" />
                Open
              </Link>
            </Button>
            <Button size="sm" variant="outline" asChild className="flex-1">
              <Link to="/plans?from=lite_portfolio&feature=wallet_connect">
                Connect wallet
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}