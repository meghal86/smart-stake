import { ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'ghost'
  size?: 'sm' | 'md'
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    return (
      <button
        className={cn(
          "grid place-items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          {
            'bg-slate-800 hover:bg-slate-700 text-slate-200': variant === 'default',
            'hover:bg-slate-800/50 text-slate-300': variant === 'ghost',
            'h-8 w-8': size === 'md',
            'h-6 w-6': size === 'sm'
          },
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

IconButton.displayName = 'IconButton'

export { IconButton }