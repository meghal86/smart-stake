import { Shield, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/loading-skeleton';
import { useSanctionsCheck } from '@/hooks/useSanctionsCheck';

interface SanctionsCheckProps {
  walletAddress: string;
}

export function SanctionsCheck({ walletAddress }: SanctionsCheckProps) {
  const { isLoading, isSanctioned, sanctionsList, lastChecked, error } = useSanctionsCheck(walletAddress);

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 border-yellow-200 bg-yellow-50">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600" />
          <div>
            <div className="font-medium text-yellow-800">Sanctions Check Unavailable</div>
            <div className="text-sm text-yellow-700">Unable to verify sanctions status</div>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-4 ${isSanctioned ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isSanctioned ? (
            <AlertTriangle className="h-5 w-5 text-red-600" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
          <div>
            <div className={`font-medium ${isSanctioned ? 'text-red-800' : 'text-green-800'}`}>
              {isSanctioned ? 'SANCTIONS MATCH' : 'SANCTIONS CLEAR'}
            </div>
            <div className={`text-sm ${isSanctioned ? 'text-red-700' : 'text-green-700'}`}>
              {isSanctioned 
                ? `Found on ${sanctionsList.length} sanctions list(s)`
                : 'No sanctions matches found'
              }
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <Badge variant={isSanctioned ? 'destructive' : 'default'}>
            {isSanctioned ? 'FLAGGED' : 'CLEAR'}
          </Badge>
          {lastChecked && (
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {lastChecked.toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
      
      {isSanctioned && sanctionsList.length > 0 && (
        <div className="mt-3 pt-3 border-t border-red-200">
          <div className="text-sm font-medium text-red-800 mb-2">Sanctions Lists:</div>
          <div className="flex flex-wrap gap-1">
            {sanctionsList.map((list, index) => (
              <Badge key={index} variant="destructive" className="text-xs">
                {list}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}