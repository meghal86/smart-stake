import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Apple, Check, Crown, CreditCard } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useSignupFlow } from '@/hooks/useSignupFlow';
import { isStripeConfigured } from '@/utils/stripeConfig';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
  },
};

const SignupForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'free' | 'premium'>('free');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);

  const stripe = useStripe();
  const elements = useElements();
  const { signupUser, signupWithOAuth, validatePassword, isLoading, error, setError } = useSignupFlow();

  const passwordValidation = validatePassword(password);

  // Auto-focus first input and validate Stripe config
  useEffect(() => {
    const emailInput = document.getElementById('email');
    if (emailInput) {
      emailInput.focus();
    }
    
    if (!isStripeConfigured) {
      console.warn('Stripe is not properly configured. Premium signup may not work.');
    }

    // Suppress extension errors
    const originalError = console.error;
    console.error = (...args) => {
      if (args[0]?.includes?.('chrome-extension://')) return;
      originalError.apply(console, args);
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!passwordValidation.isValid) {
      setError('Password does not meet security requirements');
      return;
    }

    if (!acceptTerms) {
      setError('Please accept the Terms of Service and Privacy Policy');
      return;
    }

    let paymentMethodId;

    // Handle Stripe payment for premium plan
    if (selectedPlan === 'premium' && stripe && elements) {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        setError('Payment information is required for Premium plan');
        return;
      }

      const { error: stripeError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (stripeError) {
        setError(stripeError.message || 'Payment setup failed');
        return;
      }

      paymentMethodId = paymentMethod.id;
    }

    // Create account
    await signupUser({
      email,
      password,
      plan: selectedPlan,
      paymentMethodId,
    });
  };

  const handleGoogleSignup = async () => {
    setIsGoogleLoading(true);
    await signupWithOAuth('google', selectedPlan);
    setIsGoogleLoading(false);
  };

  const handleAppleSignup = async () => {
    setIsAppleLoading(true);
    await signupWithOAuth('apple', selectedPlan);
    setIsAppleLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Logo and Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Logo size="lg" showText={false} src="/whaleplus-logo-512x512.png" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
          <p className="text-muted-foreground">Trusted by 12,000+ traders worldwide</p>
        </div>

        {/* Plan Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card 
            className={`cursor-pointer transition-all ${selectedPlan === 'free' ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
            onClick={() => setSelectedPlan('free')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setSelectedPlan('free')}
          >
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="text-center">
                  <h3 className="font-semibold text-lg">Free Plan</h3>
                  <p className="text-3xl font-bold">$0</p>
                  <p className="text-sm text-muted-foreground">Sign up free forever</p>
                </div>
                <ul className="text-sm space-y-1">
                  <li>• 50 alerts/day</li>
                  <li>• No email/webhook alerts</li>
                  <li>• Community support</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className={`cursor-pointer transition-all relative ${selectedPlan === 'premium' ? 'ring-2 ring-primary shadow-lg bg-primary/5' : 'hover:shadow-md'}`}
            onClick={() => setSelectedPlan('premium')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setSelectedPlan('premium')}
          >
            <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold">
              Popular
            </Badge>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Crown className="h-5 w-5 text-yellow-500" />
                    <h3 className="font-semibold text-lg">Premium Plan</h3>
                  </div>
                  <p className="text-3xl font-bold">$19.99</p>
                  <p className="text-sm text-muted-foreground">/month</p>
                </div>
                <ul className="text-sm space-y-1">
                  <li>• Unlimited alerts</li>
                  <li>• Email/webhook delivery</li>
                  <li>• Predictions + Scenarios + Exports</li>
                  <li>• 90-day history & AI explainers</li>
                </ul>
                <div className="pt-2 border-t">
                  <p className="text-xs italic text-muted-foreground">"WhalePlus alerts helped me catch 3 major ETH moves last month."</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl text-center">Sign Up</CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Social Login Buttons */}
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-11"
                onClick={handleGoogleSignup}
                disabled={isGoogleLoading || isAppleLoading || isLoading}
              >
                {isGoogleLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </Button>

              <Button
                variant="outline"
                className="w-full h-11"
                onClick={handleAppleSignup}
                disabled={isAppleLoading || isGoogleLoading || isLoading}
              >
                {isAppleLoading ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                ) : (
                  <Apple className="w-4 h-4 mr-2" />
                )}
                Continue with Apple
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>

            {/* Email Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off" data-form-type="signup">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                    disabled={isLoading}
                    autoComplete="username"
                    data-lpignore="true"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                    data-lpignore="true"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                
                {/* Password Requirements */}
                {password && (
                  <div className="space-y-1 text-xs">
                    <div className={`flex items-center gap-2 ${passwordValidation.minLength ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <Check className={`h-3 w-3 ${passwordValidation.minLength ? 'text-green-600' : 'text-muted-foreground'}`} />
                      At least 8 characters
                    </div>
                    <div className={`flex items-center gap-2 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <Check className={`h-3 w-3 ${passwordValidation.hasUpperCase ? 'text-green-600' : 'text-muted-foreground'}`} />
                      One uppercase letter
                    </div>
                    <div className={`flex items-center gap-2 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <Check className={`h-3 w-3 ${passwordValidation.hasLowerCase ? 'text-green-600' : 'text-muted-foreground'}`} />
                      One lowercase letter
                    </div>
                    <div className={`flex items-center gap-2 ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <Check className={`h-3 w-3 ${passwordValidation.hasNumbers ? 'text-green-600' : 'text-muted-foreground'}`} />
                      One number
                    </div>
                    <div className={`flex items-center gap-2 ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-muted-foreground'}`}>
                      <Check className={`h-3 w-3 ${passwordValidation.hasSpecialChar ? 'text-green-600' : 'text-muted-foreground'}`} />
                      One special character
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                    data-lpignore="true"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-red-500">Passwords do not match</p>
                )}
              </div>

              {/* Stripe Payment Fields for Premium */}
              {selectedPlan === 'premium' && (
                <div className="space-y-2">
                  <Label>Payment Information</Label>
                  <div className="border rounded-md p-3 bg-background">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Secure payment powered by Stripe</span>
                    </div>
                    <CardElement options={cardElementOptions} />
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-2">
                <Checkbox 
                  id="terms" 
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                  className="mt-0.5"
                />
                <Label htmlFor="terms" className="text-sm leading-relaxed peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  I agree to the{' '}
                  <Link 
                    to="/terms" 
                    className="text-primary hover:underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Terms of Service
                  </Link>
                  {' '}and{' '}
                  <Link 
                    to="/privacy" 
                    className="text-primary hover:underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button 
                type="submit" 
                className={`w-full h-11 ${selectedPlan === 'premium' ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70' : ''}`}
                disabled={isLoading || isGoogleLoading || isAppleLoading || !acceptTerms}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Creating account...
                  </>
                ) : selectedPlan === 'premium' ? (
                  'Create Premium Account'
                ) : (
                  'Sign Up Free'
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                30s signup • cancel anytime • secure Stripe checkout
              </p>
            </form>
          </CardContent>

          <div className="p-6 pt-0">
            <div className="text-center">
              <span className="text-sm text-muted-foreground">Already have an account? </span>
              <Button variant="outline" size="sm" asChild>
                <Link to="/login" className="font-medium">
                  Sign in
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const SignupNew: React.FC = () => {
  return (
    <Elements stripe={stripePromise}>
      <SignupForm />
    </Elements>
  );
};

export default SignupNew;