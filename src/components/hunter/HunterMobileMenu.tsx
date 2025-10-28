import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings, Trophy, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HunterDemoToggle from './HunterDemoToggle';
import { useDemoMode } from '@/contexts/DemoModeContext';

interface HunterMobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onAchievementsClick: () => void;
}

export default function HunterMobileMenu({ 
  isOpen, 
  onClose, 
  onAchievementsClick 
}: HunterMobileMenuProps) {
  const { isDemoMode } = useDemoMode();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Menu Panel */}
          <motion.div
            className="fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/50 z-50"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
              <h2 className="text-lg font-bold text-slate-100">Menu</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-lg hover:bg-slate-800/50"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Mode Toggle */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Data Mode</h3>
                <HunterDemoToggle />
                <p className="text-xs text-slate-500 mt-2">
                  {isDemoMode 
                    ? 'Showing sample opportunities for demonstration'
                    : 'Live data from blockchain protocols'
                  }
                </p>
              </div>

              {/* Quick Actions */}
              <div>
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-10 text-slate-300 hover:bg-slate-800/50"
                    onClick={() => {
                      onAchievementsClick();
                      onClose();
                    }}
                  >
                    <Trophy className="w-4 h-4 mr-3" />
                    Achievements
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-10 text-slate-300 hover:bg-slate-800/50"
                    disabled
                  >
                    <Bell className="w-4 h-4 mr-3" />
                    Notifications
                  </Button>
                  
                  <Button
                    variant="ghost"
                    className="w-full justify-start h-10 text-slate-300 hover:bg-slate-800/50"
                    disabled
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </Button>
                </div>
              </div>

              {/* Status */}
              <div className="pt-4 border-t border-slate-700/50">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/30">
                  <div className={`w-3 h-3 rounded-full animate-pulse ${
                    isDemoMode ? 'bg-emerald-400' : 'bg-cyan-400'
                  }`} />
                  <div>
                    <div className="text-sm font-medium text-slate-200">
                      {isDemoMode ? 'Demo Mode' : 'Live Mode'}
                    </div>
                    <div className="text-xs text-slate-500">
                      {isDemoMode ? 'Sample data active' : 'Real-time data'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}