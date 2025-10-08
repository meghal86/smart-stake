import type { Meta, StoryObj } from '@storybook/react';
import { SignalGroupCard } from '@/components/signals/SignalGroupCard';
import type { Signal } from '@/types/signal';

const meta: Meta<typeof SignalGroupCard> = {
  title: 'Signals/SignalGroupCard',
  component: SignalGroupCard,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockSignals: Signal[] = [
  {
    id: '1',
    asset: 'ETH',
    direction: 'outflow',
    amountUsd: 15000000,
    timestamp: new Date(Date.now() - 300000).toISOString(), // 5 min ago
    ownerType: 'whale',
    source: 'whale_alert',
    risk: 'high',
    isLive: true,
    reason: 'Large ETH movement to exchange',
    impactScore: 8.5,
  },
  {
    id: '2',
    asset: 'ETH',
    direction: 'outflow',
    amountUsd: 12000000,
    timestamp: new Date(Date.now() - 600000).toISOString(), // 10 min ago
    ownerType: 'whale',
    source: 'whale_alert',
    risk: 'high',
    isLive: true,
    reason: 'Large ETH movement to exchange',
    impactScore: 8.2,
  },
  {
    id: '3',
    asset: 'ETH',
    direction: 'outflow',
    amountUsd: 8500000,
    timestamp: new Date(Date.now() - 900000).toISOString(), // 15 min ago
    ownerType: 'whale',
    source: 'whale_alert',
    risk: 'medium',
    isLive: true,
    reason: 'Large ETH movement to exchange',
    impactScore: 7.8,
  },
];

const mockInflowSignals: Signal[] = [
  {
    id: '4',
    asset: 'BTC',
    direction: 'inflow',
    amountUsd: 25000000,
    timestamp: new Date(Date.now() - 180000).toISOString(), // 3 min ago
    ownerType: 'whale',
    source: 'whale_alert',
    risk: 'high',
    isLive: true,
    reason: 'Large BTC accumulation',
    impactScore: 9.2,
  },
  {
    id: '5',
    asset: 'BTC',
    direction: 'inflow',
    amountUsd: 18000000,
    timestamp: new Date(Date.now() - 420000).toISOString(), // 7 min ago
    ownerType: 'whale',
    source: 'whale_alert',
    risk: 'high',
    isLive: true,
    reason: 'Large BTC accumulation',
    impactScore: 8.9,
  },
];

export const OutflowGroup: Story = {
  args: {
    signals: mockSignals,
    onExplain: (signal) => console.log('Explain:', signal),
    onCreateAlert: (signal) => console.log('Create Alert:', signal),
  },
};

export const InflowGroup: Story = {
  args: {
    signals: mockInflowSignals,
    onExplain: (signal) => console.log('Explain:', signal),
    onCreateAlert: (signal) => console.log('Create Alert:', signal),
  },
};

export const HoverDemo: Story = {
  args: {
    signals: mockSignals,
    onExplain: (signal) => console.log('Explain:', signal),
    onCreateAlert: (signal) => console.log('Create Alert:', signal),
  },
  parameters: {
    docs: {
      description: {
        story: 'Hover over the card to see the enhanced hover effects with brand shadow and action buttons.',
      },
    },
  },
};

export const ConfidenceDemo: Story = {
  args: {
    signals: mockInflowSignals,
    onExplain: (signal) => console.log('Explain:', signal),
    onCreateAlert: (signal) => console.log('Create Alert:', signal),
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows AI confidence bar and prediction for accumulation signals.',
      },
    },
  },
};