import { useState } from 'react';
import { X, Wallet, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const [connecting, setConnecting] = useState<string | null>(null);

  if (!isOpen) return null;

  const wallets = [
    {
      name: 'MetaMask',
      icon: '🦊',
      description: 'Connect using browser extension',
      onClick: () => handleConnect('metamask')
    },
    {
      name: 'WalletConnect',
      icon: '🔗',
      description: 'Scan with mobile wallet',
      onClick: () => handleConnect('walletconnect')
    },
    {
      name: 'Coinbase Wallet',
      icon: '🔵',
      description: 'Connect with Coinbase',
      onClick: () => handleConnect('coinbase')
    }
  ];

  const handleConnect = async (walletType: string) => {
    setConnecting(walletType);
    
    // Simulate connection process
    setTimeout(() => {
      setConnecting(null);
      onClose();
      // TODO: Implement actual wallet connection logic
      console.log(`Connecting to ${walletType}...`);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-[#14B8A6]" />
              <h2 className="text-lg font-bold">Connect Wallet</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            {wallets.map((wallet) => (
              <Button
                key={wallet.name}
                variant="outline"
                className="w-full h-auto p-4 justify-start hover:bg-[#14B8A6]/10 hover:border-[#14B8A6]"
                onClick={wallet.onClick}
                disabled={connecting !== null}
              >
                <div className="flex items-center gap-3 w-full">
                  <span className="text-2xl">{wallet.icon}</span>
                  <div className="text-left">
                    <div className="font-medium">{wallet.name}</div>
                    <div className="text-sm text-muted-foreground">{wallet.description}</div>
                  </div>
                  {connecting === wallet.name.toLowerCase().replace(' ', '') ? (
                    <div className="ml-auto animate-spin rounded-full h-4 w-4 border-b-2 border-[#14B8A6]" />
                  ) : (
                    <ExternalLink className="ml-auto h-4 w-4 text-muted-foreground" />
                  )}
                </div>
              </Button>
            ))}
          </div>
          
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>By connecting a wallet, you agree to our</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <button className="text-[#14B8A6] hover:underline">Terms of Service</button>
              <span>and</span>
              <button className="text-[#14B8A6] hover:underline">Privacy Policy</button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}