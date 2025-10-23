/**
 * Guardian Trust Gauge
 * Tesla-inspired kinetic visual with Apple's precision
 */
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface TrustGaugeProps {
  score: number; // 0-100
  confidence?: number; // 0-1
  isScanning?: boolean;
}

export function TrustGauge({ score, confidence = 1, isScanning = false }: TrustGaugeProps) {
  const [displayScore, setDisplayScore] = useState(0);

  // Animate score counting up
  useEffect(() => {
    if (isScanning) {
      setDisplayScore(0);
      return;
    }

    let start = 0;
    const increment = score / 60; // 60 frames
    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(start));
      }
    }, 16); // ~60fps

    return () => clearInterval(timer);
  }, [score, isScanning]);

  const getScoreColor = (s: number) => {
    if (s >= 80) return { primary: '#10B981', secondary: '#059669' }; // Green
    if (s >= 60) return { primary: '#F59E0B', secondary: '#D97706' }; // Amber
    return { primary: '#EF4444', secondary: '#DC2626' }; // Red
  };

  const colors = getScoreColor(displayScore);
  const strokeDasharray = 2 * Math.PI * 90; // circumference
  const strokeDashoffset = strokeDasharray * (1 - displayScore / 100);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 1.2, ease: 'easeOut' }}
      className="relative flex items-center justify-center w-64 h-64 md:w-80 md:h-80"
    >
      {/* Background shield with subtle pulse */}
      <motion.div
        className="absolute inset-0 opacity-5"
        style={{
          background: `radial-gradient(circle, ${colors.primary}20 0%, transparent 70%)`,
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.05, 0.08, 0.05],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow: `0 0 40px ${colors.primary}30`,
        }}
        animate={{
          boxShadow: [
            `0 0 40px ${colors.primary}30`,
            `0 0 60px ${colors.primary}50`,
            `0 0 40px ${colors.primary}30`,
          ],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* SVG Circle */}
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="trustGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colors.primary} />
            <stop offset="100%" stopColor={colors.secondary} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background circle */}
        <circle
          cx="100"
          cy="100"
          r="90"
          stroke="rgba(148, 163, 184, 0.1)"
          strokeWidth="8"
          fill="none"
        />

        {/* Progress circle */}
        <motion.circle
          cx="100"
          cy="100"
          r="90"
          stroke="url(#trustGradient)"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
          filter="url(#glow)"
          initial={{ strokeDashoffset: strokeDasharray }}
          animate={{ strokeDashoffset: isScanning ? strokeDasharray : strokeDashoffset }}
          transition={{ duration: 1.5, ease: 'easeInOut' }}
          style={{
            strokeDasharray,
          }}
        />

        {/* Scanning pulse */}
        {isScanning && (
          <motion.circle
            cx="100"
            cy="100"
            r="90"
            stroke={colors.primary}
            strokeWidth="2"
            fill="none"
            opacity="0"
            animate={{
              r: [85, 95],
              opacity: [0.5, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}
      </svg>

      {/* Center content */}
      <div className="relative z-10 text-center">
        {isScanning ? (
          <>
            <motion.div
              className="w-12 h-12 mx-auto mb-2 border-4 border-t-transparent rounded-full"
              style={{ borderColor: `${colors.primary} transparent transparent transparent` }}
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-sm text-slate-400 tracking-wide">Scanning...</p>
          </>
        ) : (
          <>
            <motion.h2
              className="text-6xl md:text-7xl font-semibold tracking-tight"
              style={{ color: colors.primary }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
            >
              {displayScore}%
            </motion.h2>
            <p className="text-sm text-slate-400 tracking-[0.15em] mt-1 font-light">Trust Score</p>
            {confidence < 1 && (
              <p className="text-xs text-slate-500 mt-1 font-light">
                {Math.round(confidence * 100)}% confidence
              </p>
            )}
          </>
        )}
      </div>

      {/* Rotating outer ring (Tesla style) */}
      {!isScanning && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            border: `1px solid ${colors.primary}20`,
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </motion.div>
  );
}

