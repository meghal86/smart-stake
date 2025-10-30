import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AlertTriangle, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useContractWrite } from 'wagmi';

// ERC20 ABI for approve function
const erc20ABI = [
  {
    name: 'approve',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

interface RiskItem {
  id: string;
  token: string;
  tokenSymbol: string;
  spender: string;
  spenderName: string;
  allowance: string;
  severity: 'high' | 'medium' | 'low';
}

interface FixRiskModalProps {
  isOpen: boolean;
  onClose: () => void;
  risks: RiskItem[];
  onSuccess: () => void;
}

export function FixRiskModal({ isOpen, onClose, risks, onSuccess }: FixRiskModalProps) {
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
  const [currentRevoke, setCurrentRevoke] = useState<RiskItem | null>(null);

  const { writeAsync: revokeApproval, isLoading: isConfirming } = useContractWrite({
    address: currentRevoke?.token as `0x${string}`,
    abi: erc20ABI,
    functionName: 'approve',
    args: [currentRevoke?.spender as `0x${string}`, BigInt(0)],
  });

  const handleRevoke = async (risk: RiskItem) => {
    setCurrentRevoke(risk);
    try {
      await revokeApproval();
      setCurrentRevoke(null);
      onSuccess();
    } catch (error) {
      console.error('Revoke failed:', error);
      setCurrentRevoke(null);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-400 bg-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-[#0F172A] to-[#1E293B] text-gray-200 border-[rgba(255,255,255,0.1)]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#00C9A7] flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Fix Detected Risks
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {risks.map((risk) => (
            <motion.div
              key={risk.id}
              className="bg-[rgba(20,22,40,0.8)] rounded-xl p-4 border border-[rgba(255,255,255,0.08)]"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-white">{risk.tokenSymbol}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityColor(risk.severity)}`}>
                      {risk.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">
                    Unlimited approval to {risk.spenderName}
                  </p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                    <span>Contract: {risk.spender.slice(0, 6)}...{risk.spender.slice(-4)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
                
                <button
                  onClick={() => handleRevoke(risk)}
                  disabled={isConfirming && currentRevoke?.id === risk.id}
                  className="px-3 py-1 rounded-lg bg-gradient-to-r from-[#00C9A7] to-[#7B61FF] text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 transition"
                >
                  {isConfirming && currentRevoke?.id === risk.id ? 'Revoking...' : 'Revoke'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t border-gray-700/40">
          <p className="text-sm text-gray-400">
            {risks.length} risk{risks.length !== 1 ? 's' : ''} detected
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-600 text-gray-300 hover:bg-gray-700/50 transition"
            >
              Close
            </button>
            <button
              onClick={() => risks.forEach(handleRevoke)}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#00C9A7] to-[#7B61FF] text-white font-medium hover:opacity-90 transition"
            >
              Revoke All
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}