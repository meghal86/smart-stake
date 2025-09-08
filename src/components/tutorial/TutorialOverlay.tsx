import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, ChevronLeft, ChevronRight, Play, Users, Shield, Bell } from 'lucide-react';

interface TutorialStep {
  id: string;
  title: string;
  content: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  action?: string;
}

interface TutorialOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  tutorialType: 'enterprise' | 'team' | 'alerts';
}

const enterpriseSteps: TutorialStep[] = [
  {
    id: '1',
    title: 'Enterprise Features Overview',
    content: 'Access enterprise-grade compliance tools, team collaboration, and audit-ready reporting for institutional use.',
    target: '[data-tutorial="enterprise-button"]',
    position: 'bottom'
  },
  {
    id: '2', 
    title: 'Custom Risk Rules',
    content: 'Create custom rules to automatically flag whales based on your specific risk criteria and compliance requirements.',
    target: '[data-tutorial="risk-rules"]',
    position: 'right'
  },
  {
    id: '3',
    title: 'Audit Logs',
    content: 'Track all team actions, rule changes, and alert triggers for complete audit trail and compliance reporting.',
    target: '[data-tutorial="audit-logs"]',
    position: 'left'
  },
  {
    id: '4',
    title: 'Export & Reporting',
    content: 'Generate compliance reports in CSV/JSON format with detailed whale activity and risk assessments.',
    target: '[data-tutorial="export-buttons"]',
    position: 'top'
  }
];

const teamSteps: TutorialStep[] = [
  {
    id: '1',
    title: 'Team Management',
    content: 'Invite team members, assign roles, and manage permissions for collaborative whale monitoring.',
    target: '[data-tutorial="team-stats"]',
    position: 'bottom'
  },
  {
    id: '2',
    title: 'Role-Based Access',
    content: 'Admin: Full access | Analyst: Create alerts & rules | Viewer: Read-only access to data.',
    target: '[data-tutorial="member-roles"]',
    position: 'right'
  },
  {
    id: '3',
    title: 'Bulk Invitations',
    content: 'Invite multiple team members at once using email lists for faster team setup.',
    target: '[data-tutorial="bulk-invite"]',
    position: 'left'
  },
  {
    id: '4',
    title: 'Status Indicators',
    content: 'See who\'s online and track team member activity for better collaboration.',
    target: '[data-tutorial="member-status"]',
    position: 'top'
  }
];

const alertSteps: TutorialStep[] = [
  {
    id: '1',
    title: 'Alert Management',
    content: 'Configure multi-channel notifications (push, SMS, email) for whale activity monitoring.',
    target: '[data-tutorial="alerts-manager"]',
    position: 'bottom'
  },
  {
    id: '2',
    title: 'Custom Thresholds',
    content: 'Set personalized risk thresholds and volume triggers based on your monitoring needs.',
    target: '[data-tutorial="alert-settings"]',
    position: 'right'
  },
  {
    id: '3',
    title: 'Team Assignment',
    content: 'Assign alerts to specific team members and track resolution status for accountability.',
    target: '[data-tutorial="alert-assignment"]',
    position: 'left'
  }
];

export const TutorialOverlay = ({ isOpen, onClose, tutorialType }: TutorialOverlayProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<Element | null>(null);

  const steps = tutorialType === 'enterprise' ? enterpriseSteps : 
                tutorialType === 'team' ? teamSteps : alertSteps;

  const currentStepData = steps[currentStep];

  useEffect(() => {
    if (isOpen && currentStepData) {
      const element = document.querySelector(currentStepData.target);
      setHighlightedElement(element);
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('tutorial-highlight');
      }
    }

    return () => {
      if (highlightedElement) {
        highlightedElement.classList.remove('tutorial-highlight');
      }
    };
  }, [currentStep, isOpen, currentStepData]);

  if (!isOpen) return null;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getIcon = () => {
    switch (tutorialType) {
      case 'enterprise': return <Shield className="h-5 w-5" />;
      case 'team': return <Users className="h-5 w-5" />;
      case 'alerts': return <Bell className="h-5 w-5" />;
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-50" />
      
      {/* Tutorial Card */}
      <div className="fixed top-4 right-4 z-50 w-80">
        <Card className="p-4 shadow-lg border-2 border-primary">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {getIcon()}
              <Badge variant="outline">
                Step {currentStep + 1} of {steps.length}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">{currentStepData.title}</h3>
            <p className="text-sm text-muted-foreground">{currentStepData.content}</p>
            
            <div className="flex items-center justify-between pt-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              {currentStep === steps.length - 1 ? (
                <Button size="sm" onClick={onClose}>
                  Complete
                </Button>
              ) : (
                <Button size="sm" onClick={nextStep}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Progress Indicator */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="flex gap-2 bg-background/90 backdrop-blur p-2 rounded-full border">
          {steps.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index <= currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </>
  );
};