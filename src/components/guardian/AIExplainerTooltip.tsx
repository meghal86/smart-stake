/**
 * AI Explainer Tooltip
 * Shows contextual explanations for complex crypto/security concepts
 * Supports both novice-friendly and technical explanations
 */
import { useState } from 'react';
import { HelpCircle, Sparkles, BookOpen, ExternalLink } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';

export interface AIExplainerTooltipProps {
  /** The concept being explained */
  concept: string;
  /** Simple explanation for beginners */
  simpleExplanation: string;
  /** Technical explanation for experts */
  technicalExplanation?: string;
  /** Optional analogy to help understanding */
  analogy?: string;
  /** Link to learn more */
  learnMoreUrl?: string;
  /** Example to illustrate the concept */
  example?: string;
  /** Show technical details by default (for expert mode) */
  showTechnical?: boolean;
  /** Custom icon */
  icon?: React.ReactNode;
  /** Placement of tooltip */
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function AIExplainerTooltip({
  concept,
  simpleExplanation,
  technicalExplanation,
  analogy,
  learnMoreUrl,
  example,
  showTechnical = false,
  icon,
  side = 'top',
}: AIExplainerTooltipProps) {
  const [showAdvanced, setShowAdvanced] = useState(showTechnical);

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 rounded-full hover:bg-blue-500/10 hover:text-blue-500 transition-all"
            aria-label={`Explain: ${concept}`}
          >
            {icon || <HelpCircle className="h-4 w-4" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent
          side={side}
          className="max-w-sm p-4 space-y-3 bg-slate-900/95 backdrop-blur-xl border-slate-700"
          sideOffset={5}
        >
          {/* Header with AI Badge */}
          <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
            <Sparkles className="h-4 w-4 text-blue-400" />
            <span className="font-semibold text-sm text-slate-100">
              {concept}
            </span>
          </div>

          {/* Simple Explanation */}
          <div className="space-y-2">
            <p className="text-sm text-slate-300 leading-relaxed">
              {simpleExplanation}
            </p>

            {/* Analogy (if provided) */}
            {analogy && (
              <div className="flex gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <div className="text-lg" aria-hidden="true">
                  💡
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-400 mb-1">
                    Think of it like this:
                  </p>
                  <p className="text-xs text-slate-400 italic">{analogy}</p>
                </div>
              </div>
            )}

            {/* Example (if provided) */}
            {example && (
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-xs font-medium text-slate-400 mb-1">
                  Example:
                </p>
                <p className="text-xs text-slate-300 font-mono">{example}</p>
              </div>
            )}
          </div>

          {/* Technical Toggle */}
          {technicalExplanation && (
            <div className="space-y-2">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs font-medium text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                {showAdvanced ? '← Simple version' : '→ Technical details'}
              </button>

              {showAdvanced && (
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 space-y-2">
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {technicalExplanation}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Learn More Link */}
          {learnMoreUrl && (
            <div className="pt-2 border-t border-slate-700">
              <a
                href={learnMoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1 group"
              >
                <BookOpen className="h-3 w-3" />
                <span>Learn more</span>
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Preset Explainers for Common Guardian Concepts
 */
export const GUARDIAN_EXPLAINERS = {
  trustScore: {
    concept: 'Trust Score',
    simpleExplanation:
      'A score from 0-100 showing how secure your wallet is. Higher is better! Think of it like a credit score for your wallet.',
    technicalExplanation:
      'Calculated using weighted factors: token approvals (40%), mixer proximity (30%), contract interactions (20%), and wallet age/reputation (10%).',
    analogy:
      "It's like a health checkup for your wallet. The doctor (Guardian) checks multiple things and gives you an overall health score.",
    learnMoreUrl: 'https://docs.example.com/trust-score',
  },
  
  tokenApproval: {
    concept: 'Token Approval',
    simpleExplanation:
      'Permission you gave an app to spend your tokens. Some apps ask for unlimited access, which is risky if they get hacked.',
    technicalExplanation:
      'ERC-20/721 approve() function calls that grant spender allowance. Unlimited approvals (2^256-1) pose security risks and should be revoked when not in use.',
    analogy:
      "It's like giving someone a signed blank check. They can fill in any amount. Safe apps only ask for what they need.",
    example: 'Uniswap might need approval to swap your USDC, but unlimited access is risky.',
    learnMoreUrl: 'https://docs.example.com/approvals',
  },
  
  mixerExposure: {
    concept: 'Mixer Exposure',
    simpleExplanation:
      'Mixers are services that blend crypto transactions to hide their origin. While not illegal, they can be red flags.',
    technicalExplanation:
      'Tornado Cash and similar protocols obfuscate transaction graphs. Proximity scoring measures transaction hops from known mixer addresses.',
    analogy:
      'Like washing cash through multiple bank accounts to hide where it came from. Sometimes legitimate, sometimes suspicious.',
    learnMoreUrl: 'https://docs.example.com/mixer-risk',
  },
  
  contractRisk: {
    concept: 'Contract Risk',
    simpleExplanation:
      'Smart contracts are programs on the blockchain. Some have bugs or hidden features that could steal your money.',
    technicalExplanation:
      'Static analysis for honeypot patterns, hidden mint functions, ownership centralization, and unverified bytecode. Includes Slither/Mythril vulnerability scanning.',
    analogy:
      'Like checking if a vending machine might keep your money instead of giving you a snack.',
    example: 'A honeypot contract lets you buy tokens but never lets you sell them.',
    learnMoreUrl: 'https://docs.example.com/contract-risks',
  },
  
  walletAge: {
    concept: 'Wallet Age',
    simpleExplanation:
      'How long your wallet has been active. Older wallets with consistent use are generally more trustworthy.',
    technicalExplanation:
      'Time since first transaction. Factors in transaction frequency, volume patterns, and dormancy periods to assess legitimacy.',
    analogy:
      'Like a credit history – longer history of good behavior builds trust.',
  },
};

