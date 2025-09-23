import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, ArrowRight, ArrowLeft, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: string;
}

const tourSteps: TourStep[] = [
  {
    id: 'kpis',
    title: 'Live KPI Cards',
    description: 'Click any KPI card to drill down to filtered data. Tap bell icon for alerts.',
    target: '[data-tour="kpis"]',
    position: 'bottom',
    action: 'Try tapping a KPI card'
  },
  {
    id: 'tabs',
    title: 'Market Tabs',
    description: 'Whale Analytics, Sentiment Analysis, and Portfolio Tracking with advanced filtering.',
    target: '[data-tour="tabs"]',
    position: 'bottom',
    action: 'Switch between tabs to explore'
  },
  {
    id: 'toolbar',
    title: 'Smart Toolbar',
    description: 'Live BTC/ETH prices, timeframe filters, and search with prefixes like addr:, tx:, asset:',
    target: '[data-tour="toolbar"]',
    position: 'bottom'
  },
  {
    id: 'activity-feed',
    title: 'Activity Feed',
    description: 'Real-time whale moves and market updates. On mobile, use the drawer at bottom.',
    target: '[data-tour="activity-feed"]',
    position: 'left'
  }
];

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function GuidedTour({ isOpen, onClose, onComplete }: GuidedTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!isOpen) return;

    const step = tourSteps[currentStep];
    
    // Wait a bit for elements to render, especially on mobile
    const timeout = setTimeout(() => {
      const element = document.querySelector(step.target) as HTMLElement;
      setTargetElement(element);

      if (element) {
        // Scroll element into view with mobile-friendly options
        element.scrollIntoView({ 
          behavior: 'smooth', 
          block: window.innerWidth < 640 ? 'start' : 'center',
          inline: 'nearest'
        });
        
        // Add highlight class
        element.classList.add('tour-highlight');
      }
    }, 100);

    return () => {
      clearTimeout(timeout);
      const element = document.querySelector(step.target) as HTMLElement;
      if (element) {
        element.classList.remove('tour-highlight');
      }
    };
  }, [currentStep, isOpen]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Mark tour as completed in localStorage
    if (user) {
      localStorage.setItem(`tour_completed_${user.id}`, 'true');
    }
    
    onComplete();
    onClose();
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isOpen || !targetElement) return null;

  const step = tourSteps[currentStep];
  const rect = targetElement.getBoundingClientRect();
  
  // Calculate tooltip position - simplified for better visibility
  let tooltipStyle: React.CSSProperties = {};
  const offset = 20;
  const tooltipHeight = 200; // Estimated tooltip height
  
  // Check if there's space below, otherwise position above
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  
  if (spaceBelow >= tooltipHeight + offset) {
    // Position below
    tooltipStyle = {
      top: rect.bottom + offset,
      left: rect.left + rect.width / 2 - 150
    };
  } else if (spaceAbove >= tooltipHeight + offset) {
    // Position above
    tooltipStyle = {
      top: rect.top - tooltipHeight - offset,
      left: rect.left + rect.width / 2 - 150
    };
  } else {
    // Position in center of screen as fallback
    tooltipStyle = {
      top: window.innerHeight / 2 - tooltipHeight / 2,
      left: window.innerWidth / 2 - 150
    };
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50" />
      
      {/* Spotlight */}
      <div 
        className="fixed border-4 border-primary rounded-lg z-50 pointer-events-none"
        style={{
          top: rect.top - 4,
          left: rect.left - 4,
          width: rect.width + 8,
          height: rect.height + 8,
          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
        }}
      />
      
      {/* Tooltip */}
      <Card 
        className="fixed z-50 p-3 sm:p-4 w-72 sm:w-96 shadow-xl"
        style={{
          position: 'fixed',
          top: Math.max(10, Math.min(window.innerHeight - 200, (tooltipStyle.top as number) || 100)),
          left: Math.max(10, Math.min(window.innerWidth - 300, (tooltipStyle.left as number) || 10)),
          transform: 'none'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <h3 className="font-semibold">{step.title}</h3>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {currentStep + 1}/{tourSteps.length}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
          {step.description}
        </p>

        {step.action && (
          <div className="mb-3 sm:mb-4 p-2 bg-primary/10 rounded text-xs text-primary font-medium">
            💡 {step.action}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-xs order-2 sm:order-1"
          >
            Skip Tour
          </Button>
          
          <div className="flex items-center gap-2 order-1 sm:order-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                className="text-xs flex-1 sm:flex-none"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">Back</span>
              </Button>
            )}
            
            <Button
              size="sm"
              onClick={handleNext}
              className="text-xs flex-1 sm:flex-none"
            >
              {currentStep === tourSteps.length - 1 ? 'Finish' : 'Next'}
              {currentStep < tourSteps.length - 1 && (
                <ArrowRight className="h-3 w-3 ml-1" />
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Progress dots */}
      <div className="fixed bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex items-center gap-1 sm:gap-2 bg-background/90 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 border">
          {tourSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-colors touch-manipulation ${
                index === currentStep ? 'bg-primary' : 
                index < currentStep ? 'bg-primary/50' : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </div>

      <style jsx>{`
        .tour-highlight {
          position: relative;
          z-index: 51;
          animation: tour-pulse 2s infinite;
        }
        
        @keyframes tour-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4); }
          50% { box-shadow: 0 0 0 10px rgba(59, 130, 246, 0); }
        }
      `}</style>
    </>
  );
}