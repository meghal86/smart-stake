import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] duration-150 ease-out",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  
  // UX Enhancement Props
  loading?: boolean
  loadingText?: string
  successState?: boolean
  successText?: string
  errorState?: boolean
  errorText?: string
  
  // Animation controls
  scaleOnPress?: boolean
  animationDuration?: number
  
  // No Silent Clicks enforcement
  disabledReason?: string // Tooltip content when disabled
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    loadingText,
    successState = false,
    successText,
    errorState = false,
    errorText,
    scaleOnPress = true,
    animationDuration = 150,
    disabledReason,
    disabled,
    children,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Determine the current state and content
    const isDisabled = disabled || loading
    const currentContent = React.useMemo(() => {
      if (loading) {
        return (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            {loadingText || children}
          </div>
        )
      }
      
      if (successState && successText) {
        return successText
      }
      
      if (errorState && errorText) {
        return errorText
      }
      
      return children
    }, [loading, loadingText, successState, successText, errorState, errorText, children])
    
    // Handle reduced motion preference
    const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)
    
    React.useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
      setPrefersReducedMotion(mediaQuery.matches)
      
      const handleChange = (e: MediaQueryListEvent) => {
        setPrefersReducedMotion(e.matches)
      }
      
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }, [])
    
    // Build className with animation controls
    const buttonClassName = cn(
      buttonVariants({ variant, size }),
      {
        // Remove scale animation if reduced motion is preferred or explicitly disabled
        'active:scale-[0.98]': scaleOnPress && !prefersReducedMotion,
        'active:scale-100': !scaleOnPress || prefersReducedMotion,
      },
      className
    )
    
    // Apply custom animation duration if provided
    const style = React.useMemo(() => {
      if (prefersReducedMotion) {
        return { transitionDuration: '0ms' }
      }
      return animationDuration !== 150 ? { transitionDuration: `${animationDuration}ms` } : undefined
    }, [animationDuration, prefersReducedMotion])
    
    return (
      <Comp
        className={buttonClassName}
        ref={ref}
        disabled={isDisabled}
        style={style}
        title={isDisabled && disabledReason ? disabledReason : undefined}
        aria-label={isDisabled && disabledReason ? disabledReason : undefined}
        {...props}
      >
        {currentContent}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }