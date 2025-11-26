/**
 * Multi-Chain Engine Tests
 * Verifies Deno migration and core functionality
 */

import { assertEquals, assertExists } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { MultiChainEngine, CHAIN_CONFIGS, getMultiChainEngine } from '../multi-chain-engine.ts';

Deno.test('MultiChainEngine - imports successfully', () => {
  assertExists(MultiChainEngine);
  assertExists(CHAIN_CONFIGS);
  assertExists(getMultiChainEngine);
});

Deno.test('MultiChainEngine - constructor initializes correctly', () => {
  const engine = new MultiChainEngine({
    preferredProvider: 'alchemy',
  });
  
  assertExists(engine);
});

Deno.test('MultiChainEngine - getSupportedChains returns expected chains', () => {
  const engine = new MultiChainEngine();
  const chains = engine.getSupportedChains();
  
  assertEquals(chains.length, 5);
  assertEquals(chains.includes(1), true); // Ethereum
  assertEquals(chains.includes(8453), true); // Base
  assertEquals(chains.includes(42161), true); // Arbitrum
  assertEquals(chains.includes(10), true); // Optimism
  assertEquals(chains.includes(137), true); // Polygon
});

Deno.test('MultiChainEngine - isChainSupported works correctly', () => {
  const engine = new MultiChainEngine();
  
  assertEquals(engine.isChainSupported(1), true);
  assertEquals(engine.isChainSupported(8453), true);
  assertEquals(engine.isChainSupported(999999), false);
});

Deno.test('MultiChainEngine - getChainConfig returns correct config', () => {
  const engine = new MultiChainEngine();
  const config = engine.getChainConfig(1);
  
  assertEquals(config.chainId, 1);
  assertEquals(config.name, 'Ethereum');
  assertEquals(config.nativeCurrency.symbol, 'ETH');
  assertExists(config.dexRouters);
  assertExists(config.stableTokens);
});

Deno.test('MultiChainEngine - getChainConfig throws for unsupported chain', () => {
  const engine = new MultiChainEngine();
  
  try {
    engine.getChainConfig(999999);
    throw new Error('Should have thrown');
  } catch (error) {
    assertEquals((error as Error).message, 'Unsupported chain: 999999');
  }
});

Deno.test('MultiChainEngine - getNativeCurrencySymbol returns correct symbols', () => {
  const engine = new MultiChainEngine();
  
  assertEquals(engine.getNativeCurrencySymbol(1), 'ETH');
  assertEquals(engine.getNativeCurrencySymbol(8453), 'ETH');
  assertEquals(engine.getNativeCurrencySymbol(137), 'MATIC');
});

Deno.test('MultiChainEngine - getStableTokens returns tokens', () => {
  const engine = new MultiChainEngine();
  const stables = engine.getStableTokens(1);
  
  assertEquals(stables.length, 3); // USDC, USDT, DAI on Ethereum
  assertEquals(stables[0], '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'); // USDC
});

Deno.test('MultiChainEngine - getDexRouters returns routers', () => {
  const engine = new MultiChainEngine();
  const routers = engine.getDexRouters(1);
  
  assertExists(routers['uniswap-v2']);
  assertExists(routers['uniswap-v3']);
  assertExists(routers['sushiswap']);
});

Deno.test('MultiChainEngine - getBlockExplorerUrl formats correctly', () => {
  const engine = new MultiChainEngine();
  const url = engine.getBlockExplorerUrl(1, '0x123abc');
  
  assertEquals(url, 'https://etherscan.io/tx/0x123abc');
});

Deno.test('MultiChainEngine - singleton pattern works', () => {
  const engine1 = getMultiChainEngine();
  const engine2 = getMultiChainEngine();
  
  assertEquals(engine1, engine2);
});

Deno.test('CHAIN_CONFIGS - contains all expected chains', () => {
  assertEquals(Object.keys(CHAIN_CONFIGS).length, 5);
  assertExists(CHAIN_CONFIGS[1]); // Ethereum
  assertExists(CHAIN_CONFIGS[8453]); // Base
  assertExists(CHAIN_CONFIGS[42161]); // Arbitrum
  assertExists(CHAIN_CONFIGS[10]); // Optimism
  assertExists(CHAIN_CONFIGS[137]); // Polygon
});

Deno.test('CHAIN_CONFIGS - Ethereum config is complete', () => {
  const ethConfig = CHAIN_CONFIGS[1];
  
  assertEquals(ethConfig.chainId, 1);
  assertEquals(ethConfig.name, 'Ethereum');
  assertEquals(ethConfig.nativeCurrency.symbol, 'ETH');
  assertEquals(ethConfig.nativeCurrency.decimals, 18);
  assertEquals(ethConfig.blockExplorer, 'https://etherscan.io');
  assertEquals(ethConfig.rpcUrls.length >= 3, true);
  assertEquals(ethConfig.stableTokens.length, 3);
  assertExists(ethConfig.dexRouters['uniswap-v2']);
  assertExists(ethConfig.dexRouters['uniswap-v3']);
});

Deno.test('CHAIN_CONFIGS - Base config is complete', () => {
  const baseConfig = CHAIN_CONFIGS[8453];
  
  assertEquals(baseConfig.chainId, 8453);
  assertEquals(baseConfig.name, 'Base');
  assertEquals(baseConfig.nativeCurrency.symbol, 'ETH');
  assertEquals(baseConfig.blockExplorer, 'https://basescan.org');
  assertExists(baseConfig.dexRouters['uniswap-v3']);
  assertExists(baseConfig.dexRouters['aerodrome']);
});

Deno.test('CHAIN_CONFIGS - Arbitrum config is complete', () => {
  const arbConfig = CHAIN_CONFIGS[42161];
  
  assertEquals(arbConfig.chainId, 42161);
  assertEquals(arbConfig.name, 'Arbitrum');
  assertEquals(arbConfig.nativeCurrency.symbol, 'ETH');
  assertEquals(arbConfig.blockExplorer, 'https://arbiscan.io');
  assertExists(arbConfig.dexRouters['uniswap-v3']);
});

Deno.test('CHAIN_CONFIGS - Optimism config is complete', () => {
  const opConfig = CHAIN_CONFIGS[10];
  
  assertEquals(opConfig.chainId, 10);
  assertEquals(opConfig.name, 'Optimism');
  assertEquals(opConfig.nativeCurrency.symbol, 'ETH');
  assertEquals(opConfig.blockExplorer, 'https://optimistic.etherscan.io');
  assertExists(opConfig.dexRouters['uniswap-v3']);
});

Deno.test('CHAIN_CONFIGS - Polygon config is complete', () => {
  const polyConfig = CHAIN_CONFIGS[137];
  
  assertEquals(polyConfig.chainId, 137);
  assertEquals(polyConfig.name, 'Polygon');
  assertEquals(polyConfig.nativeCurrency.symbol, 'MATIC');
  assertEquals(polyConfig.blockExplorer, 'https://polygonscan.com');
  assertExists(polyConfig.dexRouters['uniswap-v3']);
  assertExists(polyConfig.dexRouters['quickswap']);
});
