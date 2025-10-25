/**
 * Landing Page Hero Component
 * Modern, conversion-optimized hero section for marketing pages
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Check, Sparkles, TrendingUp, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface LandingPageHeroProps {
  variant?: 'default' | 'product' | 'pricing';
}

export function LandingPageHero({ variant = 'default' }: LandingPageHeroProps) {
  const [email, setEmail] = useState('');

  const handleGetStarted = () => {
    // Navigate to signup with email pre-filled
    window.location.href = `/signup?email=${encodeURIComponent(email)}`;
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-blue-900">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -right-1/2 w-96 h-96 bg-blue-200 dark:bg-blue-900 rounded-full opacity-20 blur-3xl" />
        <div className="absolute -bottom-1/2 -left-1/2 w-96 h-96 bg-purple-200 dark:bg-purple-900 rounded-full opacity-20 blur-3xl" />
      </div>

      <div className="relative container mx-auto px-4 py-20 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            {/* Badge */}
            <Badge className="inline-flex items-center gap-2 px-4 py-2 text-sm">
              <Sparkles className="h-4 w-4" />
              <span>Trusted by 12,000+ traders worldwide</span>
            </Badge>

            {/* Headline */}
            <h1 className="text-5xl lg:text-6xl font-bold leading-tight">
              Track Crypto Whales,
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}Make Smarter Trades
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-muted-foreground leading-relaxed">
              Get real-time alerts on whale movements, identify market trends before they happen,
              and protect your portfolio with advanced risk intelligence.
            </p>

            {/* Value props */}
            <div className="space-y-3">
              {[
                'Real-time whale transaction monitoring',
                'AI-powered risk analysis & anomaly detection',
                'Portfolio protection with Guardian alerts',
                'Multi-chain support (Ethereum, BSC, Polygon, Tron)'
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span className="text-lg">{feature}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleGetStarted()}
                />
              </div>
              <Button
                size="lg"
                className="px-8 py-6 text-lg"
                onClick={handleGetStarted}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">
              No credit card required • Free tier available • Upgrade anytime
            </p>

            {/* Social proof */}
            <div className="flex items-center gap-6 pt-4">
              <div>
                <div className="text-3xl font-bold">12K+</div>
                <div className="text-sm text-muted-foreground">Active Users</div>
              </div>
              <div className="h-12 w-px bg-gray-300 dark:bg-gray-600" />
              <div>
                <div className="text-3xl font-bold">$2.5B+</div>
                <div className="text-sm text-muted-foreground">Assets Tracked</div>
              </div>
              <div className="h-12 w-px bg-gray-300 dark:bg-gray-600" />
              <div>
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-sm text-muted-foreground">Monitoring</div>
              </div>
            </div>
          </motion.div>

          {/* Right column - Visual/Demo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            {/* Dashboard preview mockup */}
            <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 border border-gray-200 dark:border-gray-700">
              {/* Mock browser chrome */}
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>

              {/* Mock dashboard content */}
              <div className="space-y-4">
                {/* Whale alert card */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold">Whale Alert</div>
                        <div className="text-xs text-muted-foreground">2 minutes ago</div>
                      </div>
                    </div>
                    <Badge variant="destructive">Critical</Badge>
                  </div>
                  <p className="text-sm">
                    Large transfer detected: <span className="font-bold">$45.2M USDT</span> moved to Binance
                  </p>
                </div>

                {/* Risk metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      <span className="text-xs text-muted-foreground">Portfolio Risk</span>
                    </div>
                    <div className="text-2xl font-bold text-green-600">Low</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-orange-600" />
                      <span className="text-xs text-muted-foreground">Whale Activity</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">High</div>
                  </div>
                </div>

                {/* Chart placeholder */}
                <div className="h-32 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-lg flex items-center justify-center">
                  <div className="text-sm text-muted-foreground">Live whale activity chart</div>
                </div>
              </div>
            </div>

            {/* Floating elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -top-4 -right-4 bg-green-500 text-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold"
            >
              🟢 Live Monitoring
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
              className="absolute -bottom-4 -left-4 bg-purple-600 text-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold"
            >
              🔔 Instant Alerts
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/**
 * Feature Highlights Section
 */
export function FeatureHighlights() {
  const features = [
    {
      icon: TrendingUp,
      title: 'Real-Time Tracking',
      description: 'Monitor whale wallets 24/7 with instant notifications for large transactions',
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: Shield,
      title: 'Risk Intelligence',
      description: 'AI-powered risk analysis identifies threats before they impact your portfolio',
      color: 'text-green-600 dark:text-green-400'
    },
    {
      icon: Zap,
      title: 'Anomaly Detection',
      description: 'Advanced ML algorithms spot unusual patterns and coordinated whale movements',
      color: 'text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">
            Everything You Need to Track Crypto Whales
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional-grade tools trusted by traders, investors, and institutions
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-gray-50 dark:bg-gray-800 p-8 rounded-2xl hover:shadow-xl transition-shadow"
            >
              <feature.icon className={`h-12 w-12 ${feature.color} mb-4`} />
              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Call-to-Action Section
 */
export function CTASection() {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto space-y-8"
        >
          <h2 className="text-4xl lg:text-5xl font-bold">
            Ready to Start Tracking Whales?
          </h2>
          <p className="text-xl opacity-90">
            Join thousands of traders who use WhalePlus to make smarter investment decisions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="px-8 py-6 text-lg">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="px-8 py-6 text-lg bg-transparent border-white text-white hover:bg-white hover:text-blue-600">
              View Pricing
            </Button>
          </div>
          <p className="text-sm opacity-75">
            No credit card required • 14-day free trial • Cancel anytime
          </p>
        </motion.div>
      </div>
    </section>
  );
}

