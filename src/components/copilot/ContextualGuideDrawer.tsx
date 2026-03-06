import { useEffect, useMemo, useRef, useState } from 'react';
import { Bot, Brain, Briefcase, Send, Shield, Sparkles } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

type GuideKind = 'portfolio' | 'guardian';

type GuideMessage = {
  id: string;
  role: 'assistant' | 'user';
  content: string;
};

type QuickPrompt = {
  id: string;
  label: string;
  prompt: string;
};

export interface PortfolioGuideContext {
  screenLabel: string;
  walletScopeLabel: string;
  totalValue: number;
  dailyDelta: number;
  overallRiskScore: number;
  trustIndex: number;
  approvalsCount: number;
  highRiskApprovals: number;
  actionTitles: string[];
  topPositions: Array<{ token: string; valueUsd: number }>;
  isDemo: boolean;
}

export interface GuardianGuideContext {
  walletLabel: string;
  trustScore: number | null;
  flagCount: number;
  approvalRiskCount: number;
  freshnessLabel: string;
  primaryAction: string;
  isDemo: boolean;
}

interface ContextualGuideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  kind: GuideKind;
  context: PortfolioGuideContext | GuardianGuideContext;
}

const portfolioPrompts: QuickPrompt[] = [
  { id: 'summary', label: 'Summarize', prompt: 'Summarize this portfolio for me.' },
  { id: 'changes', label: 'What Changed', prompt: 'What changed that I should care about?' },
  { id: 'risk', label: 'Risk Focus', prompt: 'Where is the concentration or approval risk?' },
  { id: 'positions', label: 'Top Positions', prompt: 'Explain my largest positions.' },
];

const guardianPrompts: QuickPrompt[] = [
  { id: 'score', label: 'Explain Score', prompt: 'Explain this wallet health score.' },
  { id: 'fix', label: 'Fix First', prompt: 'What should I fix first?' },
  { id: 'approvals', label: 'Approvals', prompt: 'Which approval should I review first?' },
  { id: 'rescan', label: 'Rescan', prompt: 'When should I rescan this wallet?' },
];

function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

function buildInitialMessage(kind: GuideKind, context: PortfolioGuideContext | GuardianGuideContext) {
  if (kind === 'portfolio') {
    const portfolio = context as PortfolioGuideContext;
    return [
      `I am your portfolio guide for ${portfolio.screenLabel.toLowerCase()}.`,
      `Current scope: ${portfolio.walletScopeLabel}.`,
      portfolio.isDemo
        ? 'Demo mode is active, so this conversation is grounded in sample portfolio data.'
        : `Live portfolio value is ${formatUsd(portfolio.totalValue)} with ${portfolio.approvalsCount} approvals in scope.`,
      'Ask for risk, changes, approvals, or the largest positions and I will keep the answer focused.',
    ].join('\n');
  }

  const guardian = context as GuardianGuideContext;
  return [
    `I am your Guardian guide for ${guardian.walletLabel}.`,
    guardian.isDemo
      ? 'Demo mode is active, so this conversation is grounded in sample Guardian findings.'
      : `Latest reading: ${guardian.trustScore ?? '--'} with ${guardian.flagCount} open items.`,
    'Ask what to fix first, what the health score means, which approvals need attention, or when to rescan.',
  ].join('\n');
}

function buildPortfolioReply(input: string, context: PortfolioGuideContext) {
  const message = input.toLowerCase();
  const topPositions = context.topPositions.slice(0, 3);
  const leadPosition = topPositions[0];
  const topAction = context.actionTitles[0];

  if (message.includes('change')) {
    return [
      `Here is the change-focused read for ${context.walletScopeLabel}.`,
      `Portfolio value is ${formatUsd(context.totalValue)} and the daily move is ${context.dailyDelta >= 0 ? '+' : ''}${formatUsd(context.dailyDelta)}.`,
      topAction ? `The first recommended action right now is "${topAction}".` : 'There is no urgent action returned right now.',
      context.highRiskApprovals > 0
        ? `${context.highRiskApprovals} approvals are still high-risk enough to matter in today’s read.`
        : 'Approvals are not the dominant issue in the current scope.',
    ].join('\n');
  }

  if (message.includes('risk') || message.includes('approval')) {
    return [
      `Risk view for ${context.walletScopeLabel}:`,
      `Overall risk reads ${(context.overallRiskScore * 10).toFixed(1)}/10 and trust reads ${context.trustIndex}%.`,
      context.highRiskApprovals > 0
        ? `There are ${context.highRiskApprovals} high-risk approvals out of ${context.approvalsCount} total approvals. Start there before making bigger portfolio changes.`
        : `There are ${context.approvalsCount} approvals in scope, but none are currently reading as high-risk.`,
      leadPosition
        ? `The largest single exposure is ${leadPosition.token} at ${formatUsd(leadPosition.valueUsd)}, so concentration around top holdings is still worth watching.`
        : 'No top-position concentration data is available yet.',
    ].join('\n');
  }

  if (message.includes('position') || message.includes('holding')) {
    if (!topPositions.length) {
      return 'No live positions are available for this wallet scope yet.';
    }

    return [
      `Largest holdings for ${context.walletScopeLabel}:`,
      ...topPositions.map((position, index) => `${index + 1}. ${position.token}: ${formatUsd(position.valueUsd)}`),
      'If you want, ask next for concentration risk or what changed today.',
    ].join('\n');
  }

  return [
    `Portfolio overview for ${context.screenLabel.toLowerCase()}:`,
    `Scope: ${context.walletScopeLabel}.`,
    `Value: ${formatUsd(context.totalValue)}. Trust: ${context.trustIndex}%. Risk: ${(context.overallRiskScore * 10).toFixed(1)}/10.`,
    topAction ? `Best next question to ask: why "${topAction}" is being recommended.` : 'Best next question to ask: where the current concentration risk sits.',
  ].join('\n');
}

function buildGuardianReply(input: string, context: GuardianGuideContext) {
  const message = input.toLowerCase();

  if (message.includes('trust') || message.includes('score') || message.includes('health')) {
    return [
      `Guardian health read for ${context.walletLabel}:`,
      context.trustScore == null
        ? 'There is no completed live score yet. Run a scan first so Guardian has evidence to explain.'
        : `The current health score is ${context.trustScore}. That score is being shaped by ${context.flagCount} open items and ${context.approvalRiskCount} approval-related issues.`,
      `Latest scan freshness: ${context.freshnessLabel}.`,
    ].join('\n');
  }

  if (message.includes('fix') || message.includes('first') || message.includes('next')) {
    return [
      `Start here for ${context.walletLabel}: ${context.primaryAction}.`,
      context.flagCount > 0
        ? `${context.flagCount} open items are affecting the wallet reading right now.`
        : 'There are no open issues right now, so the main job is staying current after new interactions.',
      context.approvalRiskCount > 0
        ? `${context.approvalRiskCount} of those items are approval-related, which usually gives the fastest improvement.`
        : 'Approval risk is not the main driver at the moment.',
    ].join('\n');
  }

  if (message.includes('approval')) {
    return context.approvalRiskCount > 0
      ? [
          `Guardian sees ${context.approvalRiskCount} approval-related issues for ${context.walletLabel}.`,
          'Those are the best place to start because they are usually the easiest cleanup and the fastest trust-score improvement.',
          `Recommended first move: ${context.primaryAction}.`,
        ].join('\n')
      : `Guardian is not seeing approval-driven issues right now for ${context.walletLabel}.`;
  }

  if (message.includes('scan') || message.includes('rescan') || message.includes('refresh')) {
    return [
      `Current scan freshness: ${context.freshnessLabel}.`,
      'Rescan after a new contract interaction, a large transfer, a new approval, or before making a bigger move from this wallet.',
      context.isDemo ? 'In demo mode, refreshes stay on sample data until demo mode is turned off.' : 'Outside demo mode, refresh pulls the current live wallet state.',
    ].join('\n');
  }

  return [
    `Guardian summary for ${context.walletLabel}:`,
    context.trustScore == null
      ? 'No live score has been recorded yet.'
      : `Score ${context.trustScore} with ${context.flagCount} open items.`,
    `Best next step: ${context.primaryAction}.`,
  ].join('\n');
}

export function ContextualGuideDrawer({
  isOpen,
  onClose,
  kind,
  context,
}: ContextualGuideDrawerProps) {
  const prompts = kind === 'portfolio' ? portfolioPrompts : guardianPrompts;
  const initialMessage = useMemo(() => buildInitialMessage(kind, context), [kind, context]);
  const [messages, setMessages] = useState<GuideMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setMessages([{ id: `${kind}-intro`, role: 'assistant', content: initialMessage }]);
    setInputValue('');
    setIsThinking(false);
  }, [initialMessage, isOpen, kind]);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [isOpen, messages, isThinking]);

  const title = kind === 'portfolio' ? 'Portfolio AI Guide' : 'Guardian AI Guide';
  const description =
    kind === 'portfolio'
      ? 'A calmer read on positions, risk, approvals, and next actions.'
      : 'A wallet-safety guide focused on health score, fixes, approvals, and scan timing.';

  const sendPrompt = (prompt: string) => {
    const trimmed = prompt.trim();
    if (!trimmed || isThinking) return;

    const userMessage: GuideMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsThinking(true);

    window.setTimeout(() => {
      const reply =
        kind === 'portfolio'
          ? buildPortfolioReply(trimmed, context as PortfolioGuideContext)
          : buildGuardianReply(trimmed, context as GuardianGuideContext);

      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-assistant`, role: 'assistant', content: reply },
      ]);
      setIsThinking(false);
    }, 420);
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="h-[82vh] border-white/10 bg-[#080808] text-[#f6f2ea]">
        <DrawerHeader className="border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-2">
              {kind === 'portfolio' ? (
                <Briefcase className="h-5 w-5 text-[#a7c0ff]" />
              ) : (
                <Shield className="h-5 w-5 text-[#a7c0ff]" />
              )}
            </div>
            <div>
              <DrawerTitle className="text-left text-xl text-[#f6f2ea]">{title}</DrawerTitle>
              <DrawerDescription className="text-left text-[#9c978f]">{description}</DrawerDescription>
            </div>
            <div className="ml-auto flex items-center gap-2">
              {'isDemo' in context && context.isDemo ? (
                <Badge variant="outline" className="border-[#d7bf7d]/30 text-[#d7bf7d]">
                  Demo Mode
                </Badge>
              ) : null}
              <Badge variant="outline" className="border-white/10 text-[#9c978f]">
                <Sparkles className="mr-1 h-3 w-3" />
                Guided
              </Badge>
            </div>
          </div>
        </DrawerHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mb-4 flex flex-wrap gap-2">
            {prompts.map((prompt) => (
              <Button
                key={prompt.id}
                variant="outline"
                onClick={() => sendPrompt(prompt.prompt)}
                className="rounded-full border-white/10 bg-white/[0.03] text-[#f6f2ea] hover:bg-white/[0.08]"
              >
                <Brain className="mr-2 h-4 w-4 text-[#a7c0ff]" />
                {prompt.label}
              </Button>
            ))}
          </div>

          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'assistant' ? 'justify-start' : 'justify-end'}`}
              >
                <div
                  className={`max-w-[88%] rounded-[24px] px-4 py-3 text-sm leading-6 ${
                    message.role === 'assistant'
                      ? 'border border-white/8 bg-white/[0.04] text-[#f6f2ea]'
                      : 'bg-[#f6f2ea] text-black'
                  }`}
                >
                  <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.18em]">
                    {message.role === 'assistant' ? (
                      <>
                        <Bot className="h-3.5 w-3.5 text-[#a7c0ff]" />
                        <span className="text-[#9c978f]">{title}</span>
                      </>
                    ) : (
                      <span className="text-black/60">You</span>
                    )}
                  </div>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}

            {isThinking ? (
              <div className="flex justify-start">
                <div className="rounded-[24px] border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-[#9c978f]">
                  Thinking through the current {kind === 'portfolio' ? 'portfolio' : 'wallet'} context...
                </div>
              </div>
            ) : null}

            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="border-t border-white/8 px-4 py-4">
          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  sendPrompt(inputValue);
                }
              }}
              placeholder={kind === 'portfolio' ? 'Ask about positions, risk, or approvals...' : 'Ask about health score, fixes, or scan timing...'}
              className="border-white/10 bg-white/[0.03] text-[#f6f2ea] placeholder:text-[#7c776f]"
            />
            <Button
              onClick={() => sendPrompt(inputValue)}
              disabled={!inputValue.trim() || isThinking}
              className="rounded-2xl bg-[#f6f2ea] px-4 text-black hover:bg-white"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
