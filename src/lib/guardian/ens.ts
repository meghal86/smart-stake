import { isAddress, createPublicClient, http, type Address } from 'viem';
import { mainnet } from 'viem/chains';

const client = createPublicClient({
  chain: mainnet,
  transport: http(),
});

export interface ResolveEnsResult {
  address: Address;
  ensName: string | null;
}

export async function resolveEns(input: string): Promise<ResolveEnsResult> {
  const trimmed = input.trim();

  if (!trimmed) {
    throw new Error('Input required');
  }

  const isEnsName = trimmed.includes('.');

  if (isEnsName) {
    const resolvedAddress = await client.getEnsAddress({ name: trimmed });

    if (!resolvedAddress) {
      throw new Error('ENS name could not be resolved');
    }

    return {
      address: resolvedAddress,
      ensName: trimmed.toLowerCase(),
    };
  }

  if (!isAddress(trimmed)) {
    throw new Error('Invalid address format');
  }

  const ensName = await client.getEnsName({ address: trimmed as Address }).catch(() => null);

  return {
    address: trimmed as Address,
    ensName: ensName ? ensName.toLowerCase() : null,
  };
}
