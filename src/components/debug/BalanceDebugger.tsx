import React, { useState } from 'react';
import { ethBalanceProvider } from '@/services/EthBalanceProvider_Etherscan';

interface BalanceDebuggerProps {
  addresses: string[];
}

export const BalanceDebugger: React.FC<BalanceDebuggerProps> = ({ addresses }) => {
  const [debugInfo, setDebugInfo] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const runDebugTest = async () => {
    setTesting(true);
    setDebugInfo([]);
    
    const results = [];
    
    // Test ETH price fetch
    try {
      const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
      const priceData = await priceResponse.json();
      results.push({
        type: 'price',
        success: true,
        data: priceData,
        ethPrice: priceData.ethereum?.usd
      });
    } catch (error) {
      results.push({
        type: 'price',
        success: false,
        error: error.message
      });
    }

    // Test each address
    for (const address of addresses) {
      try {
        // Test direct Etherscan API
        const etherscanResponse = await fetch(`https://api.etherscan.io/api?module=account&action=balance&address=${address}&tag=latest`);
        const etherscanData = await etherscanResponse.json();
        
        // Test our balance provider
        const providerBalance = await ethBalanceProvider.getEthBalance(address);
        
        results.push({
          type: 'balance',
          address,
          success: true,
          etherscanData,
          providerBalance,
          directBalance: etherscanData.status === '1' ? parseInt(etherscanData.result) / 1e18 : 0
        });
      } catch (error) {
        results.push({
          type: 'balance',
          address,
          success: false,
          error: error.message
        });
      }
    }

    setDebugInfo(results);
    setTesting(false);
  };

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
          🐛 Balance Debug Info (Dev Only)
        </h3>
        <button
          onClick={runDebugTest}
          disabled={testing}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {testing ? 'Testing...' : 'Run Debug Test'}
        </button>
      </div>
      
      {debugInfo.length > 0 && (
        <div className="space-y-4">
          {debugInfo.map((info, index) => (
            <div key={index} className="bg-white dark:bg-slate-800 rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-3 h-3 rounded-full ${info.success ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="font-medium text-slate-900 dark:text-white">
                  {info.type === 'price' ? 'ETH Price' : `Balance: ${info.address?.slice(0, 6)}...${info.address?.slice(-4)}`}
                </span>
              </div>
              
              <pre className="text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 p-2 rounded overflow-x-auto">
                {JSON.stringify(info, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};