import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DemoModeBannerProps {
  isDemo: boolean;
  onExitDemo?: () => void;
}

export const DemoModeBanner = ({ isDemo, onExitDemo }: DemoModeBannerProps) => {
  if (!isDemo) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-gray-900 shadow-lg"
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xl">🎭</span>
            <p className="text-sm md:text-base font-medium">
              <span className="font-bold">Demo Mode Active</span> - Showing sample data | Connect wallet for live data
            </p>
          </div>
          {onExitDemo && (
            <button
              onClick={onExitDemo}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
              aria-label="Exit demo mode"
            >
              <span className="hidden sm:inline">Exit Demo</span>
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
