# Price Oracle & Multi-Chain Infrastructure

This document describes the implementation of Task 9 and its subtasks for the HarvestPro tax-loss harvesting module.

## Overview

Task 9 implements a comprehensive price oracle system with failover chain and supporting infrastructure for multi-chain operations.

## Components Implemented

### 1. Price Oracle (`price-oracle.ts`)

A robust price fetching system with automatic failover:

**Features:**
- **Primary Source**: CoinGecko API
- **Fallback Source**: CoinMarketCap API
- **Final Fallback**: Internal cache (even if expired)
- **Caching**: 1-minute TTL for all price data
- **Batch Support**: Fetch multiple token prices in parallel

**Usage:**
```typescript
import { getPriceOracle } from '@/lib/harvestpro/price-oracle';

const oracle = getPriceOracle();

// Single token
const btcPrice = await oracle.getPrice('BTC');
console.log(btcPrice.price, btcPrice.source); // 45000, 'coingecko'

// Multiple tokens
const prices = await oracle.getPrices(['BTC', 'ETH', 'USDC']);
console.log(prices['BTC'].price);
```

**API Endpoint:**
- `GET /api/harvest/prices?tokens=BTC,ETH,USDC`
- Returns: `{ ts: string, prices: Record<string, number> }`
- Cache-Control: 60 seconds

### 2. Gas Estimation Engine (`gas-estimation.ts`)

EIP-1559 compliant gas estimation with multi-chain support:

**Features:**
- **EIP-1559**: Uses maxFeePerGas and maxPriorityFeePerGas
- **Multi-Chain**: Ethereum, Base, Arbitrum, Optimism, Polygon
- **Retry Logic**: 3 attempts with exponential backoff
- **Caching**: 25-second TTL
- **Chain-Specific**: Different gas limits and buffers per chain

**Usage:**
```typescript
import { getGasEstimationEngine } from '@/lib/harvestpro/gas-estimation';

const engine = getGasEstimationEngine();

const estimate = await engine.estimateSwapGas(
  1, // Ethereum
  'ETH',
  BigInt(1e18), // 1 ETH
  3000 // ETH price in USD
);

console.log(estimate.estimatedCostUsd); // e.g., 15.50
```

**Chain-Specific Buffers:**
- Ethereum: 20%
- Base: 15%
- Arbitrum: 25% (L2 mechanics)
- Optimism: 15%
- Polygon: 20%

### 3. Slippage Estimation Engine (`slippage-estimation.ts`)

DEX quote simulation and pool depth checking:

**Features:**
- **Primary**: 1inch API for accurate quotes
- **Fallback**: Heuristic estimation based on trade size
- **Caching**: 30-second TTL
- **Warning Levels**: Low (<0.5%), Medium (<2%), High (≥2%)

**Usage:**
```typescript
import { getSlippageEstimationEngine } from '@/lib/harvestpro/slippage-estimation';

const engine = getSlippageEstimationEngine();

const estimate = await engine.estimateSlippage(
  1, // Ethereum
  'ETH',
  'USDC',
  1000, // $1000 trade
  3000 // Current ETH price
);

console.log(estimate.slippagePercent); // e.g., 0.3%
console.log(estimate.slippageCostUsd); // e.g., 3.00
```

**Heuristic Slippage:**
- < $1k: 0.1%
- $1k-$10k: 0.3%
- $10k-$50k: 0.8%
- > $50k: 2.0%

### 4. Token Tradability Detection (`token-tradability.ts`)

Checks if tokens can be traded on supported DEXes:

**Features:**
- **DEX Support**: Checks Uniswap, Sushiswap, Aerodrome, etc.
- **Liquidity Check**: Minimum $10k liquidity requirement
- **Stable Pairs**: Verifies USDC/USDT/DAI pairs exist
- **Approval Check**: Detects if token approval is needed

**Usage:**
```typescript
import { getTokenTradabilityEngine } from '@/lib/harvestpro/token-tradability';

const engine = getTokenTradabilityEngine();

const check = await engine.checkTradability(
  1, // Ethereum
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
  '0x...' // User address (optional)
);

console.log(check.isTradable); // true
console.log(check.supportedDexes); // ['uniswap-v3', 'sushiswap']
console.log(check.liquidityUsd); // 50000
```

### 5. Multi-Chain Engine (`multi-chain-engine.ts`)

Unified interface for multi-chain operations:

**Features:**
- **RPC Routing**: Alchemy → Infura → Public RPCs
- **Chain Configs**: Complete configuration for 5 chains
- **Gas Estimation**: Chain-specific gas estimation
- **Swap Routing**: DEX router addresses per chain
- **Block Explorer**: Transaction URL generation

**Usage:**
```typescript
import { getMultiChainEngine } from '@/lib/harvestpro/multi-chain-engine';

const engine = getMultiChainEngine();

// Get client for a chain
const client = engine.getPublicClient(1); // Ethereum

// Get chain config
const config = engine.getChainConfig(8453); // Base
console.log(config.dexRouters); // { 'uniswap-v3': '0x...', ... }

// Get swap route
const route = await engine.getSwapRoute(
  1,
  '0x...', // Token in
  '0x...', // Token out
  BigInt(1e18)
);
```

**Supported Chains:**
- Ethereum (1)
- Base (8453)
- Arbitrum (42161)
- Optimism (10)
- Polygon (137)

## Environment Variables

```bash
# Price Oracle
COINGECKO_API_KEY=your_key_here
COINMARKETCAP_API_KEY=your_key_here

# Multi-Chain RPC URLs
ALCHEMY_API_KEY=your_key_here
INFURA_API_KEY=your_key_here
QUICKNODE_API_KEY=your_key_here

# Or chain-specific
RPC_URL_1=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY
RPC_URL_8453=https://base-mainnet.g.alchemy.com/v2/YOUR_KEY
RPC_URL_42161=https://arb-mainnet.g.alchemy.com/v2/YOUR_KEY

# Slippage Estimation
ONEINCH_API_KEY=your_key_here
```

## Testing

All components include comprehensive tests:

```bash
# Run all HarvestPro tests
npm run test -- src/lib/harvestpro/__tests__

# Run specific test
npm run test -- src/lib/harvestpro/__tests__/price-oracle.test.ts --run
```

## Performance Characteristics

| Component | Cache TTL | Retry | Timeout |
|-----------|-----------|-------|---------|
| Price Oracle | 60s | 3x | 10s |
| Gas Estimation | 25s | 3x | 5s |
| Slippage Estimation | 30s | 1x | 10s |
| Tradability Check | None | 1x | 5s |

## Error Handling

All components implement graceful error handling:

1. **Price Oracle**: Falls back through CoinGecko → CoinMarketCap → Expired Cache
2. **Gas Estimation**: Retries 3x with exponential backoff, then returns default
3. **Slippage Estimation**: Falls back to heuristic if 1inch fails
4. **Tradability**: Returns `isTradable: false` with reasons on error

## Integration with HarvestPro

These components are used by:
- **Opportunity Detection** (Task 3): Price oracle for current prices
- **Eligibility Filtering** (Task 4): Gas estimation and tradability checks
- **Net Benefit Calculation** (Task 5): Gas and slippage estimates
- **Wallet Connection** (Task 7): Multi-chain engine for wallet support
- **Execution Flow** (Task 16): Multi-chain engine for transaction execution

## Future Enhancements

1. **Price Oracle**:
   - Add more data sources (Binance, Kraken)
   - Implement price aggregation (median of multiple sources)
   - Add historical price data

2. **Gas Estimation**:
   - Real-time network congestion monitoring
   - Dynamic gas buffer adjustment
   - Gas price predictions

3. **Slippage Estimation**:
   - Direct pool reserve queries
   - Multi-hop route optimization
   - MEV protection estimates

4. **Tradability**:
   - Real-time liquidity monitoring
   - Token blacklist/whitelist
   - Honeypot detection

5. **Multi-Chain**:
   - Add more chains (Avalanche, BSC, etc.)
   - Cross-chain bridge support
   - L2 gas optimization

## Requirements Validated

This implementation satisfies:
- **Requirement 2.2**: Current market price fetching for unrealized PnL
- **Requirement 3.4**: Gas cost estimation for eligibility filtering
- **Requirement 3.5**: Token tradability detection
- **Requirement 4.1**: Price data for tax savings calculation
- **Requirement 4.2**: Gas estimation for net benefit
- **Requirement 4.3**: Slippage estimation for net benefit
- **Requirement 1.2**: Multi-wallet support across chains
- **Requirement 8.2**: Multi-chain transaction execution

## Status

✅ Task 9: Price Oracle Integration - **COMPLETED**
✅ Task 9.1: Gas Estimation Engine - **COMPLETED**
✅ Task 9.2: Slippage Estimation Engine - **COMPLETED**
✅ Task 9.3: Token Tradability Detection - **COMPLETED**
✅ Task 9.4: Multi-Chain Engine Foundation - **COMPLETED**
