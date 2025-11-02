import { isAddress } from 'viem';

export function normalizeAddress(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) {
    throw new Error('Wallet address is required');
  }

  if (trimmed.endsWith('.eth')) {
    return trimmed.toLowerCase();
  }

  if (!isAddress(trimmed)) {
    throw new Error('Please enter a valid Ethereum address or ENS name');
  }

  return trimmed.toLowerCase();
}

export function shortAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
