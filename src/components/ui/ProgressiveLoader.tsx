import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Progressive Loader Component
 * 
 * Implements progressive content loading where header renders first,
 * then content loads in stages with appropriate skeleton states.
 * 
 * Requirements: R7.LOADING.PROGRESSIVE, R2.LOADING.DESCRIPTIVE
 */

interface ProgressiveLoaderProps {
  children: React.ReactNode;
  isLoading: boolean;
  skeleton: React.ReactNode;
  loadingMessage?: string;
  delay?: number; // Delay before showing content (ms)
  className?: string;
}

export const ProgressiveLoader = ({
  children,
  isLoading,
  skeleton,
  loadingMessage = "Loading content...",
  delay = 0,
  className = "",
}: ProgressiveLoaderProps) => {
  const [showContent, setShowContent] = useState(!isLoading);

  useEffect(() => {
    if (!isLoading) {
      if (delay > 0) {
        const timer = setTimeout(() => {
          setShowContent(true);
        }, delay);
        return () => clearTimeout(timer);
      } else {
        setShowContent(true);
      }
    } else {
      setShowContent(false);
    }
  }, [isLoading, delay]);

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {isLoading || !showContent ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="status"
            aria-label={loadingMessage}
          >
            {skeleton}
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/**
 * Progressive Section Loader
 * 
 * Loads sections progressively with staggered delays
 * to create a smooth loading experience.
 */
interface ProgressiveSectionLoaderProps {
  sections: Array<{
    id: string;
    content: React.ReactNode;
    skeleton: React.ReactNode;
    delay?: number;
    loadingMessage?: string;
  }>;
  isLoading: boolean;
  className?: string;
}

export const ProgressiveSectionLoader = ({
  sections,
  isLoading,
  className = "",
}: ProgressiveSectionLoaderProps) => {
  return (
    <div className={className}>
      {sections.map((section, index) => (
        <ProgressiveLoader
          key={section.id}
          isLoading={isLoading}
          skeleton={section.skeleton}
          loadingMessage={section.loadingMessage}
          delay={section.delay || index * 100} // Stagger by 100ms
          className="mb-8"
        >
          {section.content}
        </ProgressiveLoader>
      ))}
    </div>
  );
};

/**
 * Header-First Progressive Loader
 * 
 * Ensures header content renders immediately while
 * body content shows skeleton states during loading.
 */
interface HeaderFirstLoaderProps {
  header: React.ReactNode;
  children: React.ReactNode;
  isLoading: boolean;
  skeleton: React.ReactNode;
  loadingMessage?: string;
  className?: string;
}

export const HeaderFirstLoader = ({
  header,
  children,
  isLoading,
  skeleton,
  loadingMessage = "Loading content...",
  className = "",
}: HeaderFirstLoaderProps) => {
  return (
    <div className={className}>
      {/* Header renders immediately */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {header}
      </motion.div>

      {/* Content with progressive loading */}
      <ProgressiveLoader
        isLoading={isLoading}
        skeleton={skeleton}
        loadingMessage={loadingMessage}
        delay={150} // Small delay after header
      >
        {children}
      </ProgressiveLoader>
    </div>
  );
};