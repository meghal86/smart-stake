import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Shield, DollarSign, Clock } from 'lucide-react';
import { InlineMetricsProof } from '@/components/ux/MetricsProof';
import { useHomeMetrics, getFreshnessMessage, getFreshnessColor } from '@/hooks/useHomeMetrics';

/**
 * ImpactStats Component
 * 
 * Displays high-impact statistics with expandable breakdowns and "Last updated" timestamps.
 * Fixed Tailwind dynamic class issue with inline styles.
 * 
 * Requirements: 
 * - 4.5 (Platform Statistics)
 * - R14.TRUST.METRICS_PROOF (Methodology explanation modals)
 * - R10.TRUST.METHODOLOGY (How it's calculated links)
 * - R14.TRUST.TIMESTAMPS ("Last updated" timestamps for platform statistics)
 */
export const ImpactStats = () => {
  const { metrics, isLoading, error, freshnessStatus, dataAge, isDemo } = useHomeMetrics();
  const stats = [
    {
      icon: Shield,
      value: isDemo ? '$142M' : `$${metrics?.totalWalletsProtected ? (metrics.totalWalletsProtected / 1000000).toFixed(0) : '142'}M`,
      label: 'Assets Protected',
      metricType: 'assets_protected' as const,
      breakdown: [
        { label: 'Flash loan attacks', value: '$89M' },
        { label: 'Rug pulls detected', value: '$38M' },
        { label: 'Bad APY avoided', value: '$15M' },
      ],
      colors: {
        bg: 'rgba(100, 116, 139, 0.1)',
        border: 'rgba(100, 116, 139, 0.3)',
        text: '#94a3b8',
      },
    },
    {
      icon: TrendingUp,
      value: isDemo ? '10,000+' : `${metrics?.totalWalletsProtected ? (metrics.totalWalletsProtected / 1000).toFixed(0) : '10'}K+`,
      label: 'Active Users',
      metricType: 'wallets_protected' as const,
      breakdown: [
        { label: 'Daily active users', value: '2,400' },
        { label: 'Institutional clients', value: '47' },
        { label: 'Total scans run', value: '1.2M' },
      ],
      colors: {
        bg: 'rgba(100, 116, 139, 0.1)',
        border: 'rgba(100, 116, 139, 0.3)',
        text: '#94a3b8',
      },
    },
    {
      icon: DollarSign,
      value: isDemo ? '$12.4K' : `$${metrics?.totalYieldOptimizedUsd ? (metrics.totalYieldOptimizedUsd / 1000).toFixed(1) : '12.4'}K`,
      label: 'Avg Annual Savings',
      metricType: 'yield_optimized' as const,
      breakdown: [
        { label: 'Harvest opportunities', value: '847' },
        { label: 'Total tax saved', value: '$24.8M' },
        { label: 'Avg per harvest', value: '$2,100' },
      ],
      colors: {
        bg: 'rgba(100, 116, 139, 0.1)',
        border: 'rgba(100, 116, 139, 0.3)',
        text: '#94a3b8',
      },
    },
  ];

  const [expandedStat, setExpandedStat] = React.useState<number | null>(null);

  return (
    <section
      className="w-full py-8 md:py-16 bg-[#0A0F1F]"
      aria-labelledby="impact-stats-heading"
    >
      <div className="container mx-auto px-4">
        {/* Section Heading */}
        <motion.div
          className="text-center mb-6 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2
            id="impact-stats-heading"
            className="text-2xl md:text-3xl font-semibold text-white mb-2 md:mb-4"
          >
            Platform Metrics
          </h2>
          
          {/* Last Updated Timestamp - R14.TRUST.TIMESTAMPS */}
          <div className="mt-3 flex items-center justify-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-gray-500" data-testid="clock-icon" />
            {isLoading ? (
              <span className="text-gray-500">Loading...</span>
            ) : error ? (
              <span className="text-red-400">Data unavailable</span>
            ) : metrics?.lastUpdated ? (
              <span className={`${getFreshnessColor(freshnessStatus)}`}>
                {getFreshnessMessage(freshnessStatus, dataAge)}
              </span>
            ) : (
              <span className="text-gray-500">Timestamp unavailable</span>
            )}
            {isDemo && (
              <span className="text-cyan-400 text-xs ml-2 px-2 py-1 bg-cyan-400/10 rounded">
                Demo Mode
              </span>
            )}
          </div>
        </motion.div>

        {/* Stats Grid - CLICK TO REVEAL */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            const isExpanded = expandedStat === index;

            return (
              <motion.div
                key={stat.label}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <motion.div
                  className="bg-white/[0.02] border rounded-lg p-4 md:p-6 cursor-pointer transition-all duration-200"
                  style={{
                    borderColor: isExpanded ? stat.colors.border : 'rgb(31, 41, 55)',
                  }}
                  whileHover={{ y: -2 }}
                  onClick={() => setExpandedStat(isExpanded ? null : index)}
                  role="button"
                  aria-expanded={isExpanded}
                  aria-label={`${stat.label}. Click to see breakdown.`}
                >
                  {/* Icon - Minimal */}
                  <div
                    className="w-12 h-12 rounded-lg mb-4 flex items-center justify-center"
                    style={{ backgroundColor: stat.colors.bg }}
                  >
                    <Icon className="w-6 h-6" style={{ color: stat.colors.text }} />
                  </div>

                  {/* Label */}
                  <p className="text-base font-medium text-white mb-2">
                    {stat.label}
                  </p>

                  {/* Breakdown (Expanded State) - SHOWS VALUE + DETAILS */}
                  <motion.div
                    initial={false}
                    animate={{
                      height: isExpanded ? 'auto' : 0,
                      opacity: isExpanded ? 1 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    {/* Big Value */}
                    <p
                      className="text-3xl md:text-4xl font-semibold mb-4"
                      style={{ color: stat.colors.text }}
                    >
                      {stat.value}
                    </p>
                    
                    {/* Breakdown Details */}
                    <div className="pt-4 border-t border-gray-800 space-y-2">
                      {stat.breakdown.map((item) => (
                        <div
                          key={item.label}
                          className="flex justify-between items-center text-xs"
                        >
                          <span className="text-gray-500">{item.label}</span>
                          <span className="font-medium text-gray-400">
                            {item.value}
                          </span>
                        </div>
                      ))}
                      
                      {/* How it's calculated link */}
                      <div className="pt-3 border-t border-gray-800">
                        <InlineMetricsProof 
                          metricType={stat.metricType}
                          className="text-xs"
                        >
                          How it's calculated
                        </InlineMetricsProof>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Removed fake testimonial - will add real one later */}
      </div>
    </section>
  );
};
