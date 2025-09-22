import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  onAction, 
  secondaryAction 
}: EmptyStateProps) {
  return (
    <Card className="p-8 text-center border-2 border-dashed border-muted-foreground/20">
      <div className="flex flex-col items-center gap-4">
        <div className="p-3 bg-muted/20 rounded-full">
          {icon}
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            {description}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={onAction} className="bg-primary hover:bg-primary/90">
            {actionLabel}
          </Button>
          
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}