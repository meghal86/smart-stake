import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WindowChipsProps {
  value: string;
  onChange: (value: string) => void;
  'aria-label'?: string;
}

const windows = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' }
];

export function WindowChips({ value, onChange, 'aria-label': ariaLabel }: WindowChipsProps) {
  return (
    <div 
      role="tablist" 
      aria-label={ariaLabel || "Time window selection"}
      className="flex gap-1 bg-muted rounded-lg p-1"
    >
      {windows.map((window, index) => (
        <Button
          key={window.value}
          role="tab"
          aria-selected={value === window.value}
          tabIndex={value === window.value ? 0 : -1}
          size="sm"
          variant={value === window.value ? 'default' : 'ghost'}
          className={cn(
            'h-8 px-3 text-xs min-w-[44px] min-h-[44px] focus:ring-2 focus:ring-primary focus:ring-offset-2',
            'transition-all duration-200'
          )}
          onClick={() => onChange(window.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowLeft' && index > 0) {
              onChange(windows[index - 1].value);
            } else if (e.key === 'ArrowRight' && index < windows.length - 1) {
              onChange(windows[index + 1].value);
            }
          }}
        >
          {window.label}
        </Button>
      ))}
    </div>
  );
}