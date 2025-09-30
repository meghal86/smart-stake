import { DatabaseStatus } from '@/components/debug/DatabaseStatus';
import { SubscriptionDebug } from '@/components/debug/SubscriptionDebug';
import { TierTester } from '@/components/debug/TierTester';
import { ScenarioTester } from '@/components/debug/ScenarioTester';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Debug() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          <h1 className="text-2xl font-bold">Debug Dashboard</h1>
        </div>

        <DatabaseStatus />
        
        <SubscriptionDebug />
        
        <TierTester />
        
        <ScenarioTester />

        <div className="text-center text-sm text-muted-foreground">
          <p>This debug page helps you verify that your database is set up correctly.</p>
          <p>Once everything is working, you can remove this page.</p>
        </div>
      </div>
    </div>
  );
}