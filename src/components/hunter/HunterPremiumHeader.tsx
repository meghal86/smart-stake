import { motion } from 'framer-motion';
import { Search, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import HunterNotificationBell from './HunterNotificationBell';
import HunterXPProgressBar from './HunterXPProgressBar';
import { useHunterXP } from '@/hooks/useHunterXP';
import { useState } from 'react';

interface HunterPremiumHeaderProps {
  onSearch?: (query: string) => void;
  onMenuClick?: () => void;
  className?: string;
}

export default function HunterPremiumHeader({
  onSearch,
  onMenuClick,
  className
}: HunterPremiumHeaderProps) {
  const { xpData, isLoading } = useHunterXP();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <motion.header
      className={cn(
        "sticky top-0 z-40 w-full",
        "bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl",
        "border-b border-white/10 dark:border-slate-800/50",
        "shadow-lg shadow-slate-900/5",
        className
      )}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <div className="container mx-auto px-4 md:px-6">
        {/* Main Header Row */}
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Left: Logo + Title */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-emerald-500/25">
              <span className="text-xl md:text-2xl">🎯</span>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Hunter
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden md:block">
                Opportunity Feed
              </p>
            </div>
          </motion.div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Search Icon/Field */}
            <div className="relative">
              {searchOpen ? (
                <motion.form
                  onSubmit={handleSearch}
                  className="flex items-center gap-2"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 'auto', opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                >
                  <Input
                    type="text"
                    placeholder="Search opportunities..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-40 md:w-64 h-9 bg-slate-800/50 border-slate-700/50 text-sm"
                    autoFocus
                    onBlur={() => {
                      if (!searchQuery) setSearchOpen(false);
                    }}
                  />
                </motion.form>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchOpen(true)}
                  className="h-9 w-9 rounded-lg hover:bg-slate-800/50"
                >
                  <Search className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Notifications */}
            <HunterNotificationBell />

            {/* Wallet Status Chip (Desktop) */}
            <motion.div
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/30 border border-slate-700/50"
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-slate-300">
                Demo Mode
              </span>
            </motion.div>

            {/* Menu (Mobile) */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="md:hidden h-9 w-9 rounded-lg hover:bg-slate-800/50"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* XP Progress Bar (Full Width Below Header) */}
        {!isLoading && (
          <motion.div
            className="pb-3 md:pb-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <HunterXPProgressBar
              currentXP={xpData.currentXP}
              level={xpData.level}
              nextLevelXP={xpData.nextLevelXP}
              progressPercent={xpData.progressPercent}
              showDetails={false}
            />
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}

