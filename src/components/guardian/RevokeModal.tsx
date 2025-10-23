/**
 * Guardian Revoke Modal
 * Interface for revoking risky token approvals
 * With gas estimation & trust score delta preview
 */
import { useState, useEffect } from 'react';
import { Trash2, Loader2, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { requestGuardianRevoke } from '@/services/guardianService';

interface Approval {
  token: `0x${string}`;
  spender: `0x${string}`;
  symbol: string;
  riskLevel: 'high' | 'medium' | 'low';
  reason: string;
}

interface RevokeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  approvals: Approval[];
  onRevoke: (selected: Approval[]) => Promise<void>;
  walletAddress?: string;
  currentTrustScore?: number;
}

export function RevokeModal({
  open,
  onOpenChange,
  approvals,
  onRevoke,
  walletAddress,
  currentTrustScore = 0,
}: RevokeModalProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<{ total: number; perTx: number } | null>(null);
  const [loadingGas, setLoadingGas] = useState(false);

  // Fetch gas estimate when selection changes
  useEffect(() => {
    if (selected.size === 0 || !walletAddress) {
      setGasEstimate(null);
      return;
    }

    const fetchGasEstimate = async () => {
      setLoadingGas(true);
      try {
        const toRevoke = approvals.filter((a) => selected.has(a.token));
        // Call revoke API with dry_run flag to get gas estimate
        const response = await requestGuardianRevoke({
          wallet: walletAddress,
          approvals: toRevoke.map((a) => ({
            token: a.token,
            spender: a.spender,
          })),
          network: 'ethereum',
          dry_run: true, // Don't execute, just estimate
        });

        if (response.gas_estimate) {
          setGasEstimate({
            total: response.gas_estimate.total_gas,
            perTx: Math.floor(response.gas_estimate.total_gas / toRevoke.length),
          });
        }
      } catch (err) {
        console.warn('Failed to fetch gas estimate:', err);
        // Fallback to simple estimate
        setGasEstimate({
          total: selected.size * 45000,
          perTx: 45000,
        });
      } finally {
        setLoadingGas(false);
      }
    };

    // Debounce gas fetching
    const timer = setTimeout(fetchGasEstimate, 500);
    return () => clearTimeout(timer);
  }, [selected, walletAddress, approvals]);

  const toggleSelection = (token: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(token)) {
      newSelected.delete(token);
    } else {
      newSelected.add(token);
    }
    setSelected(newSelected);
  };

  const selectAll = () => {
    if (selected.size === approvals.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(approvals.map((a) => a.token)));
    }
  };

  const handleRevoke = async () => {
    if (selected.size === 0) return;

    setRevoking(true);
    setError(null);

    try {
      const toRevoke = approvals.filter((a) => selected.has(a.token));
      await onRevoke(toRevoke);
      setSuccess(true);
      setTimeout(() => {
        onOpenChange(false);
        setSuccess(false);
        setSelected(new Set());
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke approvals');
    } finally {
      setRevoking(false);
    }
  };

  const getRiskColor = (level: 'high' | 'medium' | 'low') => {
    switch (level) {
      case 'high':
        return 'bg-red-500/10 text-red-500 border-red-500/30';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30';
      case 'low':
        return 'bg-slate-500/10 text-slate-500 border-slate-500/30';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            Revoke Risky Approvals
          </DialogTitle>
          <DialogDescription>
            Select the approvals you want to revoke. Each revocation requires a separate transaction.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-12 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold">Revocation Successful</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Your approvals have been revoked successfully.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {/* Select All */}
              <div className="flex items-center justify-between pb-2 border-b">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={selected.size === approvals.length && approvals.length > 0}
                    onCheckedChange={selectAll}
                    id="select-all"
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium cursor-pointer"
                  >
                    Select All ({approvals.length})
                  </label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selected.size} selected
                </p>
              </div>

              {/* Approval List */}
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-2">
                  {approvals.map((approval) => (
                    <div
                      key={approval.token}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg border-2 transition-colors cursor-pointer',
                        selected.has(approval.token)
                          ? 'border-blue-500 bg-blue-500/5'
                          : 'border-border hover:border-muted-foreground/30'
                      )}
                      onClick={() => toggleSelection(approval.token)}
                    >
                      <Checkbox
                        checked={selected.has(approval.token)}
                        onCheckedChange={() => toggleSelection(approval.token)}
                        className="mt-0.5"
                      />

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{approval.symbol}</span>
                          <Badge
                            variant="outline"
                            className={cn('text-xs', getRiskColor(approval.riskLevel))}
                          >
                            {approval.riskLevel}
                          </Badge>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {approval.reason}
                        </p>

                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                          <span className="truncate">
                            {approval.spender.slice(0, 10)}...{approval.spender.slice(-8)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Gas Estimate & Score Delta */}
              <div className="space-y-2">
                {/* Gas Estimate */}
                <div className="flex items-center justify-between text-sm p-3 bg-muted/50 rounded-lg">
                  <span className="text-muted-foreground">
                    Estimated gas:
                  </span>
                  <span className="font-medium">
                    {loadingGas ? (
                      <Loader2 className="w-4 h-4 animate-spin inline" />
                    ) : gasEstimate ? (
                      `~${gasEstimate.total.toLocaleString()} gas (${gasEstimate.perTx.toLocaleString()}/tx)`
                    ) : (
                      '—'
                    )}
                  </span>
                </div>

                {/* Trust Score Delta */}
                {selected.size > 0 && (
                  <div className="flex items-center justify-between text-sm p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-green-500" />
                      <span className="text-green-500 font-medium">Trust Score Impact</span>
                    </div>
                    <span className="font-semibold text-green-500">
                      +{Math.min(selected.size * 3, 15)} points
                    </span>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={revoking}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRevoke}
                disabled={selected.size === 0 || revoking}
                className="bg-red-500 hover:bg-red-600"
              >
                {revoking ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Revoking...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Revoke Selected ({selected.size})
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

