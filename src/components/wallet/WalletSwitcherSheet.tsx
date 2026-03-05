import React from 'react';
import { Wallet } from 'lucide-react';

interface WalletSwitcherSheetProps {
  wallets: Array<{
    id: string;
    address: string;
    label: string;
    provider: string;
    balance: string;
    isActive: boolean;
  }>;
  onSwitch: (walletId: string) => void;
  onManage: () => void;
  onClose: () => void;
}

export const WalletSwitcherSheet: React.FC<WalletSwitcherSheetProps> = ({ wallets, onSwitch, onManage, onClose }) => {
  return (
    <div className="fixed inset-0 z-[9999] flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      {/* Bottom Sheet */}
      <div className="relative w-full max-w-md rounded-t-2xl bg-white dark:bg-slate-900 shadow-2xl pb-safe animate-slide-up" style={{ maxHeight: '65vh' }}>
        {/* Drag handle */}
        <div className="flex justify-center py-2">
          <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>
        <div className="px-4 pb-2">
          <div className="text-xs text-slate-500 mb-2">Active Wallet</div>
          {wallets.filter(w => w.isActive).map(wallet => (
            <div key={wallet.id} className="flex items-center justify-between border border-teal-500 rounded-lg px-3 py-3 mb-2 bg-white dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-teal-500" />
                <span className="font-medium text-slate-900 dark:text-white">{wallet.label}</span>
                <span className="text-xs text-slate-500">{wallet.address.slice(0,6)}…{wallet.address.slice(-4)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-white">${parseFloat(wallet.balance).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                <span className="text-teal-500"><svg width="20" height="20" fill="none" viewBox="0 0 20 20"><circle cx="10" cy="10" r="9" stroke="#14b8a6" strokeWidth="2" /><path d="M6 10l2.5 2.5L14 7" stroke="#14b8a6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
              </div>
            </div>
          ))}
          <div className="text-xs text-slate-500 mt-4 mb-2">Recent Wallets</div>
          {wallets.filter(w => !w.isActive).slice(0,2).map(wallet => (
            <button key={wallet.id} className="flex items-center justify-between rounded-lg px-3 py-3 mb-2 bg-slate-100 dark:bg-slate-800 w-full min-h-[56px] active:scale-95 transition-transform" onClick={() => onSwitch(wallet.id)}>
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-slate-400" />
                <span className="font-medium text-slate-900 dark:text-white">{wallet.label}</span>
                <span className="text-xs text-slate-500">{wallet.address.slice(0,6)}…{wallet.address.slice(-4)}</span>
              </div>
              <span className="font-semibold text-slate-900 dark:text-white">${parseFloat(wallet.balance).toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
            </button>
          ))}
          <button className="w-full mt-2 py-3 text-center text-teal-600 font-medium rounded-lg bg-slate-50 dark:bg-slate-800 active:scale-95 transition-transform" onClick={onManage}>
            Manage wallets →
          </button>
        </div>
      </div>
    </div>
  );
};
