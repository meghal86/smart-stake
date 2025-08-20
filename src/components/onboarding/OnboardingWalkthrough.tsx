import { useState } from "react";
import { X, ChevronRight, ChevronLeft, Zap, TrendingUp, Shield, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface OnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const onboardingSlides = [
  {
    icon: Zap,
    title: "Whale Alerts",
    description: "Get instant notifications when large cryptocurrency transactions happen. Never miss a whale move again.",
    color: "text-primary",
    bgColor: "bg-primary/10"
  },
  {
    icon: TrendingUp,
    title: "Yield Opportunities",
    description: "Discover the highest APY protocols across all major DeFi platforms. Maximize your returns safely.",
    color: "text-success",
    bgColor: "bg-success/10"
  },
  {
    icon: Shield,
    title: "Risk Scanner",
    description: "AI-powered wallet analysis to identify potential risks and security threats before you invest.",
    color: "text-premium",
    bgColor: "bg-premium/10"
  },
  {
    icon: Crown,
    title: "Premium Features",
    description: "Unlock advanced analytics, unlimited alerts, and priority support with our subscription plans.",
    color: "text-premium",
    bgColor: "bg-premium/10"
  }
];

export function OnboardingWalkthrough({ isOpen, onClose, onComplete }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentSlide < onboardingSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const slide = onboardingSlides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-6 bg-gradient-to-br from-card/95 to-card/85 backdrop-blur-lg border border-border/50">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">
              {currentSlide + 1} of {onboardingSlides.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-muted/30 rounded-full h-1 mb-8">
          <div 
            className="bg-primary h-1 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${((currentSlide + 1) / onboardingSlides.length) * 100}%` }}
          />
        </div>

        {/* Slide Content */}
        <div className="text-center mb-8 space-y-6">
          <div className={`p-4 ${slide.bgColor} rounded-2xl inline-block`}>
            <Icon className={`h-12 w-12 ${slide.color}`} />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-2xl font-bold text-foreground">{slide.title}</h2>
            <p className="text-muted-foreground leading-relaxed">
              {slide.description}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip
          </Button>

          <div className="flex items-center gap-2">
            {currentSlide > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                className="px-3"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            
            <Button
              onClick={handleNext}
              className="px-4"
            >
              {currentSlide === onboardingSlides.length - 1 ? (
                "Get Started"
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}