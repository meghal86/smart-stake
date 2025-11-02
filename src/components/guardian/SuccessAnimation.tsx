import { motion } from 'framer-motion';

interface SuccessAnimationProps {
  message?: string;
  subMessage?: string;
}

export function SuccessAnimation({
  message = 'Trust Score updated',
  subMessage = 'Excellent Security',
}: SuccessAnimationProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 text-center text-white">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 220, damping: 16 }}
        className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[#00C9A7]/20"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 320, damping: 18 }}
          className="absolute inset-0 rounded-full border border-[#00C9A7]/60"
        />
        <motion.svg
          viewBox="0 0 52 52"
          className="h-12 w-12 stroke-[#00C9A7]"
        >
          <motion.path
            fill="none"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14 27 l7 7 l17 -17"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </motion.svg>
      </motion.div>

      <div className="space-y-1">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          className="text-lg font-semibold"
        >
          {message}
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.3 }}
          className="text-sm text-gray-300"
        >
          {subMessage}
        </motion.p>
      </div>
    </div>
  );
}
