import { motion } from 'framer-motion';
import { Brain, Activity, Sun, Moon } from 'lucide-react';
import { HunterTabs, TabType } from './HunterTabs';

interface HeaderProps {
  isDemo: boolean;
  setIsDemo: (value: boolean) => void;
  copilotEnabled: boolean;
  setCopilotEnabled: (value: boolean) => void;
  lastUpdated?: Date;
  onRefresh: () => void;
  isDarkTheme: boolean;
  setIsDarkTheme: (value: boolean) => void;
  activeFilter: TabType;
  setActiveFilter: (filter: TabType) => void;
}

export function Header({
  isDemo,
  setIsDemo,
  copilotEnabled,
  setCopilotEnabled,
  lastUpdated,
  onRefresh,
  isDarkTheme,
  setIsDarkTheme,
  activeFilter,
  setActiveFilter
}: HeaderProps) {
  return (
    <motion.header
      className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
        isDarkTheme 
          ? 'bg-[rgba(16,18,30,0.75)] border-[rgba(255,255,255,0.08)]' 
          : 'bg-[rgba(255,255,255,0.85)] border-[rgba(0,0,0,0.08)]'
      }`}
      style={{
        boxShadow: isDarkTheme 
          ? 'none'
          : '0 2px 8px rgba(0,0,0,0.04)'
      }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex flex-col gap-2">
        {/* Top Row */}
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/header.png" alt="Logo" className="w-8 h-8" />
          <h1 className={`text-xl font-semibold transition-colors duration-300 ${
            isDarkTheme ? 'text-white' : 'text-[#1B1F29]'
          }`}>
            Hunter
          </h1>
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          >
            <Brain className="w-4 h-4 text-[#00F5A0]" />
          </motion.div>
        </div>
        
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <p className={`text-xs transition-colors duration-300 ${
              isDarkTheme ? 'text-gray-400' : 'text-[#7C8896]'
            }`}>
              Updated {Math.floor((Date.now() - lastUpdated.getTime()) / 1000)}s ago
            </p>
          )}
          
          <div className="flex items-center gap-3">
            <motion.button
              onClick={() => setIsDarkTheme(!isDarkTheme)}
              className={`p-2 rounded-lg transition-all duration-200 ${
                isDarkTheme 
                  ? 'bg-white/10 hover:bg-white/15' 
                  : 'bg-gray-100/80 hover:bg-gray-200/80'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {isDarkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </motion.button>
            
            <div className="flex gap-2 text-sm">
              <button
                onClick={() => setIsDemo(true)}
                className={`px-3 py-1 rounded-lg border transition-all duration-300 ${
                  isDemo
                    ? 'bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] text-white font-medium shadow-sm'
                    : isDarkTheme
                      ? 'border-[rgba(255,255,255,0.1)] text-gray-300 hover:bg-[rgba(255,255,255,0.05)]'
                      : 'border-[rgba(0,0,0,0.08)] text-[#444C56] hover:bg-gray-100'
                }`}
              >
                Demo
              </button>
              <button
                onClick={() => setIsDemo(false)}
                className={`px-3 py-1 rounded-lg border transition-all duration-300 flex items-center gap-1 ${
                  !isDemo
                    ? 'bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] text-white font-medium shadow-sm'
                    : isDarkTheme
                      ? 'border-[rgba(255,255,255,0.1)] text-gray-300 hover:bg-[rgba(255,255,255,0.05)]'
                      : 'border-[rgba(0,0,0,0.08)] text-[#444C56] hover:bg-gray-100'
                }`}
              >
                Live
                {!isDemo && (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Activity className="w-3 h-3" />
                  </motion.div>
                )}
              </button>
            </div>
            
            <motion.button
              onClick={() => setCopilotEnabled(!copilotEnabled)}
              className="px-3 py-1 bg-gradient-to-r from-[#00F5A0] to-[#7B61FF] text-white font-medium rounded-lg shadow-sm text-sm"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              AI Digest
            </motion.button>
          </div>
        </div>
      </div>

        {/* Bottom Row - Filter Tabs */}
        <HunterTabs
          activeTab={activeFilter}
          onTabChange={setActiveFilter}
          isDarkTheme={isDarkTheme}
        />
      </div>
    </motion.header>
  );
}