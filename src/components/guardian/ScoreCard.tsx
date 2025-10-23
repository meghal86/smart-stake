/**
 * Guardian Score Card
 * Displays trust score with gauge visualization
 */
import { Shield, RefreshCw, Wrench, Clock, Flag, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ScoreCardProps {
  score: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  flags: number;
  critical: number;
  lastScan: string; // Relative time like "3m ago"
  chains: string[];
  autoRefreshEnabled?: boolean;
  onRescan: () => void;
  onFixRisks: () => void;
  isRescanning?: boolean;
}

export function ScoreCard({
  score,
  grade,
  flags,
  critical,
  lastScan,
  chains,
  autoRefreshEnabled = false,
  onRescan,
  onFixRisks,
  isRescanning = false,
}: ScoreCardProps) {
  // Determine color based on score
  const getScoreColor = () => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBg = () => {
    if (score >= 80) return 'from-green-500/20 to-green-600/10';
    if (score >= 60) return 'from-yellow-500/20 to-yellow-600/10';
    return 'from-red-500/20 to-red-600/10';
  };

  const getScoreBorder = () => {
    if (score >= 80) return 'border-green-500/50';
    if (score >= 60) return 'border-yellow-500/50';
    return 'border-red-500/50';
  };

  const getGradeBadge = () => {
    const variants: Record<string, string> = {
      A: 'bg-green-500/10 text-green-500 border-green-500/30',
      B: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
      C: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
      D: 'bg-orange-500/10 text-orange-500 border-orange-500/30',
      F: 'bg-red-500/10 text-red-500 border-red-500/30',
    };
    return variants[grade] || variants.F;
  };

  return (
    <div className="space-y-4">
      {/* Main Score Display */}
      <Card className={cn('border-2', getScoreBorder())}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Trust Score
            </CardTitle>
            <Badge
              variant="outline"
              className={cn('text-lg font-bold px-3 py-1', getGradeBadge())}
            >
              {grade}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Circular Gauge */}
          <div className="flex items-center justify-center">
            <div className="relative w-48 h-48">
              {/* Background Circle */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className="text-muted"
                  opacity="0.2"
                />
                {/* Progress Circle */}
                <circle
                  cx="96"
                  cy="96"
                  r="88"
                  stroke="currentColor"
                  strokeWidth="12"
                  fill="none"
                  className={getScoreColor()}
                  strokeLinecap="round"
                  strokeDasharray={`${(score / 100) * 553} 553`}
                />
              </svg>

              {/* Score Text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={cn('text-6xl font-bold', getScoreColor())}>
                  {score}
                </span>
                <span className="text-sm text-muted-foreground">out of 100</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={onRescan}
              disabled={isRescanning}
              className="w-full"
            >
              <RefreshCw className={cn('w-4 h-4 mr-2', isRescanning && 'animate-spin')} />
              Rescan Wallet
            </Button>

            <Button
              onClick={onFixRisks}
              disabled={flags === 0}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              <Wrench className="w-4 h-4 mr-2" />
              Fix Risks
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info Tiles */}
      <div className="grid grid-cols-3 gap-3">
        {/* Flags */}
        <Card className="border-2">
          <CardContent className="pt-4 pb-3 px-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-2xl font-bold">
                  {flags}
                  {critical > 0 && (
                    <span className="text-sm text-red-500 ml-1">
                      ({critical})
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Flags {critical > 0 && '• Critical'}
                </p>
              </div>
              <Flag className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
            </div>
          </CardContent>
        </Card>

        {/* Last Scan */}
        <Card className="border-2">
          <CardContent className="pt-4 pb-3 px-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{lastScan}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {autoRefreshEnabled ? 'Auto-refresh on' : 'Last scan'}
                </p>
              </div>
              <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
            </div>
          </CardContent>
        </Card>

        {/* Chains */}
        <Card className="border-2">
          <CardContent className="pt-4 pb-3 px-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">
                  {chains.join(', ')}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {chains.length} chain{chains.length > 1 ? 's' : ''}
                </p>
              </div>
              <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

