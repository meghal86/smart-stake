import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Bell } from 'lucide-react';
import { motionClasses } from '@/lib/motion-tokens';

export type AlertCTAVariant = 'global' | 'inline' | 'modal';

interface AlertCTAProps {
  variant: AlertCTAVariant;
  onCreateAlert: () => void;
  className?: string;
  disabled?: boolean;
}

export function AlertCTA({ variant, onCreateAlert, className = '', disabled = false }: AlertCTAProps) {
  const handleClick = () => {
    // Telemetry tracking
    if (typeof window !== 'undefined') {
      window.gtag?.('event', 'alert_cta_click', {
        variant,
        timestamp: Date.now(),
      });
    }
    onCreateAlert();
  };

  // Only one solid primary CTA per viewport rule
  const variants = {
    global: {
      size: 'default' as const,
      variant: 'default' as const,
      icon: Plus,
      text: 'Create Alert',
      className: `${motionClasses.hoverLift} bg-blue-600 hover:bg-blue-700`,
    },
    inline: {
      size: 'sm' as const,
      variant: 'outline' as const,
      icon: Plus,
      text: 'Alert',
      className: `${motionClasses.fast} opacity-0 group-hover:opacity-100`,
    },
    modal: {
      size: 'sm' as const,
      variant: 'ghost' as const,
      icon: Bell,
      text: '',
      className: `${motionClasses.buttonRipple} h-8 w-8 p-0`,
    },
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <Button
      size={config.size}
      variant={config.variant}
      onClick={handleClick}
      disabled={disabled}
      className={`${config.className} ${className}`}
      aria-label={config.text || 'Create alert'}
    >
      <Icon className="h-4 w-4" />
      {config.text && <span className="ml-2">{config.text}</span>}
    </Button>
  );
}