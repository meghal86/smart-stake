import { useState, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface TooltipStep {
  id: string;
  target: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface ContextualTooltipProps {
  steps: TooltipStep[];
  isActive: boolean;
  onComplete: () => void;
}

export const ContextualTooltip = ({ steps, isActive, onComplete }: ContextualTooltipProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isActive || !steps[currentStep]) return;

    const targetElement = document.querySelector(steps[currentStep].target);
    if (targetElement) {
      const rect = targetElement.getBoundingClientRect();
      const tooltipPosition = steps[currentStep].position || 'bottom';
      
      let top = 0;
      let left = 0;

      switch (tooltipPosition) {
        case 'top':
          top = rect.top - 10;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 10;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 10;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 10;
          break;
      }

      setPosition({ top, left });
    }
  }, [currentStep, isActive, steps]);

  if (!isActive || !steps[currentStep]) return null;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-40" />
      
      {/* Tooltip */}
      <Card 
        className="fixed z-50 w-80 shadow-lg"
        style={{
          top: position.top,
          left: position.left,
          transform: 'translate(-50%, -50%)'
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-500" />
              <h3 className="font-semibold text-sm">{steps[currentStep].title}</h3>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSkip} className="h-6 w-6 p-0">
              <X className="h-3 w-3" />
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mb-4">
            {steps[currentStep].content}
          </p>
          
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {currentStep + 1} of {steps.length}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleSkip}>
                Skip
              </Button>
              <Button size="sm" onClick={handleNext}>
                {currentStep < steps.length - 1 ? 'Next' : 'Finish'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};

// Hook for managing tooltips
export const useContextualTooltips = () => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);
  const [completedTooltips, setCompletedTooltips] = useState<string[]>(() => {
    const saved = localStorage.getItem('whaleplus_completed_tooltips');
    return saved ? JSON.parse(saved) : [];
  });

  const startTooltip = (tooltipId: string) => {
    if (!completedTooltips.includes(tooltipId)) {
      setActiveTooltip(tooltipId);
    }
  };

  const completeTooltip = (tooltipId: string) => {
    const updated = [...completedTooltips, tooltipId];
    setCompletedTooltips(updated);
    localStorage.setItem('whaleplus_completed_tooltips', JSON.stringify(updated));
    setActiveTooltip(null);
  };

  const resetTooltips = () => {
    setCompletedTooltips([]);
    localStorage.removeItem('whaleplus_completed_tooltips');
  };

  return {
    activeTooltip,
    completedTooltips,
    startTooltip,
    completeTooltip,
    resetTooltips
  };
};