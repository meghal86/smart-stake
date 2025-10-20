import { useEffect, useMemo, useState } from 'react';
import {
  AnimatePresence,
  motion,
  animate,
  useMotionValue,
  useMotionValueEvent
} from 'framer-motion';
import LegendaryLayout from '@/components/ui/LegendaryLayout';
import { cn } from '@/lib/utils';
import { useGuardianScan } from '@/hooks/useGuardianScan';
import { GuardianFlag, GuardianSeverity } from '@/services/guardianService';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Hub2BottomNav from '@/components/hub2/Hub2BottomNav';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  Copy,
  Download,
  Loader2,
  RefreshCw,
  Shield,
  Sparkles,
  Wand2
} from 'lucide-react';

const severityThemes: Record<
  GuardianSeverity,
  {
    chip: string;
    icon: typeof AlertTriangle;
    label: string;
  }
> = {
  low: {
    chip: 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/30',
    icon: CheckCircle2,
    label: 'Low'
  },
  medium: {
    chip: 'bg-amber-500/15 text-amber-200 border border-amber-400/30',
    icon: AlertTriangle,
    label: 'Medium'
  },
  high: {
    chip: 'bg-rose-500/20 text-rose-100 border border-rose-500/40',
    icon: AlertTriangle,
    label: 'High'
  }
};

const NETWORK_OPTIONS = [
  { value: 'ethereum', label: 'Ethereum Mainnet' },
  { value: 'base', label: 'Base' },
  { value: 'polygon', label: 'Polygon' },
  { value: 'arbitrum', label: 'Arbitrum One' },
  { value: 'optimism', label: 'Optimism' },
  { value: 'solana', label: 'Solana' }
];

interface AnimatedNumberProps {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

const AnimatedNumber = ({
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
  duration = 0.6,
  className
}: AnimatedNumberProps) => {
  const motionValue = useMotionValue(value);
  const [display, setDisplay] = useState<string>(() =>
    formatValue(value, decimals, prefix, suffix)
  );

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: 'easeOut'
    });
    return () => controls.stop();
  }, [motionValue, value, duration]);

  useMotionValueEvent(motionValue, 'change', (latest) => {
    setDisplay(formatValue(latest, decimals, prefix, suffix));
  });

  return <span className={className}>{display}</span>;
};

function formatValue(
  raw: number,
  decimals: number,
  prefix: string,
  suffix: string
) {
  const factor = 10 ** decimals;
  const formatted = Math.round(raw * factor) / factor;
  return `${prefix}${formatted.toFixed(decimals)}${suffix}`;
}

const CopilotMessage = ({
  role,
  children
}: {
  role: 'user' | 'assistant';
  children: React.ReactNode;
}) => (
  <div
    className={cn(
      'rounded-2xl px-4 py-3 text-sm shadow-lg',
      role === 'assistant'
        ? 'bg-white/10 border border-white/10 text-white/90'
        : 'bg-white/5 border border-white/10 text-white/70 self-end'
    )}
  >
    {children}
  </div>
);

export default function Guardian() {
  const [walletAddress, setWalletAddress] = useState(
    '0xA6bF1D4E9c34d12BfC5e8A946f912e7cC42D2D9C'
  );
  const [network, setNetwork] = useState('ethereum');
  const [isFixModalOpen, setFixModalOpen] = useState(false);
  const [isCopilotModalOpen, setCopilotModalOpen] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied'>('idle');
  const [selectedFlag, setSelectedFlag] = useState<GuardianFlag | null>(null);
  const [evidenceFlag, setEvidenceFlag] = useState<GuardianFlag | null>(null);
  const [isEvidenceModalOpen, setEvidenceModalOpen] = useState(false);
  const [isProofModalOpen, setProofModalOpen] = useState(false);
  const [copyProofState, setCopyProofState] = useState<'idle' | 'copied'>('idle');
  const [copyEvidenceState, setCopyEvidenceState] = useState<'idle' | 'copied'>('idle');
  const canUseClipboard = typeof navigator !== 'undefined' && !!navigator.clipboard;

  const {
    data,
    isLoading,
    isRefetching,
    isRescanning,
    rescan,
    statusAccent,
    scoreGlow
  } = useGuardianScan({
    walletAddress,
    network
  });

  const isBusy = isLoading || isRescanning || isRefetching;

  const actionableFlags = useMemo(
    () => data?.flags ?? [],
    [data?.flags]
  );

  useEffect(() => {
    if (copyState === 'copied') {
      const timeout = setTimeout(() => setCopyState('idle'), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copyState]);

  useEffect(() => {
    if (copyProofState === 'copied') {
      const timeout = setTimeout(() => setCopyProofState('idle'), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copyProofState]);

  useEffect(() => {
    if (copyEvidenceState === 'copied') {
      const timeout = setTimeout(() => setCopyEvidenceState('idle'), 2000);
      return () => clearTimeout(timeout);
    }
  }, [copyEvidenceState]);

  const handleCopy = () => {
    if (!canUseClipboard || typeof navigator === 'undefined') return;
    navigator.clipboard.writeText(walletAddress).then(() => {
      setCopyState('copied');
    });
  };

  const buildFlagRecommendation = (flag: GuardianFlag) => {
    if (flag.severity === 'high') {
      return `Immediately revoke approvals interacting with ${flag.type}. This item is rated HIGH severity.`;
    }
    if (flag.severity === 'medium') {
      return `Review and consider revoking permissions linked to ${flag.type}.`;
    }
    return `Monitor ${flag.type}; risk is LOW but track for future changes.`;
  };

  const fixRecommendations = useMemo(() => {
    if (!data?.flags?.length) {
      return [
        'No outstanding security flags detected. You are clear to transact.'
      ];
    }

    if (selectedFlag) {
      return [
        buildFlagRecommendation(selectedFlag),
        'Mark as acknowledged once the revocation transaction confirms on-chain.'
      ];
    }

    return [
      ...data.flags.map(buildFlagRecommendation),
      'Enable live Guardian monitoring to auto-flag new risky approvals instantly.'
    ];
  }, [data?.flags, selectedFlag]);

  const proofSummary = useMemo(() => {
    if (!data) {
      return 'Guardian proof not available yet. Run a scan to generate compliance output.';
    }

    const flagsSummary = data.flags.length
      ? data.flags
          .map((flag) => `• ${flag.type} (${flag.severity})${flag.details ? ` — ${flag.details}` : ''}`)
          .join('\n')
      : '• No active security flags';

    return [
      'AlphaWhale Guardian Proof',
      `Guardian Scan ID: ${data.guardianScanId ?? 'n/a'}`,
      `Wallet: ${data.walletAddress}`,
      `Network: ${data.network}`,
      `Trust Score: ${data.trustScorePercent}%`,
      `Risk Score: ${data.riskScore.toFixed(1)}/10 (${data.riskLevel})`,
      `Flags:`,
      flagsSummary,
      `Last Scan: ${data.lastScanLocal}`
    ].join('\n');
  }, [data]);

  const proofPayload = useMemo(() => {
    if (!data) return null;

    return {
      schema: 'alphawhale/guardian-proof@1',
      guardianScanId: data.guardianScanId ?? null,
      walletAddress: data.walletAddress,
      network: data.network,
      trustScorePercent: data.trustScorePercent,
      riskScore: data.riskScore,
      riskLevel: data.riskLevel,
      flags: data.flags,
      generatedAt: new Date().toISOString()
    };
  }, [data]);

  const copilotConversation = useMemo(() => {
    if (!data) {
      return [
        {
          role: 'assistant' as const,
          text: 'Initializing Guardian copilot. Provide a wallet to begin the scan.'
        }
      ];
    }

    const flagSummary = data.flags.length
      ? `${data.flags.length} flag${data.flags.length === 1 ? '' : 's'} (${data.issuesBySeverity.high} high, ${data.issuesBySeverity.medium} medium, ${data.issuesBySeverity.low} low).`
      : 'no open flags. All clear.';

    return [
      {
        role: 'user' as const,
        text: 'Can you scan my wallet again?'
      },
      {
        role: 'assistant' as const,
        text: `Absolutely. Re-running Guardian intelligence across ${data.network}.`
      },
      {
        role: 'assistant' as const,
        text: `Scan complete. Trust index ${data.trustScorePercent}% (${data.statusLabel}). Risk ${data.riskScore.toFixed(
          1
        )}/10. Detected ${flagSummary}`
      },
      {
        role: 'assistant' as const,
        text: data.flags.length
          ? 'Would you like me to prepare revocation transactions for the risky approvals?'
          : 'You are in the green. I can keep listening for new contract approvals if you enable live monitoring.'
      }
    ];
  }, [data]);

  const handleCopyProof = async () => {
    if (!data || !canUseClipboard || typeof navigator === 'undefined') return;
    try {
      await navigator.clipboard.writeText(proofSummary);
      setCopyProofState('copied');
    } catch (error) {
      console.error('Failed to copy guardian proof:', error);
    }
  };

  const handleDownloadProof = () => {
    if (!data || !proofPayload) return;

    const blob = new Blob([JSON.stringify(proofPayload, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeWalletPrefix = data.walletAddress?.slice(0, 6) ?? 'wallet';
    link.download = `guardian-proof-${safeWalletPrefix}-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyEvidence = async () => {
    if (!evidenceFlag || !canUseClipboard || typeof navigator === 'undefined') return;
    const summary = [
      `Guardian Evidence for ${evidenceFlag.type}`,
      `Severity: ${evidenceFlag.severity}`,
      evidenceFlag.details ? `Details: ${evidenceFlag.details}` : null,
      evidenceFlag.timestamp ? `Detected: ${new Date(evidenceFlag.timestamp).toLocaleString()}` : null,
      `Wallet: ${data?.walletAddress ?? walletAddress}`,
      `Network: ${data?.network ?? getNetworkLabel(network)}`
    ]
      .filter(Boolean)
      .join('\n');

    try {
      await navigator.clipboard.writeText(summary);
      setCopyEvidenceState('copied');
    } catch (error) {
      console.error('Failed to copy evidence summary:', error);
    }
  };

  const handleViewEvidence = (flag: GuardianFlag) => {
    setEvidenceFlag(flag);
    setEvidenceModalOpen(true);
  };

  const handleRecommendFix = (flag: GuardianFlag) => {
    setSelectedFlag(flag);
    setFixModalOpen(true);
  };

  return (
    <LegendaryLayout mode="pro">
      <main className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-4 pb-48 pt-16 sm:px-6 lg:px-8">
        <motion.header
          className="mb-10 space-y-3 text-center"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.3em] text-white/60">
            <Shield className="h-3.5 w-3.5 text-primary" />
            AlphaWhale Guardian
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-lg sm:text-5xl">
            Welcome to AlphaWhale
          </h1>
          <p className="text-base text-white/70 sm:text-lg">
            Your crypto guardian copilot. Instantly measure wallet trust, surface
            hidden threats, and take action with one tap.
          </p>
        </motion.header>

        <motion.section
          className="mb-8 grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-2xl lg:grid-cols-[1.2fr,0.8fr]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <div className="space-y-6">
            <Card className={cn('relative overflow-hidden border-white/10 bg-white/5 py-6', scoreGlow)}>
              <div
                className={cn(
                  'pointer-events-none absolute inset-0 opacity-60 blur-2xl',
                  'bg-gradient-to-br',
                  statusAccent
                )}
              />
              <div className="relative z-10 px-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.25em] text-white/60">
                      Trust Index
                    </p>
                    <div className="flex items-baseline gap-2">
                      <AnimatedNumber
                        value={data?.trustScorePercent ?? 0}
                        suffix="%"
                        className="text-5xl font-black text-white drop-shadow-lg"
                      />
                      <Badge className="bg-white/15 text-white backdrop-blur-md">
                        {data?.statusLabel ?? 'loading'}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/50">
                      Risk Score
                    </p>
                    <AnimatedNumber
                      value={data?.riskScore ?? 0}
                      decimals={1}
                      suffix="/10"
                      className="text-xl font-semibold text-white"
                    />
                    <span className="text-xs text-white/60">
                      {data?.riskLevel ?? '—'} risk posture
                    </span>
                  </div>
                </div>
                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-white/70">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                      Wallet
                    </p>
                    <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-white">
                      <span className="truncate">
                        {shortenWallet(data?.walletAddress ?? walletAddress)}
                      </span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={handleCopy}
                            className="rounded-full border border-white/10 bg-white/10 p-1 text-white/60 transition hover:bg-white/20 hover:text-white"
                            aria-label="Copy wallet address"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {copyState === 'copied' ? 'Copied!' : 'Copy address'}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <p className="mt-1 text-[11px] text-white/40">
                      {copyState === 'copied' ? 'Address copied to clipboard' : 'Tap to copy full address'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-white/70">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                      Network
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {data?.network ?? getNetworkLabel(network)}
                    </p>
                    <p className="mt-1 text-[11px] text-white/40">
                      Last scan {data?.lastScanRelative ?? 'just now'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/10 p-4 text-white/70">
                    <p className="text-xs uppercase tracking-[0.2em] text-white/40">
                      Guardian ID
                    </p>
                    <p className="mt-1 text-sm font-semibold text-white">
                      {data?.guardianScanId ?? 'pending'}
                    </p>
                    <p className="mt-1 text-[11px] text-white/40">
                      {data?.lastScanLocal ?? ''}
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Button
                    size="lg"
                    onClick={() => {
                      void rescan();
                    }}
                    disabled={isBusy}
                    className="rounded-xl bg-gradient-to-r from-teal-300 to-cyan-400 font-semibold text-black hover:from-teal-200 hover:to-cyan-300"
                  >
                    {isBusy ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    {isBusy ? 'Scanning...' : 'Rescan Wallet'}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => {
                      setSelectedFlag(null);
                      setFixModalOpen(true);
                    }}
                    disabled={!data?.hasFlags}
                    className="rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    Fix Detected Issues
                  </Button>
                  <p className="text-xs text-white/50">
                    {data?.summary ?? 'Guardian intelligence standing by.'}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="border-white/10 bg-black/20 p-6 backdrop-blur-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.25em] text-white/40">
                    Scan Parameters
                  </p>
                  <h2 className="text-xl font-semibold text-white">
                    Configure your Guardian sweep
                  </h2>
                </div>
                <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
                  <div className="flex-1">
                    <Label htmlFor="wallet" className="text-xs text-white/60">
                      Wallet Address
                    </Label>
                    <Input
                      id="wallet"
                      placeholder="0x..."
                      value={walletAddress}
                      onChange={(event) => setWalletAddress(event.target.value)}
                      className="mt-1 w-full rounded-xl border-white/20 bg-black/40 text-white placeholder:text-white/30 focus-visible:ring-emerald-300/70"
                    />
                  </div>
                  <div className="sm:w-48">
                    <Label className="text-xs text-white/60">Network</Label>
                    <Select value={network} onValueChange={setNetwork}>
                      <SelectTrigger className="mt-1 w-full rounded-xl border-white/20 bg-black/40 text-white focus:ring-emerald-300/70 focus:ring-offset-0">
                        <SelectValue placeholder="Select network" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 text-white">
                        {NETWORK_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card className="border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-white/40">
                    Guardian Watchlist
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-white">
                    Detected security flags
                  </h2>
                </div>
                <Badge className="bg-white/10 text-white">
                  {data?.flags.length ?? 0} Issues
                </Badge>
              </div>
              <div className="mt-5 space-y-4">
                {actionableFlags.length === 0 && (
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                    No active threats. Guardian is monitoring for new approvals,
                    mixers, and sanction risks.
                  </div>
                )}
                {actionableFlags.map((flag) => {
                  const theme = severityThemes[flag.severity];
                  const Icon = theme.icon;
                  return (
                    <motion.div
                      key={flag.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/30 p-4"
                    >
                      <div className="absolute inset-0 opacity-20 blur-2xl"
                        style={{
                          background:
                            flag.severity === 'high'
                              ? 'linear-gradient(135deg, rgba(255,0,102,0.4), transparent)'
                              : flag.severity === 'medium'
                                ? 'linear-gradient(135deg, rgba(249,176,64,0.4), transparent)'
                                : 'linear-gradient(135deg, rgba(45,223,184,0.35), transparent)'
                        }}
                      />
                      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl border border-white/10 bg-white/10 p-2 text-white/80">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h3 className="text-lg font-semibold text-white">
                                {flag.type}
                              </h3>
                              <span className={cn('rounded-full px-3 py-1 text-xs uppercase tracking-wide', theme.chip)}>
                                {theme.label} severity
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-white/70">
                              {flag.details ?? 'Guardian detected anomalous activity.'}
                            </p>
                            {flag.timestamp && (
                              <p className="mt-2 text-xs text-white/40">
                                Detected {new Date(flag.timestamp).toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Button
                            variant="ghost"
                            onClick={() => handleViewEvidence(flag)}
                            className="rounded-full border border-white/10 bg-white/10 text-xs uppercase tracking-wide text-white hover:bg-white/20"
                          >
                            View Evidence
                            <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => handleRecommendFix(flag)}
                            className="rounded-full border border-white/10 bg-white/10 text-xs uppercase tracking-wide text-white hover:bg-white/20"
                          >
                            Recommend Fix
                            <Sparkles className="ml-2 h-3.5 w-3.5 text-teal-200" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </Card>

            <Card className="border-white/10 bg-black/30 p-6 text-white/80 backdrop-blur-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-white/40">
                    Scan Summary
                  </p>
                  <h2 className="text-xl font-semibold text-white">
                    Guardian telemetry at a glance
                  </h2>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setProofModalOpen(true)}
                  className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20"
                >
                  Export Compliance Proof
                  <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                </Button>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                    Trust Delta (24h)
                  </p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-3xl font-bold text-emerald-300">
                      +2.4%
                    </span>
                    <span className="text-xs text-white/50">steady climb</span>
                  </div>
                  <p className="mt-3 text-sm text-white/60">
                    Guardian has observed improving trust based on fewer risky approvals.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                    Sanction Exposure
                  </p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-3xl font-bold text-emerald-200">
                      0%
                    </span>
                    <span className="text-xs text-white/50">no matches</span>
                  </div>
                  <p className="mt-3 text-sm text-white/60">
                    No intersections with OFAC, major exchange blacklists, or mixer sanctions.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-white/40">
                    Real-time Monitoring
                  </p>
                  <div className="mt-2 flex items-end gap-2">
                    <span className="text-3xl font-bold text-white">
                      Active
                    </span>
                    <span className="text-xs text-white/50">Guardian listening</span>
                  </div>
                  <p className="mt-3 text-sm text-white/60">
                    Webhooks armed for new approvals, contract interactions, and threat updates.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </motion.section>

        <AnimatePresence>
          {isBusy && (
            <motion.div
              key="guardian-loading"
              className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="relative flex h-32 w-32 items-center justify-center rounded-full border border-teal-200/30 bg-white/5 shadow-[0_0_60px_rgba(45,223,184,0.35)]"
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
              >
                <div className="absolute inset-4 rounded-full border border-teal-200/40" />
                <Shield className="h-10 w-10 text-teal-200" />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <motion.button
        onClick={() => setCopilotModalOpen(true)}
        className="group fixed bottom-28 left-1/2 z-40 flex h-24 w-24 -translate-x-1/2 items-center justify-center rounded-full bg-gradient-to-tr from-teal-300 via-cyan-300 to-emerald-300 text-slate-900 shadow-[0_0_80px_rgba(45,223,184,0.45)] transition transform hover:scale-105"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <motion.div
          className="absolute inset-0 rounded-full bg-white/40 blur-2xl"
          animate={{ opacity: [0.25, 0.6, 0.25] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <Sparkles className="relative z-10 h-8 w-8 transition group-hover:rotate-6" />
      </motion.button>

      <Dialog
        open={isFixModalOpen}
        onOpenChange={(open) => {
          setFixModalOpen(open);
          if (!open) {
            setSelectedFlag(null);
          }
        }}
      >
        <DialogContent className="max-w-lg border-white/10 bg-slate-900/95 text-white backdrop-blur-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-white">
              <Shield className="h-4 w-4 text-teal-300" />
              {selectedFlag ? `${selectedFlag.type} Fix Plan` : 'Guardian Fix Plan'}
            </DialogTitle>
            <DialogDescription className="text-sm text-white/60">
              {selectedFlag
                ? 'Targeted remediation for the selected Guardian flag.'
                : 'Recommended steps to resolve the current security flags.'}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-3 text-sm text-white/80">
            {fixRecommendations.map((item, index) => (
              <div
                key={index}
                className="rounded-2xl border border-white/10 bg-white/5 p-3"
              >
                {item}
              </div>
            ))}
            <Button
              onClick={() => {
                setFixModalOpen(false);
                setSelectedFlag(null);
              }}
              className="w-full rounded-xl bg-gradient-to-r from-teal-300 to-cyan-300 font-semibold text-slate-900 hover:from-teal-200 hover:to-cyan-200"
            >
              Mark as Acknowledged
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isEvidenceModalOpen}
        onOpenChange={(open) => {
          setEvidenceModalOpen(open);
          if (!open) {
            setEvidenceFlag(null);
            setCopyEvidenceState('idle');
          }
        }}
      >
        <DialogContent className="max-w-lg border border-white/10 bg-slate-950/95 text-white backdrop-blur-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-white">
              <AlertTriangle className="h-4 w-4 text-amber-300" />
              {evidenceFlag ? `${evidenceFlag.type} Evidence` : 'No Evidence Selected'}
            </DialogTitle>
            <DialogDescription className="text-sm text-white/60">
              On-chain signals and provenance captured during the latest Guardian scan.
            </DialogDescription>
          </DialogHeader>
          {evidenceFlag ? (
            <div className="space-y-3 text-sm text-white/80">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/40">Severity</p>
                <p className="mt-1 text-base font-semibold capitalize text-white">
                  {evidenceFlag.severity}
                </p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs uppercase tracking-[0.25em] text-white/40">Details</p>
                <p className="mt-1 text-white/80">
                  {evidenceFlag.details ?? 'No additional evidence provided for this flag.'}
                </p>
              </div>
              {evidenceFlag.timestamp && (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-[0.25em] text-white/40">Detected</p>
                  <p className="mt-1 text-white/80">
                    {new Date(evidenceFlag.timestamp).toLocaleString()}
                  </p>
                </div>
              )}
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  onClick={handleCopyEvidence}
                  disabled={!canUseClipboard}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-300 to-teal-300 font-semibold text-slate-900 hover:from-emerald-200 hover:to-teal-200"
                >
                  <ClipboardCheck className="mr-2 h-4 w-4" />
                  {copyEvidenceState === 'copied' ? 'Copied evidence' : 'Copy evidence summary'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setEvidenceModalOpen(false);
                    setSelectedFlag(evidenceFlag);
                    setFixModalOpen(true);
                  }}
                  className="flex-1 rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10"
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Open Fix Plan
                </Button>
              </div>
            </div>
          ) : (
            <p className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              Select a flag from the Guardian feed to review evidence.
            </p>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={isProofModalOpen}
        onOpenChange={(open) => {
          setProofModalOpen(open);
          if (!open) {
            setCopyProofState('idle');
          }
        }}
      >
        <DialogContent className="max-w-xl border border-white/10 bg-slate-950/95 text-white backdrop-blur-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-white">
              <Shield className="h-4 w-4 text-teal-300" />
              Guardian Compliance Proof
            </DialogTitle>
            <DialogDescription className="text-sm text-white/60">
              Shareable attestation summarising wallet trust posture and Guardian findings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <pre className="max-h-64 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-relaxed text-white/80">
              {proofSummary}
            </pre>
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                onClick={handleCopyProof}
                disabled={!data || !canUseClipboard}
                className="rounded-xl bg-gradient-to-r from-emerald-300 to-teal-300 font-semibold text-slate-900 hover:from-emerald-200 hover:to-teal-200"
              >
                <Copy className="mr-2 h-4 w-4" />
                {copyProofState === 'copied' ? 'Copied summary' : 'Copy summary'}
              </Button>
              <Button
                onClick={handleDownloadProof}
                disabled={!data}
                className="rounded-xl border border-white/20 bg-white/5 text-white hover:bg-white/10"
              >
                <Download className="mr-2 h-4 w-4" />
                Download JSON
              </Button>
            </div>
            <p className="text-xs text-white/40">
              Guardian proof files are signed client-side. For formal compliance attestations,
              enable Guardian Trusted Execution so AlphaWhale can timestamp proofs on-chain.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isCopilotModalOpen} onOpenChange={setCopilotModalOpen}>
        <DialogContent className="max-w-xl border border-teal-200/20 bg-slate-950/95 text-white backdrop-blur-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-semibold text-white">
              <Sparkles className="h-5 w-5 text-teal-300" />
              AlphaWhale Copilot
            </DialogTitle>
            <DialogDescription className="text-sm text-white/60">
              Guardian AI summarises threats, prepares fixes, and keeps your wallet safe.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex flex-col gap-3">
            {copilotConversation.map((message, index) => (
              <CopilotMessage key={index} role={message.role}>
                {message.text}
              </CopilotMessage>
            ))}
          </div>
          <div className="mt-6 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-xs text-white/60">
            <Sparkles className="h-4 w-4 text-teal-200" />
            When you enable trusted execution, Copilot can automatically prepare contract
            revocations and broadcast on your behalf.
          </div>
        </DialogContent>
      </Dialog>

      <Hub2BottomNav />
    </LegendaryLayout>
  );
}

function shortenWallet(address: string) {
  if (!address) return '—';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function getNetworkLabel(value: string) {
  return NETWORK_OPTIONS.find((option) => option.value === value)?.label ?? value;
}
