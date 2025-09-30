import { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
  defaultHeight?: number;
}

export function BottomSheet({ 
  open, 
  onOpenChange, 
  children, 
  title,
  defaultHeight = 50 
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);

  const translateY = open ? '0%' : `calc(100% - 64px)`;

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 md:hidden"
          onClick={() => onOpenChange(false)}
        />
      )}
      
      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="wh-bottom-sheet wh-z-sheet md:hidden"
        style={{ 
          height: open ? `${defaultHeight}vh` : '64px'
        }}
        data-state={open ? 'open' : 'closed'}
      >
        {/* Handle */}
        <div 
          className="flex justify-center py-2 cursor-pointer"
          onClick={() => onOpenChange(!open)}
        >
          <div className="h-1 w-10 rounded-full bg-muted-foreground/40" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 pb-2">
            <h3 className="font-semibold">{title}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Content */}
        <div className="px-4 pb-4 overflow-y-auto max-h-full">
          {children}
        </div>
      </div>
    </>
  );
}