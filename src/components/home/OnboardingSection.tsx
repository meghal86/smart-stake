import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, Search } from 'lucide-react';
import { NavigationRouter } from '@/lib/navigation/NavigationRouter';
import { toast } from 'sonner';
import { OnboardingStepsSkeleton } from '@/components/ui/Skeletons';

interface OnboardingSectionProps {
  onStartOnboarding?: () => void;
  onSkip?: () => void;
  isLoading?: boolean;
}

interface OnboardingStep {
  number: number;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    number: 1,
    icon: Shield,
    title: 'Connect Wallet',
    description: 'Link your wallet to get personalized insights',
  },
  {
    number: 2,
    icon: Shield,
    title: 'Run Guardian Scan',
    description: 'Get your security score and risk assessment',
  },
  {
    number: 3,
    icon: Search,
    title: 'Explore Opportunities',
    description: 'Discover alpha and optimize your portfolio',
  },
];

export const OnboardingSection = ({
  onStartOnboarding,
  onSkip,
  isLoading = false,
}: OnboardingSectionProps) => {
  const navigate = useNavigate();

  const handleStartOnboarding = () => {
    if (onStartOnboarding) {
      onStartOnboarding();
    } else {
      // Navigate to Guardian as the first step of onboarding using canonical routing
      NavigationRouter.navigateToCanonical('guardian', navigate, toast);
    }
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    } else {
      NavigationRouter.navigateToCanonical('hunter', navigate, toast);
    }
  };

  // Keyboard accessibility
  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    action: () => void
  ) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      action();
    }
  };

  return (
    <section
      className="py-8 md:py-16 px-4 container mx-auto border-t border-white/10"
      aria-labelledby="onboarding-heading"
      role="region"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-6 md:mb-12">
          <h2 id="onboarding-heading" className="text-2xl md:text-4xl font-bold text-white mb-2 md:mb-4">
            Get Started in 3 Simple Steps
          </h2>
          <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto">
            Join thousands of users protecting their assets and maximizing returns
          </p>
        </div>

        {/* Steps Container - Progressive Loading */}
        {isLoading ? (
          <div className="mb-8 md:mb-12">
            <OnboardingStepsSkeleton />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-12">
            {ONBOARDING_STEPS.map((step) => {
              const IconComponent = step.icon;
              
              return (
                <div
                  key={step.number}
                  className="
                    relative
                    bg-white/5 backdrop-blur-md
                    border border-white/10
                    rounded-lg
                    p-4 md:p-6
                    text-center
                    transition-transform duration-150
                    hover:scale-105
                  "
                  role="article"
                  aria-label={`Step ${step.number}: ${step.title}`}
                >
                  {/* Step Number Badge */}
                  <div
                    className="
                      absolute -top-4 left-1/2 -translate-x-1/2
                      w-8 h-8
                      bg-cyan-500
                      rounded-full
                      flex items-center justify-center
                      text-white font-bold text-sm
                    "
                    aria-label={`Step ${step.number}`}
                  >
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="flex justify-center mb-4 mt-2">
                    <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center">
                      <IconComponent className="w-8 h-8 text-cyan-400" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {step.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-400 text-sm">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          {/* Primary CTA */}
          <button
            onClick={handleStartOnboarding}
            onKeyDown={(e) => handleKeyDown(e, handleStartOnboarding)}
            className="
              bg-cyan-700 hover:bg-cyan-600 active:bg-cyan-800
              text-white font-semibold
              px-8 py-3 rounded-lg
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900
              w-full sm:w-auto
            "
            aria-label="Start onboarding process"
            tabIndex={0}
          >
            Start Onboarding
          </button>

          {/* Secondary CTA */}
          <button
            onClick={handleSkip}
            onKeyDown={(e) => handleKeyDown(e, handleSkip)}
            className="
              bg-transparent hover:bg-white/5 active:bg-white/10
              text-gray-300 hover:text-white
              border border-white/20
              font-semibold
              px-8 py-3 rounded-lg
              transition-colors duration-150
              focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-slate-900
              w-full sm:w-auto
            "
            aria-label="Skip onboarding and browse Hunter"
            tabIndex={0}
          >
            Skip
          </button>
        </div>
      </div>
    </section>
  );
};
