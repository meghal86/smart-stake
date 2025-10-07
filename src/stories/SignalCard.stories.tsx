import type { Meta, StoryObj } from '@storybook/react'
import SignalCard from '@/components/signals/SignalCard'
import { SignalEvent } from '@/types/hub2'
import { useState, useEffect } from 'react'

const meta: Meta<typeof SignalCard> = {
  title: 'Signals/SignalCard',
  component: SignalCard,
  parameters: { layout: 'centered' },
  decorators: [
    (Story) => (
      <div className="w-[400px] p-4">
        <Story />
      </div>
    ),
  ],
}
export default meta
type S = StoryObj<typeof SignalCard>

const mockSignal: SignalEvent = {
  id: 'sig_001',
  type: 'cex_outflow',
  entity: {
    name: 'Ethereum',
    symbol: 'ETH',
    address: '0x...',
  },
  ts: new Date(Date.now() - 5 * 60000).toISOString(),
  confidence: 'high',
  impactUsd: 12500000,
  delta: -8.5,
  reasonCodes: ['large_volume', 'exchange_exit', 'whale_activity'],
}

export const Default: S = {
  args: {
    signal: mockSignal,
    onAction: (signal) => console.log('Follow clicked:', signal),
    onDetailsClick: (signal) => console.log('Details clicked:', signal),
  },
}

export const DormantAwake: S = {
  args: {
    signal: {
      ...mockSignal,
      id: 'sig_002',
      type: 'dormant_awake',
      entity: { name: 'Bitcoin', symbol: 'BTC', address: '0x...' },
      confidence: 'med',
      delta: 12.3,
      impactUsd: 45000000,
      reasonCodes: ['dormant_wallet', 'first_movement_90d'],
    },
  },
}

export const RiskChange: S = {
  args: {
    signal: {
      ...mockSignal,
      id: 'sig_003',
      type: 'risk_change',
      entity: { name: 'Solana', symbol: 'SOL', address: '0x...' },
      confidence: 'high',
      delta: -15.2,
      impactUsd: 8200000,
      reasonCodes: ['volatility_spike', 'liquidation_cascade', 'market_stress'],
    },
  },
}

export const SentimentChange: S = {
  args: {
    signal: {
      ...mockSignal,
      id: 'sig_004',
      type: 'sentiment_change',
      entity: { name: 'Cardano', symbol: 'ADA', address: '0x...' },
      confidence: 'med',
      delta: 6.8,
      impactUsd: 3400000,
      reasonCodes: ['social_momentum', 'whale_accumulation'],
    },
  },
}

export const DeFiLeverage: S = {
  args: {
    signal: {
      ...mockSignal,
      id: 'sig_005',
      type: 'defi_leverage',
      entity: { name: 'Aave', symbol: 'AAVE', address: '0x...' },
      confidence: 'low',
      delta: 22.5,
      impactUsd: 15600000,
      reasonCodes: ['leverage_increase', 'collateral_ratio_drop', 'liquidation_risk'],
    },
  },
}

export const HoverState: S = {
  args: {
    signal: mockSignal,
    onAction: (signal) => alert(`Follow clicked: ${signal.entity.name}`),
    onDetailsClick: (signal) => alert(`Details clicked: ${signal.entity.name}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'Hover over the card to see the micro-shadow effect and trigger details preload.',
      },
    },
  },
}

export const LazySparklineDemo: S = {
  render: () => {
    const [visible, setVisible] = useState(false)
    
    return (
      <div className="space-y-4">
        <button 
          onClick={() => setVisible(!visible)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          {visible ? 'Hide' : 'Show'} Card (Lazy Load Demo)
        </button>
        {visible && (
          <SignalCard 
            signal={mockSignal}
            onAction={(s) => console.log('Follow:', s)}
            onDetailsClick={(s) => console.log('Details:', s)}
          />
        )}
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Toggle visibility to see the sparkline lazy-load with skeleton placeholder.',
      },
    },
  },
}

export const NewSignalFadeIn: S = {
  render: () => {
    const [signals, setSignals] = useState<SignalEvent[]>([mockSignal])
    
    const addSignal = () => {
      const newSignal: SignalEvent = {
        ...mockSignal,
        id: `sig_${Date.now()}`,
        type: ['cex_outflow', 'dormant_awake', 'risk_change', 'sentiment_change'][
          Math.floor(Math.random() * 4)
        ] as any,
        entity: {
          name: ['Bitcoin', 'Ethereum', 'Solana', 'Cardano'][Math.floor(Math.random() * 4)],
          symbol: ['BTC', 'ETH', 'SOL', 'ADA'][Math.floor(Math.random() * 4)],
          address: '0x...',
        },
        ts: new Date().toISOString(),
        delta: (Math.random() - 0.5) * 20,
      }
      setSignals([newSignal, ...signals])
    }
    
    return (
      <div className="space-y-4">
        <button 
          onClick={addSignal}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Add New Signal (Fade-In Demo)
        </button>
        <div className="space-y-2">
          {signals.map((signal) => (
            <SignalCard 
              key={signal.id}
              signal={signal}
              onAction={(s) => console.log('Follow:', s)}
              onDetailsClick={(s) => console.log('Details:', s)}
            />
          ))}
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Click to add new signals and see the fade-in animation (250ms opacity transition).',
      },
    },
  },
}

export const SourceTooltipDemo: S = {
  args: {
    signal: mockSignal,
  },
  parameters: {
    docs: {
      description: {
        story: 'Hover over the source badge (✓ or ○) to see the tooltip showing live/cached status.',
      },
    },
  },
}

export const TimestampRefresh: S = {
  render: () => {
    const [timestamp, setTimestamp] = useState(new Date(Date.now() - 2 * 60000).toISOString())
    
    useEffect(() => {
      const interval = setInterval(() => {
        setTimestamp(new Date(Date.now() - Math.random() * 3600000).toISOString())
      }, 3000)
      return () => clearInterval(interval)
    }, [])
    
    return (
      <SignalCard 
        signal={{
          ...mockSignal,
          ts: timestamp,
        }}
        onAction={(s) => console.log('Follow:', s)}
        onDetailsClick={(s) => console.log('Details:', s)}
      />
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Watch the relative time update every 3 seconds (simulating the 60s ticker).',
      },
    },
  },
}

export const StaggeredAnimation: S = {
  render: () => {
    const [show, setShow] = useState(false)
    const signals: SignalEvent[] = [
      { ...mockSignal, id: 'sig_1', type: 'cex_outflow', entity: { name: 'Ethereum', symbol: 'ETH', address: '0x...' } },
      { ...mockSignal, id: 'sig_2', type: 'dormant_awake', entity: { name: 'Bitcoin', symbol: 'BTC', address: '0x...' }, delta: 10 },
      { ...mockSignal, id: 'sig_3', type: 'risk_change', entity: { name: 'Solana', symbol: 'SOL', address: '0x...' }, delta: -12 },
    ]
    
    return (
      <div className="space-y-4">
        <button 
          onClick={() => setShow(!show)}
          className="px-4 py-2 bg-purple-500 text-white rounded"
        >
          {show ? 'Hide' : 'Show'} Cards (Stagger Demo)
        </button>
        {show && (
          <div className="grid grid-cols-1 gap-3 w-[400px]">
            {signals.map((signal, idx) => (
              <div key={signal.id} style={{ animationDelay: `${idx * 100}ms` }}>
                <SignalCard 
                  signal={signal}
                  onAction={(s) => console.log('Follow:', s)}
                  onDetailsClick={(s) => console.log('Details:', s)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'Toggle to see staggered animation with 100ms delay per card.',
      },
    },
  },
}

export const AllVariants: S = {
  render: () => {
    const signals: SignalEvent[] = [
      { ...mockSignal, id: 'sig_1', type: 'cex_outflow', entity: { name: 'Ethereum', symbol: 'ETH', address: '0x...' } },
      { ...mockSignal, id: 'sig_2', type: 'dormant_awake', entity: { name: 'Bitcoin', symbol: 'BTC', address: '0x...' }, delta: 10 },
      { ...mockSignal, id: 'sig_3', type: 'risk_change', entity: { name: 'Solana', symbol: 'SOL', address: '0x...' }, delta: -12 },
      { ...mockSignal, id: 'sig_4', type: 'sentiment_change', entity: { name: 'Cardano', symbol: 'ADA', address: '0x...' }, delta: 5 },
      { ...mockSignal, id: 'sig_5', type: 'defi_leverage', entity: { name: 'Aave', symbol: 'AAVE', address: '0x...' }, delta: 18 },
    ]
    
    return (
      <div className="space-y-3 w-[400px]">
        {signals.map((signal) => (
          <SignalCard 
            key={signal.id}
            signal={signal}
            onAction={(s) => console.log('Follow:', s)}
            onDetailsClick={(s) => console.log('Details:', s)}
          />
        ))}
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: 'All signal type variants displayed together.',
      },
    },
  },
}
