/**
 * World-Class New Items Badge - Smooth slide-in with pulse
 */

import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowUp } from 'lucide-react';
import { trackEvent } from '@/lib/telemetry';

interface WorldClassNewItemsBadgeProps {
  count: number;
  onViewNew: () => void;
}

export function WorldClassNewItemsBadge({ count, onViewNew }: WorldClassNewItemsBadgeProps) {
  const handleClick = () => {
    trackEvent('new_items_applied', { count });
    onViewNew();
  };

  return (
    <AnimatePresence>
      {count > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ 
            duration: 0.2, 
            ease: [0.4, 0, 0.2, 1],
            type: "spring",
            stiffness: 300,
            damping: 30
          }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-30"
        >
          <Button
            onClick={handleClick}
            className="bg-[var(--brand-teal,#14B8A6)] hover:bg-[var(--brand-teal,#14B8A6)]/90 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            size="sm"
          >
            <ArrowUp className="h-4 w-4 mr-2" />
            New
            <Badge variant="secondary" className="ml-2 bg-white/20 text-white tabular-nums">
              <div className="w-2 h-2 bg-white rounded-full mr-1 live-pulse" />
              {count}
            </Badge>
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}