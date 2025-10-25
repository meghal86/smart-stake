/**
 * Guardian Scan Dialog
 * Shows animated scanning progress
 */
import { useEffect, useState } from 'react';
import { Shield, CheckCircle2, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface ScanDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
}

const SCAN_STEPS = [
  { label: 'Checking approvals', duration: 800 },
  { label: 'Analyzing contracts', duration: 1000 },
  { label: 'Verifying reputation', duration: 800 },
  { label: 'Scanning mixer activity', duration: 1200 },
];

export function ScanDialog({ open, onOpenChange }: ScanDialogProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!open) {
      setCurrentStep(0);
      setProgress(0);
      return;
    }

    let stepIndex = 0;
    let totalProgress = 0;

    const interval = setInterval(() => {
      if (stepIndex < SCAN_STEPS.length) {
        setCurrentStep(stepIndex);
        totalProgress = ((stepIndex + 1) / SCAN_STEPS.length) * 100;
        setProgress(totalProgress);
        stepIndex++;
      } else {
        clearInterval(interval);
      }
    }, 900);

    return () => clearInterval(interval);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-16 h-16">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse opacity-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Shield className="w-8 h-8 text-blue-500 animate-pulse" />
              </div>
            </div>
          </div>
          
          <DialogTitle className="text-center">
            Scanning Wallet
          </DialogTitle>
          
          <DialogDescription className="text-center">
            Running comprehensive security checks...
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" aria-label="Scan progress" />
            <p 
              className="text-sm text-center text-muted-foreground"
              aria-live="polite"
              aria-atomic="true"
            >
              {Math.round(progress)}% complete
            </p>
          </div>

          {/* Steps */}
          <div className="space-y-3" role="status" aria-live="polite" aria-atomic="false">
            {SCAN_STEPS.map((step, index) => (
              <div
                key={step.label}
                className="flex items-center gap-3 text-sm"
                aria-label={`Step ${index + 1}: ${step.label}`}
              >
                {index < currentStep ? (
                  <CheckCircle2 
                    className="w-5 h-5 text-green-500 flex-shrink-0" 
                    aria-label="Completed"
                  />
                ) : index === currentStep ? (
                  <Loader2 
                    className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" 
                    aria-label="In progress"
                  />
                ) : (
                  <div 
                    className="w-5 h-5 rounded-full border-2 border-muted flex-shrink-0" 
                    aria-label="Pending"
                  />
                )}
                <span
                  className={
                    index <= currentStep
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }
                >
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Screen reader announcement */}
          <div className="sr-only" aria-live="assertive" aria-atomic="true">
            {currentStep < SCAN_STEPS.length ? (
              `Currently ${SCAN_STEPS[currentStep]?.label}. ${Math.round(progress)}% complete.`
            ) : (
              'Scan complete'
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

