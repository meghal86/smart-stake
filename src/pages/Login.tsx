import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Apple, ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useWallet } from '@/contexts/WalletContext';
import { supabase } from '@/integrations/supabase/client';

const spinner = (
  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
);

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { hydrateFromServer } = useWallet();

  const nextParam = searchParams.get('next');

  const getValidRedirectPath = (path: string | null): string => {
    if (!path) return '/cockpit';
    if (path.startsWith('/') && !path.startsWith('//')) return path;
    return '/cockpit';
  };

  const redirectPath = getValidRedirectPath(nextParam);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message);
        toast({
          variant: 'destructive',
          title: 'Login failed',
          description: signInError.message,
        });
        return;
      }

      toast({
        title: 'Welcome back',
        description: 'Your workspace is ready.',
      });

      await hydrateFromServer();
      navigate(redirectPath);
    } catch {
      setError('An unexpected error occurred');
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectPath}`,
        },
      });

      if (oauthError) {
        toast({
          variant: 'destructive',
          title: 'Google sign in failed',
          description: oauthError.message,
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to sign in with Google. Please try again.',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsAppleLoading(true);

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}${redirectPath}`,
        },
      });

      if (oauthError) {
        toast({
          variant: 'destructive',
          title: 'Apple sign in failed',
          description: oauthError.message,
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to sign in with Apple. Please try again.',
      });
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast({
        variant: 'destructive',
        title: 'Email required',
        description: 'Enter your email address first.',
      });
      return;
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        toast({
          variant: 'destructive',
          title: 'Reset failed',
          description: resetError.message,
        });
        return;
      }

      toast({
        title: 'Reset email sent',
        description: 'Check your inbox for password reset instructions.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to send reset email. Please try again.',
      });
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050505] text-[#f6f2ea]">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_right,rgba(126,163,242,0.14),transparent_24%),radial-gradient(circle_at_18%_78%,rgba(214,192,141,0.09),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_34%)]" />
      <main className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md">
          <section className="rounded-3xl border border-white/10 bg-[#0c0d11]/92 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur sm:p-7">
          <div className="text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.03]">
              <img src="/header.png" alt="AlphaWhale" className="h-8 w-8 rounded-full" />
            </div>
            <h1
              className="mt-5 text-3xl text-[#f6f2ea]"
              style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}
            >
              Login
            </h1>
            <p className="mt-2 text-sm leading-6 text-[#9f9a91]">
              Sign in to continue.
            </p>
          </div>

          <div className="mt-7 grid gap-3">
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isAppleLoading || isLoading}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-[#121319] px-5 text-sm font-medium text-[#f6f2ea] transition hover:bg-[#161821] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isGoogleLoading ? (
                spinner
              ) : (
                <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              Continue with Google
            </button>

            <button
              type="button"
              onClick={handleAppleLogin}
              disabled={isAppleLoading || isGoogleLoading || isLoading}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/10 bg-[#121319] px-5 text-sm font-medium text-[#f6f2ea] transition hover:bg-[#161821] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isAppleLoading ? spinner : <Apple className="mr-2 h-4 w-4" />}
              Continue with Apple
            </button>
          </div>

          <div className="my-7 flex items-center gap-4">
            <div className="h-px flex-1 bg-white/8" />
            <span className="text-[11px] uppercase tracking-[0.24em] text-[#8f8a82]">or email</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-5">
            {error ? (
              <div className="rounded-xl border border-[#6a3030] bg-[#1a0d0d] px-4 py-3 text-sm text-[#f0c4c4]">
                {error}
              </div>
            ) : null}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#d7d1c7]">
                Email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8a82]" />
                <input
                  id="email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#121319] pl-11 pr-4 text-sm text-[#f6f2ea] outline-none transition placeholder:text-[#68645d] focus:border-white/20 focus:bg-[#151720]"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#d7d1c7]">
                Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8f8a82]" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#121319] pl-11 pr-12 text-sm text-[#f6f2ea] outline-none transition placeholder:text-[#68645d] focus:border-white/20 focus:bg-[#151720]"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  disabled={isLoading}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8f8a82] transition hover:text-[#f6f2ea] disabled:cursor-not-allowed"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isLoading}
                className="text-sm text-[#9f9a91] transition hover:text-[#f6f2ea] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading || isAppleLoading}
              className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-[#f1ede4] text-sm font-medium text-[#111111] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  {spinner}
                  Signing in...
                </>
              ) : (
                <>
                  Sign in
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-7 rounded-xl border border-white/8 bg-white/[0.02] px-4 py-4 text-center text-sm text-[#9f9a91]">
            New to AlphaWhale?{' '}
            <Link to="/signup" className="font-medium text-[#f6f2ea] transition hover:text-white">
              Create an account
            </Link>
          </div>

          <p className="mt-6 text-center text-xs leading-6 text-[#7c7770]">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="transition hover:text-[#f6f2ea]">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="transition hover:text-[#f6f2ea]">
              Privacy Policy
            </Link>
            .
          </p>
          </section>
        </div>
      </main>
    </div>
  );
};

export default Login;
