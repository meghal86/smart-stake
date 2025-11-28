/**
 * Etherscan API integration for Guardian
 */

const ETHERSCAN_API_URLS: Record<string, string> = {
  ethereum: 'https://api.etherscan.io/api',
  base: 'https://api.basescan.org/api',
  arbitrum: 'https://api.arbiscan.io/api',
  polygon: 'https://api.polygonscan.com/api',
  optimism: 'https://api-optimistic.etherscan.io/api',
};

/**
 * Get Etherscan API URL for a chain
 */
function getEtherscanUrl(chain: string): string {
  return ETHERSCAN_API_URLS[chain.toLowerCase()] || ETHERSCAN_API_URLS.ethereum;
}

/**
 * Get API key from environment
 */
function getApiKey(): string {
  return import.meta.env.VITE_ETHERSCAN_API_KEY || 'YourApiKeyToken';
}

/**
 * Check if a contract is verified
 */
export async function isContractVerified(
  address: string,
  chain = 'ethereum'
): Promise<boolean> {
  try {
    const source = await getContractSource(address, chain);
    return source.verified;
  } catch (error) {
    console.error('Error checking contract verification:', error);
    return false;
  }
}

/**
 * Get contract source code
 */
export async function getContractSource(
  address: string,
  chain = 'ethereum'
): Promise<{ verified: boolean; source?: string; contractName?: string }> {
  try {
    const url = getEtherscanUrl(chain);
    const apiKey = getApiKey();

    const response = await fetch(
      `${url}?module=contract&action=getsourcecode&address=${address}&apikey=${apiKey}`
    );

    if (!response.ok) {
      return { verified: false };
    }

    const data = await response.json();

    if (data.status !== '1' || !data.result?.[0]) {
      return { verified: false };
    }

    const result = data.result[0];

    if (!result.SourceCode || result.SourceCode === '') {
      return { verified: false };
    }

    return {
      verified: true,
      source: result.SourceCode,
      contractName: result.ContractName,
    };
  } catch (error) {
    console.error('Error fetching contract source:', error);
    return { verified: false };
  }
}

/**
 * Get contract ABI
 */
export async function getABI(
  address: string,
  chain = 'ethereum'
): Promise<string | null> {
  try {
    const url = getEtherscanUrl(chain);
    const apiKey = getApiKey();

    const response = await fetch(
      `${url}?module=contract&action=getabi&address=${address}&apikey=${apiKey}`
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status !== '1' || !data.result) {
      return null;
    }

    return data.result;
  } catch (error) {
    console.error('Error fetching contract ABI:', error);
    return null;
  }
}

/**
 * Get address labels/tags (reputation indicators)
 */
export async function getLabels(
  address: string,
  chain = 'ethereum'
): Promise<string[]> {
  try {
    const url = getEtherscanUrl(chain);
    const apiKey = getApiKey();

    // Try to get account info which may include tags
    const response = await fetch(
      `${url}?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`
    );

    if (!response.ok) {
      return [];
    }

    // Note: Etherscan doesn't have a direct tags endpoint for free tier
    // This is a placeholder. Real implementation would need premium API
    // or scraping, or use a different reputation source
    
    return [];
  } catch (error) {
    console.error('Error fetching address labels:', error);
    return [];
  }
}

/**
 * Get transaction count for an address
 */
export async function getTransactionCount(
  address: string,
  chain = 'ethereum'
): Promise<number> {
  try {
    const url = getEtherscanUrl(chain);
    const apiKey = getApiKey();

    const response = await fetch(
      `${url}?module=proxy&action=eth_getTransactionCount&address=${address}&tag=latest&apikey=${apiKey}`
    );

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();

    if (!data.result) {
      return 0;
    }

    return parseInt(data.result, 16);
  } catch (error) {
    console.error('Error fetching transaction count:', error);
    return 0;
  }
}

/**
 * Get normal transactions for an address
 */
export async function getTransactions(
  address: string,
  chain = 'ethereum',
  startBlock = 0,
  endBlock = 99999999,
  page = 1,
  offset = 100
): Promise<unknown[]> {
  try {
    const url = getEtherscanUrl(chain);
    const apiKey = getApiKey();

    const response = await fetch(
      `${url}?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${endBlock}&page=${page}&offset=${offset}&sort=asc&apikey=${apiKey}`
    );

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (data.status !== '1' || !Array.isArray(data.result)) {
      return [];
    }

    return data.result;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

/**
 * Get ERC20 token transfers for an address
 */
export async function getTokenTransfers(
  address: string,
  chain = 'ethereum',
  contractAddress?: string
): Promise<Array<Record<string, unknown>>> {
  try {
    const url = getEtherscanUrl(chain);
    const apiKey = getApiKey();

    let queryUrl = `${url}?module=account&action=tokentx&address=${address}&sort=desc&apikey=${apiKey}`;
    
    if (contractAddress) {
      queryUrl += `&contractaddress=${contractAddress}`;
    }

    const response = await fetch(queryUrl);

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (data.status !== '1' || !Array.isArray(data.result)) {
      return [];
    }

    return data.result;
  } catch (error) {
    console.error('Error fetching token transfers:', error);
    return [];
  }
}

/**
 * Check Etherscan API status
 */
export async function checkApiStatus(chain = 'ethereum'): Promise<boolean> {
  try {
    const url = getEtherscanUrl(chain);
    const apiKey = getApiKey();

    const response = await fetch(
      `${url}?module=stats&action=ethsupply&apikey=${apiKey}`,
      { signal: AbortSignal.timeout(5000) }
    );

    return response.ok;
  } catch (error) {
    return false;
  }
}

