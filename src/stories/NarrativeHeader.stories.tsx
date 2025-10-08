import type { Meta, StoryObj } from '@storybook/react';
import { NarrativeHeader } from '@/components/signals/NarrativeHeader';
import type { Signal } from '@/types/signal';

const meta: Meta<typeof NarrativeHeader> = {
  title: 'Signals/NarrativeHeader',
  component: NarrativeHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockBuySignals: Signal[] = [
  {
    id: '1',
    asset: 'ETH',
    direction: 'inflow',
    amountUsd: 45000000,
    timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    ownerType: 'whale',
    source: 'whale_alert',
    risk: 'high',
    isLive: true,
    reason: 'Large ETH accumulation',
    impactScore: 9.1,
  },
  {
    id: '2',
    asset: 'BTC',
    direction: 'inflow',
    amountUsd: 32000000,
    timestamp: new Date(Date.now() - 2400000).toISOString(), // 40 min ago
    ownerType: 'whale',
    source: 'whale_alert',
    risk: 'high',
    isLive: true,
    reason: 'Large BTC accumulation',
    impactScore: 8.8,
  },
  {
    id: '3',
    asset: 'ETH',
    direction: 'inflow',
    amountUsd: 18000000,
    timestamp: new Date(Date.now() - 3000000).toISOString(), // 50 min ago
    ownerType: 'whale',
    source: 'whale_alert',
    risk: 'medium',
    isLive: true,
    reason: 'ETH accumulation',
    impactScore: 8.2,
  },
];

const mockSellSignals: Signal[] = [
  {
    id: '4',
    asset: 'ETH',
    direction: 'outflow',
    amountUsd: 28000000,
    timestamp: new Date(Date.now() - 1200000).toISOString(), // 20 min ago
    ownerType: 'whale',
    source: 'whale_alert',
    risk: 'high',
    isLive: true,
    reason: 'Large ETH movement to exchange',
    impactScore: 8.6,
  },
  {
    id: '5',
    asset: 'BTC',
    direction: 'outflow',
    amountUsd: 35000000,
    timestamp: new Date(Date.now() - 2100000).toISOString(), // 35 min ago
    ownerType: 'whale',
    source: 'whale_alert',
    risk: 'high',
    isLive: true,
    reason: 'Large BTC movement to exchange',
    impactScore: 8.9,
  },
  {
    id: '6',
    asset: 'USDT',
    direction: 'outflow',
    amountUsd: 15000000,
    timestamp: new Date(Date.now() - 2700000).toISOString(), // 45 min ago
    ownerType: 'whale',
    source: 'whale_alert',
    risk: 'medium',
    isLive: true,
    reason: 'USDT movement to exchange',
    impactScore: 7.5,
  },
];

const mockMixedSignals: Signal[] = [
  ...mockBuySignals.slice(0, 1),
  ...mockSellSignals.slice(0, 2),
];

export const BuySideBias: Story = {
  args: {
    signals: mockBuySignals,
    timeWindow: 60,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows buy-side bias with green badge when inflows dominate.',
      },
    },
  },
};

export const SellSideBias: Story = {
  args: {
    signals: mockSellSignals,
    timeWindow: 60,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows sell-side bias with red badge when outflows dominate.',
      },
    },
  },
};

export const MixedSignals: Story = {
  args: {
    signals: mockMixedSignals,
    timeWindow: 60,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows mixed market activity with calculated bias percentage.',
      },
    },
  },
};

export const FadeInDemo: Story = {
  args: {
    signals: mockBuySignals,
    timeWindow: 60,
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates the 250ms fade-in animation with cubic-bezier easing.',
      },
    },
  },
};

export const ShortTimeWindow: Story = {
  args: {
    signals: mockBuySignals,
    timeWindow: 30,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows narrative for a 30-minute time window.',
      },
    },
  },
};