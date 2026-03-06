import { HomeErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GlobalHeader } from '@/components/header/GlobalHeader';
import { HeroSection } from '@/components/home/HeroSection';
import { GuardianFeatureCard } from '@/components/home/GuardianFeatureCard';
import { HunterFeatureCard } from '@/components/home/HunterFeatureCard';
import { HarvestProFeatureCard } from '@/components/home/HarvestProFeatureCard';
import { ImpactStats } from '@/components/home/ImpactStats';
import { TrustBuilders } from '@/components/home/TrustBuilders';
import { OnboardingSection } from '@/components/home/OnboardingSection';
import { FooterNav } from '@/components/layout/FooterNav';
import { HomeAuthProvider } from '@/lib/context/HomeAuthContext';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { PullToRefreshIndicator } from '@/components/ui/PullToRefreshIndicator';
import { useHomeMetrics } from '@/hooks/useHomeMetrics';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

/**
 * AlphaWhale Home Page
 * 
 * The main landing page for AlphaWhale featuring:
 * - Hero section with value proposition
 * - Feature cards for Guardian, Hunter, and HarvestPro
 * - Trust builders showing platform statistics
 * - Onboarding section with 3-step guide
 * - Footer navigation
 * 
 * This page works in both demo mode (unauthenticated) and live mode (authenticated).
 */
export default function AlphaWhaleHome() {
  const { manualRefresh } = useHomeMetrics();
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirect to cockpit if signed in
  useEffect(() => {
    if (user) {
      navigate('/cockpit');
    }
  }, [user, navigate]);

  const { isPulling, isRefreshing, pullDistance, threshold } = usePullToRefresh({
    onRefresh: manualRefresh,
    threshold: 80,
  });

  return (
    <HomeAuthProvider>
      <PullToRefreshIndicator
        isPulling={isPulling}
        isRefreshing={isRefreshing}
        pullDistance={pullDistance}
        threshold={threshold}
      />
      <div className="min-h-screen relative overflow-hidden bg-[#050505] text-[#f6f2ea]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(126,163,242,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_35%)]" />
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            background: [
              'radial-gradient(circle at 30% 40%, rgba(126,163,242,0.10) 0%, transparent 50%)',
              'radial-gradient(circle at 70% 60%, rgba(255,255,255,0.04) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 30%, rgba(126,163,242,0.05) 0%, transparent 50%)',
              'radial-gradient(circle at 30% 70%, rgba(255,255,255,0.06) 0%, transparent 50%)',
              'radial-gradient(circle at 30% 40%, rgba(126,163,242,0.10) 0%, transparent 50%)'
            ]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: [0.25, 1, 0.5, 1]
          }}
        />
        
        {/* Header */}
        <HomeErrorBoundary fallback={<div className="p-6 text-center text-red-400">Failed to load header</div>}>
          <GlobalHeader className="border-white/8 bg-[#050505]/94" />
        </HomeErrorBoundary>

        <div className="relative mx-auto max-w-[1600px] px-4 pb-28 pt-4 sm:px-6 lg:px-8">
          <HomeErrorBoundary fallback={<div className="p-6 text-center text-red-400">Failed to load hero section</div>}>
            <HeroSection />
          </HomeErrorBoundary>

          <section className="py-8 md:py-12 space-y-6">
            <HomeErrorBoundary fallback={<div className="p-6 text-center text-red-400">Failed to load features</div>}>
              <motion.div
                className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
              >
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.5, ease: 'easeOut' }
                    },
                  }}
                >
                  <GuardianFeatureCard />
                </motion.div>
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.5, ease: 'easeOut' }
                    },
                  }}
                >
                  <HunterFeatureCard />
                </motion.div>
                <motion.div
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.5, ease: 'easeOut' }
                    },
                  }}
                >
                  <HarvestProFeatureCard />
                </motion.div>
              </motion.div>
            </HomeErrorBoundary>
          </section>

          <div className="py-4 md:py-6">
            <div className="h-px bg-white/8" />
          </div>

          <HomeErrorBoundary fallback={<div className="p-6 text-center text-red-400">Failed to load impact stats</div>}>
            <ImpactStats />
          </HomeErrorBoundary>

          <div className="py-4 md:py-6">
            <div className="h-px bg-white/8" />
          </div>

          <HomeErrorBoundary fallback={<div className="p-6 text-center text-red-400">Failed to load trust builders</div>}>
            <TrustBuilders />
          </HomeErrorBoundary>

          <HomeErrorBoundary fallback={<div className="p-6 text-center text-red-400">Failed to load onboarding</div>}>
            <OnboardingSection />
          </HomeErrorBoundary>
        </div>

        <HomeErrorBoundary fallback={<div className="p-6 text-center text-red-400">Failed to load footer</div>}>
          <FooterNav currentRoute="/" />
        </HomeErrorBoundary>
      </div>
    </HomeAuthProvider>
  );
}
