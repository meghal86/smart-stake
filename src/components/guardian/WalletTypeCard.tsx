import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface WalletTypeCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function WalletTypeCard({
  icon: Icon,
  title,
  description,
  selected = false,
  disabled = false,
  onClick,
}: WalletTypeCardProps) {
  return (
    <motion.button
      type="button"
      whileHover={!disabled ? { scale: 1.02, y: -2 } : undefined}
      whileTap={!disabled ? { scale: 0.98 } : undefined}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        'flex flex-col gap-2 rounded-xl border p-4 text-left transition-colors',
        'bg-white/5 hover:bg-white/10 border-white/10 text-gray-200',
        selected && 'border-[#00C9A7] bg-white/10 shadow-[0_0_0_1px_rgba(0,201,167,0.35)]',
        disabled && 'opacity-50 pointer-events-none',
      )}
    >
      <div className={cn(
        'flex h-12 w-12 items-center justify-center rounded-xl',
        selected ? 'bg-[#00C9A7]/30 text-[#00C9A7]' : 'bg-white/10 text-white',
      )}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-gray-400">{description}</p>
      </div>
      <div
        className={cn(
          'h-1 w-full rounded-full transition-colors',
          selected ? 'bg-[#00C9A7]' : 'bg-white/10',
        )}
      />
    </motion.button>
  );
}
