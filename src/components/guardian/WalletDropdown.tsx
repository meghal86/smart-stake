import { Wallet, Plus, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useWalletContext } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';

interface WalletDropdownProps {
  onAddWallet: () => void;
  className?: string;
}

export default function WalletDropdown({ onAddWallet, className }: WalletDropdownProps) {
  const { wallets, activeWallet, setActiveWallet } = useWalletContext();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg",
            "bg-white/5 hover:bg-white/10 border border-white/10",
            "text-gray-200 hover:text-white transition-colors",
            className
          )}
        >
          <Wallet className="w-4 h-4 text-[#00C9A7]" />
          <span className="font-medium">
            {activeWallet?.short || "Select Wallet"}
          </span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        className="w-60 bg-[rgba(16,18,30,0.95)] backdrop-blur-xl border-gray-700/50 text-gray-200"
        align="start"
      >
        {wallets.length === 0 ? (
          <div className="px-3 py-2 text-sm text-gray-400 text-center">
            No wallets added yet
          </div>
        ) : (
          wallets.map((wallet) => (
            <DropdownMenuItem
              key={wallet.address}
              onClick={() => setActiveWallet(wallet.address)}
              className={cn(
                "flex justify-between items-center px-3 py-2 cursor-pointer",
                "hover:bg-white/5 focus:bg-white/5",
                activeWallet?.address === wallet.address && "text-[#00C9A7] bg-[#00C9A7]/10"
              )}
            >
              <div className="flex flex-col">
                <span className="font-medium">
                  {wallet.alias || wallet.short}
                </span>
                {wallet.alias && (
                  <span className="text-xs text-gray-400 font-mono">
                    {wallet.short}
                  </span>
                )}
              </div>
              <div className="flex flex-col items-end">
                <span className="text-xs font-semibold">
                  {wallet.trust_score ?? "--"}
                </span>
                <span className="text-xs text-gray-400">
                  Trust Score
                </span>
              </div>
            </DropdownMenuItem>
          ))
        )}
        
        <DropdownMenuSeparator className="bg-gray-700/50" />
        
        <DropdownMenuItem
          onClick={onAddWallet}
          className="flex items-center gap-2 px-3 py-2 text-[#7B61FF] hover:bg-[#7B61FF]/10 focus:bg-[#7B61FF]/10 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Wallet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}