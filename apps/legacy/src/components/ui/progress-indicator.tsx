import { CheckCircle, Circle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  title: string;
  description?: string;
}

interface ProgressIndicatorProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function ProgressIndicator({ steps, currentStep, className }: ProgressIndicatorProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isUpcoming = index > currentStep;

        return (
          <div key={step.id} className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-1">
              {isCompleted && (
                <CheckCircle className="h-5 w-5 text-green-600" />
              )}
              {isCurrent && (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              )}
              {isUpcoming && (
                <Circle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className={cn(
                "text-sm font-medium",
                isCompleted && "text-green-600",
                isCurrent && "text-primary",
                isUpcoming && "text-muted-foreground"
              )}>
                {step.title}
              </div>
              {step.description && (
                <div className="text-xs text-muted-foreground mt-1">
                  {step.description}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}