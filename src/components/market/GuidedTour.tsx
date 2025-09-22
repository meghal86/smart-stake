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
    id: 'toolbar',
    title: 'Smart Toolbar',
    description: 'Use BTC/ETH tickers, timeframe filters, and powerful search with prefixes like addr:, tx:, asset:',
    target: '[data-tour="toolbar"]',
    position: 'bottom'
  },
  {
    id: 'kpis',
    title: 'Live KPI Cards',
    description: 'Click any KPI card to drill down to filtered data. Hover for one-click alert creation.',
    target: '[data-tour="kpis"]',
    position: 'bottom',
    action: 'Try clicking a KPI card'
  },
  {
    id: 'activity-feed',
    title: 'Activity Feed',
    description: 'Real-time whale moves, portfolio changes, and sentiment shifts. Follow addresses and assets for alerts.',
    target: '[data-tour="activity-feed"]',
    position: 'left'
  },
  {
    id: 'tabs',
    title: 'Enhanced Tabs',
    description: 'Whale Analytics, Sentiment Analysis, and Portfolio Tracking with advanced filtering and clustering.',
    target: '[data-tour="tabs"]',
    position: 'top',
    action: 'Switch between tabs to explore'
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
    const element = document.querySelector(step.target) as HTMLElement;
    setTargetElement(element);

    if (element) {
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      // Add highlight class
      element.classList.add('tour-highlight');
      
      return () => {
        element.classList.remove('tour-highlight');
      };
    }
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
  
  // Calculate tooltip position
  let tooltipStyle: React.CSSProperties = {};
  const offset = 20;
  
  switch (step.position) {
    case 'top':
      tooltipStyle = {
        top: rect.top - offset,
        left: rect.left + rect.width / 2,
        transform: 'translate(-50%, -100%)'
      };
      break;
    case 'bottom':
      tooltipStyle = {
        top: rect.bottom + offset,
        left: rect.left + rect.width / 2,
        transform: 'translate(-50%, 0)'
      };
      break;
    case 'left':
      tooltipStyle = {
        top: rect.top + rect.height / 2,
        left: rect.left - offset,
        transform: 'translate(-100%, -50%)'
      };
      break;
    case 'right':
      tooltipStyle = {
        top: rect.top + rect.height / 2,
        left: rect.right + offset,
        transform: 'translate(0, -50%)'
      };
      break;
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
        className="fixed z-50 p-4 max-w-sm shadow-xl"
        style={tooltipStyle}
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

        <p className="text-sm text-muted-foreground mb-4">
          {step.description}
        </p>

        {step.action && (
          <div className="mb-4 p-2 bg-primary/10 rounded text-xs text-primary font-medium">
            💡 {step.action}
          </div>
        )}

        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-xs"
          >
            Skip Tour
          </Button>
          
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                className="text-xs"
              >
                <ArrowLeft className="h-3 w-3 mr-1" />
                Back
              </Button>
            )}
            
            <Button
              size="sm"
              onClick={handleNext}
              className="text-xs"
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
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 border">
          {tourSteps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
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