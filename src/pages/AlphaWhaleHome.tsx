import { HomeErrorBoundary } from '@/components/ui/ErrorBoundary';
import { HeroSection } from '@/components/home/HeroSection';
import { GuardianFeatureCard } from '@/components/home/GuardianFeatureCard';
import { HunterFeatureCard } from '@/components/home/HunterFeatureCard';
import { HarvestProFeatureCard } from '@/components/home/HarvestProFeatureCard';
import { ImpactStats } from '@/components/home/ImpactStats';
import { TrustBuilders } from '@/components/home/TrustBuilders';
import { OnboardingSection } from '@/components/home/OnboardingSection';
import { FooterNav } from '@/components/home/FooterNav';
import { HomeAuthProvider } from '@/lib/context/HomeAuthContext';
import { motion } from 'framer-motion';

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
  return (
    <HomeAuthProvider>
      <div className="min-h-screen bg-[#0A0F1F]">
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

        {/* Footer Navigation */}
        <HomeErrorBoundary fallback={<div className="p-6 text-center text-red-400">Failed to load footer</div>}>
          <FooterNav />
        </HomeErrorBoundary>
      </div>
    </HomeAuthProvider>
  );
}
