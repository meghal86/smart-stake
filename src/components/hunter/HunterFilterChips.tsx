import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterOption {
  id: string;
  label: string;
  icon?: string;
  count?: number;
}

interface HunterFilterChipsProps {
  filters: FilterOption[];
  selectedFilter: string;
  onFilterChange: (filterId: string) => void;
  className?: string;
}

export default function HunterFilterChips({
  filters,
  selectedFilter,
  onFilterChange,
  className
}: HunterFilterChipsProps) {
  return (
    <motion.div
      className={cn("relative", className)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      {/* Horizontal scroll container */}
      <div className="overflow-x-auto scrollbar-hide -mx-2 px-2">
        <div className="flex items-center gap-2 min-w-max pb-2">
          {filters.map((filter, index) => {
            const isActive = selectedFilter === filter.id;

            return (
              <motion.button
                key={filter.id}
                onClick={() => onFilterChange(filter.id)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-2 rounded-xl",
                  "text-sm font-medium transition-all duration-200",
                  "border backdrop-blur-xl",
                  isActive
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-lg shadow-emerald-500/20"
                    : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-300 hover:border-white/20"
                )}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {/* Icon */}
                {filter.icon && (
                  <span className="text-base">{filter.icon}</span>
                )}

                {/* Label */}
                <span className="whitespace-nowrap">{filter.label}</span>

                {/* Count Badge */}
                {filter.count !== undefined && filter.count > 0 && (
                  <span
                    className={cn(
                      "px-1.5 py-0.5 rounded-md text-xs font-semibold",
                      isActive
                        ? "bg-emerald-500/30 text-emerald-200"
                        : "bg-slate-700/50 text-slate-400"
                    )}
                  >
                    {filter.count}
                  </span>
                )}

                {/* Active Indicator */}
                {isActive && (
                  <motion.div
                    className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  >
                    <Check className="w-2.5 h-2.5 text-white" />
                  </motion.div>
                )}

                {/* Glow effect for active filter */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-xl bg-emerald-500/20 blur-md -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Gradient fade edges for scroll indication */}
      <div className="pointer-events-none absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-slate-900 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-slate-900 to-transparent" />
    </motion.div>
  );
}




