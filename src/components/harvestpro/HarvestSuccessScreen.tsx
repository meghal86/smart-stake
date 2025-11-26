/**
 * HarvestSuccessScreen Component
 * Displays success confirmation after completing a harvest
 * 
 * Requirements: 10.1-10.5
 * - Achievement-style success card
 * - Confetti animation
 * - Total losses harvested display
 * - Download CSV button
 * - View Proof button
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Download, 
  FileText, 
  TrendingDown, 
  Sparkles,
  ArrowRight,
  Shield,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { HarvestSession } from '@/types/harvestpro';

// ============================================================================
// TYPES
// ============================================================================

export interface HarvestSuccessScreenProps {
  session: HarvestSession;
  onDownloadCSV: (sessionId: string) => void;
  onViewProof: (sessionId: string) => void;
  onClose?: () => void;
  isDownloading?: boolean;
}

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Format currency with proper decimals
 */
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Generate confetti pieces
 */
function generateConfetti(count: number): ConfettiPiece[] {
  const colors = [
    '#ed8f2d', // Orange
    '#14b8a6', // Teal
    '#3b82f6', // Blue
    '#10b981', // Green
    '#f59e0b', // Amber
    '#8b5cf6', // Purple
  ];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: -10,
    rotation: Math.random() * 360,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 8 + 4,
    delay: Math.random() * 0.5,
  }));
}

/**
 * Format execution time
 */
function formatExecutionTime(session: HarvestSession): string {
  const createdAt = new Date(session.createdAt);
  const updatedAt = new Date(session.updatedAt);
  const durationMs = updatedAt.getTime() - createdAt.getTime();
  const durationSec = Math.floor(durationMs / 1000);
  
  if (durationSec < 60) {
    return `${durationSec}s`;
  }
  
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  return `${minutes}m ${seconds}s`;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function HarvestSuccessScreen({
  session,
  onDownloadCSV,
  onViewProof,
  onClose,
  isDownloading = false,
}: HarvestSuccessScreenProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [showConfetti, setShowConfetti] = useState(true);
  
  // Generate confetti on mount
  useEffect(() => {
    setConfetti(generateConfetti(50));
    
    // Stop confetti after 3 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const totalOpportunities = session.opportunitiesSelected.length;
  const executionTime = formatExecutionTime(session);
  const completedSteps = session.executionSteps.filter(s => s.status === 'completed').length;
  
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#0A0E1A] to-[#111827] flex items-center justify-center p-4">
      {/* Background Effects */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          background: [
            'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(16,185,129,0.15) 0%, transparent 70%)',
            'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(59,130,246,0.12) 0%, transparent 70%)',
            'radial-gradient(ellipse 80% 50% at 50% 50%, rgba(16,185,129,0.15) 0%, transparent 70%)',
          ],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Confetti Animation */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {confetti.map((piece) => (
              <motion.div
                key={piece.id}
                initial={{
                  x: `${piece.x}vw`,
                  y: '-10vh',
                  rotate: piece.rotation,
                  opacity: 1,
                }}
                animate={{
                  y: '110vh',
                  rotate: piece.rotation + 720,
                  opacity: [1, 1, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  delay: piece.delay,
                  ease: 'linear',
                }}
                style={{
                  position: 'absolute',
                  width: piece.size,
                  height: piece.size,
                  backgroundColor: piece.color,
                  borderRadius: Math.random() > 0.5 ? '50%' : '0%',
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>
      
      {/* Success Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
        className="relative z-10 w-full max-w-2xl"
      >
        <div className={cn(
          'p-8 sm:p-12 rounded-3xl',
          'bg-gradient-to-br from-[rgba(255,255,255,0.12)] to-[rgba(0,0,0,0.4)]',
          'border border-[rgba(255,255,255,0.15)]',
          'backdrop-blur-xl',
          'shadow-2xl'
        )}>
          {/* Success Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
            className="flex justify-center mb-6"
          >
            <div className="relative">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="absolute inset-0 bg-green-500/30 rounded-full blur-xl"
              />
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
              </div>
            </div>
          </motion.div>
          
          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3 flex items-center justify-center gap-3">
              <Sparkles className="w-8 h-8 text-yellow-400" />
              Harvest Complete!
              <Sparkles className="w-8 h-8 text-yellow-400" />
            </h1>
            <p className="text-gray-400 text-lg">
              Successfully harvested {totalOpportunities} {totalOpportunities === 1 ? 'opportunity' : 'opportunities'}
            </p>
          </motion.div>
          
          {/* Stats Grid */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
          >
            {/* Total Losses Harvested */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                <span className="text-sm text-gray-400">Losses Harvested</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-red-400">
                {formatCurrency(session.realizedLossesTotal)}
              </div>
            </div>
            
            {/* Net Benefit */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-400">Net Benefit</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-green-400">
                {formatCurrency(session.netBenefitTotal)}
              </div>
            </div>
            
            {/* Execution Time */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-blue-400" />
                <span className="text-sm text-gray-400">Execution Time</span>
              </div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-400">
                {executionTime}
              </div>
            </div>
          </motion.div>
          
          {/* Execution Summary */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-8 p-5 rounded-2xl bg-white/5 border border-white/10"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">
                Execution Summary
              </h3>
              <div className="flex items-center gap-2 text-sm text-green-400">
                <Shield className="w-4 h-4" />
                <span>{completedSteps}/{session.executionSteps.length} steps completed</span>
              </div>
            </div>
            
            <div className="space-y-2">
              {session.opportunitiesSelected.map((opp, index) => (
                <div
                  key={opp.id}
                  className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    </div>
                    <span className="text-white font-medium">{opp.token}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-gray-400">{opp.metadata.venue}</span>
                  </div>
                  <span className="text-red-400 font-semibold">
                    {formatCurrency(opp.unrealizedLoss)}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
          
          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Button
              onClick={() => onDownloadCSV(session.sessionId)}
              disabled={isDownloading}
              className={cn(
                'flex-1 h-12 font-semibold text-base',
                'bg-gradient-to-r from-blue-500 to-blue-600',
                'hover:from-blue-600 hover:to-blue-700',
                'text-white border-0',
                'transition-all duration-200',
                'shadow-lg shadow-blue-500/25'
              )}
            >
              {isDownloading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Download 8949 CSV
                </>
              )}
            </Button>
            
            <Button
              onClick={() => onViewProof(session.sessionId)}
              className={cn(
                'flex-1 h-12 font-semibold text-base',
                'bg-white/10 hover:bg-white/15',
                'text-white border border-white/20',
                'transition-all duration-200'
              )}
            >
              <FileText className="w-5 h-5 mr-2" />
              View Proof-of-Harvest
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
          
          {/* Close Button (Optional) */}
          {onClose && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="mt-6 text-center"
            >
              <button
                onClick={onClose}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Return to Dashboard
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
