import { Button } from "@/components/ui/button";
import { TimeWindow } from "@/types/hub2";
import { cn } from "@/lib/utils";

interface TimeWindowToggleProps {
  value: TimeWindow;
  onChange: (window: TimeWindow) => void;
  className?: string;
}

export default function TimeWindowToggle({ value, onChange, className }: TimeWindowToggleProps) {
  const windows: { value: TimeWindow; label: string }[] = [
    { value: '24h', label: '24h' },
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' }
  ];

  return (
    <div className={cn("flex border rounded-lg p-1", className)}>
      {windows.map((window) => (
        <Button
          key={window.value}
          size="sm"
          variant={value === window.value ? 'default' : 'ghost'}
          onClick={() => onChange(window.value)}
          className="text-xs px-3"
        >
          {window.label}
        </Button>
      ))}
    </div>
  );
}
