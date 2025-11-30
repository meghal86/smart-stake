import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LucideIcon } from 'lucide-react';
import { FeatureCardSkeleton } from '@/components/ui/Skeletons';

/**
 * FeatureCard Props Interface
 * Defines all properties for the FeatureCard component
 */
export interface FeatureCardProps {
  feature: 'guardian' | 'hunter' | 'harvestpro';
  icon: LucideIcon;
  title: string;
  tagline: string;
  previewLabel: string;
  previewValue: string | number;
  previewDescription: string;
  primaryRoute: string;
  demoRoute?: string;
  isLoading?: boolean;
  isDemo?: boolean;
  error?: string | null;
}

/**
 * FeatureCard Component
 * 
 * Displays a feature card with icon, title, tagline, preview metric, and action buttons.
 * Supports loading, demo, live, and error states with smooth transitions.
 * 
 * Requirements: 2.2, 10.1
 */
export const FeatureCard = ({
  feature,
  icon: Icon,
  title,
  tagline,
  previewLabel,
  previewValue,
  previewDescription,
  primaryRoute,
  demoRoute,
  isLoading = false,
  isDemo = false,
  error = null,
}: FeatureCardProps) => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = React.useState(false);
  const [showMiniDemo, setShowMiniDemo] = React.useState(false);

  // Event handlers
  const handlePrimaryClick = () => {
    navigate(primaryRoute);
  };

  const handleSecondaryClick = () => {
    if (demoRoute) {
      navigate(demoRoute);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: 'primary' | 'secondary') => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (action === 'primary') {
        handlePrimaryClick();
      } else {
        handleSecondaryClick();
      }
    }
  };

  // Show skeleton during loading
  if (isLoading) {
    return <FeatureCardSkeleton />;
  }

  // Feature-specific animation personalities
  const getAnimationPersonality = () => {
    switch (feature) {
      case 'guardian':
        return {
          hover: { scale: 1.02, y: -4 },
          transition: { duration: 0.3 }, // Calm & protective
        };
      case 'hunter':
        return {
          hover: { scale: 1.03, y: -6 },
          transition: { duration: 0.15 }, // Fast & exciting
        };
      case 'harvestpro':
        return {
          hover: { scale: 1.02, y: -3 },
          transition: { duration: 0.25 }, // Smart & efficient
        };
      default:
        return {
          hover: { scale: 1.02 },
          transition: { duration: 0.2 },
        };
    }
  };

  const personality = getAnimationPersonality();

  return (
    <motion.div
      className="
        bg-white/[0.02] border border-gray-800 rounded-lg p-4 md:p-6
        flex flex-col gap-3 md:gap-4
        transition-all duration-200
        cursor-pointer
        hover:bg-white/[0.04] hover:border-gray-700
      "
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      onClick={handlePrimaryClick}
      data-testid={`${feature}-card`}
      role="article"
      aria-label={`${title} feature card`}
    >
      {/* Icon - Minimal */}
      <div
        className="w-12 h-12 rounded-lg bg-gray-800/50 flex items-center justify-center"
        aria-hidden="true"
      >
        <Icon className="w-6 h-6 text-gray-400" />
      </div>

      {/* Title */}
      <h3 className="text-lg font-medium text-white">
        {title}
      </h3>

      {/* Tagline */}
      <p className="text-sm text-gray-500">
        {tagline}
      </p>

      {/* Preview Metric Display Area */}
      <motion.div
        className="mt-4 space-y-2 relative"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        key={`${feature}-${isDemo}-${error}`}
      >
        {/* Label */}
        <p className="text-xs text-gray-400 uppercase tracking-wide">
          {previewLabel}
        </p>

        {/* Value with Demo Badge or Error State */}
        <div className="flex items-center gap-2">
          <p
            className="text-2xl font-semibold text-white"
            data-testid={`${feature}-preview-value`}
          >
            {error ? '—' : previewValue}
          </p>
          
          {/* Demo Mode Badge - Minimal */}
          {isDemo && !error && (
            <span
              className="
                px-2 py-0.5 text-xs font-medium
                bg-gray-800 text-gray-400
                border border-gray-700 rounded
              "
              data-testid="demo-badge"
              aria-label="Demo mode"
            >
              Demo
            </span>
          )}
        </div>

        {/* Description or Error Message */}
        <p className={`text-xs ${error ? 'text-red-400' : 'text-gray-500'}`}>
          {error || previewDescription}
        </p>
      </motion.div>

      {/* Action Button - Gradient */}
      <div className="mt-4">
        <button
          onClick={handlePrimaryClick}
          onKeyDown={(e) => handleKeyDown(e, 'primary')}
          className="
            w-full min-h-[44px] py-2
            bg-gradient-to-r from-[#00F5A0] to-[#7B61FF]
            hover:from-[#00E094] hover:to-[#6B51EF]
            active:from-[#00D088] active:to-[#5B41DF]
            text-white font-medium text-sm
            rounded-lg
            shadow-md shadow-[#00F5A0]/20
            transition-all duration-200
            focus:outline-none focus:ring-2 focus:ring-[#00F5A0] focus:ring-offset-2 focus:ring-offset-[#0A0F1F]
          "
          aria-label={`View ${title}`}
          tabIndex={0}
        >
          {error ? 'Retry' : `View ${title}`}
        </button>
      </div>
    </motion.div>
  );
};
