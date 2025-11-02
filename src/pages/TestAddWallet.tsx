'use client';

import { SimpleAddWalletButton } from '@/components/guardian/SimpleAddWalletButton';
import { DebugAddWallet } from '@/components/guardian/DebugAddWallet';
import { WorkingAddWalletButton } from '@/components/guardian/WorkingAddWalletButton';
import { WalletProvider } from '@/contexts/WalletContext';

export function TestAddWallet() {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-black text-white p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Test Add Wallet Button</h1>
          
          <div className="space-y-4">
            <div>
              <h2 className="text-xl mb-4">Default Button</h2>
              <SimpleAddWalletButton />
            </div>
            
            <div>
              <h2 className="text-xl mb-4">Outline Button</h2>
              <SimpleAddWalletButton variant="outline" />
            </div>
            
            <div>
              <h2 className="text-xl mb-4">Large Button</h2>
              <SimpleAddWalletButton size="lg" className="bg-gradient-to-r from-[#00C9A7] to-[#7B61FF]" />
            </div>
            
            <div>
              <h2 className="text-xl mb-4">Debug Button (Simple Modal)</h2>
              <DebugAddWallet />
            </div>
            
            <div>
              <h2 className="text-xl mb-4">Working Add Wallet Button</h2>
              <WorkingAddWalletButton 
                size="lg" 
                className="bg-gradient-to-r from-[#00C9A7] to-[#7B61FF]" 
                onWalletAdded={(wallet) => console.log('Wallet added callback:', wallet)}
              />
            </div>
          </div>
          
          <div className="mt-8 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-gray-300">
              <li>Click any "Add Wallet" button above</li>
              <li>The modal should open immediately</li>
              <li>You can connect a wallet or add one manually</li>
              <li>Test both connected and manual wallet addition</li>
            </ol>
          </div>
        </div>
      </div>
    </WalletProvider>
  );
}

export default TestAddWallet;