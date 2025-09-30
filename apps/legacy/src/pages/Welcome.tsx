import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  CheckCircle, Mail, Crown, ArrowRight, Sparkles, Bell, 
  BarChart3, Settings, Webhook, Users, TrendingUp, 
  Shield, Zap, Clock, RefreshCw
} from 'lucide-react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/hooks/useOnboarding';
import QuickAlertSetup from '@/components/onboarding/QuickAlertSetup';

const Welcome: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { onboardingState, resendVerificationEmail, isResendingEmail } = useOnboarding();
  const [showEmailBanner, setShowEmailBanner] = useState(true);
  const [showAlertSetup, setShowAlertSetup] = useState(false);
  
  const plan = searchParams.get('plan') || 'free';
  const paymentPending = searchParams.get('payment') === 'pending';
  const isPremium = plan === 'premium';

  // Get user's first name for personalization
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  useEffect(() => {
    // Hide email banner if verified
    if (onboardingState.emailVerified) {
      setShowEmailBanner(false);
    }

    // Auto-redirect after 15 seconds (longer for better UX)
    const timer = setTimeout(() => {
      navigate('/');
    }, 15000);

    return () => clearTimeout(timer);
  }, [navigate, onboardingState.emailVerified]);



  const progressValue = onboardingState.progressPercentage;

  // Premium Welcome Screen
  if (isPremium) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl space-y-6">
          {/* Progress Indicator */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Setup Progress</span>
              <span>{Math.round(progressValue)}% Complete</span>
            </div>
            <Progress value={progressValue} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3 text-green-500" />
                Account Created
              </span>
              <span className="flex items-center gap-1">
                {onboardingState.emailVerified ? (
                  <CheckCircle className="h-3 w-3 text-green-500" />
                ) : (
                  <div className="h-3 w-3 border border-muted-foreground rounded-full" />
                )}
                Verify Email
              </span>
              <span className="flex items-center gap-1">
                <div className="h-3 w-3 border border-muted-foreground rounded-full" />
                Set Up Alerts
              </span>
            </div>
          </div>

          {/* Email Verification Banner */}
          {showEmailBanner && !onboardingState.emailVerified && (
            <Alert className="border-blue-200 bg-blue-50">
              <Mail className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="flex items-center justify-between">
                  <span>Verify your email to unlock exports & webhooks</span>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={resendVerificationEmail}
                      disabled={isResendingEmail}
                      className="text-blue-600 hover:text-blue-800 h-6 px-2"
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${isResendingEmail ? 'animate-spin' : ''}`} />
                      {isResendingEmail ? 'Sending...' : 'Resend Email'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowEmailBanner(false)}
                      className="text-blue-600 hover:text-blue-800 h-6 px-2"
                    >
                      ×
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Main Welcome Card */}
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center space-y-4 pb-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="h-16 w-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2">
                    <Crown className="h-8 w-8 text-yellow-500" />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <CardTitle className="text-3xl font-bold">
                  🎉 Hi {firstName}, your Premium account is ready!
                </CardTitle>
                <p className="text-lg text-muted-foreground">
                  Start tracking whale movements with unlimited alerts and AI predictions.
                </p>
              </div>

              <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold text-sm px-4 py-1">
                <Sparkles className="h-4 w-4 mr-1" />
                Premium Features Unlocked
              </Badge>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Payment Status */}
              {paymentPending && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertDescription className="text-yellow-800">
                    Payment setup is being processed. You'll receive a confirmation email shortly.
                  </AlertDescription>
                </Alert>
              )}

              {/* Two-Column Layout */}
              <div className="grid lg:grid-cols-2 gap-8">
                {/* Left: What's Next */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-xl flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    What's Next?
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                      <Bell className="h-5 w-5 text-blue-500" />
                      <div>
                        <p className="font-medium text-sm">Set up your first whale alert</p>
                        <p className="text-xs text-muted-foreground">Track large transactions instantly</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                      <BarChart3 className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium text-sm">Explore the dashboard</p>
                        <p className="text-xs text-muted-foreground">See live whale activity</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                      <Settings className="h-5 w-5 text-purple-500" />
                      <div>
                        <p className="font-medium text-sm">Customize preferences</p>
                        <p className="text-xs text-muted-foreground">Set your favorite tokens & chains</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg border">
                      <Webhook className="h-5 w-5 text-orange-500" />
                      <div>
                        <p className="font-medium text-sm">Set up webhooks</p>
                        <p className="text-xs text-muted-foreground">Get alerts in Discord/Slack</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right: Premium Features */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-xl flex items-center gap-2">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    Your Premium Features
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Zap className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Unlimited whale alerts</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Email & webhook delivery</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <TrendingUp className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">AI predictions & scenarios</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-orange-500" />
                      <span className="text-sm font-medium">90-day history & exports</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="h-4 w-4 text-red-500" />
                      <span className="text-sm font-medium">Priority support</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  onClick={() => setShowAlertSetup(true)}
                  className="flex-1 h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  size="lg"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Set Up Your First Whale Alert
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1 h-12"
                  size="lg"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>
              </div>

              {/* Microcopy */}
              <p className="text-xs text-center text-muted-foreground">
                Takes less than 1 min • Auto-redirect in 15 seconds
              </p>
            </CardContent>
          </Card>

          {/* Trust Badge */}
          <Card className="border-muted/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-center gap-4 text-center">
                <Users className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  <span className="font-semibold">Trusted by 12,000+ traders worldwide</span> • 
                  "WhalePlus alerts helped me catch 3 major ETH moves last month."
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Alert Setup Modal */}
        <QuickAlertSetup 
          isOpen={showAlertSetup}
          onClose={() => setShowAlertSetup(false)}
          onComplete={() => {
            setShowAlertSetup(false);
            navigate('/');
          }}
        />
      </div>
    );
  }

  // Free Welcome Screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-6">
        {/* Progress Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Setup Progress</span>
            <span>33% Complete</span>
          </div>
          <Progress value={33} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              Account Created
            </span>
            <span className="flex items-center gap-1">
              <div className="h-3 w-3 border border-muted-foreground rounded-full" />
              Verify Email
            </span>
            <span className="flex items-center gap-1">
              <div className="h-3 w-3 border border-muted-foreground rounded-full" />
              Set Up Alerts
            </span>
          </div>
        </div>

        {/* Email Verification Banner */}
        {showEmailBanner && (
          <Alert className="border-blue-200 bg-blue-50">
            <Mail className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="flex items-center justify-between">
                <span>Verify your email to secure your account</span>
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={resendVerificationEmail}
                    disabled={isResendingEmail}
                    className="text-blue-600 hover:text-blue-800 h-6 px-2"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${isResendingEmail ? 'animate-spin' : ''}`} />
                    {isResendingEmail ? 'Sending...' : 'Resend Email'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setShowEmailBanner(false)}
                    className="text-blue-600 hover:text-blue-800 h-6 px-2"
                  >
                    ×
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Welcome Card */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex justify-center">
              <div className="h-16 w-16 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <CardTitle className="text-3xl font-bold">
                🎉 Hi {firstName}, welcome to WhalePlus!
              </CardTitle>
              <p className="text-lg text-muted-foreground">
                Your free account is ready. Start tracking whale movements with 50 daily alerts.
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Two-Column Layout */}
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Left: What's Next */}
              <div className="space-y-4">
                <h3 className="font-semibold text-xl flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  What's Next?
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                    <Bell className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium text-sm">Set up your first whale alert</p>
                      <p className="text-xs text-muted-foreground">Track large transactions</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <BarChart3 className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-sm">Explore the dashboard</p>
                      <p className="text-xs text-muted-foreground">See live whale activity</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg border">
                    <Settings className="h-5 w-5 text-purple-500" />
                    <div>
                      <p className="font-medium text-sm">Customize preferences</p>
                      <p className="text-xs text-muted-foreground">Set favorite tokens</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right: Free Features + Upgrade */}
              <div className="space-y-4">
                <h3 className="font-semibold text-xl">Your Free Features</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Bell className="h-4 w-4 text-green-500" />
                    <span className="text-sm">50 whale alerts per day</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Real-time monitoring</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Community support</span>
                  </div>
                </div>
                
                {/* Upgrade CTA */}
                <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Crown className="h-4 w-4 text-yellow-500" />
                        <h4 className="font-semibold text-sm">Upgrade to Premium</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Unlimited alerts, AI predictions, webhooks & more
                      </p>
                      <Button size="sm" className="w-full mt-2">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Upgrade Now - $19.99/mo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button 
                onClick={() => setShowAlertSetup(true)}
                className="flex-1 h-12"
                size="lg"
              >
                <Bell className="h-4 w-4 mr-2" />
                Set Up Your First Whale Alert
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1 h-12"
                size="lg"
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Go to Dashboard
              </Button>
            </div>

            {/* Microcopy */}
            <p className="text-xs text-center text-muted-foreground">
              Takes less than 1 min • Auto-redirect in 15 seconds
            </p>
          </CardContent>
        </Card>

        {/* Trust Badge */}
        <Card className="border-muted/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-center gap-4 text-center">
              <Users className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold">Trusted by 12,000+ traders worldwide</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quick Alert Setup Modal */}
        <QuickAlertSetup 
          isOpen={showAlertSetup}
          onClose={() => setShowAlertSetup(false)}
          onComplete={() => {
            setShowAlertSetup(false);
            navigate('/');
          }}
        />
      </div>
    </div>
  );
};

export default Welcome;