import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const SubscriptionCancel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center mb-4">
            <XCircle className="h-6 w-6 text-destructive" />
          </div>
          <CardTitle className="text-xl">Subscription Canceled</CardTitle>
          <CardDescription>
            Your subscription process was canceled. No charges were made.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Don't worry! You can try again anytime. Your account remains active with free features.
            </p>
            
            <div className="space-y-2">
              <Button 
                className="w-full" 
                onClick={() => navigate('/subscription')}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </div>
          </div>
          
          <div className="pt-4 border-t text-center">
            <p className="text-xs text-muted-foreground">
              Need help? Contact our support team at{' '}
              <a href="mailto:support@whaletracker.com" className="text-primary hover:underline">
                support@whaletracker.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionCancel;