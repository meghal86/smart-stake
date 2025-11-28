import type { Meta, StoryObj } from '@storybook/react';
import { AlertCTA } from '@/components/ui/AlertCTA';
import { ConfidenceBar } from '@/components/ui/ConfidenceBar';
import { AnimatedMarketBanner } from '@/components/ui/AnimatedMarketBanner';
import { CTATelemetryDashboard } from '@/components/analytics/CTATelemetryDashboard';

const meta: Meta = {
  title: 'Phase E/Polish & Motion',
  parameters: {
    layout: 'padded',
  },
};

export default meta;

// CTA Hierarchy Stories
export const CTAVariants: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">CTA Hierarchy System</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 border rounded-lg">
          <h4 className="text-sm font-medium mb-2">Global CTA (Primary)</h4>
          <AlertCTA variant="global" onCreateAlert={() => console.log('Global alert')} />
        </div>
        <div className="p-4 border rounded-lg group">
          <h4 className="text-sm font-medium mb-2">Inline CTA (Hover to see)</h4>
          <AlertCTA variant="inline" onCreateAlert={() => console.log('Inline alert')} />
        </div>
        <div className="p-4 border rounded-lg">
          <h4 className="text-sm font-medium mb-2">Modal CTA (Icon only)</h4>
          <AlertCTA variant="modal" onCreateAlert={() => console.log('Modal alert')} />
        </div>
      </div>
    </div>
  ),
};

// Confidence Bar Animation
export const ConfidenceAnimations: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Confidence Bar Animations</h3>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-slate-600 mb-2">High Confidence (85%)</p>
          <ConfidenceBar confidence={85} />
        </div>
        <div>
          <p className="text-sm text-slate-600 mb-2">Medium Confidence (65%)</p>
          <ConfidenceBar confidence={65} />
        </div>
        <div>
          <p className="text-sm text-slate-600 mb-2">Low Confidence (35%)</p>
          <ConfidenceBar confidence={35} />
        </div>
      </div>
    </div>
  ),
};

// Market Banner
export const MarketBanner: StoryObj = {
  render: () => {
    const mockMetrics = [
      { label: 'Buy-Side', value: '+40%', change: 40, isLive: true },
      { label: 'Flow Volume', value: '$124M', change: 15 },
      { label: 'Active Whales', value: '47', change: -5 },
      { label: 'Risk Score', value: 'Medium', change: 0 },
    ];

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">Animated Market Banner</h3>
        <AnimatedMarketBanner metrics={mockMetrics} />
      </div>
    );
  },
};

// CTA Analytics Dashboard
export const CTAAnalytics: StoryObj = {
  render: () => {
    const mockMetrics = [
      { variant: 'global' as const, clicks: 245, conversions: 89, avgTimeToAlert: 12 },
      { variant: 'inline' as const, clicks: 156, conversions: 67, avgTimeToAlert: 8 },
      { variant: 'modal' as const, clicks: 78, conversions: 23, avgTimeToAlert: 15 },
    ];

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold">CTA Performance Analytics</h3>
        <CTATelemetryDashboard metrics={mockMetrics} />
      </div>
    );
  },
};

// Motion System Demo
export const MotionSystem: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Micro-Motion System</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium">Button Interactions</h4>
          <div className="space-y-2">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:translate-y-[-2px] transition-transform duration-120">
              Hover Lift Effect
            </button>
            <button className="px-4 py-2 bg-green-600 text-white rounded active:scale-95 transition-transform duration-75">
              Click Ripple Effect
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <h4 className="font-medium">Live Indicators</h4>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-[pulse_2s_ease-in-out_infinite] opacity-60" />
            <span className="text-sm">System Vitality Pulse</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full animate-[pulse_2s_ease-in-out_infinite]">
              Market Heartbeat
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};