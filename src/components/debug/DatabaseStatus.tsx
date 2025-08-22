import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { checkDatabaseHealth, HealthCheckResult } from '@/utils/databaseHealthCheck';

export const DatabaseStatus = () => {
  const [results, setResults] = useState<HealthCheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const healthResults = await checkDatabaseHealth();
      setResults(healthResults);
      setLastCheck(new Date());
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runHealthCheck();
  }, []);

  const allHealthy = results.every(r => r.accessible);
  const hasIssues = results.some(r => !r.accessible);

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Database Health Check
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={runHealthCheck}
            disabled={loading}
          >
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
        {lastCheck && (
          <p className="text-sm text-muted-foreground">
            Last checked: {lastCheck.toLocaleTimeString()}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/20">
          {loading ? (
            <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
          ) : allHealthy ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <span className="font-medium">
            {loading ? 'Checking...' : allHealthy ? 'All systems operational' : 'Issues detected'}
          </span>
        </div>

        {/* Table Status */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm">Database Tables</h4>
          {results.map((result) => (
            <div key={result.table} className="flex items-center justify-between p-2 rounded border">
              <div className="flex items-center gap-2">
                {result.accessible ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="font-mono text-sm">{result.table}</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={result.accessible ? 'default' : 'destructive'}>
                  {result.accessible ? 'OK' : 'Error'}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Error Details */}
        {hasIssues && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-red-600">Issues Found</h4>
            {results
              .filter(r => !r.accessible)
              .map((result) => (
                <div key={result.table} className="p-3 rounded bg-red-50 border border-red-200">
                  <div className="font-medium text-sm text-red-800">
                    {result.table}
                  </div>
                  <div className="text-xs text-red-600 mt-1">
                    {result.error}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Setup Instructions */}
        {hasIssues && (
          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
            <h4 className="font-medium text-sm text-blue-800 mb-2">
              Setup Required
            </h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p>1. Go to your Supabase Dashboard</p>
              <p>2. Open SQL Editor</p>
              <p>3. Run the script from <code>database-setup.sql</code></p>
              <p>4. Refresh this page</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};