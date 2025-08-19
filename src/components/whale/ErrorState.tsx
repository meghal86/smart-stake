import { AlertTriangle, RefreshCw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

export function ErrorState({ onRetry, isRetrying = false }: ErrorStateProps) {
  return (
    <div className="p-4">
      <Alert variant="destructive" className="border-destructive/20 bg-destructive/5">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Unable to Load Whale Alerts</AlertTitle>
        <AlertDescription className="mt-2 space-y-3">
          <p className="text-sm text-muted-foreground">
            We're having trouble fetching the latest whale transactions. This could be due to network issues or API limitations.
          </p>
          <Button 
            onClick={onRetry}
            disabled={isRetrying}
            variant="outline"
            size="sm"
            className="border-destructive/30 hover:bg-destructive/10"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </>
            )}
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}