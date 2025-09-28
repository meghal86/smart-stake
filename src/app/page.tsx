import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, BarChart3, Shield, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">
            🐋 AlphaWhale Lite - Now Available
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Track Whale Movements
            <br />
            <span className="text-primary">Like Never Before</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Get real-time whale intelligence, token unlock alerts, and market insights 
            to stay ahead of the crypto market.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/hub2">
                Get Started - Hub 2
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link href="/hub">
                Lite Version
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Whale Intelligence</CardTitle>
              <CardDescription>
                Real-time tracking of large whale movements across all major blockchains
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Large transaction monitoring</li>
                <li>• Exchange flow tracking</li>
                <li>• Smart money movements</li>
                <li>• Risk assessment alerts</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Token Unlocks</CardTitle>
              <CardDescription>
                Stay ahead of market-moving token unlocks and vesting schedules
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Upcoming unlock calendar</li>
                <li>• Impact analysis</li>
                <li>• Price prediction models</li>
                <li>• Historical unlock data</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Market Intelligence</CardTitle>
              <CardDescription>
                Comprehensive market analysis powered by whale behavior patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li>• Market sentiment analysis</li>
                <li>• Trend identification</li>
                <li>• Risk scoring</li>
                <li>• Portfolio optimization</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands of traders using AlphaWhale to stay ahead of the market
          </p>
          <Button asChild size="lg">
            <Link href="/hub2">
              Launch Hub 2
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
