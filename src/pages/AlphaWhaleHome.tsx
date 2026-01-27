import { HomeErrorBoundary } from '@/components/ui/ErrorBoundary';
import { GlobalHeader } from '@/components/header/GlobalHeader';
import { HeroSection } from '@/components/home/HeroSection';
import { GuardianFeatureCard } from '@/components/home/GuardianFeatureCard';
import { HunterFeatureCard } from '@/components/home/HunterFeatureCard';
import { HarvestProFeatureCard } from '@/components/home/HarvestProFeatureCard';
import { ImpactStats } from '@/components/home/ImpactStats';
import { TrustBuilders } from '@/components/home/TrustBuilders';
import { OnboardingSection } from '@/components/home/OnboardingSection';
import { FooterNav } from '@/components/home/FooterNav';
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
      <div className="min-h-screen relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-[#0A0E1A] dark:to-[#111827] bg-gradient-to-b from-[#F8FAFC] via-[#FFFFFF] to-[#F8FAFC]">
        {/* Animated Background Glow - Theme Aware */}
        <motion.div
          className="absolute inset-0 pointer-events-none dark:block hidden"
          animate={{
            background: [
              'radial-gradient(circle at 30% 40%, rgba(0,245,160,0.08) 0%, transparent 50%)',
              'radial-gradient(circle at 70% 60%, rgba(123,97,255,0.06) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 30%, rgba(0,245,160,0.04) 0%, transparent 50%)',
              'radial-gradient(circle at 30% 70%, rgba(123,97,255,0.08) 0%, transparent 50%)',
              'radial-gradient(circle at 30% 40%, rgba(0,245,160,0.08) 0%, transparent 50%)'
            ]
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: [0.25, 1, 0.5, 1]
          }}
        />
        <motion.div
          className="absolute inset-0 pointer-events-none dark:hidden block"
          animate={{
            background: [
              'radial-gradient(circle at 30% 40%, rgba(20,184,166,0.06) 0%, transparent 50%)',
              'radial-gradient(circle at 70% 60%, rgba(123,97,255,0.04) 0%, transparent 50%)',
              'radial-gradient(circle at 50% 30%, rgba(20,184,166,0.03) 0%, transparent 50%)',
              'radial-gradient(circle at 30% 70%, rgba(123,97,255,0.06) 0%, transparent 50%)',
              'radial-gradient(circle at 30% 40%, rgba(20,184,166,0.06) 0%, transparent 50%)'
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
          <GlobalHeader />
        </HomeErrorBoundary>
        
        {/* Hero Section */}
        <HomeErrorBoundary fallback={<div className="p-6 text-center text-red-400">Failed to load hero section</div>}>
          <HeroSection />
        </HomeErrorBoundary>

        {/* Feature Cards Section with Progressive Revelation */}
        <section className="container mx-auto px-4 py-8 md:py-12 space-y-6">
          <HomeErrorBoundary fallback={<div className="p-6 text-center text-red-400">Failed to load features</div>}>
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1, // 100ms stagger between cards
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

        {/* Section Divider */}
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="h-px bg-gray-800" />
        </div>

        {/* Impact Stats Section - NEW! */}
        <HomeErrorBoundary fallback={<div className="p-6 text-center text-red-400">Failed to load impact stats</div>}>
          <ImpactStats />
        </HomeErrorBoundary>

        {/* Section Divider */}
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="h-px bg-gray-800" />
        </div>

        {/* Trust Builders Section */}
        <HomeErrorBoundary fallback={<div className="p-6 text-center text-red-400">Failed to load trust builders</div>}>
          <TrustBuilders />
        </HomeErrorBoundary>

        {/* Onboarding Section */}
        <HomeErrorBoundary fallback={<div className="p-6 text-center text-red-400">Failed to load onboarding</div>}>
          <OnboardingSection />
        </HomeErrorBoundary>

        {/* Bottom Padding for Fixed Footer */}
        <div className="h-20" aria-hidden="true" />

        {/* Footer Navigation */}
        <HomeErrorBoundary fallback={<div className="p-6 text-center text-red-400">Failed to load footer</div>}>
          <FooterNav />
        </HomeErrorBoundary>
      </div>
    </HomeAuthProvider>
  );
}
