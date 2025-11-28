import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ChevronLeft, ChevronRight, Home, TrendingUp, Fish, DollarSign, Shield, User, Bell, Eye, Zap } from 'lucide-react';

interface TutorialStep {
  id: number;
  title: string;
  content: string;
  icon: unknown;
  tips?: string[];
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 1,
    title: "Welcome to WhalePlus!",
    content: "WhalePlus is your comprehensive crypto intelligence platform designed to help you master the DeFi waves. Track top crypto whales, scan wallets for risk, monitor yield opportunities, and get live alerts—all in one intuitive app.",
    icon: Zap,
    tips: [
      "Monitor large whale transactions in real time",
      "Analyze wallet risk and compliance status", 
      "Track whale portfolios, ROI, and activity",
      "Discover and compare yield protocols and APYs"
    ]
  },
  {
    id: 2,
    title: "Navigation Overview",
    content: "WhalePlus has 5 main sections accessible from the bottom menu. Tap an icon to switch screens anytime. You can also access your profile from the top-right corner.",
    icon: Home,
    tips: [
      "Home: Quick access to your personalized dashboard",
      "Sentiment: Market trends and community sentiment",
      "Whales: Deep dive into whale analytics",
      "Yields: Explore and compare DeFi protocols",
      "Scanner: Advanced search and custom filters"
    ]
  },
  {
    id: 3,
    title: "Whale Alerts",
    content: "Get notified instantly about large whale transactions on multiple blockchains. Set minimum thresholds, choose favorite chains or tokens, and customize alert types.",
    icon: Bell,
    tips: [
      "Set minimum transaction thresholds",
      "Choose favorite chains and tokens",
      "Customize alert types (buy, sell, transfer)",
      "Stay informed on big market moves"
    ]
  },
  {
    id: 4,
    title: "Wallet Risk Scans",
    content: "Scan any wallet address to see risk scores, compliance checks, transaction history, and activity trends. Confirm if a wallet is safe to interact with.",
    icon: Shield,
    tips: [
      "Enter wallet address on Scanner page",
      "Review detailed risk breakdown",
      "Check compliance status",
      "Flag suspicious behavior early"
    ]
  },
  {
    id: 5,
    title: "Whale Analytics",
    content: "Track top crypto whales with insights on their balances, ROI, transaction activity, and risk scores. Add them to your watchlist to monitor their moves closely.",
    icon: Fish,
    tips: [
      "Browse or search top whales",
      "View balances, ROI, and activity",
      "Add whales to watchlist",
      "Analyze whale behavior for market signals"
    ]
  },
  {
    id: 6,
    title: "Yield Opportunities",
    content: "Compare APY and TVL across DeFi protocols on different blockchains. Use filters to customize views and identify the best yield opportunities.",
    icon: DollarSign,
    tips: [
      "Compare APY across protocols",
      "Filter by chain and protocol",
      "Sort by APY or risk scores",
      "Reduce risk with informed selection"
    ]
  },
  {
    id: 7,
    title: "Personalization & Settings",
    content: "Customize your WhalePlus experience with favorite chains, tokens, themes, and alert thresholds. Access all settings from your profile.",
    icon: User,
    tips: [
      "Set favorite chains & tokens",
      "Choose Light, Dark, or System theme",
      "Set minimum whale thresholds",
      "Enable notifications and alerts"
    ]
  },
  {
    id: 8,
    title: "Getting Started Tips",
    content: "Ready to master the DeFi waves? Here are some tips to get the most out of WhalePlus from day one.",
    icon: TrendingUp,
    tips: [
      "Start by scanning your primary wallets",
      "Add interesting whales to your watchlist",
      "Set alerts for big market moves",
      "Explore yield trends regularly",
      "Upgrade for unlimited features"
    ]
  }
];

interface AppTutorialProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppTutorial = ({ isOpen, onClose }: AppTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const step = tutorialSteps[currentStep];
  const Icon = step.icon;

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{step.title}</h2>
                <Badge variant="outline" className="text-xs mt-1">
                  Step {currentStep + 1} of {tutorialSteps.length}
                </Badge>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-1 mb-2">
              {tutorialSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToStep(index)}
                  className={`flex-1 h-2 rounded-full transition-colors ${
                    index <= currentStep ? 'bg-primary' : 'bg-muted'
                  }`}
                />
              ))}
            </div>
            <div className="text-xs text-muted-foreground text-center">
              {Math.round(((currentStep + 1) / tutorialSteps.length) * 100)}% Complete
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <p className="text-muted-foreground leading-relaxed">
              {step.content}
            </p>

            {step.tips && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Key Features:</h4>
                <ul className="space-y-2">
                  {step.tips.map((tip, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 shrink-0" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {currentStep === tutorialSteps.length - 1 ? (
                <Button onClick={onClose} className="flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Start Exploring
                </Button>
              ) : (
                <Button onClick={nextStep} className="flex items-center gap-2">
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {currentStep < tutorialSteps.length - 1 && (
            <div className="text-center mt-4">
              <Button variant="ghost" size="sm" onClick={onClose} className="text-xs text-muted-foreground">
                Skip Tutorial
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};